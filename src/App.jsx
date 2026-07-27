import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  Camera,
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
  Moon,
  Newspaper,
  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
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
  updateUserProfile,
} from './firebaseAuth'
import './App.css'

const copy = {
  en: {
    home: 'Home',
    projects: 'Projects',
    pricing: 'Pricing',
    settings: 'Settings',
    login: 'Login',
    register: 'Register',
    logout: 'Log out',
    latestPost: 'Latest post',
    savedPosts: 'Saved posts',
    noPosts: 'No article written yet.',
    settingsTitle: 'Settings',
    settingsIntro: 'Choose theme, language, username, and profile image.',
    theme: 'Theme',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    language: 'Language',
    username: 'Username',
    profilePicture: 'Profile picture',
    uploadProfilePicture: 'Upload profile picture',
    profilePictureHelp: 'Upload an image or paste a URL.',
    chooseImage: 'Choose image',
    removeImage: 'Remove image',
    imageUploadFailed: 'Image upload failed. Use a JPG, PNG, WebP, or GIF under 8 MB.',
    saveProfile: 'Save profile',
    usernameLimit: 'Username can be changed 2 times per month.',
    administrator: 'Administrator',
    alerts: 'Open alerts',
    heroEyebrow: 'Scan once. Decide where search demand moves next.',
    heroTitle: 'Audit any website, then compare SEO and AI search visibility against the market.',
    heroBody: 'RankSprint is a subscription workspace for teams that need URL scanning, competitor discovery, GEO visibility analysis, and polished reports from one product surface.',
    openProjects: 'Open projects',
    viewPrices: 'View prices',
    introTitle: 'The public page now stays focused on the product story.',
    introBody: 'Statistics, competitor tools, and analytics live inside project dashboards so the homepage can explain the offer and push users into their workspace cleanly.',
    pricingTitle: 'Subscription plans for search visibility work.',
    pricingBody: 'Create projects, run competitor discovery, and unlock exports from a persistent account workspace. NullTek administrators keep full access.',
    starter: 'Starter',
    growth: 'Growth',
    studio: 'Studio',
    starterPoints: ['3 projects', '10 scans', 'Basic exports'],
    growthPoints: ['25 projects', 'Competitor tracking', 'GEO reports'],
    studioPoints: ['Unlimited seats', 'White-label reports', 'Priority crawl queue'],
    choosePlan: 'Choose plan',
    unlockedForNulltek: 'Unlocked for NullTek',
    footerTitle: 'Start with a project, then run every workflow in its dashboard.',
    projectsEyebrow: 'Projects',
    projectsTitle: 'Choose a workspace or create a new project.',
    apiAccess: 'OpenAI API access',
    apiAccessBody: 'Every feature gets its own key slot. Future features should add a new text field here.',
    configured: 'Configured',
    missing: 'Missing',
    effort: 'effort',
    saveKey: 'Save key',
    adminOnlyKeys: 'Only the NullTek administrator can add or replace feature API keys.',
    createProject: 'Create project',
    createProjectBody: 'Name and website are required. Description and image are optional.',
    projectName: 'Project name',
    projectDescription: 'Project description',
    projectImageUrl: 'Project image URL',
    uploadProjectImage: 'Upload project image',
    projectImageHelp: 'Upload an image or paste a URL.',
    websiteUrl: 'Website URL',
    projectNamePlaceholder: 'NullTek growth audit',
    projectDescriptionPlaceholder: 'Short business context, market, customers, or offer.',
    listedProjects: 'Listed projects',
    listedProjectsBody: 'Select one to open its dashboard.',
    noProjects: 'No projects yet.',
    leftThisMonth: 'left this month.',
    backToProjects: 'Back to projects',
    details: 'Details',
    competitorSearch: 'Competitor search',
    seoAnalysis: 'SEO analysis',
    blogWriter: 'Blog writer',
    layoutAudit: 'Layout audit',
    analytics: 'Analytics',
    noProjectDescription: 'No project description added yet.',
    website: 'Website',
    competitorKey: 'Competitor key',
    seoKey: 'SEO key',
    blogKey: 'Blog key',
    layoutAuditKey: 'Layout audit key',
    connected: 'Connected',
    competitors: 'Competitors',
    competitorTitle: 'Find competing businesses for {project}.',
    source: 'Source',
    openAiLiveSearch: 'OpenAI live search',
    fallbackPlaceholders: 'fallback placeholders',
    competitorRunning: 'Competitor search running',
    searchCompetitors: 'Search competitors',
    noCompetitors: 'No competitors searched yet.',
    seoTitle: 'Analyze {project} against SEO rules and competitors.',
    seoRunning: 'SEO analysis running',
    runSeo: 'Run SEO analysis',
    seoScore: 'SEO score',
    noSummary: 'No summary available.',
    downloadTwoPagePdf: 'Download 2-page PDF',
    basicSeoRules: 'Basic SEO rules',
    competitorComparison: 'Competitor comparison',
    popularKeywords: 'Popular keywords',
    keywordCoverage: 'Keyword coverage',
    rankingPlan: 'Search + AI ranking plan',
    present: 'Present',
    missingKeyword: 'Missing',
    recommendations: 'Recommendations',
    noSeo: 'No SEO analysis run yet.',
    blogTitle: 'Write a trend-aware article for {project}.',
    blogRunning: 'Blog/news writer running',
    writeArticle: 'Write article',
    untitledPost: 'Untitled post',
    liveTrendDraft: 'Live trend draft',
    placeholderDraft: 'Placeholder draft',
    trendAngle: 'Trend angle',
    competitorAngles: 'Competitor angles',
    postText: 'Post text',
    layoutTitle: 'Check mobile, laptop, brand, and layout quality for {project}.',
    layoutRunning: 'Responsive layout audit running',
    runLayoutAudit: 'Run layout audit',
    liveResponsiveAudit: 'Live responsive audit',
    placeholderAudit: 'Placeholder audit',
    downloadFullPdf: 'Download full PDF',
    mobileLayout: 'Mobile layout',
    laptopLayout: 'Laptop layout',
    responsiveness: 'Responsiveness',
    brandingIssues: 'Branding issues',
    fix: 'Fix',
    quickWins: 'Quick wins',
    noLayoutAudit: 'No responsive layout audit run yet.',
    analyticsTitle: 'Project statistics and report signals stay here.',
    competitorsFound: 'Competitors found',
    dataSource: 'Data source',
    reportsSaved: 'Reports saved',
    latestArticle: 'Latest article',
    layoutScore: 'Layout score',
    none: 'None',
    analyticsShellTitle: 'Analytics page shell ready for SEO and GEO statistics.',
    analyticsShellBody: 'This tab is where visibility charts, competitor deltas, report history, and scan statistics will live for the selected project.',
    saveAnalyticsPdf: 'Save analytics PDF',
    competitorProfile: 'Competitor profile',
    noDescription: 'No description found yet.',
    locationNotFound: 'Location not found',
    emailNotFound: 'Email not found',
    phoneNotFound: 'Phone not found',
    websiteNotFound: 'Website not found',
    savedPost: 'Saved post',
    closeProgress: 'Close progress popup',
    closeSeoProgress: 'Close SEO progress popup',
    closeBlogProgress: 'Close blog writer progress popup',
    closeLayoutProgress: 'Close layout audit progress popup',
    createWorkspaceAccess: 'Create workspace access',
    welcomeBack: 'Welcome back',
    registerTitle: 'Register for RankSprint.',
    loginTitle: 'Log in to RankSprint.',
    authCopy: 'Use email and password, or continue with Google once Firebase Authentication is configured.',
    firebaseMissing: 'Firebase env values missing. Copy .env.example to .env.local, add your web app config, then enable Google in Firebase Authentication.',
    googleClientMissing: 'Google client ID missing from .env.local.',
    emailAccess: 'Email access',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 6 characters',
    working: 'Working...',
    createAccount: 'Create account',
    alreadyHaveAccount: 'Already have an account? Log in',
    needAccount: 'Need an account? Register',
  },
  hu: {
    home: 'Kezd\u0151lap',
    projects: 'Projektek',
    pricing: '\u00c1rak',
    settings: 'Be\u00e1ll\u00edt\u00e1sok',
    login: 'Bejelentkez\u00e9s',
    register: 'Regisztr\u00e1ci\u00f3',
    logout: 'Kijelentkez\u00e9s',
    latestPost: 'Leg\u00fajabb poszt',
    savedPosts: 'Mentett posztok',
    noPosts: 'M\u00e9g nincs cikk.',
    settingsTitle: 'Be\u00e1ll\u00edt\u00e1sok',
    settingsIntro: 'V\u00e1lassz t\u00e9m\u00e1t, nyelvet, felhaszn\u00e1l\u00f3nevet \u00e9s profilk\u00e9pet.',
    theme: 'T\u00e9ma',
    lightMode: 'Vil\u00e1gos m\u00f3d',
    darkMode: 'S\u00f6t\u00e9t m\u00f3d',
    language: 'Nyelv',
    username: 'Felhaszn\u00e1l\u00f3n\u00e9v',
    profilePicture: 'Profilk\u00e9p',
    uploadProfilePicture: 'Profilk\u00e9p felt\u00f6lt\u00e9se',
    profilePictureHelp: 'T\u00f6lts fel k\u00e9pet vagy illessz be URL-t.',
    chooseImage: 'K\u00e9p v\u00e1laszt\u00e1sa',
    removeImage: 'K\u00e9p elt\u00e1vol\u00edt\u00e1sa',
    imageUploadFailed: 'A k\u00e9pfelt\u00f6lt\u00e9s sikertelen. Haszn\u00e1lj 8 MB alatti JPG, PNG, WebP vagy GIF f\u00e1jlt.',
    saveProfile: 'Profil ment\u00e9se',
    usernameLimit: 'A felhaszn\u00e1l\u00f3n\u00e9v havonta 2 alkalommal m\u00f3dos\u00edthat\u00f3.',
    administrator: 'Adminisztr\u00e1tor',
    alerts: '\u00c9rtes\u00edt\u00e9sek megnyit\u00e1sa',
    heroEyebrow: 'Egyszer szkennelj. L\u00e1sd, merre mozdul a keresleti figyelem.',
    heroTitle: 'Audit\u00e1lj b\u00e1rmilyen weboldalt, majd hasonl\u00edtsd \u00f6ssze a SEO \u00e9s AI keres\u00e9si l\u00e1that\u00f3s\u00e1got a piaccal.',
    heroBody: 'A RankSprint el\u0151fizet\u00e9ses munkafel\u00fclet csapatoknak: URL szkennel\u00e9s, versenyt\u00e1rs-keres\u00e9s, GEO l\u00e1that\u00f3s\u00e1g \u00e9s profi riportok egy helyen.',
    openProjects: 'Projektek megnyit\u00e1sa',
    viewPrices: '\u00c1rak megtekint\u00e9se',
    introTitle: 'A nyilv\u00e1nos oldal most a term\u00e9k t\u00f6rt\u00e9net\u00e9re f\u00f3kusz\u00e1l.',
    introBody: 'A statisztik\u00e1k, versenyt\u00e1rs eszk\u00f6z\u00f6k \u00e9s elemz\u00e9sek projekt dashboardokban vannak, \u00edgy a f\u0151oldal tiszt\u00e1n mutatja az aj\u00e1nlatot \u00e9s a munkater\u00fclet fel\u00e9 visz.',
    pricingTitle: 'El\u0151fizet\u00e9si csomagok keres\u00e9si l\u00e1that\u00f3s\u00e1gi munk\u00e1hoz.',
    pricingBody: 'Hozz l\u00e9tre projekteket, futtass versenyt\u00e1rs-keres\u00e9st, \u00e9s export\u00e1lj riportokat tart\u00f3s fi\u00f3k munkater\u00fcletr\u0151l. A NullTek adminok teljes hozz\u00e1f\u00e9r\u00e9st kapnak.',
    starter: 'Kezd\u0151',
    growth: 'N\u00f6veked\u00e9s',
    studio: 'St\u00fadi\u00f3',
    starterPoints: ['3 projekt', '10 szkennel\u00e9s', 'Alap exportok'],
    growthPoints: ['25 projekt', 'Versenyt\u00e1rs-k\u00f6vet\u00e9s', 'GEO riportok'],
    studioPoints: ['Korl\u00e1tlan felhaszn\u00e1l\u00f3', 'White-label riportok', 'Priorit\u00e1sos crawl sor'],
    choosePlan: 'Csomag v\u00e1laszt\u00e1sa',
    unlockedForNulltek: 'NullTeknek feloldva',
    footerTitle: 'Kezdj projekttel, majd minden munkafolyamatot a dashboardban futtass.',
    projectsEyebrow: 'Projektek',
    projectsTitle: 'V\u00e1lassz munkater\u00fcletet vagy hozz l\u00e9tre \u00faj projektet.',
    apiAccess: 'OpenAI API hozz\u00e1f\u00e9r\u00e9s',
    apiAccessBody: 'Minden funkci\u00f3 saj\u00e1t kulcsmez\u0151t kap. A j\u00f6v\u0151beli funkci\u00f3khoz ide ker\u00fcl \u00faj mez\u0151.',
    configured: 'Be\u00e1ll\u00edtva',
    missing: 'Hi\u00e1nyzik',
    effort: 'er\u0151fesz\u00edt\u00e9s',
    saveKey: 'Kulcs ment\u00e9se',
    adminOnlyKeys: 'Csak a NullTek adminisztr\u00e1tor adhat hozz\u00e1 vagy cser\u00e9lhet funkci\u00f3 API kulcsokat.',
    createProject: 'Projekt l\u00e9trehoz\u00e1sa',
    createProjectBody: 'A n\u00e9v \u00e9s a weboldal k\u00f6telez\u0151. A le\u00edr\u00e1s \u00e9s k\u00e9p opcion\u00e1lis.',
    projectName: 'Projekt neve',
    projectDescription: 'Projekt le\u00edr\u00e1sa',
    projectImageUrl: 'Projekt k\u00e9p URL',
    uploadProjectImage: 'Projektk\u00e9p felt\u00f6lt\u00e9se',
    projectImageHelp: 'T\u00f6lts fel k\u00e9pet vagy illessz be URL-t.',
    websiteUrl: 'Weboldal URL',
    projectNamePlaceholder: 'NullTek n\u00f6veked\u00e9si audit',
    projectDescriptionPlaceholder: 'R\u00f6vid \u00fczleti kontextus, piac, \u00fcgyfelek vagy aj\u00e1nlat.',
    listedProjects: 'List\u00e1zott projektek',
    listedProjectsBody: 'V\u00e1lassz egyet a dashboard megnyit\u00e1s\u00e1hoz.',
    noProjects: 'M\u00e9g nincs projekt.',
    leftThisMonth: 'maradt ebben a h\u00f3napban.',
    backToProjects: 'Vissza a projektekhez',
    details: 'R\u00e9szletek',
    competitorSearch: 'Versenyt\u00e1rs keres\u00e9s',
    seoAnalysis: 'SEO elemz\u00e9s',
    blogWriter: 'Blog \u00edr\u00f3',
    layoutAudit: 'Layout audit',
    analytics: 'Analitika',
    noProjectDescription: 'M\u00e9g nincs projektle\u00edr\u00e1s.',
    website: 'Weboldal',
    competitorKey: 'Versenyt\u00e1rs kulcs',
    seoKey: 'SEO kulcs',
    blogKey: 'Blog kulcs',
    layoutAuditKey: 'Layout audit kulcs',
    connected: 'Csatlakoztatva',
    competitors: 'Versenyt\u00e1rsak',
    competitorTitle: 'Versenyt\u00e1rs v\u00e1llalkoz\u00e1sok keres\u00e9se ehhez: {project}.',
    source: 'Forr\u00e1s',
    openAiLiveSearch: '\u00c9l\u0151 OpenAI keres\u00e9s',
    fallbackPlaceholders: 'tartal\u00e9k mintaadatok',
    competitorRunning: 'Versenyt\u00e1rs keres\u00e9s fut',
    searchCompetitors: 'Versenyt\u00e1rsak keres\u00e9se',
    noCompetitors: 'M\u00e9g nincs versenyt\u00e1rs keres\u00e9s.',
    seoTitle: '{project} elemz\u00e9se SEO szab\u00e1lyok \u00e9s versenyt\u00e1rsak alapj\u00e1n.',
    seoRunning: 'SEO elemz\u00e9s fut',
    runSeo: 'SEO elemz\u00e9s futtat\u00e1sa',
    seoScore: 'SEO pontsz\u00e1m',
    noSummary: 'Nincs el\u00e9rhet\u0151 \u00f6sszefoglal\u00f3.',
    downloadTwoPagePdf: '2 oldalas PDF let\u00f6lt\u00e9se',
    basicSeoRules: 'Alap SEO szab\u00e1lyok',
    competitorComparison: 'Versenyt\u00e1rs \u00f6sszehasonl\u00edt\u00e1s',
    popularKeywords: 'N\u00e9pszer\u0171 kulcsszavak',
    keywordCoverage: 'Kulcssz\u00f3 lefedetts\u00e9g',
    rankingPlan: 'Keres\u0151 + AI rangsorol\u00e1si terv',
    present: 'Jelen van',
    missingKeyword: 'Hi\u00e1nyzik',
    recommendations: 'Javaslatok',
    noSeo: 'M\u00e9g nincs SEO elemz\u00e9s.',
    blogTitle: 'Trend-alap\u00fa cikk \u00edr\u00e1sa ehhez: {project}.',
    blogRunning: 'Blog/h\u00edr \u00edr\u00f3 fut',
    writeArticle: 'Cikk \u00edr\u00e1sa',
    untitledPost: 'C\u00edm n\u00e9lk\u00fcli poszt',
    liveTrendDraft: '\u00c9l\u0151 trend v\u00e1zlat',
    placeholderDraft: 'Minta v\u00e1zlat',
    trendAngle: 'Trend sz\u00f6g',
    competitorAngles: 'Versenyt\u00e1rs sz\u00f6gek',
    postText: 'Poszt sz\u00f6veg',
    layoutTitle: 'Mobil, laptop, m\u00e1rka \u00e9s layout min\u0151s\u00e9g ellen\u0151rz\u00e9se ehhez: {project}.',
    layoutRunning: 'Reszponz\u00edv layout audit fut',
    runLayoutAudit: 'Layout audit futtat\u00e1sa',
    liveResponsiveAudit: '\u00c9l\u0151 reszponz\u00edv audit',
    placeholderAudit: 'Minta audit',
    downloadFullPdf: 'Teljes PDF let\u00f6lt\u00e9se',
    mobileLayout: 'Mobil layout',
    laptopLayout: 'Laptop layout',
    responsiveness: 'Reszponzivit\u00e1s',
    brandingIssues: 'M\u00e1rka probl\u00e9m\u00e1k',
    fix: 'Jav\u00edt\u00e1s',
    quickWins: 'Gyors nyeres\u00e9gek',
    noLayoutAudit: 'M\u00e9g nincs reszponz\u00edv layout audit.',
    analyticsTitle: 'Projekt statisztik\u00e1k \u00e9s riport jelek itt jelennek meg.',
    competitorsFound: 'Tal\u00e1lt versenyt\u00e1rsak',
    dataSource: 'Adatforr\u00e1s',
    reportsSaved: 'Mentett riportok',
    latestArticle: 'Legut\u00f3bbi cikk',
    layoutScore: 'Layout pontsz\u00e1m',
    none: 'Nincs',
    analyticsShellTitle: 'Az analitika oldal k\u00e9szen \u00e1ll SEO \u00e9s GEO statisztik\u00e1kra.',
    analyticsShellBody: 'Itt jelennek majd meg a l\u00e1that\u00f3s\u00e1gi grafikonok, versenyt\u00e1rs elt\u00e9r\u00e9sek, riport el\u0151zm\u00e9nyek \u00e9s szkennel\u00e9si statisztik\u00e1k a kiv\u00e1lasztott projekthez.',
    saveAnalyticsPdf: 'Analitika PDF ment\u00e9se',
    competitorProfile: 'Versenyt\u00e1rs profil',
    noDescription: 'M\u00e9g nincs le\u00edr\u00e1s.',
    locationNotFound: 'Hely nem tal\u00e1lhat\u00f3',
    emailNotFound: 'Email nem tal\u00e1lhat\u00f3',
    phoneNotFound: 'Telefon nem tal\u00e1lhat\u00f3',
    websiteNotFound: 'Weboldal nem tal\u00e1lhat\u00f3',
    savedPost: 'Mentett poszt',
    closeProgress: 'Folyamat ablak bez\u00e1r\u00e1sa',
    closeSeoProgress: 'SEO folyamat ablak bez\u00e1r\u00e1sa',
    closeBlogProgress: 'Blog \u00edr\u00f3 folyamat ablak bez\u00e1r\u00e1sa',
    closeLayoutProgress: 'Layout audit folyamat ablak bez\u00e1r\u00e1sa',
    createWorkspaceAccess: 'Munkater\u00fclet hozz\u00e1f\u00e9r\u00e9s l\u00e9trehoz\u00e1sa',
    welcomeBack: '\u00dcdv \u00fajra',
    registerTitle: 'Regisztr\u00e1ci\u00f3 a RankSprintbe.',
    loginTitle: 'Bejelentkez\u00e9s a RankSprintbe.',
    authCopy: 'Haszn\u00e1lj emailt \u00e9s jelsz\u00f3t, vagy folytasd Google-lel, ha a Firebase Authentication be van \u00e1ll\u00edtva.',
    firebaseMissing: 'Hi\u00e1nyoznak a Firebase k\u00f6rnyezeti \u00e9rt\u00e9kek. M\u00e1sold a .env.example f\u00e1jlt .env.local n\u00e9ven, add meg a web app configot, majd enged\u00e9lyezd a Google-t a Firebase Authenticationben.',
    googleClientMissing: 'Hi\u00e1nyzik a Google client ID a .env.local f\u00e1jlb\u00f3l.',
    emailAccess: 'Email hozz\u00e1f\u00e9r\u00e9s',
    name: 'N\u00e9v',
    email: 'Email',
    password: 'Jelsz\u00f3',
    passwordPlaceholder: 'Legal\u00e1bb 6 karakter',
    working: 'Dolgozik...',
    createAccount: 'Fi\u00f3k l\u00e9trehoz\u00e1sa',
    alreadyHaveAccount: 'M\u00e1r van fi\u00f3kod? Jelentkezz be',
    needAccount: 'Kell fi\u00f3k? Regisztr\u00e1lj',
  },
}

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

