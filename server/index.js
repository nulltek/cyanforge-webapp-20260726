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
  {
    id: 'seo_analysis',
    label: 'SEO analysis',
    model: 'gpt-5.5',
    reasoningEffort: 'low',
  },
  {
    id: 'blog_writer',
    label: 'Blog and news writer',
    model: 'gpt-5.5',
    reasoningEffort: 'medium',
  },
  {
    id: 'layout_audit',
    label: 'Responsive layout audit',
    model: 'gpt-5.5',
    reasoningEffort: 'medium',
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

app.use(express.json({ limit: '3mb' }))

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
      username_change_month text,
      username_change_count integer not null default 0,
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

    create table if not exists seo_analyses (
      id bigserial primary key,
      project_id bigint references projects(id) on delete cascade,
      status text not null default 'complete',
      payload jsonb not null default '{}'::jsonb,
      source text not null default 'fallback',
      created_at timestamptz not null default now()
    );

    create table if not exists articles (
      id bigserial primary key,
      project_id bigint references projects(id) on delete cascade,
      status text not null default 'draft',
      payload jsonb not null default '{}'::jsonb,
      source text not null default 'fallback',
      created_at timestamptz not null default now()
    );

    create table if not exists layout_audits (
      id bigserial primary key,
      project_id bigint references projects(id) on delete cascade,
      status text not null default 'complete',
      payload jsonb not null default '{}'::jsonb,
      source text not null default 'fallback',
      created_at timestamptz not null default now()
    );

    alter table competitors
      add column if not exists project_id bigint references projects(id) on delete cascade,
      add column if not exists business_name text,
      add column if not exists description text,
      add column if not exists location text,
      add column if not exists email text,
      add column if not exists phone text,
      add column if not exists website_url text;

    alter table app_users
      add column if not exists username_change_month text,
      add column if not exists username_change_count integer not null default 0;
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

function parseSeoPayload(text) {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed)

  return {
    score: Math.max(0, Math.min(10, Number(parsed.score || 0))),
    summary: String(parsed.summary || '').trim(),
    rules: Array.isArray(parsed.rules) ? parsed.rules.slice(0, 12) : [],
    competitorComparison: Array.isArray(parsed.competitorComparison)
      ? parsed.competitorComparison.slice(0, 10)
      : [],
    popularKeywords: Array.isArray(parsed.popularKeywords)
      ? parsed.popularKeywords.slice(0, 20).map(String)
      : [],
    keywordCoverage: Array.isArray(parsed.keywordCoverage)
      ? parsed.keywordCoverage.slice(0, 20)
      : [],
    rankingPlan: Array.isArray(parsed.rankingPlan)
      ? parsed.rankingPlan.slice(0, 12).map(String)
      : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 12) : [],
  }
}

function parseArticlePayload(text) {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed)

  return {
    title: String(parsed.title || '').trim(),
    slug: String(parsed.slug || '').trim(),
    excerpt: String(parsed.excerpt || '').trim(),
    trendSummary: String(parsed.trendSummary || '').trim(),
    competitorAngles: Array.isArray(parsed.competitorAngles) ? parsed.competitorAngles.slice(0, 8) : [],
    postText: String(parsed.postText || '').trim(),
    callToAction: String(parsed.callToAction || '').trim(),
  }
}

function normalizeFindingList(value, limit = 24) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.slice(0, limit).map((item) => {
    if (typeof item === 'string') {
      return {
        title: item,
        severity: 'medium',
        finding: item,
        fix: 'Review and correct this issue.',
      }
    }

    return {
      title: String(item.title || item.issue || item.rule || 'Layout issue').trim(),
      severity: String(item.severity || item.status || 'medium').trim(),
      finding: String(item.finding || item.description || item.problem || '').trim(),
      fix: String(item.fix || item.recommendation || item.solution || '').trim(),
    }
  }).filter((item) => item.title || item.finding || item.fix)
}

