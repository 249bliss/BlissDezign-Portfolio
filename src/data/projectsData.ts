// ProjectData interface — used as the adapted shape for case study modals and 3D scenes
// Sourced directly from Supabase Admin board
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
    id: 'avenor-landingpage',
    title: 'AVENOR - Real Estate Landing Page',
    client: 'Avenor Real Estate',
    year: '2025 - 2026',
    category: 'Websites & Real Estate',
    categoryTag: 'REAL ESTATE • LANDING PAGE',
    role: 'Lead Product Designer',
    duration: '2 Weeks',
    tools: ['Figma', 'Jitter', 'Motion'],
    industry: 'Real Estate & Architecture',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791915317/projects/xqhh6vxyqqrpeqy5pc06.mp4',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/video/upload/v1791915317/projects/xqhh6vxyqqrpeqy5pc06.mp4',
    ],
    metrics: [
      { label: 'Inquiries', value: '+42%' },
      { label: 'Dwell Time', value: '3.4m' },
    ],
    tagline: 'A luxury real estate landing page designed in Figma and prototyped in Jitter.',
    overview: 'High-end property showcase platform engineered to captivate luxury real estate buyers with architectural elegance and cinematic motion.',
    challenge: 'High-net-worth buyers needed seamless visual storytelling without compromising performance.',
    solution: 'Designed fluid micro-interactions, editorial typography, and high-impact full-bleed property visual galleries.',
    impact: ['Drove significant increase in qualified private viewing inquiries.'],
    colorAccent: '#0ea5e9',
    hasCaseStudy: true,
  },
  {
    id: 'wagestream-redesign',
    title: 'WageStream Onboarding Redesign',
    client: 'WageStream',
    year: '2025 - 2026',
    category: 'Mobile Apps & Fintech',
    categoryTag: 'FINTECH • ONBOARDING',
    role: 'Product Designer (UX UI)',
    duration: '2 Weeks',
    tools: ['Figma', 'AI', 'Design Systems'],
    industry: 'Financial Wellness & Fintech',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791918523/projects/giljpuzculsd1iqqrhaf.webp',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/image/upload/v1791918523/projects/giljpuzculsd1iqqrhaf.webp',
    ],
    metrics: [
      { label: 'Completion', value: '+34%' },
      { label: 'Drop-off', value: '-28%' },
    ],
    tagline: "A UX-driven onboarding redesign that transforms WageStream's first-time experience from feature-focused to trust-focused.",
    overview: 'Complete UX restructuring of the employee financial wellness platform, eliminating friction in payroll streaming and account setup.',
    challenge: 'Users felt anxious during biometric and payroll authorization stages.',
    solution: 'Introduced progressive disclosure, calm transparent messaging, and instant clarity on earned wage access.',
    impact: ['Greatly increased day-one active payroll connections and financial health tracking.'],
    colorAccent: '#10b981',
    hasCaseStudy: true,
  },
  {
    id: 'wayve---app-store-screenshot',
    title: 'Wayve AppScreenshot Redesign',
    client: 'Wayve Mobility',
    year: '2025',
    category: 'App Store & Visual Strategy',
    categoryTag: 'APP STORE • PRODUCT DESIGN',
    role: 'Visual & UI/UX Designer',
    duration: '3 Days',
    tools: ['Figma', '3D Device Renders'],
    industry: 'Mobility & Technology',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791925442/projects/qhgj0v0csrykldtsodgi.mp4',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/video/upload/v1791925442/projects/qhgj0v0csrykldtsodgi.mp4',
    ],
    metrics: [
      { label: 'Conversion', value: '+28%' },
      { label: 'Impressions', value: '180K+' },
    ],
    tagline: "I redesigned Wayve’s App Store and Google Play screenshots to communicate the product’s value within the few seconds",
    overview: 'High-conversion screenshot sequence engineered to hook scanning mobile app store users in the crucial first 3 seconds.',
    challenge: 'Low store listing tap-through rate due to cluttered interface screenshots.',
    solution: 'Crafted bold value propositions, stylized device perspectives, and sharp visual hierarchy.',
    impact: ['Proven increase in App Store and Google Play install conversions.'],
    colorAccent: '#f59e0b',
    hasCaseStudy: true,
  },
  {
    id: 'wysa-health-chat-redesign',
    title: 'Wysa - Mental Health Chat Redesign',
    client: 'Wysa Health',
    year: '2025',
    category: 'Healthcare & Conversational AI',
    categoryTag: 'HEALTHCARE • CONVERSATIONAL UX',
    role: 'Lead UX Designer',
    duration: '1 Week',
    tools: ['Figma', 'Prototyping', 'User Research'],
    industry: 'Digital Health & AI Wellness',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791925995/projects/og2yexpzoedtkrtbxgro.jpg',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/image/upload/v1791925995/projects/og2yexpzoedtkrtbxgro.jpg',
    ],
    metrics: [
      { label: 'Session Depth', value: '+45%' },
      { label: 'Comfort Score', value: '96%' },
    ],
    tagline: "A redesign of Wysa's chat experience, reducing visual clutter and creating a calmer, more supportive conversation interface.",
    overview: 'Empathetic conversational interface designed specifically for emotionally vulnerable users seeking psychological support.',
    challenge: 'Existing chat was dense with UI buttons that overwhelmed stressed users.',
    solution: 'Designed breathing room, soft micro-interactions, and supportive response pacing.',
    impact: ['Helped users complete check-in sessions with significantly lower anxiety triggers.'],
    colorAccent: '#8b5cf6',
    hasCaseStudy: true,
  },
  {
    id: 'xoria-webredesign',
    title: 'Website Redesign for Xoria',
    client: 'Xoria Labs',
    year: '2025',
    category: 'SaaS & AI Platforms',
    categoryTag: 'SAAS • AI PRODUCT DESIGN',
    role: 'Product Designer (UX UI)',
    duration: '2 Weeks',
    tools: ['Figma', 'Design Systems', 'Next.js'],
    industry: 'Artificial Intelligence & SaaS',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/image/upload/v1791926472/projects/fc0imy7uxe4qsqzzdlqn.png',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/image/upload/v1791926472/projects/fc0imy7uxe4qsqzzdlqn.png',
    ],
    metrics: [
      { label: 'Sign-ups', value: '+54%' },
      { label: 'Demo Requests', value: '2.8x' },
    ],
    tagline: "UX Audit & Redesigned Xoria's website to improve product presentation and communication.",
    overview: 'Enterprise marketing and developer product experience demonstrating complex AI model capabilities with intuitive clarity.',
    challenge: 'Explaining cutting-edge generative workflows without overwhelming non-technical stakeholders.',
    solution: 'Created interactive playground previews and interactive pricing calculators.',
    impact: ['Drove significant growth in enterprise tier demo schedules.'],
    colorAccent: '#6366f1',
    hasCaseStudy: true,
  },
  {
    id: 'hit-webredesign',
    title: 'Health In Tech - Website Redesign',
    client: 'Health In Tech',
    year: '2025',
    category: 'Healthcare & Enterprise Web',
    categoryTag: 'HEALTHTECH • ENTERPRISE UX',
    role: 'Senior Product Designer',
    duration: '10 Days',
    tools: ['Figma', 'Component Systems'],
    industry: 'Health Insurance Technology',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791927409/projects/gjpii1z9acxyxevgyyzn.mp4',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/video/upload/v1791927409/projects/gjpii1z9acxyxevgyyzn.mp4',
    ],
    metrics: [
      { label: 'Enterprise Inquiries', value: '+48%' },
      { label: 'Page Speed', value: '98/100' },
    ],
    tagline: "Concept redesign of Health In Tech's website, transforming a feature-heavy experience into a trust-driven digital presence",
    overview: 'Modernized enterprise health benefits portal communicating regulatory security and automated underwriting in seconds.',
    challenge: 'Complex actuarial tables and jargon confused decision-makers.',
    solution: 'Restructured information architecture around clear value pillars and live quote simulations.',
    impact: ['Enhanced brand authority and streamlined broker onboarding.'],
    colorAccent: '#0284c7',
    hasCaseStudy: true,
  },
  {
    id: '1p-algo',
    title: '1P Algorithms',
    client: '1P Algorithms Finance',
    year: '2025 - 2026',
    category: 'Fintech & Algorithmic Trading',
    categoryTag: 'FINTECH • QUANTITATIVE UX',
    role: 'Lead UI/UX Designer',
    duration: '2 Weeks',
    tools: ['Figma', 'Data Visualization', '3D Graphics'],
    industry: 'Algorithmic Trading & Web3',
    thumbnail: 'https://res.cloudinary.com/adfxi8js/video/upload/v1791927912/projects/ypw8dioexjbk0leojqgx.mp4',
    visuals: [
      'https://res.cloudinary.com/adfxi8js/video/upload/v1791927912/projects/ypw8dioexjbk0leojqgx.mp4',
    ],
    metrics: [
      { label: 'AUM Growth', value: '+$14M' },
      { label: 'User Trust Index', value: '98%' },
    ],
    tagline: 'Hero section redesign for an AI trading platform, shifting from a text-heavy page to a product-led experience that builds trust instantly.',
    overview: 'High-frequency algorithmic trading intelligence platform designed for institutional quant traders and funds.',
    challenge: 'Communicating model telemetry and risk parameters with zero perceptual latency.',
    solution: 'Engineered high-contrast telemetry charts, dark-mode terminal aesthetics, and dynamic model confidence ribbons.',
    impact: ['Secured institutional liquidity provider partnerships.'],
    colorAccent: '#10b981',
    hasCaseStudy: true,
  },
];
