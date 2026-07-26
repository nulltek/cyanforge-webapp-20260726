import express from 'express'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const app = express()
const port = process.env.PORT || 3000
const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || ''
const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
)
const apiKeyFeatures = [
  {
    id: 'competitor_search',
    label: 'Competitor search',
    model: 'gpt-5.5',
    reasoningEffort: 'low',
  },
]

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

    create table if not exists app_settings (
      key text primary key,
      value text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists projects (
      id bigserial primary key,
      user_id text references app_users(id) on delete set null,
      name text not null,
      description text,
      image_url text,
      website_url text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table competitors
      add column if not exists project_id bigint references projects(id) on delete cascade,
      add column if not exists business_name text,
      add column if not exists description text,
      add column if not exists location text,
      add column if not exists email text,
      add column if not exists phone text,
      add column if not exists website_url text;
  `)
}

function normalizeWebsiteUrl(rawUrl) {
  const value = String(rawUrl || '').trim()
  if (!value) {
    throw new Error('Website URL is required')
  }

  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  const parsed = new URL(withProtocol)

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Website URL must use http or https')
  }

  return parsed.toString()
}

function getOutputText(openaiResponse) {
  if (openaiResponse.output_text) {
    return openaiResponse.output_text
  }

  return (openaiResponse.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || '')
    .join('\n')
}

function parseCompetitorPayload(text) {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed)

  if (!Array.isArray(parsed.competitors)) {
    throw new Error('OpenAI response did not include competitors')
  }

  return parsed.competitors.slice(0, 12).map((competitor) => ({
    businessName: String(competitor.businessName || competitor.name || '').trim(),
    description: String(competitor.description || '').trim(),
    location: String(competitor.location || '').trim(),
    email: String(competitor.email || '').trim(),
    phone: String(competitor.phone || '').trim(),
    websiteUrl: String(competitor.websiteUrl || competitor.website || '').trim(),
  })).filter((competitor) => competitor.businessName)
}

function fallbackCompetitors(project) {
  const host = new URL(project.website_url).hostname.replace(/^www\./, '')
  const base = project.name || host

  return [
    {
      businessName: `${base} Alternative One`,
      description: 'Placeholder competitor generated until the competitor search API key is saved.',
      location: 'Unknown',
      email: '',
      phone: '',
      websiteUrl: '',
    },
    {
      businessName: `${base} Market Rival`,
      description: 'Placeholder competitor generated until live competitor search is configured.',
      location: 'Unknown',
      email: '',
      phone: '',
      websiteUrl: '',
    },
  ]
}

function featureSettingKey(featureId) {
  return `openai_api_key:${featureId}`
}

async function readOpenAiKey(featureId) {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY
  }

  if (!pool) {
    return ''
  }

  const result = await query(
    `
      select value
      from app_settings
      where key = $1 or ($2 = 'competitor_search' and key = 'openai_api_key')
      order by case when key = $1 then 0 else 1 end
      limit 1
    `,
    [featureSettingKey(featureId), featureId],
  )
  const savedValue = result.rows[0]?.value || ''
  const decryptedValue = decryptSetting(savedValue)
  return isLikelyOpenAiKey(decryptedValue) ? decryptedValue : ''
}

function isLikelyOpenAiKey(value) {
  return String(value || '').replace(/\s+/g, '').length >= 20
}

function settingSecret() {
  return crypto
    .createHash('sha256')
    .update(process.env.OPENAI_KEY_ENCRYPTION_SECRET || process.env.DATABASE_URL || 'cyanforge-local-dev')
    .digest()
}

function encryptSetting(value) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', settingSecret(), iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

function decryptSetting(value) {
  if (!value || !value.startsWith('v1:')) {
    return value || ''
  }

  const [, ivBase64, tagBase64, encryptedBase64] = value.split(':')
  const decipher = crypto.createDecipheriv('aes-256-gcm', settingSecret(), Buffer.from(ivBase64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagBase64, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}

async function verifyFirebaseUser(request) {
  if (!firebaseProjectId) {
    throw new Error('Firebase project id is not configured')
  }

  const authorization = request.headers.authorization || ''
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || []

  if (!token) {
    const error = new Error('Admin login is required')
    error.statusCode = 401
    throw error
  }

  const result = await jwtVerify(token, firebaseJwks, {
    audience: firebaseProjectId,
    issuer: `https://securetoken.google.com/${firebaseProjectId}`,
  })

  return result.payload
}

async function requireAdministrator(request) {
  const payload = await verifyFirebaseUser(request)
  const identity = `${payload.name || ''} ${payload.email || ''}`.toLowerCase()

  if (!identity.includes('nulltek')) {
    const error = new Error('Administrator access is required')
    error.statusCode = 403
    throw error
  }

  return payload
}