function parseLayoutAuditPayload(text) {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : trimmed)

  return {
    score: Math.max(0, Math.min(10, Number(parsed.score || 0))),
    summary: String(parsed.summary || '').trim(),
    mobile: normalizeFindingList(parsed.mobile),
    laptop: normalizeFindingList(parsed.laptop),
    responsiveness: normalizeFindingList(parsed.responsiveness),
    layoutIssues: normalizeFindingList(parsed.layoutIssues),
    brandingIssues: normalizeFindingList(parsed.brandingIssues),
    accessibilityIssues: normalizeFindingList(parsed.accessibilityIssues),
    quickWins: Array.isArray(parsed.quickWins) ? parsed.quickWins.slice(0, 16).map(String) : [],
    priorityRoadmap: Array.isArray(parsed.priorityRoadmap) ? parsed.priorityRoadmap.slice(0, 16).map(String) : [],
  }
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

function fallbackSeoAnalysis(project, competitors) {
  return {
    score: 5.2,
    summary: 'Placeholder SEO analysis shown until the SEO analysis API key is saved.',
    rules: [
      { rule: 'Title tags', status: 'review', finding: 'Check that each important page has one clear title under 60 characters.' },
      { rule: 'Meta descriptions', status: 'review', finding: 'Write useful descriptions for indexable pages.' },
      { rule: 'Headings', status: 'review', finding: 'Use one H1 and a logical H2/H3 structure.' },
      { rule: 'Core Web Vitals', status: 'review', finding: 'Measure mobile performance and interaction delay.' },
      { rule: 'Indexability', status: 'review', finding: 'Confirm robots, canonicals, and sitemap coverage.' },
    ],
    competitorComparison: competitors.slice(0, 5).map((competitor) => ({
      businessName: competitor.business_name,
      edge: 'Compare metadata, speed, content depth, backlinks, and local signals.',
      risk: 'Unknown until live SEO analysis runs.',
    })),
    popularKeywords: [],
    keywordCoverage: [],
    rankingPlan: [
      'Save the SEO analysis API key to research current popular keywords.',
      'Map missing buyer-intent keywords to landing pages and article briefs.',
      'Strengthen AI-search answers with structured, quotable, source-backed content.',
    ],
    recommendations: [
      'Save the SEO analysis API key to run live research with web search.',
      `Audit ${project.website_url} against current on-page SEO basics.`,
      'Run competitor search first for stronger comparison context.',
    ],
  }
}

function fallbackLayoutAudit(project) {
  return {
    score: 5.0,
    summary: 'Placeholder responsive layout audit shown until the responsive layout audit API key is saved.',
    mobile: [
      {
        title: 'Mobile viewport review needed',
        severity: 'review',
        finding: 'Check the page at 360px, 390px, and 430px widths for clipped text, overflowing cards, crowded navigation, and tap target spacing.',
        fix: 'Save the responsive layout audit API key to run a live mobile and laptop layout review.',
      },
    ],
    laptop: [
      {
        title: 'Laptop viewport review needed',
        severity: 'review',
        finding: 'Check common laptop widths around 1366px and 1440px for excessive empty space, weak hierarchy, and awkward section balance.',
        fix: 'Run the live audit to compare structure, branding, spacing, and responsive behavior.',
      },
    ],
    responsiveness: [
      {
        title: 'Breakpoint checks',
        severity: 'review',
        finding: 'Confirm each major section has stable widths, readable headings, and no horizontal scroll across breakpoints.',
        fix: 'Test mobile, tablet, and laptop breakpoints before shipping.',
      },
    ],
    layoutIssues: [],
    brandingIssues: [],
    accessibilityIssues: [],
    quickWins: [
      'Save the responsive layout audit API key.',
      `Audit ${project.website_url} at mobile and laptop widths.`,
      'Prioritize clipped text, overflow, CTA visibility, navigation usability, and brand consistency.',
    ],
    priorityRoadmap: [
      'Run live audit.',
      'Fix high-severity mobile layout problems.',
      'Fix laptop hierarchy and spacing problems.',
      'Re-check branding and accessibility polish.',
    ],
  }
}

