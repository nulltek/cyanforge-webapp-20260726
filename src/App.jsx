import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  LogIn,
  Mail,
  MapPin,
  MonitorSmartphone,
  Newspaper,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react'
import {
  isFirebaseConfigured,
  listenToAuthState,
  loginWithEmail,
  loginWithGoogleCredential,
  logout,
  registerWithEmail,
} from './firebaseAuth'
import './App.css'

function visualDataUri(title, variant = 0) {
  const palettes = [
    ['#ffffff', '#dff7ff', '#00a7df', '#075985'],
    ['#f8fdff', '#c8f2ff', '#27c3f3', '#0f6c8f'],
    ['#ffffff', '#e9fbff', '#63d6ff', '#06445f'],
  ]
  const [paper, wash, cyan, ink] = palettes[variant % palettes.length]
  const safeTitle = title.replace(/[<>&]/g, '')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 820">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="${paper}"/>
          <stop offset="1" stop-color="${wash}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="820" fill="url(#bg)"/>
      <circle cx="1000" cy="80" r="190" fill="${cyan}" opacity=".06"/>
      <circle cx="180" cy="720" r="220" fill="${cyan}" opacity=".05"/>
      <rect x="108" y="96" width="984" height="628" rx="42" fill="#ffffff" opacity=".84" stroke="${cyan}" stroke-opacity=".28"/>
      <rect x="158" y="150" width="414" height="44" rx="22" fill="${ink}" opacity=".88"/>
      <rect x="158" y="220" width="250" height="18" rx="9" fill="${cyan}" opacity=".16"/>
      <rect x="158" y="258" width="326" height="18" rx="9" fill="${cyan}" opacity=".09"/>
      <rect x="160" y="348" width="250" height="242" rx="28" fill="${wash}" stroke="${cyan}" stroke-opacity=".22"/>
      <rect x="460" y="348" width="250" height="242" rx="28" fill="#ffffff" stroke="${cyan}" stroke-opacity=".22"/>
      <rect x="760" y="348" width="250" height="242" rx="28" fill="${wash}" stroke="${cyan}" stroke-opacity=".22"/>
      <path d="M198 526 C276 402 326 480 386 390" fill="none" stroke="${cyan}" stroke-width="10" stroke-linecap="round"/>
      <path d="M498 526 C564 470 610 500 678 404" fill="none" stroke="${ink}" stroke-opacity=".34" stroke-width="10" stroke-linecap="round"/>
      <path d="M798 526 C852 446 924 468 978 382" fill="none" stroke="${cyan}" stroke-width="10" stroke-linecap="round"/>
      <g fill="${ink}" opacity=".72" font-family="Arial, sans-serif" font-size="34" font-weight="700">
        <text x="158" y="666">${safeTitle}</text>
      </g>
      <g fill="${cyan}" opacity=".36">
        <circle cx="242" cy="526" r="12"/>
        <circle cx="626" cy="444" r="12"/>
        <circle cx="934" cy="456" r="12"/>
      </g>
    </svg>
  `

  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

async function apiRequest(path, options = {}) {
  const { headers: optionHeaders, ...requestOptions } = options

  const response = await fetch(path, {
    ...requestOptions,
    headers: { 'Content-Type': 'application/json', ...optionHeaders },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

function addWrappedText(doc, text, x, y, width, lineHeight = 6, maxY = 278) {
  const lines = doc.splitTextToSize(String(text || ''), width)
  let cursorY = y

  for (const line of lines) {
    if (cursorY > maxY) {
      return cursorY
    }
    doc.text(line, x, cursorY)
    cursorY += lineHeight
  }

  return cursorY
}

function addPdfPageHeader(doc, title) {
  doc.setTextColor(6, 45, 66)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 22)
}

function ensurePdfSpace(doc, cursorY, needed = 28, title = '') {
  if (cursorY + needed <= 280) {
    return cursorY
  }

  doc.addPage()
  if (title) {
    addPdfPageHeader(doc, title)
    return 34
  }
  return 22
}

function addDynamicWrappedText(doc, text, x, cursorY, width, lineHeight = 5, pageTitle = '') {
  const lines = doc.splitTextToSize(String(text || ''), width)
  let nextY = cursorY

  for (const line of lines) {
    nextY = ensurePdfSpace(doc, nextY, lineHeight + 2, pageTitle)
    doc.text(line, x, nextY)
    nextY += lineHeight
  }

  return nextY
}

function addAuditPdfSection(doc, title, items, cursorY) {
  let nextY = ensurePdfSpace(doc, cursorY, 18, 'Responsive Layout Audit')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(title, 14, nextY)
  nextY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  const safeItems = Array.isArray(items) ? items : []
  if (!safeItems.length) {
    nextY = addDynamicWrappedText(doc, 'No issues listed for this section.', 14, nextY, 180, 5, 'Responsive Layout Audit')
    return nextY + 5
  }

  safeItems.forEach((item, index) => {
    nextY = ensurePdfSpace(doc, nextY, 26, 'Responsive Layout Audit')
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}. ${item.title || 'Finding'} (${item.severity || 'review'})`, 14, nextY)
    nextY += 6
    doc.setFont('helvetica', 'normal')
    nextY = addDynamicWrappedText(doc, `Finding: ${item.finding || 'No finding text provided.'}`, 18, nextY, 176, 5, 'Responsive Layout Audit')
    nextY = addDynamicWrappedText(doc, `Fix: ${item.fix || 'Review and correct this item.'}`, 18, nextY + 2, 176, 5, 'Responsive Layout Audit')
    nextY += 5
  })

  return nextY + 3
}

