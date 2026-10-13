import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight,
  Calendar,
  Mail,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import gsap from 'gsap';
import { useContainerLenis } from '../../hooks/useLenis';
import './AboutMeSection.css';

interface AboutMeSectionProps {
  onClose?: () => void;
  onNavigateHowIWork?: () => void;
}

export const AboutMeSection: React.FC<AboutMeSectionProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Silky smooth momentum scrolling with Lenis
  useContainerLenis(containerRef, true);

  const email = 'bliss@kre8mind.com';
  const phone = '+2348164702370';
  const whatsappUrl = 'https://wa.me/2348164702370';
  const calComUrl = 'https://cal.com/blissdezigns/discovery-call';
  const contraUrl = 'https://contra.com/bliss_studio_3jxtcxob/work';

  const capabilities = [
    {
      num: '01',
      title: 'Product Architecture',
      tag: 'Interaction Mechanics',
      desc: 'End-to-end UX/UI architecture for high-velocity software products, building accessible component systems and intuitive user journeys.',
    },
    {
      num: '02',
      title: 'UX Consulting & Strategy',
      tag: 'Problem Clarity',
      desc: 'Interrogating user friction, eliminating cognitive overload, and turning complex product logic into effortless workflows.',
    },
    {
      num: '03',
      title: 'Design Systems Architecture',
      tag: 'Cohesive Scale',
      desc: 'Comprehensive Figma libraries, token architecture, and structured design-to-production pipelines that keep products consistent.',
    },
    {
      num: '04',
      title: 'Cross-Functional Collaboration',
      tag: 'Unified Alignment',
      desc: 'Collaboration is fundamental when building enduring products. I champion active communication, early design alignment, and seamless synergy across founders, developers, and stakeholders.',
    },
  ];

  const trackRecords = [
    {
      year: '2026',
      client: 'Kre8mind Studio',
      project: 'Founder & Lead Designer',
      role: 'Collaborating with founders, startups, coaches, and agencies to build systems that work.',
      highlight: 'Design Studio',
    },
    {
      year: '2026',
      client: 'Talorify',
      project: 'Founding Designer & Developer',
      role: 'Initiated and built Talorify from the ground up - a resume tailoring and optimization browser extension for job seekers.',
      highlight: 'Product & Chrome Ext',
    },
    {
      year: '2026',
      client: 'Xoria',
      project: 'UX Consultant & Design Systems',
      role: 'Provided strategic UX direction, design systems architecture, and comprehensive redesign of their core web platform and landing page.',
      highlight: 'Web Platform & AI',
    },
    {
      year: '2025 - 2026',
      client: 'Swychr Global',
      project: 'Lead Product Designer',
      role: 'Cross-border fintech ecosystem. Collaborated for 8 months to architect and redesign their core mobile product screens and money corridors.',
      highlight: 'Fintech App',
    },
    {
      year: '2022 - 2025',
      client: 'StarPower Tech',
      project: 'Visual & Brand Designer',
      role: 'Collaborated with a USA-based team to design brand graphics, digital collateral, and visual communication assets.',
      highlight: 'Visual Design',
    },
  ];

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  useEffect(() => {
    // Contra embed script
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

    // GSAP Deceleration Timeline
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

    gsap.set('.about-header', {
      transformPerspective: 1600,
      y: 35,
      z: -250,
      scale: 0.92,
      opacity: 0,
    });

    gsap.set('.about-dossier-card', {
      transformPerspective: 1600,
      y: 40,
      z: -300,
      scale: 0.9,
      opacity: 0,
    });

    tl.to('.about-header', {
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      duration: 0.85,
    }, '-=0.1');

    tl.to('.about-dossier-card', {
      y: 0,
      z: 0,
      scale: 1,
      opacity: 1,
      duration: 0.9,
    }, '-=0.55');

    // Cards entrance
    cardsRef.current.forEach((card, idx) => {
      if (!card) return;
      gsap.set(card, {
        transformPerspective: 1600,
        y: 35,
        z: -200,
        scale: 0.92,
        opacity: 0,
      });

      tl.to(
        card,
        {
          y: 0,
          z: 0,
          scale: 1,
          opacity: 1,
          duration: 0.75,
          onComplete: () => {
            gsap.set(card, { clearProps: 'transform' });
          },
        },
        `-=${idx === 0 ? 0.6 : 0.65}`
      );
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="about-growth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="About Emmanuel Bliss"
    >
      <div className="about-growth-container">
        {/* ── Section Header ── */}
        <header className="about-header">
          <div className="about-eyebrow">
            <span>FOUNDER &amp; PRODUCT DESIGNER // ABOUT ME</span>
          </div>

          <h1 className="about-title">Clarity by design.</h1>

          <p className="about-subtitle">
            Turning complex systems into products people understand, trust, and use - eliminating friction to accelerate business growth.
          </p>
        </header>

        {/* ── Editorial Dossier Card (Portrait + Story Split) ── */}
        <div className="about-dossier-card">
          <div className="about-dossier-grid">
            {/* Left: Portrait Frame & Location Meta */}
            <div className="about-portrait-col">
              <div className="about-portrait-frame">
                <img
                  src="/assets/MY UPDATED PICS.png"
                  alt="Emmanuel Bliss - Product Designer"
                  className="about-portrait-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/Profile12341.png';
                  }}
                />
              </div>

              <div className="about-portrait-meta">
                <div className="about-meta-name">Emmanuel Bliss</div>
                <div className="about-meta-role">Product Designer, UI/UX</div>
                <div className="about-meta-loc">Global Remote</div>
              </div>
            </div>

            {/* Right: Narrative Story & Core Conviction */}
            <div className="about-story-col">
              <h2 className="about-story-heading">
                I&apos;m Emmanuel Bliss, a product designer who cares about how people experience digital products and how those experiences help businesses grow.
              </h2>

              <p className="about-story-p">
                Over the last few years, I have partnered with founders, startups, teams, coaches, and agencies to bring clarity to complex problems and help digital products scale and grow.
              </p>

              <div className="about-quote-callout">
                &ldquo;Design is not how a product is decorated. Design is how the system communicates, builds confidence, and converts friction into effortless flow.&rdquo;
              </div>

              <p className="about-story-p" style={{ marginBottom: 0 }}>
                Beyond individual consulting, I lead <strong>Kre8mind</strong>, a design studio built around the same conviction: shipping products with uncompromising clarity and structural integrity.
              </p>
            </div>
          </div>
        </div>

        {/* ── Reach Out Directly (Official Email & WhatsApp) ── */}
        <div className="about-channels-section">
          <h2 className="about-channels-heading">Reach out directly.</h2>
          <p className="about-channels-sub">
            Direct access for high-priority projects, advisory inquiries, and consultations.
          </p>

          <div className="about-channels-grid">
            {/* 1. Official Email Card */}
            <div className="about-channel-card email-card">
              <div className="about-channel-header">
                <div className="about-channel-icon-wrap">
                  <Mail size={18} />
                </div>
                <div>
                  <span className="about-channel-lbl">OFFICIAL EMAIL</span>
                  <div className="about-channel-value">{email}</div>
                </div>
              </div>

              <div className="about-channel-actions">
                <a
                  href={`mailto:${email}`}
                  className="about-channel-btn primary-channel-btn"
                >
                  <span>Open Mail Client</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="about-channel-btn copy-btn"
                  title="Copy email to clipboard"
                >
                  {copiedEmail ? <Check size={14} className="copied-check" /> : <Copy size={14} />}
                  <span>{copiedEmail ? 'Copied!' : 'Copy Email'}</span>
                </button>
              </div>
            </div>

            {/* 2. Direct WhatsApp Card */}
            <div className="about-channel-card whatsapp-card">
              <div className="about-channel-header">
                <div className="about-channel-icon-wrap">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <span className="about-channel-lbl">DIRECT WHATSAPP</span>
                  <div className="about-channel-value">{phone}</div>
                </div>
              </div>

              <div className="about-channel-actions">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-channel-btn primary-channel-btn"
                >
                  <MessageCircle size={14} />
                  <span>Chat on WhatsApp</span>
                  <ArrowUpRight size={14} />
                </a>
                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="about-channel-btn copy-btn"
                  title="Copy phone to clipboard"
                >
                  {copiedPhone ? <Check size={14} className="copied-check" /> : <Copy size={14} />}
                  <span>{copiedPhone ? 'Copied!' : 'Copy Number'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Kre8mind Studio Card (Featuring Dropped Kre8mind Video) ── */}
        <div className="about-venture-card">
          <div className="about-venture-grid">
            <div className="about-venture-copy">
              <h2 className="about-venture-title">Beyond Individual Craft: Kre8mind</h2>
              <p className="about-venture-p">
                I direct <strong>Kre8mind</strong>, an independent product design studio and venture incubator. We help early-stage to series-A founders rapidly discover product-market fit.
              </p>
              <div className="about-venture-actions">
                <a
                  href="https://kre8mind.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="about-cta-secondary"
                >
                  <span>Explore Kre8mind Studio</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="about-venture-img-frame">
              <video
                src="/assets/kre8mind-video.mp4"
                poster="/assets/New website cover.jpg"
                autoPlay
                loop
                muted
                playsInline
                className="about-venture-cover-video"
              />
            </div>
          </div>
        </div>

        {/* ── Scope of Craft (Neutral 4-Grid with Collaboration) ── */}
        <div className="about-capabilities-wrap">
          <h2 className="about-capabilities-heading">Where I bring the highest leverage.</h2>
          <p className="about-capabilities-sub">
            Structured design craft tailored for high-growth software and ambitious teams.
          </p>

          <div className="about-capabilities-grid">
            {capabilities.map((item, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="about-cap-card"
                style={{ '--stack-idx': idx } as React.CSSProperties}
              >
                <div className="about-cap-inner">
                  <div className="about-cap-top">
                    <span className="about-cap-num">{item.num}</span>
                    <span className="about-cap-tag">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="about-cap-title">{item.title}</h3>
                  <p className="about-cap-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Selected Track Record (Customized Client Journey) ── */}
        <div className="about-records-section">
          <h2 className="about-records-heading">Selected Track Record.</h2>
          <p className="about-records-sub">
            Partnerships spanning design studios, fintech products, browser tools, and visual identity.
          </p>

          <div className="about-records-list">
            {trackRecords.map((rec, rIdx) => (
              <div
                key={rIdx}
                className="about-record-row"
                style={{ '--rec-idx': rIdx } as React.CSSProperties}
              >
                <div className="about-record-time">
                  <span className="about-record-year">{rec.year}</span>
                  <span className="about-record-badge">{rec.highlight}</span>
                </div>
                <div className="about-record-content">
                  <div className="about-record-client">{rec.client}</div>
                  <div className="about-record-project">{rec.project}</div>
                  <div className="about-record-role">{rec.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Destination Partner Badge ── */}
        <div className="about-partner-badge-wrap">
          <div className="about-partner-badge">
            <div className="about-partner-avatar-wrap">
              <img
                src="/assets/nav face logo.png"
                alt="Emmanuel Bliss"
                className="about-partner-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/favicon.png';
                }}
              />
            </div>

            <div className="about-partner-text-group">
              <span className="about-partner-text">Your all-in-one design partner.</span>
              <span className="about-partner-sub">
                Operating across product architecture, UX consulting, and design systems.
              </span>
            </div>
          </div>
        </div>

        {/* ── Strategic CTA Footer Box: Hire Me on Contra (PRIMARY) + Book a call (SECONDARY) ── */}
        <div className="about-growth-footer">
          <div className="about-growth-cta-box">
            <span className="about-growth-cta-lbl">READY TO COLLABORATE?</span>
            <h3 className="about-growth-cta-heading">Let&apos;s build clarity together.</h3>
            <p className="about-growth-cta-p">
              Whether you are preparing for launch, refining user journeys, or scaling your design systems.
            </p>
            <div className="about-growth-cta-actions">
              {/* 1. Official Contra Hire Me Button (PRIMARY: Dark/Black + Official Contra Gradient Sparkle) */}
              <div className="about-contra-widget-box">
                <a
                  href={contraUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contra-hire-me-custom-btn"
                  title="Hire Emmanuel Bliss on Contra"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="contra-sparkle-icon" aria-hidden="true">
                    <path
                      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
                      fill="url(#contra-sparkle-grad)"
                    />
                    <defs>
                      <linearGradient id="contra-sparkle-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F97316" />
                        <stop offset="0.5" stopColor="#FB923C" />
                        <stop offset="0.8" stopColor="#F43F5E" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span>Hire Me on Contra</span>
                </a>

                <div
                  className="contra-hire-me-button"
                  data-analyticsuserid="25cf8d86-6cb3-4a06-9d31-738ec9564477"
                  data-theme="light"
                  data-username="blissdezigns"
                  style={{ display: 'none' }}
                />
              </div>

              {/* 2. Book a call (SECONDARY: Light/White) */}
              <a
                href={calComUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="about-cta-secondary-btn"
              >
                <Calendar size={15} />
                <span>Book a call</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Micro Footer Below CTA Box */}
          <footer className="about-micro-footer">
            <p className="about-micro-copy">
              &copy; 2026 Emmanuel Bliss. All Rights Reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};
