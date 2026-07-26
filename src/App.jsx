import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileText,
  Globe2,
  LockKeyhole,
  LogOut,
  LogIn,
  Mail,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Workflow,
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

gsap.registerPlugin(ScrollTrigger)

const features = [
  {
    className: 'bento-card bento-large',
    icon: Radar,
    title: 'Website scan command center',
    body: 'Paste a URL, preview crawl depth, robots status, indexability, page templates, and structured data coverage before running a paid report.',
    metric: '384 signals mapped',
  },
  {
    className: 'bento-card bento-tall',
    icon: Search,
    title: 'Competitor finder',
    body: 'Discover competing domains from SERPs, category language, backlinks, and AI answer overlap.',
    metric: '12 likely rivals',
  },
  {
    className: 'bento-card bento-wide',
    icon: BarChart3,
    title: 'SEO and GEO comparison',
    body: 'Compare rankings, answer-engine visibility, schema gaps, topical authority, and content freshness.',
    metric: '+31% opportunity',
  },
  {
    className: 'bento-card',
    icon: FileText,
    title: 'Report builder',
    body: 'Create board-ready reports with sections, screenshots, tasks, and share links.',
    metric: '4 draft reports',
  },
  {
    className: 'bento-card',
    icon: LockKeyhole,
    title: 'Subscription access',
    body: 'Plans, seats, limits, billing, and gated exports are designed into the product shell.',
    metric: '3 tiers',
  },
]

const workflowCards = [
  ['Scan', 'Crawl the submitted website and map technical, content, and AI-search surfaces.'],
  ['Compare', 'Pick competitors manually or let the product suggest domains worth benchmarking.'],
  ['Prioritize', 'Turn gaps into report sections, task lists, owners, and subscription-gated exports.'],
]