async function findCompetitorsWithOpenAI(project) {
  const apiKey = await readOpenAiKey('competitor_search')

  if (!apiKey) {
    return { competitors: fallbackCompetitors(project), source: 'fallback' }
  }

  const prompt = `
Find direct business competitors for this project.

Project name: ${project.name}
Project description: ${project.description || 'Not provided'}
Website URL: ${project.website_url}

Use current public web information. Return only valid JSON in this shape:
{
  "competitors": [
    {
      "businessName": "Business name",
      "description": "One clear sentence about what they do",
      "location": "City, region, country if available",
      "email": "Public email if available, otherwise empty string",
      "phone": "Public phone if available, otherwise empty string",
      "websiteUrl": "Official website URL if available, otherwise empty string"
    }
  ]
}
Return 5 to 10 competitors. Do not include the submitted business itself.
`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.5',
      reasoning: { effort: 'low' },
      tools: [{ type: 'web_search', search_context_size: 'low' }],
      input: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI competitor search failed')
  }

  return { competitors: parseCompetitorPayload(getOutputText(data)), source: 'openai' }
}

app.get('/api/health', async (_request, response) => {
  try {
    if (pool) {
      await query('select 1')
    }

    response.json({ ok: true, database: Boolean(pool), openai: Boolean(await readOpenAiKey('competitor_search')) })
  } catch (error) {
    response.status(500).json({ ok: false, error: error.message })
  }
})

app.get('/api/settings/openai', async (_request, response) => {
  try {
    const features = []
    for (const feature of apiKeyFeatures) {
      features.push({
        ...feature,
        configured: Boolean(await readOpenAiKey(feature.id)),
      })
    }

    response.json({
      configured: features.some((feature) => feature.configured),
      features,
    })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/settings/openai', async (request, response) => {
  try {
    await requireAdministrator(request)

    const { apiKey, featureId = 'competitor_search' } = request.body || {}
    const feature = apiKeyFeatures.find((item) => item.id === featureId)
    const trimmedKey = String(apiKey || '').replace(/\s+/g, '')

    if (!feature) {
      response.status(400).json({ error: 'Feature key slot is required.' })
      return
    }

    if (!isLikelyOpenAiKey(trimmedKey)) {
      response.status(400).json({ error: 'Enter an OpenAI API key with at least 20 characters.' })
      return
    }

    await query(
      `
        insert into app_settings (key, value)
        values ($1, $2)
        on conflict (key) do update set
          value = excluded.value,
          updated_at = now()
      `,
      [featureSettingKey(feature.id), encryptSetting(trimmedKey)],
    )

    const features = []
    for (const item of apiKeyFeatures) {
      features.push({
        ...item,
        configured: item.id === feature.id ? true : Boolean(await readOpenAiKey(item.id)),
      })
    }

    response.json({ configured: features.some((item) => item.configured), features })
  } catch (error) {
    response.status(error.statusCode || 500).json({ error: error.message })
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

app.get('/api/projects', async (request, response) => {
  try {
    const { userId } = request.query
    const result = await query(
      `
        select *
        from projects
        where ($1::text is null or user_id = $1)
        order by created_at desc
        limit 50
      `,
      [userId || null],
    )

    response.json({ projects: result.rows })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/projects', async (request, response) => {
  try {
    const { userId, name, description, imageUrl, websiteUrl } = request.body
    const projectName = String(name || '').trim()

    if (!projectName) {
      response.status(400).json({ error: 'Project name is required' })
      return
    }

    const normalizedWebsiteUrl = normalizeWebsiteUrl(websiteUrl)

    const result = await query(
      `
        insert into projects (user_id, name, description, image_url, website_url)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [
        userId || null,
        projectName,
        String(description || '').trim() || null,
        String(imageUrl || '').trim() || null,
        normalizedWebsiteUrl,
      ],
    )

    response.status(201).json({ project: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/projects/:projectId/competitors', async (request, response) => {
  try {
    const result = await query(
      `
        select *
        from competitors
        where project_id = $1
        order by id asc
      `,
      [request.params.projectId],
    )

    response.json({ competitors: result.rows })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/projects/:projectId/competitors/search', async (request, response) => {
  try {
    const projectResult = await query('select * from projects where id = $1', [request.params.projectId])
    const project = projectResult.rows[0]

    if (!project) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    const { competitors: foundCompetitors, source } = await findCompetitorsWithOpenAI(project)

    await query('delete from competitors where project_id = $1', [project.id])

    const savedCompetitors = []
    for (const competitor of foundCompetitors) {
      const result = await query(
        `
          insert into competitors (
            project_id,
            scan_id,
            domain,
            business_name,
            description,
            location,
            email,
            phone,
            website_url
          )
          values ($1, null, $2, $3, $4, $5, $6, $7, $8)
          returning *
        `,
        [
          project.id,
          competitor.websiteUrl || competitor.businessName,
          competitor.businessName,
          competitor.description || null,
          competitor.location || null,
          competitor.email || null,
          competitor.phone || null,
          competitor.websiteUrl || null,
        ],
      )
      savedCompetitors.push(result.rows[0])
    }

    response.status(201).json({ competitors: savedCompetitors, source })
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
