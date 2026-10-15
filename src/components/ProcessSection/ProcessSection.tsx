import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowUpRight, Calendar, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion';
import gsap from 'gsap';
import { useContainerLenis } from '../../hooks/useLenis';
import { fetchReviewsFromSupabase, SupabaseReview } from '../../services/supabaseClient';
import './ProcessSection.css';

interface ProcessSectionProps {
  onClose?: () => void;
  onOpenContact?: () => void;
}

const METRICS = [
  { value: '17+', label: 'Product Designs', sub: 'Shipped & Validated' },
  { value: '2+', label: 'Years Experience', sub: 'End-to-End Product Design' },
  { value: '6+', label: 'Global Clients', sub: 'Across 4+ Timezones' },
  { value: '48h', label: 'Average Response', sub: 'Fast Async Turnaround' },
];

const FALLBACK_REVIEWS: SupabaseReview[] = [
  {
    id: 'f5ef0e7b-44a4-4f73-9fde-33c900c97788',
    author_name: 'Aaron Munga',
    author_role: 'CEO at Swychr.',
    review_text: 'Emmanuel contributed to improving both our website and mobile app experience at Swychr. He brought thoughtful ideas to the table, identified user experience challenges, and was proactive in proposing solutions that helped move the product forward. He took feedback well and showed noticeable growth in his communication and collaboration throughout our time working together. I appreciate his contributions and would recommend him to teams looking for a dedicated and growth-minded Product Designer.',
    avatar_url: '/assets/Aaron.webp',
    display_order: 1,
  },
  {
    id: 'd2ee70a4-8c3c-495c-b323-2daa9b0a031a',
    author_name: 'はたけやま Hatake',
    author_role: 'Founder of Riki-AI',
    review_text: 'His passion for UI/UX design is truly remarkable. He consistently comes up with creative ideas and practical suggestions, and he has an excellent ability to understand and translate our requirements into effective designs. Working with him is both exciting and rewarding. He delivers high quality results that meet our expectations and requirements every time.',
    avatar_url: '/assets/Hatake.jpg',
    display_order: 2,
  },
  {
    id: '65445165-1757-4f9f-bbdc-09dd3b5ffcee',
    author_name: 'Rafael Ribeiro',
    author_role: 'FOUNDER AT Xoria',
    review_text: "Thank you so much for taking the time to share such thoughtful feedback. I loved your observations... I strongly agree with your points about the onboarding experience, especially the plan selection. I'll try the approach you suggested.",
    avatar_url: '',
    display_order: 3,
  },
  {
    id: 'a81ef3f6-bf48-48a8-afdc-8b8109c06fbc',
    author_name: 'Alexandre Erzadeoglu',
    author_role: 'Founder @ Wayve',
    review_text: "Great experience working with Emmanuel! He's easy to work with, understands requirements quickly, and delivers high-quality results fast. Would definitely recommend him to anyone looking for a reliable and talented designer.",
    avatar_url: '',
    display_order: 4,
  },
  {
    id: 'b118145c-9176-4352-b8f0-92df5aa1f017',
    author_name: 'Boluwatife Ojo',
    author_role: 'Founder at TOC',
    review_text: 'It was a pleasure working with Emmanuel from the discovery call till the end of the project. Helped with creating a website for my career coaching business. And it really looks good. Definitely recommend.',
    avatar_url: '',
    display_order: 5,
  },
  {
    id: '5fe14886-8b7e-4696-a5d4-07c92f3b386a',
    author_name: 'Favour Augustine',
    author_role: 'UI/UX Designer',
    review_text: 'I had a great experience collaborating with Emmanuel Bliss. He is thoughtful in his approach, communicated clearly throughout the project, and brought strong design thinking to the table. What stood out most was his ability to translate ideas into clean, well-structured visuals while staying open to feedback and iteration. I’d confidently recommend him to anyone looking for a reliable, skilled designer and would be happy to collaborate again.',
    avatar_url: '/assets/favour.avif',
    display_order: 6,
  },
  {
    id: 'c3fb6a69-5024-41f4-bca7-07035054b0c6',
    author_name: 'Kre8mind Team',
    author_role: 'Team in Kre8mind',
    review_text: 'Emmanuel has been a great designer from day one. He has been a good leader, leading a multidisciplinary digital product studio and has been a pleasure to work with ever since. His creativity, professionalism, leadership, and attention to detail make him a valuable asset to any team.',
    avatar_url: '/assets/nav face logo.png',
    display_order: 7,
  },
];