function fallbackArticle(project, competitors) {
  return {
    title: `${project.name}: What buyers should watch this week`,
    slug: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-market-watch`,
    excerpt: 'A placeholder post draft shown until the blog writer API key is saved.',
    trendSummary: 'Live internet trend analysis requires the blog and news writer API key.',
    competitorAngles: competitors.slice(0, 5).map((competitor) => ({
      businessName: competitor.business_name,
      angle: 'Review this competitor for timely content angles, launches, offers, and positioning.',
    })),
    postText: `# ${project.name}: What buyers should watch this week\n\nThe market around ${project.name} is moving quickly. Teams should publish useful, timely content that answers buyer questions clearly, compares common options, and explains what makes the business different.\n\nStart with practical advice, current customer pain points, and a clear next step. Add competitor-aware context once live trend research is enabled.`,
    callToAction: `Explore ${project.name} and compare your options with confidence.`,
  }
}

async function fetchWebsiteSnapshot(url) {
  try {
    const targetUrl = new URL(url)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RankSprintAuditBot/1.0 (+https://cyanforge-web.onrender.com/)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    })

    const html = await response.text()
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || ''
    const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]?.trim()
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]?.trim()
      || ''
    const bodyText = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, (match) => match.replace(/<\/?noscript[^>]*>/gi, ' '))
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 16000)

    const scriptSources = [...html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/gi)]
      .map((match) => match[1])
      .filter(Boolean)
      .slice(0, 6)

    const bundleTexts = []
    for (const source of scriptSources) {
      try {
        const scriptUrl = new URL(source, targetUrl)
        if (scriptUrl.origin !== targetUrl.origin) {
          continue
        }

        const scriptResponse = await fetch(scriptUrl, {
          headers: { 'User-Agent': 'RankSprintAuditBot/1.0' },
          signal: AbortSignal.timeout(6000),
        })
        const scriptText = await scriptResponse.text()
        const readableBundleText = scriptText
          .replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) => String.fromCharCode(Number.parseInt(code, 16)))
          .replace(/[^a-zA-Z0-9$.,:;!?@/#%&()[\]\s-]/g, ' ')
          .replace(/\s+/g, ' ')
          .slice(0, 8000)
        bundleTexts.push(`Script ${scriptUrl.pathname}: ${readableBundleText}`)
      } catch {
        // Ignore script fetch failures; raw HTML still gives crawlers and the model some context.
      }
    }

    const clientShellWarning = bodyText.length < 500 && /id=["']root["']/i.test(html)
      ? 'Important: raw HTML looks like a client-rendered app shell. Do not conclude that the website is blank only from the empty root. Use fetched same-origin bundle text, static fallback content, and public web/rendered-page context before judging layout.'
      : ''

    return [
      `Final URL: ${response.url}`,
      `HTTP status: ${response.status}`,
      title ? `Title: ${title}` : '',
      metaDescription ? `Meta description: ${metaDescription}` : '',
      clientShellWarning,
      `Raw/fallback body text: ${bodyText}`,
      bundleTexts.length ? `Same-origin client bundle text signals:\n${bundleTexts.join('\n\n')}` : '',
    ].filter(Boolean).join('\n\n').slice(0, 26000)
  } catch {
    return ''
  }
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
    .update(process.env.OPENAI_KEY_ENCRYPTION_SECRET || process.env.DATABASE_URL || 'ranksprint-local-dev')
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
Find direct business competitors for the business represented by this website URL.

Website URL: ${project.website_url}

Only use the submitted website URL as the target business input. You may inspect that URL, public pages under that same domain, and public search results needed to identify competitors. Do not use project name, project description, saved competitor rows, or saved reports as source input.

Return only valid JSON in this shape:
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

