export interface ProjectData {
  id: string;
  title: string;
  client: string;
  year: string;
  category: string;
  categoryTag: string;
  role: string;
  duration: string;
  tools: string[];
  industry: string;
  liveUrl?: string;
  thumbnail: string;
  visuals: string[];
  metrics: { label: string; value: string }[];
  tagline: string;
  overview: string;
  challenge: string;
  solution: string;
  impact: string[];
  colorAccent: string;
  hasCaseStudy?: boolean;
}

export const PROJECTS: ProjectData[] = [
  {
    id: 'avenor landingpage',
    title: 'AVENOR - Real Estate Landing Page',
    client: 'Avenor Group',
    year: '2025 - 2026',
    category: 'Websites & Real Estate',
    categoryTag: 'LANDING PAGE',
    role: 'Product Designer (UX UI)',
    duration: '5 Days',
    tools: ['Figma', 'Jitter', 'Design Systems'],
    industry: 'Luxury Real Estate',
    liveUrl: 'https://avenorhome.vercel.app/',
    thumbnail: '/assets/projects/avenor.mp4',
    visuals: [
      '/assets/case_studies/avenor_casestudy_1.jpg',
      '/assets/projects/avenor_after.jpg'
    ],
    metrics: [
      { label: 'Conversion Velocity', value: '+42%' },
      { label: 'Time-on-Page', value: '3m 24s' },
      { label: 'Interaction Rate', value: '78%' }
    ],
    tagline: 'A luxury real estate landing page exploring typography, spacing, and micro-motion.',
    overview: 'This project explores how thoughtful design decisions—from typography and spacing to motion and visual hierarchy—can transform a simple concept into a refined digital experience.',
    challenge: 'High-net-worth real estate buyers need an immediate tactile impression of scale and atmosphere without cumbersome virtual tour loaders.',
    solution: 'Designed an editorial digital catalogue with natural daylight lighting transitions, interactive floor-plan spatial overlays, and frictionless booking.',
    impact: [
      'Engineered fluid motion design in Jitter for key scroll milestones.',
      'Refined editorial typography system elevating property perception.'
    ],
    colorAccent: '#d97706',
    hasCaseStudy: true
  },
  {
    id: 'neura',
    title: 'NEURA KICKS',
    client: 'Nurakick Studio',
    year: '2025',
    category: 'AI Commerce & Mobile App',
    categoryTag: 'E-COMMERCE',
    role: 'Product Designer',
    duration: '3 weeks',
    tools: ['Figma', 'Blender', 'Design Systems'],
    industry: 'Ecommerce & AI Customization',
    thumbnail: '/assets/Selected Project/nURAKICK.webp',
    visuals: [
      '/assets/Selected Project/nURAKICK.webp',
      '/assets/Nurakick_slice_0.jpg',
      '/assets/Nurakick_slice_1.jpg',
      '/assets/Nurakick_slice_2.jpg',
      '/assets/Nurakick_slice_3.jpg'
    ],
    metrics: [
      { label: 'Configurator Engagement', value: '+140%' },
      { label: 'Return Rate Drop', value: '-22%' },
      { label: 'Cart Conversion', value: '4.8%' }
    ],
    tagline: 'AI E-Commerce App - NEURA Kicks generative footwear customization interface.',
    overview: 'NEURA KICKS is a direct-to-consumer footwear customization platform that lets users prompt generative AI colorways and render physical prototypes in high-fidelity 3D.',
    challenge: 'Balancing complex 3D shader parameters with an interface that non-technical consumers can playfully explore on mobile devices.',
    solution: 'Engineered a radial contextual tool wheel with haptic-inspired visual feedback, instant texture baking, and an editorial checkout drawer.',
    impact: [
      'Delivered responsive mobile canvas workflow.',
      'Featured in multiple global design roundups.'
    ],
    colorAccent: '#ec4899',
    hasCaseStudy: true
  },
  {
    id: 'swychr',
    title: 'Swychr Fintech App',
    client: 'Swychr Inc.',
    year: '2025 - 2026',
    category: 'Mobile Apps & Fintech',
    categoryTag: 'FINTECH',
    role: 'Lead Product Designer',
    duration: '6 Months',
    tools: ['Figma', 'Principle', 'Design Systems'],
    industry: 'Cross-Border Payments & FX',
    liveUrl: 'https://swychr.com',
    thumbnail: '/assets/Selected Project/sWYCHR.webp',
    visuals: [
      '/assets/Selected Project/sWYCHR.webp',
      '/assets/Selected Project/sWYCHR.png',
      '/assets/Trusted by team at/Swychr Logo PNG 1.png'
    ],
    metrics: [
      { label: 'Transfer Velocity', value: '< 15s' },
      { label: 'KYC Drop-off Reduction', value: '-38%' },
      { label: 'Active Transactors', value: '45K+' }
    ],
    tagline: 'Frictionless remittance and multi-currency banking architecture across borders.',
    overview: 'Swychr is a high-speed remittance platform built to eliminate the opacity, delays, and exorbitant fees of traditional payment corridors.',
    challenge: 'Cross-border payment flows often suffer from high user abandonment during verification and volatile exchange rate calculation.',
    solution: 'Designed a transparent 3-step routing pipeline with real-time rate lock countdowns and instant biometrics verification.',
    impact: [
      'Engineered a unified design token system used across iOS and Android.',
      'Reduced average onboarding completion time from 4.8 minutes to under 75 seconds.'
    ],
    colorAccent: '#3b82f6',
    hasCaseStudy: false
  },
  {
    id: 'riki-ai',
    title: 'Riki-AI Landing Page',
    client: 'Riki Labs Inc.',
    year: '2025',
    category: 'Websites & SaaS',
    categoryTag: 'AI & SAAS',
    role: 'UI/UX Designer',
    duration: '2 weeks',
    tools: ['Figma', 'AI tools', 'Design Systems'],
    industry: 'Productivity & AI Systems',
    liveUrl: 'https://riki-ai.tech/',
    thumbnail: '/assets/Selected Project/rICKI ai.webp',
    visuals: [
      '/assets/Selected Project/rICKI ai.webp',
      '/assets/Selected Project/rICKI ai.png'
    ],
    metrics: [
      { label: 'Time-to-Insight', value: '4x Faster' },
      { label: 'Automations Run', value: '1.2M+' },
      { label: 'Founder NPS', value: '82' }
    ],
    tagline: 'Translating complex agentic AI orchestration into an intuitive knowledge graph.',
    overview: 'Riki AI connects disparate documentation silos and developer threads into an interactive reasoning graph with verified source citations.',
    challenge: 'Developers need to verify AI reasoning steps without reading walls of unstructured conversational text.',
    solution: 'Designed an inspectable execution flowchart where every intermediate token and API tool call can be audited in real time.',
    impact: [
      'Supported fast client adoption across technical engineering leads.'
    ],
    colorAccent: '#8b5cf6',
    hasCaseStudy: true
  },
  {
    id: 'wagestream redesign',
    title: 'WageStream Onboarding Redesign',
    client: 'WageStream',
    year: '2025',
    category: 'Mobile Apps & Fintech',
    categoryTag: 'FINTECH',
    role: 'Product Designer (UX UI)',
    duration: '2 weeks',
    tools: ['Figma', 'AI', 'Design Systems'],
    industry: 'Fintech & Financial Wellness',
    thumbnail: '/assets/Maquee Images/Frame 43730.webp',
    visuals: ['/assets/Maquee Images/Frame 43730.webp'],
    metrics: [
      { label: 'First-Run Conversion', value: '+34%' },
      { label: 'Trust Rating', value: '96%' },
      { label: 'Drop-off Reduction', value: '-28%' }
    ],
    tagline: "A UX-driven onboarding redesign transforming WageStream's experience from feature-focused to trust-focused.",
    overview: 'Redesigned the onboarding architecture to address worker anxiety around payroll integration and automated earned wage access.',
    challenge: 'Employees felt hesitation linking their direct payroll accounts during initial setup.',
    solution: 'Re-architected the trust narrative with contextual security assurances, employer endorsement badges, and progressive disclosure.',
    impact: [
      'Increased day-one setup completion rate by 34%.'
    ],
    colorAccent: '#10b981',
    hasCaseStudy: true
  },
  {
    id: 'health-in-tech',
    title: 'Health In Tech - Homepage Redesign',
    client: 'Health In Tech',
    year: '2025',
    category: 'Websites & Health',
    categoryTag: 'HEALTH TECH',
    role: 'Product Designer (UX UI)',
    duration: '5 Days',
    tools: ['Figma', 'AI', 'Design Systems'],
    industry: 'Healthcare Technology',
    thumbnail: '/assets/hero images/8.png',
    visuals: ['/assets/hero images/8.png'],
    metrics: [
      { label: 'Lead Inquiries', value: '+51%' },
      { label: 'Bounce Reduction', value: '-26%' }
    ],
    tagline: 'Redesigning the Health In Tech web presence with focus on clarity, trust, and modern clinical UX.',
    overview: 'Transformed complex B2B health insurance and benefit administration software into a clear, approachable enterprise digital experience.',
    challenge: 'The legacy platform was cluttered with technical healthcare jargon and outdated visual paradigms.',
    solution: 'Designed a high-contrast modular hero and interactive benefit comparison tool.',
    impact: [
      'Clarified core value proposition for self-funded health plans.'
    ],
    colorAccent: '#0ea5e9',
    hasCaseStudy: true
  },
  {
    id: 'skin&soul',
    title: 'Skin & Soul Redesign',
    client: 'Skin & Soul',
    year: '2025',
    category: 'Websites & Beauty',
    categoryTag: 'E-COMMERCE',
    role: 'Product Designer',
    duration: '2 Days',
    tools: ['Figma', 'Lottiefile', 'Motion'],
    industry: 'SkinCare & DTC',
    thumbnail: '/assets/Selected Project/SKIN-CARE-GERO.mp4',
    visuals: ['/assets/Selected Project/SKIN-CARE-GERO.mp4'],
    metrics: [
      { label: 'Retention Boost', value: '+41%' },
      { label: 'Product Clicks', value: '2.8x' }
    ],
    tagline: 'Hero section redesign for a skincare brand engineered for higher user retention.',
    overview: 'An interactive beauty platform showcasing cellular skin science through dynamic fluid simulations and ingredient transparency meters.',
    challenge: 'Translating delicate physical cosmetics into an engaging web shopping flow.',
    solution: 'Engineered kinetic motion and tactile ingredient breakdowns directly in the hero fold.',
    impact: [
      'Significantly improved visitor engagement and scroll-through rates.'
    ],
    colorAccent: '#f43f5e',
    hasCaseStudy: true
  },
  {
    id: 'dr portfolio',
    title: 'Dr. Healthcare Portfolio Website',
    client: 'Dr. Sarah Khan',
    year: '2025',
    category: 'Websites & Portfolio',
    categoryTag: 'HEALTHCARE',
    role: 'UX Design & Development',
    duration: '1 Week',
    tools: ['Figma', 'Antigravity', 'Fullstack'],
    industry: 'Healthcare & Clinical Practice',
    liveUrl: 'https://dr-sarah-khan.vercel.app/',
    thumbnail: '/assets/Maquee Images/Desktop.webp',
    visuals: ['/assets/Maquee Images/Desktop.webp'],
    metrics: [
      { label: 'Patient Inquiries', value: '+65%' },
      { label: 'Direct Appointments', value: '3x' }
    ],
    tagline: 'Fullstack clinical portfolio design and engineering built live.',
    overview: 'Crafted a calm, trustworthy digital home for private clinical consultation and specialist research publication.',
    challenge: 'Medical portfolios often feel clinical and cold, creating emotional distance with prospective patients.',
    solution: 'Designed an approachable typographic hierarchy and effortless appointment request workflow.',
    impact: [
      'Deployed live on Vercel with zero performance degradation.'
    ],
    colorAccent: '#14b8a6',
    hasCaseStudy: true
  },
  {
    id: 'vaulta wallet',
    title: 'Vaulta Defi Wallet',
    client: 'Vaulta Finance',
    year: '2025',
    category: 'Mobile Apps & Web3',
    categoryTag: 'WEB3 / FINTECH',
    role: 'Product Designer',
    duration: '2 Days',
    tools: ['Figma', 'Design Systems'],
    industry: 'Decentralized Finance',
    thumbnail: '/assets/hero images/XORIA 1.png',
    visuals: ['/assets/hero images/XORIA 1.png'],
    metrics: [
      { label: 'Transaction Clarity', value: '100%' },
      { label: 'Gas Error Drop', value: '-94%' }
    ],
    tagline: 'Cross-chain decentralized finance wallet interface.',
    overview: 'Bridged complex on-chain liquidity swaps into an intuitive mobile banking aesthetic.',
    challenge: 'DeFi protocols frequently confuse users with gas limits and slippage tolerances.',
    solution: 'Designed visual transaction simulation modals and one-tap approval sheets.',
    impact: [
      'Eliminated user hesitation during cross-chain asset swaps.'
    ],
    colorAccent: '#6366f1',
    hasCaseStudy: true
  },
  {
    id: 'logistiq',
    title: 'Logistiq Saas Dashboard',
    client: 'Logistiq Labs',
    year: '2025',
    category: 'Dashboards & SaaS',
    categoryTag: 'SAAS DASHBOARD',
    role: 'Product Designer',
    duration: '1 Week',
    tools: ['Figma', 'Design Systems', 'Data Viz'],
    industry: 'Logistics & Supply Chain',
    thumbnail: '/assets/hero images/2.png',
    visuals: ['/assets/hero images/2.png'],
    metrics: [
      { label: 'Fleet Latency', value: '< 200ms' },
      { label: 'Triage Speed', value: '3.2x' }
    ],
    tagline: 'AI-powered control dashboard for logistics and fleet dispatch telemetry.',
    overview: 'Architected real-time fleet telematics, predictive routing alerts, and driver dispatch tables for high-velocity supply chain operators.',
    challenge: 'Dispatchers were overwhelmed by dozens of disjointed tracking feeds.',
    solution: 'Synthesized telemetry into a dense, dark-mode command canvas with priority-ranked exception cards.',
    impact: [
      'Standardized component library across desktop dispatch screens.'
    ],
    colorAccent: '#8b5cf6',
    hasCaseStudy: false
  },
  {
    id: 'wayve - app store screenshot',
    title: 'Wayve - App Store Screenshot Redesign',
    client: 'Wayve Inc.',
    year: '2025',
    category: 'Mobile Apps & Lifestyle',
    categoryTag: 'APP STORE',
    role: 'UI/UX Designer',
    duration: '1 Day',
    tools: ['Figma', 'Marketing Design'],
    industry: 'Lifestyle & Mobility',
    liveUrl: 'https://play.google.com/store/apps/details?id=com.wayve&pli=1',
    thumbnail: '/assets/hero images/5.png',
    visuals: ['/assets/hero images/5.png'],
    metrics: [
      { label: 'Listing Conversion', value: '+28%' },
      { label: 'Store Impressions', value: '180K+' }
    ],
    tagline: 'Redesigning Wayve App Store and Google Play screenshots for instant value communication.',
    overview: 'Overhauled store listing presentation to capture buyer interest in the crucial first 3 seconds of search browsing.',
    challenge: 'Users were scanning screenshots without understanding the core app value proposition.',
    solution: 'Designed bold headline hooks paired with photorealistic device framing and high-contrast feature callouts.',
    impact: [
      'Significantly boosted Google Play and App Store tap-through rates.'
    ],
    colorAccent: '#f59e0b',
    hasCaseStudy: true
  },
  {
    id: 'wysahealth',
    title: 'Wysa Mental Health',
    client: 'Wysa Health',
    year: '2025',
    category: 'Mobile Apps & Health',
    categoryTag: 'HEALTH TECH',
    role: 'Product Designer',
    duration: '2 Days',
    tools: ['Figma', 'AI tools'],
    industry: 'Mental Health & AI Wellness',
    thumbnail: '/assets/hero images/8.png',
    visuals: ['/assets/hero images/8.png'],
    metrics: [
      { label: 'Onboarding Retention', value: '+38%' },
      { label: 'Session Start Rate', value: '92%' }
    ],
    tagline: 'Chat onboarding redesign for empathetic AI mental health companion.',
    overview: 'Rethought conversational onboarding to build patient trust, calm anxiety, and establish personalized care pathways.',
    challenge: 'New users felt skeptical interacting with an automated AI conversational agent.',
    solution: 'Created soothing visual pacing, reassuring privacy indicators, and gentle mood-mapping micro-interactions.',
    impact: [
      'Increased day-one conversational session starts.'
    ],
    colorAccent: '#10b981',
    hasCaseStudy: true
  }
];