const reportCards = [
  ['Organic visibility', 'Keyword groups, SERP features, cannibalization, and page-level wins.'],
  ['AI answer footprint', 'Mention share across answer engines, citation quality, entity gaps, and prompts.'],
  ['Competitor moat', 'Authority deltas, freshness, backlinks, content depth, and topical coverage.'],
]

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
  const pinnedRef = useRef(null)
  const [authMode, setAuthMode] = useState(null)
  const [user, setUser] = useState(null)
  const [databaseOnline, setDatabaseOnline] = useState(false)
  const [actionStatus, setActionStatus] = useState('Ready to save scans and reports')
  const [savedReports, setSavedReports] = useState([])

  useEffect(() => listenToAuthState(setUser), [])

  useEffect(() => {
    apiRequest('/api/health')
      .then((data) => {
        setDatabaseOnline(Boolean(data.database))
        setActionStatus(data.database ? 'Database connected' : 'Database not configured')
      })
      .catch((error) => setActionStatus(error.message))
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
  }, [user])

  async function saveScan(mode = 'site_scan') {
    setActionStatus('Saving scan draft...')

    try {
      const data = await apiRequest('/api/scans', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.uid,
          url: 'https://example.com',
          mode,
          metadata: {
            source: 'layout_preview',
            competitors: ['competitor-a.com', 'competitor-b.com'],
          },
        }),
      })

      setActionStatus(`Scan draft saved as #${data.scan.id}`)
    } catch (error) {
      setActionStatus(error.message)
    }
  }

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

        gsap.from('.scanner-panel', {
          scale: 0.92,
          opacity: 0,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
        })

        gsap.utils.toArray('.bento-card').forEach((card) => {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: 'top 82%',
              end: 'bottom 18%',
              scrub: true,
            },
            scale: 0.86,
            opacity: 0.35,
            ease: 'none',
          })
        })

        if (pinnedRef.current) {
          ScrollTrigger.create({
            trigger: pinnedRef.current,
            start: 'top top',
            end: 'bottom bottom',
            pin: '.workflow-sticky',
            pinSpacing: false,
          })
        }

        gsap.utils.toArray('.stack-card').forEach((card, index) => {
          gsap.fromTo(
            card,
            { y: 90 + index * 26, scale: 0.94, opacity: 0.2 },
            {
              y: index * -18,
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                end: 'top 35%',
                scrub: true,
              },
            },
          )
        })
      }, rootRef)

      return () => ctx.revert()
    },
    { scope: rootRef },
  )

  return (
    <main ref={rootRef} className="app-shell overflow-guard">
      <nav className="nav-shell">
        <a className="brand" href="#top" aria-label="SignalForge home">
          <span className="brand-mark">
            <Globe2 size={18} />
          </span>
          CyanForge
        </a>
        <div className="nav-links" aria-label="Main navigation">
          <a href="#scan">Scan</a>
          <a href="#reports">Reports</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label="Open alerts">
            <Bell size={18} />
          </button>
          <span className={databaseOnline ? 'db-pill online' : 'db-pill'}>
            <Database size={15} />
            {databaseOnline ? 'DB live' : 'DB off'}
          </span>
          {user ? (
            <div className="user-chip">
              <span>{user.displayName || user.email}</span>
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

      <section id="top" className="hero-section">
        <div className="hero-art" aria-hidden="true">
          <img
            src="https://picsum.photos/seed/search-console-orbit/1400/1100"
            alt=""
          />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Scan once. Decide where search demand moves next.</p>
          <h1>
            Audit any website, then compare SEO and AI search visibility against the market.
          </h1>
          <p className="hero-body">
            A subscription workspace for teams that need URL scanning, competitor discovery,
            GEO visibility analysis, and polished reports from one product surface.
          </p>
          <div className="hero-actions">
            <button className="button light large" type="button" onClick={() => saveScan('site_scan')}>
              <Sparkles size={18} />
              Start mock scan
            </button>
            <button className="button dark large" type="button" onClick={() => saveReport('SEO and GEO comparison')}>
              View reports
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section id="scan" className="scan-section">
        <div className="scanner-panel">
          <div className="scanner-input">
            <Globe2 size={22} />
            <input value="https://example.com" aria-label="Website URL" readOnly />
            <button className="button light" type="button" onClick={() => saveScan('site_scan')}>
              Scan
              <ChevronRight size={17} />
            </button>
          </div>
          <p className="storage-status">{actionStatus}</p>
          <div className="mode-grid" aria-label="Report modes">
            {[
              ['SEO audit', 'Technical and content quality'],
              ['GEO comparison', 'AI answer and citation footprint'],
              ['Find competitors', 'SERP and category rivals'],
              ['Create report', 'Export-ready workspace draft'],
            ].map(([title, body]) => (
              <button
                className="mode-card"
                type="button"
                key={title}
                onClick={() => saveScan(title.toLowerCase().replaceAll(' ', '_'))}
              >
                <span>{title}</span>
                <small>{body}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="interest-section">
        <div className="section-copy">
          <h2>Everything the finished product needs is already visible.</h2>
          <p>
            The layout shows the core product map: URL intake, scan settings, competitor
            selection, comparison outputs, paid reports, alerts, account access, and billing.
          </p>
        </div>
        <div className="bento-grid">
          {features.map(({ className, icon: Icon, title, body, metric }) => (
            <article className={className} key={title}>
              <div className="card-image">
                <img
                  src={`https://picsum.photos/seed/${title.replaceAll(' ', '-')}/900/650`}
                  alt=""
                />
              </div>
              <div className="card-content">
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{body}</p>
                <strong>{metric}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section ref={pinnedRef} className="workflow-section">
        <div className="workflow-sticky">
          <Workflow size={26} />
          <h2>From raw URL to report in one guided flow.</h2>
          <p>
            The interface can grow into a real scanner without changing the product story:
            start with a domain, choose intent, compare, then publish.
          </p>
        </div>
        <div className="workflow-list">
          {workflowCards.map(([title, body], index) => (
            <article className="workflow-card" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="reports" className="reports-section">
        <div className="section-copy">
          <h2>Reports feel like a workspace, not a static PDF button.</h2>
          <p>
            Users can draft multiple deliverables, revisit findings, and see subscription limits
            before export or sharing.
          </p>
        </div>
        <div className="report-stage">
          {reportCards.map(([title, body], index) => (
            <article className="stack-card" key={title}>
              <div>
                <FileText size={22} />
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              <div className="report-actions">
                <span>{index === 0 ? 'Draft' : index === 1 ? 'Ready' : 'Locked'}</span>
                <button className="button light" type="button" onClick={() => saveReport(title)}>
                  Save
                </button>
              </div>
            </article>
          ))}
        </div>
        {savedReports.length ? (
          <div className="saved-report-list">
            {savedReports.map((report) => (
              <span key={report.id}>{report.title}</span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="marquee-section" aria-label="Comparison surfaces">
        <div className="marquee-row">
          <span>Technical SEO</span>
          <span>Schema</span>
          <span>AI citations</span>
          <span>Backlinks</span>
          <span>Prompts</span>
          <span>Content gaps</span>
          <span>Competitors</span>
        </div>
        <div className="marquee-row reverse">
          <span>Reports</span>
          <span>Seats</span>
          <span>Exports</span>
          <span>Alerts</span>
          <span>Billing</span>
          <span>Projects</span>
          <span>Workspaces</span>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="pricing-copy">
          <h2>Subscription shell ready for gated usage.</h2>
          <p>
            The visual model includes account creation, login, plan limits, report quotas,
            competitor slots, and team features.
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
              <button className={plan === 'Growth' ? 'button light' : 'button dark'} type="button">
                Choose plan
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer-section">
        <div>
          <ShieldCheck size={26} />
          <h2>Build the scanner on a persistent database foundation.</h2>
        </div>
        <div className="footer-links">
          <a href="#top">Product</a>
          <a href="#scan">Scan</a>
          <a href="#reports">Reports</a>
          <a href="#pricing">Billing</a>
        </div>
      </footer>

      {authMode ? (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onModeChange={setAuthMode}
        />
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
          <img src="https://picsum.photos/seed/identity-graph-login/900/1100" alt="" />
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