async function analyzeSeoWithOpenAI(project) {
  const apiKey = await readOpenAiKey('seo_analysis')

  if (!apiKey) {
    return { analysis: fallbackSeoAnalysis(project, []), source: 'fallback' }
  }

  const websiteSnapshot = await fetchWebsiteSnapshot(project.website_url)

  const prompt = `
Analyze SEO for the business represented by this website URL and compare it with competitors discovered from public web context.

Website URL: ${project.website_url}

Fetched target-site snapshot:
${websiteSnapshot || 'Fetch unavailable. Use public web search context and visible search snippets.'}

Only use the submitted website URL as the target business input. You may inspect that URL, public pages under that same domain, and public search results needed for competitor comparison, keyword research, search-engine ranking opportunities, and AI-search/GEO visibility opportunities. Do not use project name, project description, saved competitor rows, saved reports, or prior analyses as source input.

Research current competitors in the same market, popular keywords and buyer-intent phrases in the field, recent search demand patterns, and topics that appear in search results or AI research answers. Check whether the target site actually uses those keywords or close semantic variants in title tags, headings, body copy, internal links, structured data, and high-value landing pages.

Compare the target site to competitors on content depth, topical authority, structured data, trust signals, local/business proof, page speed signals, internal linking, snippet quality, and AI-answer usefulness. Recommendations must help the target website rank higher in traditional search engines and be cited or summarized better by AI research tools.

Return only valid JSON in this shape:
{
  "score": 0,
  "summary": "Short executive SEO summary",
  "rules": [
    { "rule": "Basic SEO rule", "status": "pass|warning|fail|unknown", "finding": "Concrete finding" }
  ],
  "competitorComparison": [
    { "businessName": "Competitor", "edge": "Where they appear stronger or weaker", "risk": "Main SEO risk" }
  ],
  "popularKeywords": ["Popular keyword or query in this field"],
  "keywordCoverage": [
    { "keyword": "Keyword", "present": true, "whereFound": "Where it appears on the target site or empty if missing", "opportunity": "How to use it better" }
  ],
  "rankingPlan": ["Specific step to improve search-engine and AI-research visibility"],
  "recommendations": ["Specific prioritized recommendation"]
}

Score must be from 0 to 10, where 10 is excellent SEO. Rules to cover: title tags, meta descriptions, headings, internal links, indexability, mobile performance, structured data, content depth, local/business trust signals, technical crawlability, competitor gaps, popular keyword coverage, and AI-search answer readiness.
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
      tool_choice: 'auto',
      input: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI SEO analysis failed')
  }

  return { analysis: parseSeoPayload(getOutputText(data)), source: 'openai' }
}

async function writeArticleWithOpenAI(project) {
  const apiKey = await readOpenAiKey('blog_writer')

  if (!apiKey) {
    return { article: fallbackArticle(project, []), source: 'fallback' }
  }

  const prompt = `
Write a blog/news article draft for the business represented by this website URL.

Website URL: ${project.website_url}

Only use the submitted website URL as the target business input. You may inspect that URL, public pages under that same domain, current internet trends, search demand, and public competitor activity discovered from web search. Do not use project name, project description, saved competitor rows, saved reports, or prior analyses as source input.

Analyze current internet trends, recent news hooks, current innovations, trending articles, recent breakthroughs, new product/category shifts, search demand, and what competitors discovered from the URL's market appear to be discussing or promoting. Then write one useful post draft for the business.

The article must feel edited by a strong human content editor: open with a sharp hook, create curiosity in the first 2 sentences, use clear stakes, vary sentence length, avoid generic filler, add concrete examples, make headings specific, and end each major section with a reason to keep reading. Make it engaging without clickbait. The draft should help the site earn SEO traffic and AI-search citations by answering real questions clearly.

Return only valid JSON in this shape:
{
  "title": "Article title",
  "slug": "article-slug",
  "excerpt": "Short excerpt",
  "trendSummary": "What current innovation, trend, article, or breakthrough angle the article uses",
  "competitorAngles": [
    { "businessName": "Competitor", "angle": "What they seem to be doing or what content gap exists" }
  ],
  "postText": "Full engaging article body in markdown, 700-1000 words, with a strong hook, specific headings, examples, and reader-focused flow",
  "callToAction": "One CTA sentence"
}
`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.5',
      reasoning: { effort: 'medium' },
      tools: [{ type: 'web_search', search_context_size: 'low' }],
      tool_choice: 'auto',
      input: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI article writer failed')
  }

  return { article: parseArticlePayload(getOutputText(data)), source: 'openai' }
}

async function analyzeLayoutWithOpenAI(project) {
  const apiKey = await readOpenAiKey('layout_audit')

  if (!apiKey) {
    return { audit: fallbackLayoutAudit(project), source: 'fallback' }
  }

  const websiteSnapshot = await fetchWebsiteSnapshot(project.website_url)

  const prompt = `
Analyze this website's mobile and laptop layout quality.

Website URL: ${project.website_url}

Fetched page snapshot:
${websiteSnapshot || 'Fetch unavailable. Use public web search context and visible search snippets.'}

Only use the submitted website URL as the target business input. You may inspect that URL, public pages under that same domain, current public web information for category norms, rendered search/web previews, and public competitor examples discovered from the URL's market. Do not use project name, project description, saved competitor rows, saved reports, or prior analyses as source input.

If the fetched snapshot says the raw HTML is a client-rendered app shell, do not score the site as blank just because #root is empty in raw HTML. Use same-origin bundle text signals, static fallback content, and public rendered-page context to infer the actual visible interface. Only report a blank-site issue when both the fetched snapshot and public/rendered context show no usable content.

Judge common mobile widths around 360-430px and laptop widths around 1366-1440px. Look for responsiveness, layout issues, branding consistency, visual hierarchy, navigation, CTA clarity, imagery quality, spacing, overflow risk, accessibility, and competitor/category expectations.

Return only valid JSON in this shape:
{
  "score": 0,
  "summary": "Short executive layout audit summary",
  "mobile": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "Concrete mobile finding", "fix": "Specific fix" }
  ],
  "laptop": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "Concrete laptop finding", "fix": "Specific fix" }
  ],
  "responsiveness": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "Breakpoint or scaling finding", "fix": "Specific fix" }
  ],
  "layoutIssues": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "General layout finding", "fix": "Specific fix" }
  ],
  "brandingIssues": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "Branding or visual identity finding", "fix": "Specific fix" }
  ],
  "accessibilityIssues": [
    { "title": "Issue title", "severity": "critical|high|medium|low|good", "finding": "Accessibility finding", "fix": "Specific fix" }
  ],
  "quickWins": ["Short fix"],
  "priorityRoadmap": ["Ordered implementation step"]
}

