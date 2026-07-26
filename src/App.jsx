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
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

function App() {
  const rootRef = useRef(null)
  const [authMode, setAuthMode] = useState(null)
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('home')
  const [dashboardTab, setDashboardTab] = useState('details')
  const [actionStatus, setActionStatus] = useState('Ready to save scans and reports')
  const [savedReports, setSavedReports] = useState([])
  const [openAiStatus, setOpenAiStatus] = useState({ configured: false, model: 'gpt-5.5', reasoningEffort: 'low' })
  const [openAiKey, setOpenAiKey] = useState('')
  const [openAiSaving, setOpenAiSaving] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    imageUrl: '',
    websiteUrl: '',
  })
  const [projects, setProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [selectedCompetitor, setSelectedCompetitor] = useState(null)
  const [projectBusy, setProjectBusy] = useState(false)
  const [competitorSource, setCompetitorSource] = useState('')
  const isAdministrator = Boolean(
    user
      && `${user.displayName || ''} ${user.email || ''}`.toLowerCase().includes('nulltek'),
  )
  const activeProject = projects.find((project) => project.id === activeProjectId) || projects[0] || null

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
  }, [activeProjectId])

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

  async function saveOpenAiKey(event) {
    event.preventDefault()

    if (!isAdministrator || !user) {
      setActionStatus('Administrator login required to save OpenAI key.')
      return
    }

    setOpenAiSaving(true)
    setActionStatus('Saving OpenAI key...')

    try {
      const token = await user.getIdToken()
      const data = await apiRequest('/api/settings/openai', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: openAiKey }),
      })

      setOpenAiStatus(data)
      setOpenAiKey('')
      setActionStatus('OpenAI key saved. Competitor search can use GPT-5.5 low effort.')
    } catch (error) {
      setActionStatus(error.message)
    } finally {
      setOpenAiSaving(false)
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

    try {
      const data = await apiRequest(`/api/projects/${activeProjectId}/competitors/search`, {
        method: 'POST',
      })

      setCompetitors(data.competitors || [])
      setCompetitorSource(data.source || '')
      setActionStatus(
        data.source === 'openai'
          ? 'Competitors found with OpenAI.'
          : 'Competitor placeholders shown. Save OpenAI key to run live search.',
      )
    } catch (error) {
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
                    {openAiStatus.configured
                      ? `${openAiStatus.model} ready on ${openAiStatus.reasoningEffort} effort`
                      : isAdministrator
                        ? 'Paste one admin key once. The app will use it for every workspace user.'
                        : 'Waiting for an administrator to connect the shared OpenAI key.'}
                  </p>
                </div>
              </div>
              {isAdministrator ? (
                <form className="api-key-form" onSubmit={saveOpenAiKey}>
                  <input
                    type="password"
                    value={openAiKey}
                    onChange={(event) => setOpenAiKey(event.target.value)}
                    placeholder="sk-..."
                    aria-label="OpenAI API key"
                    autoComplete="off"
                  />
                  <button className="button light" type="submit" disabled={openAiSaving || !openAiKey.trim()}>
                    {openAiSaving ? <LoaderCircle size={17} className="spin-icon" /> : <KeyRound size={17} />}
                    Save shared key
                  </button>
                </form>
              ) : (
                <div className="admin-lock-note">
                  <LockKeyhole size={18} />
                  Only the NullTek administrator can add or replace the shared API key.
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
                ['analytics', BarChart3],
              ].map(([tab, Icon]) => (
                <button
                  className={dashboardTab === tab ? 'active' : ''}
                  type="button"
                  key={tab}
                  onClick={() => setDashboardTab(tab)}
                >
                  <Icon size={18} />
                  {tab}
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
                    <span>OpenAI</span>
                    <strong>{openAiStatus.configured ? 'Connected' : 'Missing'}</strong>
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
                  <button className="button light large" type="button" onClick={() => saveReport(activeProject.name)}>
                    Save analytics report
                    <ArrowRight size={18} />
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
