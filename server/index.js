import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const port = process.env.PORT || 3000

function createPool() {
  const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false

  if (process.env.DATABASE_URL) {
    try {
      const databaseUrl = new URL(process.env.DATABASE_URL)
      if (databaseUrl.hostname && databaseUrl.hostname !== 'base') {
        return new Pool({ connectionString: process.env.DATABASE_URL, ssl })
      }
    } catch {
      console.warn('DATABASE_URL is invalid. Falling back to PG* variables.')
    }
  }

  if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
    return new Pool({
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl,
    })
  }

  return null
}

const pool = createPool()

app.use(express.json({ limit: '1mb' }))

async function query(sql, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured')
  }

  return pool.query(sql, params)
}

async function migrate() {
  if (!pool) {
    console.warn('DATABASE_URL missing. API will run without persistent storage.')
    return
  }

  await query(`
    create table if not exists app_users (
      id text primary key,
      email text,
      display_name text,
      photo_url text,
      provider text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists scans (
      id bigserial primary key,
      user_id text references app_users(id) on delete set null,
      url text not null,
      mode text not null default 'site_scan',
      status text not null default 'draft',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists reports (
      id bigserial primary key,
      user_id text references app_users(id) on delete set null,
      title text not null,
      report_type text not null,
      status text not null default 'draft',
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists competitors (
      id bigserial primary key,
      scan_id bigint references scans(id) on delete cascade,
      domain text not null,
      score numeric,
      created_at timestamptz not null default now()
    );
  `)
}

app.get('/api/health', async (_request, response) => {
  try {
    if (pool) {
      await query('select 1')
    }

    response.json({ ok: true, database: Boolean(pool) })
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message })
  }
})

app.post('/api/users', async (request, response) => {
  try {
    const { id, email, displayName, photoURL, provider } = request.body

    if (!id) {
      response.status(400).json({ error: 'User id is required' })
      return
    }

    const result = await query(
      `
        insert into app_users (id, email, display_name, photo_url, provider)
        values ($1, $2, $3, $4, $5)
        on conflict (id) do update set
          email = excluded.email,
          display_name = excluded.display_name,
          photo_url = excluded.photo_url,
          provider = excluded.provider,
          updated_at = now()
        returning *
      `,
      [id, email || null, displayName || null, photoURL || null, provider || null],
    )

    response.json({ user: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/scans', async (request, response) => {
  try {
    const { userId, url, mode, metadata } = request.body

    if (!url) {
      response.status(400).json({ error: 'URL is required' })
      return
    }

    const result = await query(
      `
        insert into scans (user_id, url, mode, metadata)
        values ($1, $2, $3, $4)
        returning *
      `,
      [userId || null, url, mode || 'site_scan', metadata || {}],
    )

    response.status(201).json({ scan: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/reports', async (request, response) => {
  try {
    const { userId } = request.query
    const result = await query(
      `
        select *
        from reports
        where ($1::text is null or user_id = $1)
        order by created_at desc
        limit 25
      `,
      [userId || null],
    )

    response.json({ reports: result.rows })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/reports', async (request, response) => {
  try {
    const { userId, title, reportType, payload } = request.body

    if (!title) {
      response.status(400).json({ error: 'Report title is required' })
      return
    }

    const result = await query(
      `
        insert into reports (user_id, title, report_type, payload)
        values ($1, $2, $3, $4)
        returning *
      `,
      [userId || null, title, reportType || 'seo_geo', payload || {}],
    )

    response.status(201).json({ report: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.use(express.static(path.join(__dirname, '..', 'dist')))
app.get(/.*/, (_request, response) => {
  response.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
})

migrate()
  .then(() => {
    app.listen(port, () => {
      console.log(`SignalForge listening on ${port}`)
    })
  })
  .catch((error) => {
    console.error('Database migration failed', error)
    process.exit(1)
  })