const AUTHOR_AVATAR_FALLBACKS: Record<string, string> = {
  'Aaron Munga': '/assets/Aaron.webp',
  'はたけやま Hatake': '/assets/Hatake.jpg',
  'Hatake': '/assets/Hatake.jpg',
  'Favour Augustine': '/assets/favour.avif',
  'Rafael Ribeiro': '/assets/Trusted by team at/xoria.png',
  'Alexandre Erzadeoglu': '/assets/Trusted by team at/Frame 1487627493.png',
  'Boluwatife Ojo': '/assets/Trusted by team at/Tife Ojo Consults.png',
  'Kre8mind Team': '/assets/Trusted by team at/krea8 x banner new 2.png',
};

const getCleanAvatar = (name: string, url?: string) => {
  // Check if there is a known local high-res asset/logo for this client
  const fallback = AUTHOR_AVATAR_FALLBACKS[name] || '';
  if (!url) return fallback;
  
  // If URL points to dead/quota-exceeded Supabase storage, prefer verified local assets
  if (url.includes('tqryfaoihqblcgfnoqgc.supabase.co')) {
    return fallback || url;
  }

  const parts = url
    .split(/\|+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts[0] || fallback;
};

const TestimonialAvatar: React.FC<{ name: string; url?: string }> = ({ name, url }) => {
  const [imgSrc, setImgSrc] = useState(() => getCleanAvatar(name, url));
  const fallback = AUTHOR_AVATAR_FALLBACKS[name] || '';

  const initials =
    name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  const handleError = () => {
    if (fallback && imgSrc !== fallback) {
      setImgSrc(fallback);
    } else {
      setImgSrc('');
    }
  };

  if (!imgSrc) {
    return (
      <div className="brand-testimonial-avatar brand-avatar-fallback" aria-label={name}>
        <span>{initials}</span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={name}
      className="brand-testimonial-avatar"
      onError={handleError}
    />
  );
};


export const ProcessSection: React.FC<ProcessSectionProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const contraContainerRef = useRef<HTMLDivElement>(null);

  // Reviews state & Framer Motion drag navigation
  const [reviews, setReviews] = useState<SupabaseReview[]>(FALLBACK_REVIEWS);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  useEffect(() => {
    let isMounted = true;
    fetchReviewsFromSupabase().then((data) => {
      if (isMounted && data && data.length > 0) {
        setReviews(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const maxIndex = isMobile ? Math.max(0, reviews.length - 1) : Math.max(0, reviews.length - 2);

  const calculateBounds = useCallback(() => {
    if (viewportRef.current && trackRef.current) {
      const vWidth = viewportRef.current.clientWidth;
      const tWidth = trackRef.current.scrollWidth;
      const maxScroll = Math.max(0, tWidth - vWidth);
      setDragConstraints({ left: -maxScroll, right: 0 });
    }
  }, []);

  useEffect(() => {
    calculateBounds();
    const handleResize = () => calculateBounds();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateBounds, reviews]);

  const getStep = useCallback(() => {
    if (!trackRef.current || !trackRef.current.children[0]) return 360;
    const firstCard = trackRef.current.children[0] as HTMLElement;
    return firstCard.offsetWidth + (isMobile ? 16 : 20);
  }, [isMobile]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(maxIndex, index));
      setActiveReviewIndex(clamped);
      const step = getStep();
      const targetX = -Math.min(Math.abs(dragConstraints.left), clamped * step);
      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.8,
      });
    },
    [maxIndex, getStep, dragConstraints.left, x]
  );

  const handlePrev = () => {
    scrollToIndex(activeReviewIndex - 1);
  };

  const handleNext = () => {
    scrollToIndex(activeReviewIndex + 1);
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
    const currentX = x.get();
    const step = getStep();
    const nearestIndex = Math.round(Math.abs(currentX) / step);
    const clamped = Math.max(0, Math.min(maxIndex, nearestIndex));
    setActiveReviewIndex(clamped);
  };

  // Silky smooth momentum scrolling with Lenis
  useContainerLenis(containerRef, true);

  const clientLogos = [
    { name: 'Xoria', src: '/assets/Trusted by team at/xoria.png' },
    { name: 'Kre8mind', src: '/assets/Trusted by team at/krea8 x banner new 2.png' },
    { name: 'Swychr', src: '/assets/Trusted by team at/Swychr Logo PNG 1.png' },
    { name: 'Tife Ojo Consults', src: '/assets/Trusted by team at/Tife Ojo Consults.png' },
    { name: 'Tellorify', src: '/assets/Trusted by team at/talorify.png' },
    { name: 'Product', src: '/assets/Trusted by team at/Product Logo.png' },
  ];

  const pillars = [
    {
      num: '01',
      title: 'Clarity before execution',
      tag: 'Strategy First',
      desc: 'Before I start designing, I want to understand what’s not working, why it matters, and what we actually need to solve. That way, we’re not just designing screens; we’re solving the right problem.',
      sphereStart: { x: 220, y: 150, z: -460, rx: 35, ry: -35, rz: -10 },
    },
    {
      num: '02',
      title: 'User-focused product design',
      tag: 'Heuristics & Ease',
      desc: 'I design around what people need to do, not just what a screen should look like. Every step should feel clear, so users can move through a product without second-guessing themselves.',
      sphereStart: { x: -220, y: 150, z: -460, rx: 35, ry: 35, rz: 10 },
    },
    {
      num: '03',
      title: 'Scalable design systems',
      tag: 'Design Systems',
      desc: 'I build design systems that keep products consistent as they grow. From reusable components to clear Figma structures, I make it easier for teams to design, build, and improve without starting over.',
      sphereStart: { x: 220, y: -150, z: -460, rx: -35, ry: -35, rz: 10 },
    },
    {
      num: '04',
      title: 'Prototyping & validation',
      tag: 'Rapid Validation',
      desc: 'I’d rather test an idea before a team spends time building it. Prototypes help us see where people get stuck, what makes sense to them, and what needs to change before we move forward.',
      sphereStart: { x: -220, y: -150, z: -460, rx: -35, ry: 35, rz: -10 },
    },
  ];

  useEffect(() => {
    // Ensure Contra Embed SDK initializes
    const existingScript = document.querySelector('script[src="https://contra.com/static/embed/sdk.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://contra.com/static/embed/sdk.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);
    } else {
      // @ts-ignore
      if (window.ContraEmbed?.init) {
        // @ts-ignore
        window.ContraEmbed.init();
      }
    }

    // ── 3D SPHERICAL UNFOLD & DECELERATION TIMELINE ──
    const tl = gsap.timeline({
      defaults: {
        ease: 'cubic-bezier(0.12, 1, 0.2, 1)',
      },
    });

    if (containerRef.current) {
      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      );
    }

    gsap.set('.brand-trusted-strip', {
      transformPerspective: 1600,
      y: 120,
      z: -500,
      scale: 0.25,
      rotationX: 40,
      opacity: 0,
    });
    gsap.set('.brand-growth-header', {
      transformPerspective: 1600,
      z: -420,
      scale: 0.25,
      opacity: 0,
    });

    tl.to(
      ['.brand-trusted-strip', '.brand-growth-header'],
      {
        y: 0,
        z: 0,
        scale: 1,
        rotationX: 0,
        opacity: 1,
        duration: 0.95,
        stagger: 0.1,
      },
      '-=0.15'
    );

    // 4 Value Pillars originate inside 3D Sphere Cluster
    cardsRef.current.forEach((card, idx) => {
      if (!card) return;
      const start = pillars[idx].sphereStart;

      gsap.set(card, {
        transformPerspective: 1600,
        x: start.x,
        y: start.y,
        z: start.z,
        rotationX: start.rx,
        rotationY: start.ry,
        rotationZ: start.rz,
        scale: 0.2,
        opacity: 0,
      });

      tl.to(
        card,
        {
          x: 0,
          y: 0,
          z: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          opacity: 1,
          duration: 1.05,
          onComplete: () => {
            gsap.set(card, { clearProps: 'transform' });
          },
        },
        `-=${idx === 0 ? 0.75 : 0.88}`
      );
    });

    // Destination Partner Badge & CTA Box blossom into place
    gsap.set(['.brand-partner-badge-wrap', '.brand-growth-footer'], {
      transformPerspective: 1600,
      y: 40,
      z: -300,
      scale: 0.8,
      opacity: 0,
    });

    tl.to(
      ['.brand-partner-badge-wrap', '.brand-growth-footer'],
      {
        y: 0,
        z: 0,
        scale: 1,
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
      },
      '-=0.45'
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="brand-growth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="How I help your brand grow"
    >
      <div className="brand-growth-container">
        {/* Trusted By Client Row */}
        <div className="brand-trusted-strip">
          <span className="brand-trusted-label">TRUSTED BY FOUNDERS &amp; PRODUCT TEAMS AT</span>
          <div className="brand-trusted-logos">
            {clientLogos.map((client, idx) => (
              <div key={idx} className="brand-client-pill" title={client.name}>
                <img
                  src={client.src}
                  alt={client.name}
                  className="brand-client-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <header className="brand-growth-header">
          <div className="brand-growth-eyebrow">
            <span>CAPABILITIES &amp; VALUE PILLARS</span>
          </div>

          <h1 className="brand-growth-title">How I help your brand grow.</h1>

          <p className="brand-growth-subtitle">
            Eliminating noise to turn complex ideas into products people understand, trust, and use.
          </p>
        </header>

        {/* 4 Value Pillar Cards: Neutral Styling */}
        <div className="brand-growth-grid-wrap">
          <div className="brand-growth-grid">
            {pillars.map((item, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="brand-pillar-card"
                style={{ '--stack-idx': idx } as React.CSSProperties}
              >
                <div className="brand-pillar-inner">
                  <div className="brand-pillar-top">
                    <span className="brand-pillar-num">{item.num}</span>
                    <span className="brand-pillar-tag">
                      {item.tag}
                    </span>
                  </div>

                  <h2 className="brand-pillar-title">{item.title}</h2>
                  <p className="brand-pillar-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Curving SVG Journey Connector */}
          <div className="brand-journey-connector" aria-hidden="true">
            <svg viewBox="0 0 800 60" fill="none" className="brand-connector-svg">
              <path
                d="M 120 10 Q 400 55 680 10"
                stroke="rgba(0, 0, 0, 0.12)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
            </svg>
          </div>
        </div>

        {/* ── CLIENT TESTIMONIALS & IMPACT SHOWCASE ── */}
        <section className="brand-testimonials-section" aria-label="Client Testimonials and Impact">
          <div className="brand-testimonials-header">
            <div className="brand-testimonials-eyebrow">
              <span>CLIENT VOICES // PROVEN IMPACT</span>
            </div>
            <h2 className="brand-testimonials-title">Built with teams across industries &amp; timezones.</h2>
            <p className="brand-testimonials-subtitle">
              Direct notes from founders, CEOs, and product leads on collaborating with Emmanuel Bliss.
            </p>
          </div>

          {/* ── IMPACT METRICS BAR (Directly below the title) ── */}
          <div className="brand-metrics-container">
            <div className="brand-metrics-grid">
              {METRICS.map((metric, idx) => (
                <div key={idx} className="brand-metric-card">
                  <span className="brand-metric-value">{metric.value}</span>
                  <span className="brand-metric-label">{metric.label}</span>
                  <span className="brand-metric-sub">{metric.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls Bar (Counter & Arrows) */}
          <div className="brand-testimonials-controls-bar">
            <span className="brand-testimonials-counter">
              {String(activeReviewIndex + 1).padStart(2, '0')} / {String(reviews.length).padStart(2, '0')}
            </span>
            <div className="brand-testimonials-nav-btns">
              <button
                type="button"
                className="brand-nav-btn"
                onClick={handlePrev}
                disabled={activeReviewIndex === 0}
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="brand-nav-btn"
                onClick={handleNext}
                disabled={activeReviewIndex >= maxIndex}
                aria-label="Next testimonial"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Framer Motion Draggable Carousel */}
          <div className="brand-testimonials-slider-viewport" ref={viewportRef}>
            <motion.div
              ref={trackRef}
              className="brand-testimonials-slider-track"
              drag="x"
              dragConstraints={dragConstraints}
              dragElastic={0.12}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 35, power: 0.18 }}
              style={{ x }}
              onDragEnd={handleDragEnd}
            >
              {reviews.map((rev) => (
                <div key={rev.id} className="brand-testimonial-card">
                  <div className="brand-testimonial-top">
                    <div className="brand-quote-badge">
                      <Quote size={17} className="brand-quote-icon" />
                    </div>
                    <span className="brand-review-tag">VERIFIED PARTNER</span>
                  </div>

                  <p className="brand-testimonial-text">
                    &ldquo;{rev.review_text}&rdquo;
                  </p>

                  <div className="brand-testimonial-author">
                    <TestimonialAvatar name={rev.author_name} url={rev.avatar_url} />
                    <div className="brand-testimonial-meta">
                      <span className="brand-author-name">{rev.author_name}</span>
                      <span className="brand-author-role">{rev.author_role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Destination Partner Badge */}
        <div className="brand-partner-badge-wrap">
          <div className="brand-partner-badge">
            <div className="brand-partner-avatar-wrap">
              <img
                src="/assets/nav face logo.png"
                alt="Emmanuel Bliss"
                className="brand-partner-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/favicon.png';
                }}
              />
            </div>

            <div className="brand-partner-text-group">
              <span className="brand-partner-text">Your all-in-one design partner.</span>
              <span className="brand-partner-sub">
                Operating across product architecture, UX consulting, and design systems.
              </span>
            </div>
          </div>
        </div>

        {/* Strategic CTA Footer Box: Hire Me on Contra (PRIMARY) + Book a call (SECONDARY) */}
        <div className="brand-growth-footer">
          <div className="brand-growth-cta-box">
            <span className="brand-growth-cta-lbl">READY TO ELEVATE YOUR PRODUCT?</span>
            <h3 className="brand-growth-cta-heading">Let&apos;s build clarity together.</h3>
            <p className="brand-growth-cta-p">
              Whether you are preparing for launch, expanding design tokens, or de-risking a multi-step user flow.
            </p>
            <div className="brand-growth-cta-actions">
              {/* 1. Official Contra Hire Me Button (PRIMARY: Dark/Black with official Contra sparkle) */}
              <div ref={contraContainerRef} className="brand-contra-widget-box">
                <a
                  href="https://contra.com/bliss_studio_3jxtcxob/work"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contra-hire-me-custom-btn"
                  title="Hire Emmanuel Bliss on Contra"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="contra-sparkle-icon" aria-hidden="true">
                    <path
                      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
                      fill="url(#brand-contra-sparkle-grad)"
                    />
                    <defs>
                      <linearGradient id="brand-contra-sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F97316" />
                        <stop offset="0.5" stopColor="#FB923C" />
                        <stop offset="0.8" stopColor="#F43F5E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span>Hire Me on Contra</span>
                </a>

                {/* Underlying Contra Embed SDK target */}
                <div
                  className="contra-hire-me-button"
                  data-analyticsuserid="25cf8d86-6cb3-4a06-9d31-738ec9564477"
                  data-theme="light"
                  data-username="blissdezigns"
                  style={{ display: 'none' }}
                />
              </div>

              {/* 2. Book a Call (SECONDARY: Light/White with crisp border) */}
              <a
                href="https://cal.com/blissdezigns/discovery-call"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-cta-secondary-btn"
              >
                <Calendar size={15} />
                <span>Book a call</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Micro Footer Below CTA Box */}
          <footer className="brand-micro-footer">
            <p className="brand-micro-copy">
              &copy; 2026 Emmanuel Bliss. All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