async function downloadLayoutAuditPdf(project, audit) {
  if (!project || !audit?.payload) {
    return
  }

  const { jsPDF } = await import('jspdf')
  const payload = audit.payload
  const score = Number(payload.score || 0).toFixed(1)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const fileBase = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layout-audit'

  doc.setProperties({
    title: `${project.name} responsive layout audit`,
    subject: 'Mobile, laptop, responsiveness, layout, and branding audit',
    creator: 'CyanForge',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CyanForge Responsive Layout Audit', 14, 19)

  doc.setTextColor(6, 45, 66)
  doc.setFontSize(21)
  doc.text(project.name, 14, 46)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(project.website_url, 14, 54)

  doc.setDrawColor(53, 212, 255)
  doc.roundedRect(150, 40, 42, 28, 3, 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(`${score}/10`, 158, 58)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Executive summary', 14, 80)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let cursorY = addDynamicWrappedText(doc, payload.summary || 'No summary available.', 14, 88, 180, 5, 'Responsive Layout Audit')

  const sections = [
    ['Mobile layout', payload.mobile],
    ['Laptop layout', payload.laptop],
    ['Responsiveness and breakpoints', payload.responsiveness],
    ['Layout issues', payload.layoutIssues],
    ['Branding issues', payload.brandingIssues],
    ['Accessibility issues', payload.accessibilityIssues],
  ]

  sections.forEach(([title, items]) => {
    cursorY = addAuditPdfSection(doc, title, items, cursorY + 8)
  })

  cursorY = ensurePdfSpace(doc, cursorY + 4, 20, 'Responsive Layout Audit')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Quick wins', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(payload.quickWins || []).forEach((win, index) => {
    cursorY = addDynamicWrappedText(doc, `${index + 1}. ${win}`, 14, cursorY, 180, 5, 'Responsive Layout Audit') + 2
  })

  cursorY = ensurePdfSpace(doc, cursorY + 6, 20, 'Responsive Layout Audit')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Priority roadmap', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(payload.priorityRoadmap || []).forEach((step, index) => {
    cursorY = addDynamicWrappedText(doc, `${index + 1}. ${step}`, 14, cursorY, 180, 5, 'Responsive Layout Audit') + 2
  })

  doc.save(`${fileBase}-responsive-layout-audit.pdf`)
}

async function downloadSeoPdf(project, analysis) {
  if (!project || !analysis?.payload) {
    return
  }

  const { jsPDF } = await import('jspdf')
  const payload = analysis.payload
  const score = Number(payload.score || 0).toFixed(1)
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const fileBase = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'seo-report'

  doc.setProperties({
    title: `${project.name} SEO improvement report`,
    subject: 'SEO recommendations',
    creator: 'CyanForge',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CyanForge SEO Improvement Report', 14, 18)

  doc.setTextColor(6, 45, 66)
  doc.setFontSize(22)
  doc.text(project.name, 14, 44)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(project.website_url, 14, 52)

  doc.setDrawColor(53, 212, 255)
  doc.roundedRect(150, 38, 42, 28, 3, 3)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(`${score}/10`, 158, 56)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Executive summary', 14, 74)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let cursorY = addWrappedText(doc, payload.summary || 'No summary available.', 14, 82, 180)

  cursorY += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Top improvements', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  ;(payload.recommendations || []).slice(0, 9).forEach((recommendation, index) => {
    cursorY = addWrappedText(doc, `${index + 1}. ${recommendation}`, 14, cursorY, 180)
    cursorY += 3
  })

  doc.addPage()
  doc.setFillColor(239, 251, 255)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setTextColor(6, 45, 66)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Rules and competitor comparison', 14, 22)

  doc.setFontSize(13)
  doc.text('SEO rules to improve', 14, 38)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  cursorY = 46
  ;(payload.rules || []).slice(0, 8).forEach((rule) => {
    cursorY = addWrappedText(doc, `${rule.rule} (${rule.status}): ${rule.finding}`, 14, cursorY, 180, 5, 142)
    cursorY += 3
  })

  cursorY = 158
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Competitor notes', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(payload.competitorComparison || []).slice(0, 7).forEach((competitor) => {
    cursorY = addWrappedText(
      doc,
      `${competitor.businessName}: ${competitor.edge} Risk: ${competitor.risk}`,
      14,
      cursorY,
      180,
      5,
      280,
    )
    cursorY += 3
  })

  doc.save(`${fileBase}-seo-improvements.pdf`)
}