Score must be from 0 to 10, where 10 means polished, responsive, accessible, and brand-consistent on mobile and laptop.
`

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.5',
      reasoning: { effort: 'medium' },
      tools: [{ type: 'web_search', search_context_size: 'low' }],
      tool_choice: 'auto',
      input: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error?.message || 'OpenAI responsive layout audit failed')
  }

  return { audit: parseLayoutAuditPayload(getOutputText(data)), source: 'openai' }
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

app.get('/robots.txt', (_request, response) => {
  response.type('text/plain').send([
    'User-agent: *',
    'Allow: /',
    'Sitemap: https://cyanforge-web.onrender.com/sitemap.xml',
    '',
  ].join('\n'))
})

app.get('/sitemap.xml', (_request, response) => {
  response.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cyanforge-web.onrender.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`)
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

app.get('/api/users/:userId/profile', async (request, response) => {
  try {
    const result = await query('select * from app_users where id = $1', [request.params.userId])
    response.json({ profile: result.rows[0] || null })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.patch('/api/users/:userId/profile', async (request, response) => {
  try {
    const payload = await verifyFirebaseUser(request)
    const userId = request.params.userId

    if (payload.user_id !== userId && payload.sub !== userId) {
      response.status(403).json({ error: 'You can only update your own profile.' })
      return
    }

    const requestedName = String(request.body?.displayName || '').trim()
    const requestedPhoto = String(request.body?.photoURL || '').trim()

    if (!requestedName) {
      response.status(400).json({ error: 'Username is required.' })
      return
    }

    const currentResult = await query('select * from app_users where id = $1', [userId])
    const currentProfile = currentResult.rows[0]
    if (!currentProfile) {
      await query(
        `
          insert into app_users (id, email, display_name, photo_url, provider)
          values ($1, $2, $3, $4, $5)
          on conflict (id) do nothing
        `,
        [userId, payload.email || null, payload.name || null, payload.picture || null, 'firebase'],
      )
    }
    const monthKey = new Date().toISOString().slice(0, 7)
    const currentMonth = currentProfile?.username_change_month === monthKey
    const currentCount = currentMonth ? Number(currentProfile?.username_change_count || 0) : 0
    const nameChanged = requestedName !== String(currentProfile?.display_name || '').trim()

    if (nameChanged && currentCount >= 2) {
      response.status(429).json({ error: 'Username can only be changed 2 times per month.' })
      return
    }

    const nextCount = nameChanged ? currentCount + 1 : currentCount
    const result = await query(
      `
        update app_users
        set display_name = $2,
            photo_url = $3,
            username_change_month = $4,
            username_change_count = $5,
            updated_at = now()
        where id = $1
        returning *
      `,
      [userId, requestedName, requestedPhoto || null, monthKey, nextCount],
    )

    response.json({
      profile: result.rows[0],
      usernameChangesRemaining: Math.max(0, 2 - nextCount),
    })
  } catch (error) {
    response.status(error.statusCode || 500).json({ error: error.message })
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

app.get('/api/projects/:projectId/seo/latest', async (request, response) => {
  try {
    const result = await query(
      `
        select *
        from seo_analyses
        where project_id = $1
        order by created_at desc
        limit 1
      `,
      [request.params.projectId],
    )

    response.json({ analysis: result.rows[0] || null })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/projects/:projectId/seo/analyze', async (request, response) => {
  try {
    const projectResult = await query('select * from projects where id = $1', [request.params.projectId])
    const project = projectResult.rows[0]

    if (!project) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    const { analysis, source } = await analyzeSeoWithOpenAI(project)
    const result = await query(
      `
        insert into seo_analyses (project_id, payload, source)
        values ($1, $2, $3)
        returning *
      `,
      [project.id, analysis, source],
    )

    response.status(201).json({ analysis: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/projects/:projectId/articles/latest', async (request, response) => {
  try {
    const result = await query(
      `
        select *
        from articles
        where project_id = $1
        order by created_at desc
        limit 1
      `,
      [request.params.projectId],
    )

    response.json({ article: result.rows[0] || null })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/projects/:projectId/articles', async (request, response) => {
  try {
    const result = await query(
      `
        select *
        from articles
        where project_id = $1
        order by created_at desc
        limit 50
      `,
      [request.params.projectId],
    )

    response.json({ articles: result.rows })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/projects/:projectId/articles/write', async (request, response) => {
  try {
    const projectResult = await query('select * from projects where id = $1', [request.params.projectId])
    const project = projectResult.rows[0]

    if (!project) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    const { article, source } = await writeArticleWithOpenAI(project)
    const result = await query(
      `
        insert into articles (project_id, payload, source)
        values ($1, $2, $3)
        returning *
      `,
      [project.id, article, source],
    )

    response.status(201).json({ article: result.rows[0] })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.get('/api/projects/:projectId/layout/latest', async (request, response) => {
  try {
    const result = await query(
      `
        select *
        from layout_audits
        where project_id = $1
        order by created_at desc
        limit 1
      `,
      [request.params.projectId],
    )

    response.json({ audit: result.rows[0] || null })
  } catch (error) {
    response.status(500).json({ error: error.message })
  }
})

app.post('/api/projects/:projectId/layout/analyze', async (request, response) => {
  try {
    const projectResult = await query('select * from projects where id = $1', [request.params.projectId])
    const project = projectResult.rows[0]

    if (!project) {
      response.status(404).json({ error: 'Project not found' })
      return
    }

    const { audit, source } = await analyzeLayoutWithOpenAI(project)
    const result = await query(
      `
        insert into layout_audits (project_id, payload, source)
        values ($1, $2, $3)
        returning *
      `,
      [project.id, audit, source],
    )

    response.status(201).json({ audit: result.rows[0] })
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
      console.log(`RankSprint listening on ${port}`)
    })
  })
  .catch((error) => {
    console.error('Database migration failed', error)
    process.exit(1)
  })