function interpolate(text, values = {}) {
  return Object.entries(values).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, value),
    text,
  )
}

function imageFileToDataUrl(file, maxSize = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) {
      reject(new Error('Invalid image file'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Image read failed'))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () => reject(new Error('Image decode failed'))
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Canvas unavailable'))
          return
        }
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
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
    creator: 'RankSprint',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('RankSprint Responsive Layout Audit', 14, 19)

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
    creator: 'RankSprint',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('RankSprint Improvement Report', 14, 18)

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

  cursorY = 132
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Popular keywords and coverage', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(payload.keywordCoverage || []).slice(0, 6).forEach((item) => {
    cursorY = addWrappedText(
      doc,
      `${item.keyword} (${item.present ? 'present' : 'missing'}): ${item.whereFound || item.opportunity || 'Review keyword opportunity.'}`,
      14,
      cursorY,
      180,
      5,
      178,
    )
    cursorY += 2
  })

  cursorY = 184
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
      250,
    )
    cursorY += 3
  })

  cursorY = 252
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('Ranking plan', 14, cursorY)
  cursorY += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(payload.rankingPlan || []).slice(0, 4).forEach((step, index) => {
    cursorY = addWrappedText(doc, `${index + 1}. ${step}`, 14, cursorY, 180, 5, 286)
    cursorY += 2
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
    subject: 'RankSprint analytics export',
    creator: 'RankSprint',
  })

  doc.setFillColor(0, 142, 196)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('RankSprint Analytics Report', 14, 18)

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
  const didMountThemeRef = useRef(false)
  const [authMode, setAuthMode] = useState(null)
  const [user, setUser] = useState(null)
  const [screen, setScreen] = useState('home')
  const [dashboardTab, setDashboardTab] = useState('details')
  const [themeMode, setThemeMode] = useState(() => window.localStorage.getItem('ranksprint_theme') || 'light')
  const [themeTransitioning, setThemeTransitioning] = useState(false)
  const [language, setLanguage] = useState(() => window.localStorage.getItem('ranksprint_language') || 'en')
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
  const [articleHistory, setArticleHistory] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [layoutAudit, setLayoutAudit] = useState(null)
  const [profileForm, setProfileForm] = useState({ displayName: '', photoURL: '' })
  const [usernameChangesRemaining, setUsernameChangesRemaining] = useState(null)
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
  const t = copy[language] || copy.en
  const configuredFeatures = openAiStatus.features || []
  const featureLabel = (feature) => ({
    competitor_search: t.competitorSearch,
    seo_analysis: t.seoAnalysis,
    blog_writer: t.blogWriter,
    layout_audit: t.layoutAudit,
  })[feature.id] || feature.label
  const competitorSearchKey = configuredFeatures.find((feature) => feature.id === 'competitor_search')
  const competitorJob = featureJobs.competitor_search
  const seoAnalysisKey = configuredFeatures.find((feature) => feature.id === 'seo_analysis')
  const seoJob = featureJobs.seo_analysis
  const blogWriterKey = configuredFeatures.find((feature) => feature.id === 'blog_writer')
  const blogJob = featureJobs.blog_writer
  const layoutAuditKey = configuredFeatures.find((feature) => feature.id === 'layout_audit')
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
    window.localStorage.setItem('ranksprint_theme', themeMode)
    if (!didMountThemeRef.current) {
      didMountThemeRef.current = true
      return undefined
    }
    setThemeTransitioning(true)
    const timer = window.setTimeout(() => setThemeTransitioning(false), 720)
    return () => window.clearTimeout(timer)
  }, [themeMode])

  useEffect(() => {
    window.localStorage.setItem('ranksprint_language', language)
  }, [language])

  useEffect(() => {
    if (screen === 'home') {
      return
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [screen, activeProjectId])

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

    apiRequest(`/api/users/${encodeURIComponent(user.uid)}/profile`)
      .then((data) => {
        const profile = data.profile
        setProfileForm({
          displayName: profile?.display_name || user.displayName || '',
          photoURL: profile?.photo_url || user.photoURL || '',
        })
        const currentMonth = profile?.username_change_month === new Date().toISOString().slice(0, 7)
        setUsernameChangesRemaining(Math.max(0, 2 - (currentMonth ? Number(profile?.username_change_count || 0) : 0)))
      })
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

    apiRequest(`/api/projects/${activeProjectId}/articles`)
      .then((data) => setArticleHistory(data.articles || []))
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

  function updateProfileField(event) {
    setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function uploadProfilePicture(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    try {
      const dataUrl = await imageFileToDataUrl(file, 720, 0.84)
      setProfileForm((current) => ({ ...current, photoURL: dataUrl }))
    } catch {
      setActionStatus(t.imageUploadFailed)
    }
  }

  async function saveProfileSettings(event) {
    event.preventDefault()

    if (!user) {
      setActionStatus('Login is required to save profile.')
      return
    }

    setActionStatus('Saving profile...')

    try {
      const token = await user.getIdToken()
      const data = await apiRequest(`/api/users/${encodeURIComponent(user.uid)}/profile`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          displayName: profileForm.displayName,
          photoURL: profileForm.photoURL,
        }),
      })

      await updateUserProfile({
        displayName: data.profile?.display_name || profileForm.displayName,
        photoURL: data.profile?.photo_url || profileForm.photoURL,
      })
      setUsernameChangesRemaining(data.usernameChangesRemaining)
      setUser({ ...user, displayName: data.profile?.display_name || profileForm.displayName, photoURL: data.profile?.photo_url || profileForm.photoURL })
      setActionStatus('Profile saved.')
    } catch (error) {
      setActionStatus(error.message)
    }
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

  async function uploadProjectImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    try {
      const dataUrl = await imageFileToDataUrl(file, 960, 0.82)
      setProjectForm((current) => ({ ...current, imageUrl: dataUrl }))
    } catch {
      setActionStatus(t.imageUploadFailed)
    }
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
      setArticleHistory((current) => [data.article, ...current.filter((item) => item.id !== data.article.id)])
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
    <main ref={rootRef} className={`app-shell overflow-guard theme-${themeMode}${themeTransitioning ? ' theme-transitioning' : ''}`}>
      <nav className="nav-shell">
        <button className="brand brand-button" type="button" aria-label="RankSprint home" onClick={() => setScreen('home')}>
          <img className="brand-logo" src="/ranksprint-logo.svg" alt="RankSprint" />
        </button>
        <div className="nav-links" aria-label="Main navigation">
          <button className={screen === 'home' ? 'active' : ''} type="button" onClick={() => setScreen('home')}>{t.home}</button>
          <button className={screen === 'projects' || screen === 'dashboard' ? 'active' : ''} type="button" onClick={() => setScreen('projects')}>{t.projects}</button>
          <button className={screen === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}>{t.settings}</button>
          <a href="#pricing" onClick={() => setScreen('home')}>{t.pricing}</a>
        </div>
        <div className="nav-actions">
          <button className="icon-button" type="button" aria-label={t.alerts}>
            <Bell size={18} />
          </button>
          {user ? (
            <div className="user-chip">
              <span>{user.displayName || user.email}</span>
              {isAdministrator ? <small>{t.administrator}</small> : null}
              <button className="icon-button" type="button" aria-label={t.logout} onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <button className="button ghost" type="button" onClick={() => setAuthMode('login')}>
                <LogIn size={17} />
                {t.login}
              </button>
              <button className="button light" type="button" onClick={() => setAuthMode('register')}>
                <UserPlus size={17} />
                {t.register}
              </button>
            </>
          )}
        </div>
      </nav>

      {screen === 'home' ? (
        <div className="page-transition" key={`home-${language}`}>
          <section id="top" className="hero-section">
            <div className="hero-art" aria-hidden="true">
              <img src={visualDataUri('RankSprint visibility map', 0)} alt="" />
            </div>
            <div className="hero-copy">
              <p className="eyebrow">{t.heroEyebrow}</p>
              <h1>{t.heroTitle}</h1>
              <p className="hero-body">{t.heroBody}</p>
              <div className="hero-actions">
                <button className="button light large" type="button" onClick={() => setScreen('projects')}>
                  {t.openProjects}
                  <ArrowRight size={18} />
                </button>
                <a className="button dark large" href="#pricing">
                  {t.viewPrices}
                </a>
              </div>
            </div>
          </section>

          <section className="interest-section landing-intro">
            <div className="section-copy">
              <h2>{t.introTitle}</h2>
              <p>{t.introBody}</p>
            </div>
          </section>

          <section id="pricing" className="pricing-section">
            <div className="pricing-copy">
              <h2>{t.pricingTitle}</h2>
              <p>{t.pricingBody}</p>
            </div>
            <div className="pricing-grid">
              {[
                [t.starter, '$29', t.starterPoints],
                [t.growth, '$89', t.growthPoints],
                [t.studio, '$249', t.studioPoints],
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
                  <button className={plan === t.growth ? 'button light' : 'button dark'} type="button" onClick={() => setScreen('projects')}>
                    {isAdministrator ? t.unlockedForNulltek : t.choosePlan}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <footer className="footer-section">
            <div>
              <ShieldCheck size={26} />
              <h2>{t.footerTitle}</h2>
            </div>
            <div className="footer-links">
              <button type="button" onClick={() => setScreen('home')}>RankSprint</button>
              <button type="button" onClick={() => setScreen('projects')}>{t.projects}</button>
              <a href="#pricing">{t.pricing}</a>
            </div>
          </footer>
        </div>
      ) : null}

      {screen === 'projects' ? (
        <section className="projects-page page-transition" key={`projects-${language}`}>
          <div className="page-heading">
            <p className="eyebrow">{t.projectsEyebrow}</p>
            <h1>{t.projectsTitle}</h1>
            <p>{actionStatus}</p>
          </div>

          <div className="projects-grid">
            <div className="settings-card">
              <div className="settings-heading">
                <span className="card-icon">
                  <KeyRound size={20} />
                </span>
                <div>
                  <h3>{t.apiAccess}</h3>
                  <p>{t.apiAccessBody}</p>
                </div>
              </div>
              {isAdministrator ? (
                <div className="feature-key-list">
                  {configuredFeatures.map((feature) => (
                    <form className="feature-key-form" key={feature.id} onSubmit={(event) => saveOpenAiKey(event, feature.id)}>
                      <div>
                        <strong>{featureLabel(feature)}</strong>
                        <span>
                          {feature.configured ? t.configured : t.missing} ? {feature.model} ? {feature.reasoningEffort} {t.effort}
                        </span>
                      </div>
                      <div className="api-key-form">
                        <input
                          type="password"
                          value={openAiKeys[feature.id] || ''}
                          onChange={(event) => updateFeatureKey(feature.id, event.target.value)}
                          placeholder="sk-..."
                          aria-label={`${featureLabel(feature)} OpenAI API key`}
                          autoComplete="off"
                        />
                        <button
                          className="button light"
                          type="submit"
                          disabled={openAiSavingFeature === feature.id || !(openAiKeys[feature.id] || '').trim()}
                        >
                          {openAiSavingFeature === feature.id ? <LoaderCircle size={17} className="spin-icon" /> : <KeyRound size={17} />}
                          {t.saveKey}
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              ) : (
                <div className="admin-lock-note">
                  <LockKeyhole size={18} />
                  {t.adminOnlyKeys}
                </div>
              )}
            </div>

            <form className="project-form" onSubmit={createProject}>
              <div className="settings-heading">
                <span className="card-icon">
                  <Plus size={20} />
                </span>
                <div>
                  <h3>{t.createProject}</h3>
                  <p>{t.createProjectBody}</p>
                </div>
              </div>
              <label>
                <span>{t.projectName}</span>
                <input name="name" value={projectForm.name} onChange={updateProjectField} placeholder={t.projectNamePlaceholder} required />
              </label>
              <label>
                <span>{t.projectDescription}</span>
                <textarea name="description" value={projectForm.description} onChange={updateProjectField} placeholder={t.projectDescriptionPlaceholder} />
              </label>
              <div className="project-form-field">
                <span>{t.projectImageUrl}</span>
                <div className="image-upload-row">
                  <img src={projectForm.imageUrl || visualDataUri(projectForm.name || 'Project image', 1)} alt="" />
                  <div>
                    <p>{t.projectImageHelp}</p>
                    <div className="upload-actions">
                      <label className="button dark upload-button">
                        <Image size={17} />
                        {t.chooseImage}
                        <input type="file" accept="image/*" onChange={uploadProjectImage} />
                      </label>
                      {projectForm.imageUrl ? (
                        <button
                          className="button ghost"
                          type="button"
                          onClick={() => setProjectForm((current) => ({ ...current, imageUrl: '' }))}
                        >
                          <X size={17} />
                          {t.removeImage}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="field-shell">
                  <Image size={17} />
                  <input name="imageUrl" value={projectForm.imageUrl} onChange={updateProjectField} placeholder="https://..." />
                </div>
              </div>
              <label>
                <span>{t.websiteUrl}</span>
                <div className="field-shell">
                  <Globe2 size={17} />
                  <input name="websiteUrl" value={projectForm.websiteUrl} onChange={updateProjectField} placeholder="https://company.com" required />
                </div>
              </label>
              <button className="button light auth-submit" type="submit" disabled={projectBusy}>
                {projectBusy ? <LoaderCircle size={17} className="spin-icon" /> : <Plus size={17} />}
                {t.createProject}
              </button>
            </form>

            <div className="project-list-panel">
              <div className="settings-heading">
                <span className="card-icon">
                  <Building2 size={20} />
                </span>
                <div>
                  <h3>{t.listedProjects}</h3>
                  <p>{t.listedProjectsBody}</p>
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
                    <p>{t.noProjects}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {screen === 'settings' ? (
        <section className="settings-page page-transition" key={`settings-${language}`}>
          <div className="page-heading">
            <p className="eyebrow">{t.settings}</p>
            <h1>{t.settingsTitle}</h1>
            <p>{t.settingsIntro}</p>
          </div>

          <div className="settings-grid">
            <article className="settings-card">
              <div className="settings-heading">
                <span className="card-icon">
                  {themeMode === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </span>
                <div>
                  <h3>{t.theme}</h3>
                  <p>{themeMode === 'dark' ? t.darkMode : t.lightMode}</p>
                </div>
              </div>
              <div className="segmented-control">
                <button className={themeMode === 'light' ? 'active' : ''} type="button" onClick={() => setThemeMode('light')}>
                  <Sun size={16} />
                  {t.lightMode}
                </button>
                <button className={themeMode === 'dark' ? 'active' : ''} type="button" onClick={() => setThemeMode('dark')}>
                  <Moon size={16} />
                  {t.darkMode}
                </button>
              </div>
            </article>

            <article className="settings-card">
              <div className="settings-heading">
                <span className="card-icon">
                  <Settings size={20} />
                </span>
                <div>
                  <h3>{t.language}</h3>
                  <p>English / Magyar</p>
                </div>
              </div>
              <label className="settings-field">
                <span>{t.language}</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  <option value="en">English</option>
                  <option value="hu">Magyar</option>
                </select>
              </label>
            </article>

            <form className="settings-card profile-card" onSubmit={saveProfileSettings}>
              <div className="settings-heading">
                <span className="card-icon">
                  <Camera size={20} />
                </span>
                <div>
                  <h3>{t.username}</h3>
                  <p>
                    {t.usernameLimit}
                    {usernameChangesRemaining != null ? ` ${usernameChangesRemaining} ${t.leftThisMonth}` : ''}
                  </p>
                </div>
              </div>
              <div className="profile-editor">
                <img src={profileForm.photoURL || visualDataUri(profileForm.displayName || 'Profile', 2)} alt="" />
                <div className="profile-fields">
                  <label className="settings-field">
                    <span>{t.username}</span>
                    <input name="displayName" value={profileForm.displayName} onChange={updateProfileField} placeholder="NullTek" required />
                  </label>
                  <div className="settings-field">
                    <span>{t.profilePicture}</span>
                    <div className="image-upload-row">
                      <img src={profileForm.photoURL || visualDataUri(profileForm.displayName || 'Profile', 2)} alt="" />
                      <div>
                        <p>{t.profilePictureHelp}</p>
                        <div className="upload-actions">
                          <label className="button dark upload-button">
                            <Camera size={17} />
                            {t.chooseImage}
                            <input type="file" accept="image/*" onChange={uploadProfilePicture} />
                          </label>
                          {profileForm.photoURL ? (
                            <button
                              className="button ghost"
                              type="button"
                              onClick={() => setProfileForm((current) => ({ ...current, photoURL: '' }))}
                            >
                              <X size={17} />
                              {t.removeImage}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <input name="photoURL" value={profileForm.photoURL} onChange={updateProfileField} placeholder="https://..." />
                  </div>
                  <div className="avatar-picker">
                    {['cyan-profile', 'blue-grid', 'clean-wave', 'audit-map'].map((seed, index) => (
                      <button
                        type="button"
                        key={seed}
                        aria-label={`Pick profile image ${index + 1}`}
                        onClick={() => setProfileForm((current) => ({ ...current, photoURL: visualDataUri(seed, index) }))}
                      >
                        <img src={visualDataUri(seed, index)} alt="" />
                      </button>
                    ))}
                  </div>
                  <button className="button light" type="submit" disabled={!user}>
                    <Check size={17} />
                    {t.saveProfile}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {screen === 'dashboard' && activeProject ? (
        <section className="dashboard-shell page-transition" key={`dashboard-${activeProject.id}-${language}`}>
          <aside className="dashboard-sidebar">
            <button className="button dark" type="button" onClick={() => setScreen('projects')}>
              {t.backToProjects}
            </button>
            <div className="dashboard-project">
              <img src={activeProject.image_url || visualDataUri(activeProject.name, 2)} alt="" />
              <h2>{activeProject.name}</h2>
              <p>{activeProject.website_url}</p>
            </div>
            <nav className="dashboard-nav" aria-label="Project dashboard navigation">
              {[
                ['details', FileText, t.details],
                ['competitor search', Search, t.competitorSearch],
                ['seo analysis', Globe2, t.seoAnalysis],
                ['blog writer', Newspaper, t.blogWriter],
                ['layout audit', MonitorSmartphone, t.layoutAudit],
                ['analytics', BarChart3, t.analytics],
              ].map(([tab, Icon, label]) => (
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
                  {label}
                  {tab === 'competitor search' && unreadFeatureDots.competitor_search ? <span className="nav-done-dot" /> : null}
                  {tab === 'seo analysis' && unreadFeatureDots.seo_analysis ? <span className="nav-done-dot" /> : null}
                  {tab === 'blog writer' && unreadFeatureDots.blog_writer ? <span className="nav-done-dot" /> : null}
                  {tab === 'layout audit' && unreadFeatureDots.layout_audit ? <span className="nav-done-dot" /> : null}
                </button>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content" key={`${dashboardTab}-${language}`}>
            {dashboardTab === 'details' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.details}</p>
                <h1>{activeProject.name}</h1>
                <p>{activeProject.description || t.noProjectDescription}</p>
                <div className="analytics-grid">
                  <article className="analytics-card full-row-card">
                    <span>{t.website}</span>
                    <strong>{activeProject.website_url}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.competitorKey}</span>
                    <strong>{competitorSearchKey?.configured ? t.connected : t.missing}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.seoKey}</span>
                    <strong>{seoAnalysisKey?.configured ? t.connected : t.missing}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.blogKey}</span>
                    <strong>{blogWriterKey?.configured ? t.connected : t.missing}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.layoutAuditKey}</span>
                    <strong>{layoutAuditKey?.configured ? t.connected : t.missing}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.competitors}</span>
                    <strong>{competitors.length}</strong>
                  </article>
                </div>
              </div>
            ) : null}

            {dashboardTab === 'competitor search' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.competitorSearch}</p>
                <h1>{interpolate(t.competitorTitle, { project: activeProject.name })}</h1>
                <p>{competitorSource ? `${t.source}: ${competitorSource === 'openai' ? t.openAiLiveSearch : t.fallbackPlaceholders}` : actionStatus}</p>
                {competitorJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>{t.competitorRunning}</span>
                      <strong>{competitorJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${competitorJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={searchCompetitors} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Search size={18} />}
                  {t.searchCompetitors}
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
                      <p>{t.noCompetitors}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {dashboardTab === 'seo analysis' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.seoAnalysis}</p>
                <h1>{interpolate(t.seoTitle, { project: activeProject.name })}</h1>
                <p>{actionStatus}</p>
                {seoJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>{t.seoRunning}</span>
                      <strong>{seoJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${seoJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={runSeoAnalysis} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Globe2 size={18} />}
                  {t.runSeo}
                </button>

                {seoAnalysis ? (
                  <div className="seo-report">
                    <div className="seo-score-card">
                      <span>{t.seoScore}</span>
                      <strong>{Number(seoAnalysis.payload?.score || 0).toFixed(1)}<small>/10</small></strong>
                      <p>{seoAnalysis.payload?.summary || t.noSummary}</p>
                      <button className="button light" type="button" onClick={() => downloadSeoPdf(activeProject, seoAnalysis)}>
                        <Download size={17} />
                        {t.downloadTwoPagePdf}
                      </button>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>{t.basicSeoRules}</h3>
                        {(seoAnalysis.payload?.rules || []).map((rule) => (
                          <div className="seo-row" key={`${rule.rule}-${rule.finding}`}>
                            <span>{rule.rule}</span>
                            <strong>{rule.status}</strong>
                            <p>{rule.finding}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>{t.competitorComparison}</h3>
                        {(seoAnalysis.payload?.competitorComparison || []).map((competitor) => (
                          <div className="seo-row" key={`${competitor.businessName}-${competitor.risk}`}>
                            <span>{competitor.businessName}</span>
                            <strong>{competitor.risk}</strong>
                            <p>{competitor.edge}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>{t.popularKeywords}</h3>
                        {(seoAnalysis.payload?.popularKeywords || []).map((keyword) => (
                          <div className="seo-row" key={keyword}>
                            <span>{keyword}</span>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>{t.keywordCoverage}</h3>
                        {(seoAnalysis.payload?.keywordCoverage || []).map((item) => (
                          <div className="seo-row" key={`${item.keyword}-${item.present}`}>
                            <span>{item.keyword}</span>
                            <strong>{item.present ? t.present : t.missingKeyword}</strong>
                            <p>{item.whereFound || item.opportunity}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <article className="seo-recommendations">
                      <h3>{t.rankingPlan}</h3>
                      {(seoAnalysis.payload?.rankingPlan || []).map((step) => (
                        <p key={step}>
                          <Check size={16} />
                          {step}
                        </p>
                      ))}
                    </article>
                    <article className="seo-recommendations">
                      <h3>{t.recommendations}</h3>
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
                    <p>{t.noSeo}</p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardTab === 'blog writer' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.blogWriter}</p>
                <h1>{interpolate(t.blogTitle, { project: activeProject.name })}</h1>
                <p>{actionStatus}</p>
                {blogJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>{t.blogRunning}</span>
                      <strong>{blogJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${blogJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={writeBlogArticle} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <Newspaper size={18} />}
                  {t.writeArticle}
                </button>

                <div className="article-workspace">
                  <aside className="article-history-menu">
                    <h3>{t.savedPosts}</h3>
                    {articleHistory.map((article) => (
                      <button type="button" key={article.id} onClick={() => setSelectedArticle(article)}>
                        <span>{article.payload?.title || t.untitledPost}</span>
                        <small>{new Date(article.created_at).toLocaleDateString()}</small>
                      </button>
                    ))}
                    {!articleHistory.length ? <p>{t.noPosts}</p> : null}
                  </aside>

                  {articleDraft ? (
                    <div className="article-report">
                      <article className="article-summary-card">
                        <span>{t.latestPost} / {articleDraft.source === 'openai' ? t.liveTrendDraft : t.placeholderDraft}</span>
                        <h2>{articleDraft.payload?.title}</h2>
                        <p>{articleDraft.payload?.excerpt}</p>
                        <small>{articleDraft.payload?.slug}</small>
                      </article>
                      <article className="article-trends-card">
                        <h3>{t.trendAngle}</h3>
                        <p>{articleDraft.payload?.trendSummary}</p>
                      </article>
                      <article className="article-trends-card">
                        <h3>{t.competitorAngles}</h3>
                        {(articleDraft.payload?.competitorAngles || []).map((item) => (
                          <p key={`${item.businessName}-${item.angle}`}>
                            <strong>{item.businessName}</strong>
                            {item.angle}
                          </p>
                        ))}
                      </article>
                      <article className="article-body-card">
                        <h3>{t.postText}</h3>
                        <pre>{articleDraft.payload?.postText}</pre>
                        <p className="article-cta">{articleDraft.payload?.callToAction}</p>
                      </article>
                    </div>
                  ) : (
                    <div className="empty-competitors">
                      <Newspaper size={22} />
                      <p>{t.noPosts}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {dashboardTab === 'layout audit' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.layoutAudit}</p>
                <h1>{interpolate(t.layoutTitle, { project: activeProject.name })}</h1>
                <p>{actionStatus}</p>
                {layoutJob?.status === 'running' ? (
                  <div className="feature-progress">
                    <div className="feature-progress-meta">
                      <span>{t.layoutRunning}</span>
                      <strong>{layoutJob.progress}%</strong>
                    </div>
                    <div className="feature-progress-track">
                      <span style={{ width: `${layoutJob.progress}%` }} />
                    </div>
                  </div>
                ) : null}
                <button className="button light large competitor-search" type="button" onClick={runLayoutAudit} disabled={projectBusy}>
                  {projectBusy ? <LoaderCircle size={18} className="spin-icon" /> : <MonitorSmartphone size={18} />}
                  {t.runLayoutAudit}
                </button>

                {layoutAudit ? (
                  <div className="seo-report layout-audit-report">
                    <div className="seo-score-card">
                      <span>{layoutAudit.source === 'openai' ? t.liveResponsiveAudit : t.placeholderAudit}</span>
                      <strong>{Number(layoutAudit.payload?.score || 0).toFixed(1)}<small>/10</small></strong>
                      <p>{layoutAudit.payload?.summary || t.noSummary}</p>
                      <button className="button light" type="button" onClick={() => downloadLayoutAuditPdf(activeProject, layoutAudit)}>
                        <Download size={17} />
                        {t.downloadFullPdf}
                      </button>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>{t.mobileLayout}</h3>
                        {(layoutAudit.payload?.mobile || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>{t.fix}:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>{t.laptopLayout}</h3>
                        {(layoutAudit.payload?.laptop || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>{t.fix}:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <div className="seo-section-grid">
                      <article>
                        <h3>{t.responsiveness}</h3>
                        {(layoutAudit.payload?.responsiveness || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>{t.fix}:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                      <article>
                        <h3>{t.brandingIssues}</h3>
                        {(layoutAudit.payload?.brandingIssues || []).map((item) => (
                          <div className="seo-row" key={`${item.title}-${item.finding}`}>
                            <span>{item.title}</span>
                            <strong>{item.severity}</strong>
                            <p>{item.finding}</p>
                            <p><b>{t.fix}:</b> {item.fix}</p>
                          </div>
                        ))}
                      </article>
                    </div>
                    <article className="seo-recommendations">
                      <h3>{t.quickWins}</h3>
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
                    <p>{t.noLayoutAudit}</p>
                  </div>
                )}
              </div>
            ) : null}

            {dashboardTab === 'analytics' ? (
              <div className="dashboard-panel">
                <p className="eyebrow">{t.analytics}</p>
                <h1>{t.analyticsTitle}</h1>
                <div className="analytics-grid">
                  <article className="analytics-card">
                    <span>{t.competitorsFound}</span>
                    <strong>{competitors.length}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.dataSource}</span>
                    <strong>{competitorSource || t.none}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.reportsSaved}</span>
                    <strong>{savedReports.length}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.seoScore}</span>
                    <strong>{seoAnalysis?.payload?.score != null ? `${Number(seoAnalysis.payload.score).toFixed(1)}/10` : t.none}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.latestArticle}</span>
                    <strong>{articleDraft?.payload?.title || t.none}</strong>
                  </article>
                  <article className="analytics-card">
                    <span>{t.layoutScore}</span>
                    <strong>{layoutAudit?.payload?.score != null ? `${Number(layoutAudit.payload.score).toFixed(1)}/10` : t.none}</strong>
                  </article>
                </div>
                <div className="analytics-panel">
                  <div>
                    <BarChart3 size={24} />
                    <h2>{t.analyticsShellTitle}</h2>
                    <p>{t.analyticsShellBody}</p>
                  </div>
                  <button className="button light large" type="button" onClick={saveAnalyticsPdf}>
                    {t.saveAnalyticsPdf}
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
          t={t}
        />
      ) : null}

      {selectedCompetitor ? (
        <div className="auth-backdrop" role="presentation">
          <section className="competitor-modal" role="dialog" aria-modal="true" aria-labelledby="competitor-title">
            <button className="auth-close" type="button" aria-label={t.competitorProfile} onClick={() => setSelectedCompetitor(null)}>
              <X size={19} />
            </button>
            <div className="competitor-modal-art" aria-hidden="true">
              <img src={visualDataUri(selectedCompetitor.business_name || 'Competitor profile', 1)} alt="" />
            </div>
            <div className="competitor-modal-body">
              <p className="auth-kicker">{t.competitorProfile}</p>
              <h2 id="competitor-title">{selectedCompetitor.business_name}</h2>
              <p>{selectedCompetitor.description || t.noDescription}</p>
              <div className="competitor-details">
                <span>
                  <MapPin size={17} />
                  {selectedCompetitor.location || t.locationNotFound}
                </span>
                <span>
                  <Mail size={17} />
                  {selectedCompetitor.email || t.emailNotFound}
                </span>
                <span>
                  <Phone size={17} />
                  {selectedCompetitor.phone || t.phoneNotFound}
                </span>
                <span>
                  <ExternalLink size={17} />
                  {selectedCompetitor.website_url ? (
                    <a href={selectedCompetitor.website_url} target="_blank" rel="noreferrer">
                      {selectedCompetitor.website_url}
                    </a>
                  ) : (
                    t.websiteNotFound
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedArticle ? (
        <div className="auth-backdrop" role="presentation">
          <section className="article-modal" role="dialog" aria-modal="true" aria-labelledby="article-title">
            <button className="auth-close" type="button" aria-label={t.savedPost} onClick={() => setSelectedArticle(null)}>
              <X size={19} />
            </button>
            <p className="auth-kicker">{t.savedPost}</p>
            <h2 id="article-title">{selectedArticle.payload?.title || t.untitledPost}</h2>
            <p>{selectedArticle.payload?.excerpt}</p>
            <pre>{selectedArticle.payload?.postText}</pre>
          </section>
        </div>
      ) : null}

      {showCompetitorMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{t.competitorRunning}</span>
            <strong>{competitorJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${competitorJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label={t.closeProgress}
            onClick={() => setHiddenJobPopups((current) => ({ ...current, competitor_search: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showSeoMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{t.seoRunning}</span>
            <strong>{seoJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${seoJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label={t.closeSeoProgress}
            onClick={() => setHiddenJobPopups((current) => ({ ...current, seo_analysis: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showBlogMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{t.blogRunning}</span>
            <strong>{blogJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${blogJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label={t.closeBlogProgress}
            onClick={() => setHiddenJobPopups((current) => ({ ...current, blog_writer: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {showLayoutMiniProgress ? (
        <div className="floating-progress" role="status" aria-live="polite">
          <div className="floating-progress-copy">
            <span>{t.layoutRunning}</span>
            <strong>{layoutJob.progress}%</strong>
          </div>
          <div className="feature-progress-track">
            <span style={{ width: `${layoutJob.progress}%` }} />
          </div>
          <button
            type="button"
            aria-label={t.closeLayoutProgress}
            onClick={() => setHiddenJobPopups((current) => ({ ...current, layout_audit: true }))}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}
    </main>
  )
}

function AuthModal({ mode, onClose, onModeChange, t }) {
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
        <button className="auth-close" type="button" aria-label={isRegister ? t.registerTitle : t.loginTitle} onClick={onClose}>
          <X size={19} />
        </button>
        <div className="auth-media" aria-hidden="true">
          <img src={visualDataUri('Secure account access', 2)} alt="" />
        </div>
        <div className="auth-panel">
          <p className="auth-kicker">{isRegister ? t.createWorkspaceAccess : t.welcomeBack}</p>
          <h2 id="auth-title">{isRegister ? t.registerTitle : t.loginTitle}</h2>
          <p className="auth-copy">{t.authCopy}</p>

          {!isFirebaseConfigured ? (
            <div className="setup-note">
              {t.firebaseMissing}
            </div>
          ) : null}

          <div className="google-identity-shell">
            <div ref={googleButtonRef} className="google-identity-button" />
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <p className="auth-error">{t.googleClientMissing}</p>
            ) : null}
          </div>

          <div className="auth-divider">
            <span />
            {t.emailAccess}
            <span />
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister ? (
              <label>
                <span>{t.name}</span>
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
              <span>{t.email}</span>
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
              <span>{t.password}</span>
              <input
                name="password"
                type="password"
                value={form.password}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={6}
                onChange={updateField}
                placeholder={t.passwordPlaceholder}
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="button light auth-submit" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? t.working : isRegister ? t.createAccount : t.login}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={() => onModeChange(isRegister ? 'login' : 'register')}
          >
            {isRegister ? t.alreadyHaveAccount : t.needAccount}
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