async function downloadAnalyticsPdf(project, competitors, seoAnalysis, articleDraft, layoutAudit, reports, competitorSource) {
  if (!project) {
    return
  }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const fileBase = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'analytics-report'
  const seoPayload = seoAnalysis?.payload || {}
  const articlePayload = articleDraft?.payload || {}
  const layoutPayload = layoutAudit?.payload || {}

  doc.setProperties({
    title: `${project.name} analytics report`,
    subject: 'CyanForge analytics export',
    creator: 'CyanForge',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('CyanForge Analytics Report', 14, 18)

  doc.setTextColor(6, 45, 66)
  doc.setFontSize(22)
  doc.text(project.name, 14, 44)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(project.website_url, 14, 52)

  const scoreText = seoPayload.score != null ? `${Number(seoPayload.score).toFixed(1)}/10` : 'None'
  const metricCards = [
    ['Competitors found', String(competitors.length)],
    ['Competitor source', competitorSource || 'None'],
    ['SEO score', scoreText],
    ['Layout score', layoutPayload.score != null ? `${Number(layoutPayload.score).toFixed(1)}/10` : 'None'],
    ['Reports saved', String(reports.length)],
  ]

  let x = 14
  metricCards.forEach(([label, value]) => {
    doc.setDrawColor(53, 212, 255)
    doc.roundedRect(x, 70, 34, 26, 3, 3)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(label, x + 4, 79)
    doc.setFontSize(13)
    doc.text(value, x + 4, 90)
    x += 37
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Project summary', 14, 112)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let cursorY = addWrappedText(doc, project.description || 'No project description added.', 14, 120, 180)

  cursorY += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Competitors', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  competitors.slice(0, 12).forEach((competitor, index) => {
    cursorY = addWrappedText(
      doc,
      `${index + 1}. ${competitor.business_name} - ${competitor.website_url || 'No website'} - ${competitor.location || 'No location'}`,
      14,
      cursorY,
      180,
      5,
      278,
    )
    cursorY += 2
  })

  doc.addPage()
  doc.setTextColor(6, 45, 66)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('SEO signals and recommendations', 14, 22)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  cursorY = addWrappedText(doc, seoPayload.summary || 'No SEO analysis has been run yet.', 14, 34, 180)

  cursorY += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Recommendations', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(seoPayload.recommendations || []).slice(0, 12).forEach((recommendation, index) => {
    cursorY = addWrappedText(doc, `${index + 1}. ${recommendation}`, 14, cursorY, 180, 5, 160)
    cursorY += 2
  })

  cursorY = 178
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('SEO rule findings', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(seoPayload.rules || []).slice(0, 8).forEach((rule) => {
    cursorY = addWrappedText(doc, `${rule.rule} (${rule.status}): ${rule.finding}`, 14, cursorY, 180, 5, 280)
    cursorY += 2
  })

  if (articlePayload.title) {
    doc.addPage()
    doc.setTextColor(6, 45, 66)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Latest article draft', 14, 22)
    doc.setFontSize(14)
    doc.text(articlePayload.title, 14, 36)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    cursorY = addWrappedText(doc, articlePayload.trendSummary || '', 14, 46, 180, 5, 76)
    cursorY += 8
    cursorY = addWrappedText(doc, articlePayload.postText || '', 14, cursorY, 180, 5, 278)
  }

  if (layoutPayload.summary) {
    doc.addPage()
    doc.setTextColor(6, 45, 66)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Responsive layout audit', 14, 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    cursorY = addDynamicWrappedText(doc, layoutPayload.summary, 14, 34, 180, 5, 'Responsive layout audit')
    cursorY = addAuditPdfSection(doc, 'Mobile layout', layoutPayload.mobile, cursorY + 8)
    cursorY = addAuditPdfSection(doc, 'Laptop layout', layoutPayload.laptop, cursorY + 8)
    cursorY = addAuditPdfSection(doc, 'Branding issues', layoutPayload.brandingIssues, cursorY + 8)
  }

  doc.save(`${fileBase}-analytics.pdf`)
}

function App() {
  const rootRef = useRef(null)
  const [authMode, setAuthMode] = useState(null)
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('home')
  const [dashboardTab, setDashboardTab] = useState('details')
  const [actionStatus, setActionStatus] = useState('Ready to save scans and reports')
  const [savedReports, setSavedReports] = useState([])
  const [openAiStatus, setOpenAiStatus] = useState({ configured: false, features: [] })
  const [openAiKeys, setOpenAiKeys] = useState({})
  const [openAiSavingFeature, setOpenAiSavingFeature] = useState('')
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    websiteUrl: '',
  })
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [seoAnalysis, setSeoAnalysis] = useState(null)
  const [articleDraft, setArticleDraft] = useState(null)
  const [layoutAudit, setLayoutAudit] = useState(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState(null)
  const [projectBusy, setProjectBusy] = useState(false)
  const [competitorSource, setCompetitorSource] = useState('')
  const [featureJobs, setFeatureJobs] = useState({})
  const [hiddenJobPopups, setHiddenJobPopups] = useState({})
  const [unreadFeatureDots, setUnreadFeatureDots] = useState({})
  const isAdministrator = Boolean(
    user
      && `${user.displayName || ''} ${user.email || ''}`.toLowerCase().includes('nulltek'),
  )
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null
  const competitorSearchKey = openAiStatus.features.find((feature) => feature.id === 'competitor_search')
  const competitorJob = featureJobs.competitor_search
  const seoAnalysisKey = openAiStatus.features.find((feature) => feature.id === 'seo_analysis')
  const seoJob = featureJobs.seo_analysis
  const blogWriterKey = openAiStatus.features.find((feature) => feature.id === 'blog_writer')
  const blogJob = featureJobs.blog_writer
  const layoutAuditKey = openAiStatus.features.find((feature) => feature.id === 'layout_audit')
  const layoutJob = featureJobs.layout_audit
  const showCompetitorMiniProgress = Boolean(
    competitorJob
      && competitorJob.status === 'running'
      && dashboardTab !== 'competitor search'
      && !hiddenJobPopups.competitor_search,
  )
  const showSeoMiniProgress = Boolean(
    seoJob
      && seoJob.status === 'running'
      && dashboardTab !== 'seo analysis'
      && !hiddenJobPopups.seo_analysis,
  )
  const showBlogMiniProgress = Boolean(
    blogJob
      && blogJob.status === 'running'
      && dashboardTab !== 'blog writer'
      && !hiddenJobPopups.blog_writer,
  )
  const showLayoutMiniProgress = Boolean(
    layoutJob
      && layoutJob.status === 'running'
      && dashboardTab !== 'layout audit'
      && !hiddenJobPopups.layout_audit,
  )

  useEffect(() => listenToAuthState(setUser), [])

  useEffect(() => {
    apiRequest('/api/health')
      .then((data) => {
        setActionStatus(data.database ? 'Database connected' : 'Database not configured')
        setOpenAiStatus((current) => ({ ...current, configured: Boolean(data.openai) }))
      })
      .catch((error) => setActionStatus(error.message))

    apiRequest('/api/settings/openai')
      .then((data) => setOpenAiStatus(data))
      .catch((error) => setActionStatus(error.message))

    loadProjects(null)
  }, [])

  useEffect(() => {
    if (!user) {
      setSavedReports([])
      return
    }

    apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify({
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        provider: user.providerData?.[0]?.providerId,
      }),
    }).catch((error) => setActionStatus(error.message))

    apiRequest(`/api/reports?userId=${encodeURIComponent(user.uid)}`)
      .then((data) => setSavedReports(data.reports || []))
      .catch((error) => setActionStatus(error.message))

    loadProjects(user.uid)
  }, [user])

  useEffect(() => {
    if (!activeProjectId) {
      setCompetitors([])
      return
    }

    apiRequest(`/api/projects/${activeProjectId}/competitors`)
      .then((data) => setCompetitors(data.competitors || []))
      .catch((error) => setActionStatus(error.message))

    apiRequest(`/api/projects/${activeProjectId}/seo/latest`)
      .then((data) => setSeoAnalysis(data.analysis))
      .catch((error) => setActionStatus(error.message))

    apiRequest(`/api/projects/${activeProjectId}/articles/latest`)
      .then((data) => setArticleDraft(data.article))
      .catch((error) => setActionStatus(error.message))

    apiRequest(`/api/projects/${activeProjectId}/layout/latest`)
      .then((data) => setLayoutAudit(data.audit))
      .catch((error) => setActionStatus(error.message))
  }, [activeProjectId])

  useEffect(() => {
    const hasRunningJob = Object.values(featureJobs).some((job) => job.status === 'running')

    if (!hasRunningJob) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setFeatureJobs((current) => {
        const next = { ...current }
        for (const [featureId, job] of Object.entries(next)) {
          if (job.status === 'running') {
            next[featureId] = {
              ...job,
              progress: Math.min(92, job.progress + Math.max(2, Math.round((100 - job.progress) * 0.08))),
            }
          }
        }
        return next
      })
    }, 850)

    return () => window.clearInterval(timer)
  }, [featureJobs])

  async function saveReport(title, reportType = 'seo_geo') {
    setActionStatus('Saving report draft...')

    try {
      const data = await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          title,
          reportType,
          payload: {
            stage: 'layout_preview',
            sections: ['summary', 'competitors', 'recommendations'],
          },
        }),
      })

      setSavedReports((current) => [data.report, ...current].slice(0, 5))
      setActionStatus(`Report saved as #${data.report.id}`)
    } catch (error) {
      setActionStatus(error.message)
    }
  }

  function updateFeatureKey(featureId, value) {
    setOpenAiKeys((current) => ({ ...current, [featureId]: value }))
  }

  async function saveOpenAiKey(event, featureId) {
    event.preventDefault()

    if (!isAdministrator || !user) {
      setActionStatus('Administrator login required to save OpenAI key.')
      return
    }

    setOpenAiSavingFeature(featureId)
    setActionStatus('Saving feature API key...')

    try {
      const featureLabel = openAiStatus.features.find((feature) => feature.id === featureId)?.label || 'Feature'
      const token = await user.getIdToken()
      const data = await apiRequest('/api/settings/openai', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: String(openAiKeys[featureId] || '').trim(), featureId }),
      })

      setOpenAiStatus(data)
      updateFeatureKey(featureId, '')
      setActionStatus(`${featureLabel} API key saved without exposing it.`)
    } catch (error) {
      setActionStatus(error.message)
    } finally {
      setOpenAiSavingFeature('')
    }
  }

  function updateProjectField(event) {
    setProjectForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function loadProjects(userId = user?.uid) {
    try {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : ''
      const data = await apiRequest(`/api/projects${query}`)
      const nextProjects = data.projects || []
      setProjects(nextProjects)
      setActiveProjectId((current) => current || nextProjects[0]?.id || null)
    } catch (error) {
      setActionStatus(error.message)
    }
  }

  async function createProject(event) {
    event.preventDefault()
    setProjectBusy(true)
    setActionStatus('Creating project...')

    try {
      const data = await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          name: projectForm.name,
          description: projectForm.description,
          imageUrl: projectForm.imageUrl,
          websiteUrl: projectForm.websiteUrl,
        }),
      })

      setProjects((current) => [data.project, ...current])
      setActiveProjectId(data.project.id)
      setCompetitors([])
      setProjectForm({ name: '', description: '', imageUrl: '', websiteUrl: '' })
      setActionStatus(`Project "${data.project.name}" created`)
    } catch (error) {
      setActionStatus(error.message)
    } finally {
      setProjectBusy(false)
    }
  }

  async function searchCompetitors() {
    if (!activeProjectId) {
      setActionStatus('Create a project first.')
      return
    }

    setProjectBusy(true)
    setActionStatus('Searching competitors with GPT-5.5 low effort...')
    setCompetitorSource('')
    setHiddenJobPopups((current) => ({ ...current, competitor_search: false }))
    setFeatureJobs((current) => ({
      ...current,
      competitor_search: {
        label: 'Competitor search',
        status: 'running',
        progress: 8,
      },
    }))

    try {
      const data = await apiRequest(`/api/projects/${activeProjectId}/competitors/search`, {
        method: 'POST',
      })

      setCompetitors(data.competitors || [])
      setCompetitorSource(data.source || '')
      setFeatureJobs((current) => ({
        ...current,
        competitor_search: {
          ...current.competitor_search,
          label: 'Competitor search',
          status: 'done',
          progress: 100,
        },
      }))
      if (dashboardTab !== 'competitor search') {
        setUnreadFeatureDots((current) => ({ ...current, competitor_search: true }))
      }
      setActionStatus(
        data.source === 'openai'
          ? 'Competitors found with OpenAI.'
          : 'Competitor placeholders shown. Save the competitor search API key to run live search.',
      )
    } catch (error) {
      setFeatureJobs((current) => ({
        ...current,
        competitor_search: {
          ...current.competitor_search,
          label: 'Competitor search',
          status: 'failed',
          progress: 100,
        },
      }))
      setActionStatus(error.message)
    } finally {
      setProjectBusy(false)
    }
  }

  async function runSeoAnalysis() {
    if (!activeProjectId) {
      setActionStatus('Create a project first.')
      return
    }

    setProjectBusy(true)
    setActionStatus('Running SEO analysis with GPT-5.5 low effort...')
    setHiddenJobPopups((current) => ({ ...current, seo_analysis: false }))
    setFeatureJobs((current) => ({
      ...current,
      seo_analysis: {
        label: 'SEO analysis',
        status: 'running',
        progress: 8,
      },
    }))

    try {
      const data = await apiRequest(`/api/projects/${activeProjectId}/seo/analyze`, {
        method: 'POST',
      })

      setSeoAnalysis(data.analysis)
      setFeatureJobs((current) => ({
        ...current,
        seo_analysis: {
          ...current.seo_analysis,
          label: 'SEO analysis',
          status: 'done',
          progress: 100,
        },
      }))
      if (dashboardTab !== 'seo analysis') {
        setUnreadFeatureDots((current) => ({ ...current, seo_analysis: true }))
      }
      setActionStatus(
        data.analysis?.source === 'openai'
          ? 'SEO analysis complete with OpenAI.'
          : 'SEO placeholder analysis shown. Save the SEO analysis API key to run live analysis.',
      )
    } catch (error) {
      setFeatureJobs((current) => ({
        ...current,
        seo_analysis: {
          ...current.seo_analysis,
          label: 'SEO analysis',
          status: 'failed',
          progress: 100,
        },
      }))
      setActionStatus(error.message)
    } finally {
      setProjectBusy(false)
    }
  }

  async function saveAnalyticsPdf() {
    await saveReport(activeProject?.name || 'Analytics report', 'project_analytics')
    await downloadAnalyticsPdf(activeProject, competitors, seoAnalysis, articleDraft, layoutAudit, savedReports, competitorSource)
  }

  async function writeBlogArticle() {
    if (!activeProjectId) {
      setActionStatus('Create a project first.')
      return
    }

    setProjectBusy(true)
    setActionStatus('Writing blog/news article with GPT-5.5 medium effort...')
    setHiddenJobPopups((current) => ({ ...current, blog_writer: false }))
    setFeatureJobs((current) => ({
      ...current,
      blog_writer: {
        label: 'Blog/news writer',
        status: 'running',
        progress: 8,
      },
    }))

    try {
      const data = await apiRequest(`/api/projects/${activeProjectId}/articles/write`, {
        method: 'POST',
      })

      setArticleDraft(data.article)
      setFeatureJobs((current) => ({
        ...current,
        blog_writer: {
          ...current.blog_writer,
          label: 'Blog/news writer',
          status: 'done',
          progress: 100,
        },
      }))
      if (dashboardTab !== 'blog writer') {
        setUnreadFeatureDots((current) => ({ ...current, blog_writer: true }))
      }
      setActionStatus(
        data.article?.source === 'openai'
          ? 'Blog/news article written with OpenAI.'
          : 'Placeholder article shown. Save the blog and news writer API key to run live trend analysis.',
      )
    } catch (error) {
      setFeatureJobs((current) => ({
        ...current,
        blog_writer: {
          ...current.blog_writer,
          label: 'Blog/news writer',
          status: 'failed',
          progress: 100,
        },
      }))
      setActionStatus(error.message)
    } finally {
      setProjectBusy(false)
    }
  }

  async function runLayoutAudit() {
    if (!activeProjectId) {
      setActionStatus('Create a project first.')
      return
    }

    setProjectBusy(true)
    setActionStatus('Running responsive layout audit with GPT-5.5 medium effort...')
    setHiddenJobPopups((current) => ({ ...current, layout_audit: false }))
    setFeatureJobs((current) => ({
      ...current,
      layout_audit: {
        label: 'Responsive layout audit',
        status: 'running',
        progress: 8,
      },
    }))

    try {
      const data = await apiRequest(`/api/projects/${activeProjectId}/layout/analyze`, {
        method: 'POST',
      })

      setLayoutAudit(data.audit)
      setFeatureJobs((current) => ({
        ...current,
        layout_audit: {
          ...current.layout_audit,
          label: 'Responsive layout audit',
          status: 'done',
          progress: 100,
        },
      }))
      if (dashboardTab !== 'layout audit') {
        setUnreadFeatureDots((current) => ({ ...current, layout_audit: true }))
      }
      setActionStatus(
        data.audit?.source === 'openai'
          ? 'Responsive layout audit complete with OpenAI.'
          : 'Layout audit placeholder shown. Save the responsive layout audit API key to run live analysis.',
      )
    } catch (error) {
      setFeatureJobs((current) => ({
        ...current,
        layout_audit: {
          ...current.layout_audit,
          label: 'Responsive layout audit',
          status: 'failed',
          progress: 100,
        },
      }))
      setActionStatus(error.message)
    } finally {
      setProjectBusy(false)
    }
  }

  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        gsap.from('.nav-shell', {
          y: -24,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        })

        gsap.from('.hero-copy > *', {
          y: 34,
          opacity: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: 'power3.out',
        })

        gsap.from('.projects-grid, .dashboard-shell, .pricing-grid', {
          scale: 0.92,
          opacity: 0,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
        })
      }, rootRef)

      return () => ctx.revert()
    },
    { scope: rootRef },
  )

  return (
    <main ref={rootRef} className="app-shell overflow-guard">
      <nav className="nav-shell">
        <button className="brand brand-button" type="button" aria-label="CyanForge home" onClick={() => setScreen('home')}>
          <span className="brand-mark">
            <Globe2 size={18} />
          </span>
          CyanForge
        </button>
        <div className="nav-links" aria-label="Main navigation">
          <button type="button" onClick={() => setScreen('home')}>Home</button>
          <button type="button" onClick={() => setScreen('projects')}>Projects</button>
          <a href="#pricing" onClick={() => setScreen('home')}>Pricing</a>
        </div>
        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label="Open alerts">
            <Bell size={18} />
          </button>
          {user ? (
            <div className="user-chip">
              <span>{user.displayName || user.email}</span>
              {isAdministrator ? <small>Administrator</small> : null}
              <button className="icon-button" type="button" aria-label="Log out" onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <button className="button ghost" type="button" onClick={() => setAuthMode('login')}>
                <LogIn size={17} />
                Login
              </button>
              <button className="button light" type="button" onClick={() => setAuthMode('register')}>
                <UserPlus size={17} />
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {screen === 'home' ? (
        <>
          <section id="top" className="hero-section">
            <div className="hero-art" aria-hidden="true">
              <img src={visualDataUri('CyanForge visibility map', 0)} alt="" />
            </div>
            <div className="hero-copy">
              <p className="eyebrow">Scan once. Decide where search demand moves next.</p>
              <h1>Audit any website, then compare SEO and AI search visibility against the market.</h1>
              <p className="hero-body">
                CyanForge is a subscription workspace for teams that need URL scanning,
                competitor discovery, GEO visibility analysis, and polished reports from one product surface.
              </p>
              <div className="hero-actions">
                <button className="button light large" type="button" onClick={() => setScreen('projects')}>
                  Open projects
                  <ArrowRight size={18} />
                </button>
                <a className="button dark large" href="#pricing">
                  View prices
                </a>
              </div>
            </div>
          </section>

          <section className="interest-section landing-intro">
            <div className="section-copy">
              <h2>The public page now stays focused on the product story.</h2>
              <p>
                Statistics, competitor tools, and analytics live inside project dashboards so the
                homepage can explain the offer and push users into their workspace cleanly.
              </p>
            </div>
          </section>

          <section id="pricing" className="pricing-section">
            <div className="pricing-copy">
              <h2>Subscription plans for search visibility work.</h2>
              <p>
                Create projects, run competitor discovery, and unlock exports from a persistent
                account workspace. NullTek administrators keep full access.
              </p>
            </div>
            <div className="pricing-grid">
              {[
                ['Starter', '$29', ['3 projects', '10 scans', 'Basic exports']],
                ['Growth', '$89', ['25 projects', 'Competitor tracking', 'GEO reports']],
                ['Studio', '$249', ['Unlimited seats', 'White-label reports', 'Priority crawl queue']],
              ].map(([plan, price, points]) => (
                <article className="price-card" key={plan}>
                  <CircleDollarSign size={22} />
                  <h3>{plan}</h3>
                  <strong>{price}<small>/mo</small></strong>
                  {points.map((point) => (
                    <p key={point}>
                      <Check size={16} />
                      {point}
                    </p>
                  ))}
                  <button className={plan === 'Growth' ? 'button light' : 'button dark'} type="button" onClick={() => setScreen('projects')}>
                    {isAdministrator ? 'Unlocked for NullTek' : 'Choose plan'}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <footer className="footer-section">
            <div>
              <ShieldCheck size={26} />
              <h2>Start with a project, then run every workflow in its dashboard.</h2>
            </div>
            <div className="footer-links">
              <button type="button" onClick={() => setScreen('home')}>Product</button>
              <button type="button" onClick={() => setScreen('projects')}>Projects</button>
              <a href="#pricing">Pricing</a>
            </div>
          </footer>
        </>
      ) : null}

      {screen === 'projects' ? (
        <section className="projects-page">
          <div className="page-heading">
            <p className="eyebrow">Projects</p>
            <h1>Choose a workspace or create a new project.</h1>
            <p>{actionStatus}</p>
          </div>

          <div className="projects-grid">
            <div className="settings-card">
              <div className="settings-heading">
                <span className="card-icon">
                  <KeyRound size={20} />
                </span>
                <div>
                  <h3>OpenAI API access</h3>
                  <p>
                    Every feature gets its own key slot. Future features should add a new text field here.
                  </p>
                </div>
              </div>
              {isAdministrator ? (
                <div className="feature-key-list">
                  {openAiStatus.features.map((feature) => (
                    <form className="feature-key-form" key={feature.id} onSubmit={(event) => saveOpenAiKey(event, feature.id)}>
                      <div>
                        <strong>{feature.label}</strong>
                        <span>
                          {feature.configured ? 'Configured' : 'Missing'} · {feature.model} · {feature.reasoningEffort} effort
                        </span>
                      </div>
                      <div className="api-key-form">
                        <input
                          type="password"
                          value={openAiKeys[feature.id] || ''}
                          onChange={(event) => updateFeatureKey(feature.id, event.target.value)}
                          placeholder="sk-..."
                          aria-label={`${feature.label} OpenAI API key`}
                          autoComplete="off"
                        />
                        <button
                          className="button light"
                          type="submit"
                          disabled={openAiSavingFeature === feature.id || !(openAiKeys[feature.id] || '').trim()}
                        >
                          {openAiSavingFeature === feature.id ? <LoaderCircle size={17} className="spin-icon" /> : <KeyRound size={17} />}
                          Save key
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              ) : (
                <div className="admin-lock-note">
                  <LockKeyhole size={18} />
                  Only the NullTek administrator can add or replace feature API keys.
                </div>
              )}
            </div>

            <form className="project-form" onSubmit={createProject}>
              <div className="settings-heading">
                <span className="card-icon">
                  <Plus size={20} />
                </span>
                <div>
                  <h3>Create project</h3>
                  <p>Name and website are required. Description and image are optional.</p>
                </div>
              </div>
              <label>
                <span>Project name</span>
                <input name="name" value={projectForm.name} onChange={updateProjectField} placeholder="NullTek growth audit" required />
              </label>
              <label>
                <span>Project description</span>
                <textarea name="description" value={projectForm.description} onChange={updateProjectField} placeholder="Short business context, market, customers, or offer." />
              </label>
              <label>
                <span>Project image URL</span>
                <div className="field-shell">
                  <Image size={17} />
                  <input name="imageUrl" value={projectForm.imageUrl} onChange={updateProjectField} placeholder="https://..." />
                </div>
              </label>
              <label>
                <span>Website URL</span>
                <div className="field-shell">
                  <Globe2 size={17} />
                  <input name="websiteUrl" value={projectForm.websiteUrl} onChange={updateProjectField} placeholder="https://company.com" required />
                </div>
              </label>
              <button className="button light auth-submit" type="submit" disabled={projectBusy}>
                {projectBusy ? <LoaderCircle size={17} className="spin-icon" /> : <Plus size={17} />}
                Create project
              </button>
            </form>

            <div className="project-list-panel">
              <div className="settings-heading">
                <span className="card-icon">
                  <Building2 size={20} />
                </span>
                <div>
                  <h3>Listed projects</h3>
                  <p>Select one to open its dashboard.</p>
                </div>
              </div>
              <div className="listed-projects">
                {projects.map((project) => (
                  <button
                    className="listed-project-card"
                    type="button"
                    key={project.id}
                    onClick={() => {
                      setActiveProjectId(project.id)
                      setDashboardTab('details')
                      setScreen('dashboard')
                    }}
                  >
                    <img src={project.image_url || visualDataUri(project.name, 1)} alt="" />
                    <span>{project.name}</span>
                    <small>{project.website_url}</small>
                  </button>
                ))}
                {!projects.length ? (
                  <div className="empty-competitors">
                    <Building2 size={22} />
                    <p>No projects yet.</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {screen === 'dashboard' && activeProject ? (
        <section className="dashboard-shell">
          <aside className="dashboard-sidebar">
            <button className="button dark" type="button" onClick={() => setScreen('projects')}>
              Back to projects
            </button>
            <div className="dashboard-project">
              <img src={activeProject.image_url || visualDataUri(activeProject.name, 2)} alt="" />
              <h2>{activeProject.name}</h2>
              <p>{activeProject.website_url}</p>
            </div>
            <nav className="dashboard-nav" aria-label="Project dashboard navigation">
              {[
                ['details', FileText],
                ['competitor search', Search],
                ['seo analysis', Globe2],
                ['blog writer', Newspaper],
                ['layout audit', MonitorSmartphone],
                ['analytics', BarChart3],
              ].map(([tab, Icon]) => (
                <button
                  className={dashboardTab === tab ? 'active' : ''}
                  type="button"
                  key={tab}
                  onClick={() => {
                    setDashboardTab(tab)
                    if (tab === 'competitor search') {
                      setUnreadFeatureDots((current) => ({ ...current, competitor_search: false }))
                    }
                    if (tab === 'seo analysis') {
                      setUnreadFeatureDots((current) => ({ ...current, seo_analysis: false }))
                    }
                    if (tab === 'blog writer') {
                      setUnreadFeatureDots((current) => ({ ...current, blog_writer: false }))
                    }
                    if (tab === 'layout audit') {
                      setUnreadFeatureDots((current) => ({ ...current, layout_audit: false }))
                    }
                  }}
                >
                  <Icon size={18} />
                  {tab}
                  {tab === 'competitor search' && unreadFeatureDots.competitor_search ? <span className="nav-done-dot" /> : null}
                  {tab === 'seo analysis' && unreadFeatureDots.seo_analysis ? <span className="nav-done-dot" /> : null}
                  {tab === 'blog writer' && unreadFeatureDots.blog_writer ? <span className="nav-done-dot" /> : null}
                  {tab === 'layout audit' && unreadFeatureDots.layout_audit ? <span className="nav-done-dot" /> : null}
                </button>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content">
            {dashboardTab === 'details' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">Details</p>
                <h1>{activeProject.name}</h1>
                <p>{activeProject.description || 'No project description added yet.'}</p>
                <div className="analytics-grid">
                  <article className="analytics-card">
                    <span>Website</span>
                    <strong>{activeProject.website_url}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Competitor key</span>
                    <strong>{competitorSearchKey?.configured ? 'Connected' : 'Missing'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>SEO key</span>
                    <strong>{seoAnalysisKey?.configured ? 'Connected' : 'Missing'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Blog key</span>
                    <strong>{blogWriterKey?.configured ? 'Connected' : 'Missing'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Layout audit key</span>
                    <strong>{layoutAuditKey?.configured ? 'Connected' : 'Missing'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Competitors</span>
                    <strong>{competitors.length}</strong>
                  </article>
                </div>
              </div>
            ) : null}

            {dashboardTab === 'competitor search' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">Competitor search</p>
                <h1>Find competing businesses for {activeProject.name}.</h1>
                <p>{competitorSource ? `Source: ${competitorSource === 'openai' ? 'OpenAI live search' : 'fallback placeholders'}` : actionStatus}</p>
                {competitorJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>Competitor search running</span>
                      <strong>{competitorJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${competitorJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={searchCompetitors} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Search size={18} />}
                  Search competitors
                </button>
                <div className="competitor-list">
                  {competitors.map((competitor) => (
                    <button className="competitor-row" type="button" key={competitor.id} onClick={() => setSelectedCompetitor(competitor)}>
                      <span>{competitor.business_name}</span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                  {!competitors.length ? (
                    <div className="empty-competitors">
                      <Search size={22} />
                      <p>No competitors searched yet.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {dashboardTab === 'seo analysis' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">SEO analysis</p>
                <h1>Analyze {activeProject.name} against SEO rules and competitors.</h1>
                <p>{actionStatus}</p>
                {seoJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>SEO analysis running</span>
                      <strong>{seoJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${seoJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={runSeoAnalysis} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Globe2 size={18} />}
                  Run SEO analysis
                </button>

                {seoAnalysis ? (
                  <div className="seo-report">
                    <div className="seo-score-card">
                      <span>SEO score</span>
                      <strong>{Number(seoAnalysis.payload?.score || 0).toFixed(1)}<small>/10</small></strong>
                      <p>{seoAnalysis.payload?.summary || 'No summary available.'}</p>
                      <button className="button light" type="button" onClick={() => downloadSeoPdf(activeProject, seoAnalysis)}>
                        <Download size={17} />
                        Download 2-page PDF
                      </button>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>Basic SEO rules</h3>
                        {(seoAnalysis.payload?.rules || []).map((rule) => (
                          <div className="seo-row" key={`${rule.rule}-${rule.finding}`}>
                            <span>{rule.rule}</span>
                            <strong>{rule.status}</strong>
                            <p>{rule.finding}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>Competitor comparison</h3>
                        {(seoAnalysis.payload?.competitorComparison || []).map((competitor) => (
                          <div className="seo-row" key={`${competitor.businessName}-${competitor.risk}`}>
                            <span>{competitor.businessName}</span>
                            <strong>{competitor.risk}</strong>
                            <p>{competitor.edge}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <article className="seo-recommendations">
                      <h3>Recommendations</h3>
                      {(seoAnalysis.payload?.recommendations || []).map((recommendation) => (
                        <p key={recommendation}>
                          <Check size={16} />
                          {recommendation}
                        </p>
                      ))}
                    </article>
                  </div>
                ) : (
                  <div className="empty-competitors">
                    <Globe2 size={22} />
                    <p>No SEO analysis run yet.</p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardTab === 'blog writer' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">Blog/news writer</p>
                <h1>Write a trend-aware article for {activeProject.name}.</h1>
                <p>{actionStatus}</p>
                {blogJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>Blog/news writer running</span>
                      <strong>{blogJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${blogJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={writeBlogArticle} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Newspaper size={18} />}
                  Write article
                </button>

                {articleDraft ? (
                  <div className="article-report">
                    <article className="article-summary-card">
                      <span>{articleDraft.source === 'openai' ? 'Live trend draft' : 'Placeholder draft'}</span>
                      <h2>{articleDraft.payload?.title}</h2>
                      <p>{articleDraft.payload?.excerpt}</p>
                      <small>{articleDraft.payload?.slug}</small>
                    </article>
                    <article className="article-trends-card">
                      <h3>Trend angle</h3>
                      <p>{articleDraft.payload?.trendSummary}</p>
                    </article>
                    <article className="article-trends-card">
                      <h3>Competitor angles</h3>
                      {(articleDraft.payload?.competitorAngles || []).map((item) => (
                        <p key={`${item.businessName}-${item.angle}`}>
                          <strong>{item.businessName}</strong>
                          {item.angle}
                        </p>
                      ))}
                    </article>
                    <article className="article-body-card">
                      <h3>Post text</h3>
                      <pre>{articleDraft.payload?.postText}</pre>
                      <p className="article-cta">{articleDraft.payload?.callToAction}</p>
                    </article>
                  </div>
                ) : (
                  <div className="empty-competitors">
                    <Newspaper size={22} />
                    <p>No article written yet.</p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardTab === 'layout audit' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">Responsive layout audit</p>
                <h1>Check mobile, laptop, brand, and layout quality for {activeProject.name}.</h1>
                <p>{actionStatus}</p>
                {layoutJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>Responsive layout audit running</span>
                      <strong>{layoutJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${layoutJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={runLayoutAudit} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <MonitorSmartphone size={18} />}
                  Run layout audit
                </button>

                {layoutAudit ? (
                  <div className="seo-report layout-audit-report">
                    <div className="seo-score-card">
                      <span>{layoutAudit.source === 'openai' ? 'Live responsive audit' : 'Placeholder audit'}</span>
                      <strong>{Number(layoutAudit.payload?.score || 0).toFixed(1)}<small>/10</small></strong>
                      <p>{layoutAudit.payload?.summary || 'No summary available.'}</p>
                      <button className="button light" type="button" onClick={() => downloadLayoutAuditPdf(activeProject, layoutAudit)}>
                        <Download size={17} />
                        Download full PDF
                      </button>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>Mobile layout</h3>
                        {(layoutAudit.payload?.mobile || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>Fix:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>Laptop layout</h3>
                        {(layoutAudit.payload?.laptop || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>Fix:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>Responsiveness</h3>
                        {(layoutAudit.payload?.responsiveness || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>Fix:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>Branding issues</h3>
                        {(layoutAudit.payload?.brandingIssues || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>Fix:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <article className="seo-recommendations">
                      <h3>Quick wins</h3>
                      {(layoutAudit.payload?.quickWins || []).map((win) => (
                        <p key={win}>
                          <Check size={16} />
                          {win}
                        </p>
                      ))}
                    </article>
                  </div>
                ) : (
                  <div className="empty-competitors">
                    <MonitorSmartphone size={22} />
                    <p>No responsive layout audit run yet.</p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardTab === 'analytics' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">Analytics</p>
                <h1>Project statistics and report signals stay here.</h1>
                <div className="analytics-grid">
                  <article className="analytics-card">
                    <span>Competitors found</span>
                    <strong>{competitors.length}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Data source</span>
                    <strong>{competitorSource || 'None'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Reports saved</span>
                    <strong>{savedReports.length}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>SEO score</span>
                    <strong>{seoAnalysis?.payload?.score != null ? `${Number(seoAnalysis.payload.score).toFixed(1)}/10` : 'None'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Latest article</span>
                    <strong>{articleDraft?.payload?.title || 'None'}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>Layout score</span>
                    <strong>{layoutAudit?.payload?.score != null ? `${Number(layoutAudit.payload.score).toFixed(1)}/10` : 'None'}</strong>
                  </article>
                </div>
                <div className="analytics-panel">
                  <div>
                    <BarChart3 size={24} />
                    <h2>Analytics page shell ready for SEO and GEO statistics.</h2>
                    <p>
                      This tab is where visibility charts, competitor deltas, report history,
                      and scan statistics will live for the selected project.
                    </p>
                  </div>
                  <button className="button light large" type="button" onClick={saveAnalyticsPdf}>
                    Save analytics PDF
                    <Download size={18} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {authMode ? (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onModeChange={setAuthMode}
        />
      ) : null}

      {selectedCompetitor ? (
        <div className="auth-backdrop" role="presentation">
          <section className="competitor-modal" role="dialog" aria-modal="true" aria-labelledby="competitor-title">
            <button className="auth-close" type="button" aria-label="Close competitor details" onClick={() => setSelectedCompetitor(null)}>
              <X size={19} />
            </button>
            <div className="competitor-modal-art" aria-hidden="true">
              <img src={visualDataUri(selectedCompetitor.business_name || 'Competitor profile', 1)} alt="" />
            </div>
            <div className="competitor-modal-body">
              <p className="auth-kicker">Competitor profile</p>
              <h2 id="competitor-title">{selectedCompetitor.business_name}</h2>
              <p>{selectedCompetitor.description || 'No description found yet.'}</p>
              <div className="competitor-details">
                <span>
                  <MapPin size={17} />
                  {selectedCompetitor.location || 'Location not found'}
                </span>
                <span>
                  <Mail size={17} />
                  {selectedCompetitor.email || 'Email not found'}
                </span>
                <span>
                  <Phone size={17} />
                  {selectedCompetitor.phone || 'Phone not found'}
                </span>
                <span>
                  <ExternalLink size={17} />
                  {selectedCompetitor.website_url ? (
                    <a href={selectedCompetitor.website_url} target="_blank" rel="noreferrer">
                      {selectedCompetitor.website_url}
                    </a>
                  ) : (
                    'Website not found'
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {showCompetitorMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{competitorJob.label}</span>
            <strong>{competitorJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${competitorJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label="Close progress popup"
            onClick={() => setHiddenJobPopups((current) => ({ ...current, competitor_search: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showSeoMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{seoJob.label}</span>
            <strong>{seoJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${seoJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label="Close SEO progress popup"
            onClick={() => setHiddenJobPopups((current) => ({ ...current, seo_analysis: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showBlogMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{blogJob.label}</span>
            <strong>{blogJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${blogJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label="Close blog writer progress popup"
            onClick={() => setHiddenJobPopups((current) => ({ ...current, blog_writer: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showLayoutMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{layoutJob.label}</span>
            <strong>{layoutJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${layoutJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label="Close layout audit progress popup"
            onClick={() => setHiddenJobPopups((current) => ({ ...current, layout_audit: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
    </main>
  )
}

function AuthModal({ mode, onClose, onModeChange }) {
  const googleButtonRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const isRegister = mode === 'register'

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

    if (!isFirebaseConfigured || !googleButtonRef.current || !clientId) {
      return undefined
    }

    let cancelled = false

    async function handleCredentialResponse(response) {
      if (!response.credential) {
        setError('Google did not return an identity token.')
        return
      }

      setStatus('loading')
      setError('')

      try {
        await loginWithGoogleCredential(response.credential)
        onClose()
      } catch (authError) {
        setError(authError.message)
      } finally {
        setStatus('idle')
      }
    }

    function renderGoogleButton() {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) {
        return
      }

      googleButtonRef.current.innerHTML = ''
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        size: 'large',
        text: 'continue_with',
        theme: 'outline',
        type: 'standard',
        width: 360,
      })
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton()
    } else if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = renderGoogleButton
      script.onerror = () => setError('Google sign-in script could not be loaded.')
      document.head.appendChild(script)
    } else {
      const timer = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          window.clearInterval(timer)
          renderGoogleButton()
        }
      }, 250)

      return () => {
        cancelled = true
        window.clearInterval(timer)
      }
    }

    return () => {
      cancelled = true
    }
  }, [onClose])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus('loading')
    setError('')

    try {
      if (isRegister) {
        await registerWithEmail(form)
      } else {
        await loginWithEmail(form)
      }
      onClose()
    } catch (authError) {
      setError(authError.message)
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="auth-backdrop" role="presentation">
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" aria-label="Close auth panel" onClick={onClose}>
          <X size={19} />
        </button>
        <div className="auth-media" aria-hidden="true">
          <img src={visualDataUri('Secure account access', 2)} alt="" />
        </div>
        <div className="auth-panel">
          <p className="auth-kicker">{isRegister ? 'Create workspace access' : 'Welcome back'}</p>
          <h2 id="auth-title">{isRegister ? 'Register for CyanForge.' : 'Log in to CyanForge.'}</h2>
          <p className="auth-copy">
            Use email and password, or continue with Google once Firebase Authentication is configured.
          </p>

          {!isFirebaseConfigured ? (
            <div className="setup-note">
              Firebase env values missing. Copy <code>.env.example</code> to <code>.env.local</code>,
              add your web app config, then enable Google in Firebase Authentication.
            </div>
          ) : null}

          <div className="google-identity-shell">
            <div ref={googleButtonRef} className="google-identity-button" />
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <p className="auth-error">Google client ID missing from .env.local.</p>
            ) : null}
          </div>

          <div className="auth-divider">
            <span />
            Email access
            <span />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label>
                <span>Name</span>
                <input
                  name="name"
                  value={form.name}
                  autoComplete="name"
                  onChange={updateField}
                  placeholder="Ada Lovelace"
                />
              </label>
            ) : null}
            <label>
              <span>Email</span>
              <div className="field-shell">
                <Mail size={17} />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  onChange={updateField}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </label>
            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={form.password}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                onChange={updateField}
                placeholder="At least 6 characters"
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="button light auth-submit" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Working...' : isRegister ? 'Create account' : 'Log in'}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={() => onModeChange(isRegister ? 'login' : 'register')}
          >
            {isRegister ? 'Already have an account? Log in' : 'Need an account? Register'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
