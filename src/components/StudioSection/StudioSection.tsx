import React, { useEffect, useRef } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import './StudioSection.css';

interface StudioSectionProps {
  onClose: () => void;
  onOpenContact: () => void;
}

export const StudioSection: React.FC<StudioSectionProps> = ({ onClose, onOpenContact }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div ref={containerRef} className="studio-overlay-section">
      <button onClick={onClose} className="studio-close-floating" aria-label="Return to Spatial Scene">
        <span>Back to 3D View</span>
        <X size={16} />
      </button>

      <div className="studio-inner-container">
        {/* 1. Hero Dossier */}
        <section className="studio-hero-dossier">
          <div className="dossier-portrait-frame">
            <img
              src="/assets/MY UPDATED PICS.png"
              alt="Emmanuel Bliss - Product Designer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/Profile12341.png';
              }}
            />
            <div className="dossier-portrait-meta">
              <div className="dossier-name">Emmanuel Bliss</div>
              <div className="dossier-tagline">Product Designer &amp; Systems Strategist</div>
            </div>
          </div>

          <div className="dossier-statement-col">
            <div className="studio-eyebrow">FIELD RECORD // DESIGN PHILOSOPHY</div>
            <h1 className="studio-main-heading">
              Turning complex systems into products people understand, trust, and use.
            </h1>
            <p className="studio-body-p">
              Hi, I’m Emmanuel. Over the past 6+ years, I’ve partnered with high-growth startups, fintech pioneers, and AI ventures across Europe, North America, and Africa.
            </p>
            <div className="studio-quote-callout">
              &ldquo;Clarity by Design. If a product requires a manual to feel natural, the interaction model is already broken.&rdquo;
            </div>
            <p className="studio-body-p">
              I believe great product design isn’t about decorative flash; it’s about reducing cognitive friction, clarifying unit economics, and engineering scalable design tokens that engineers love implementing.
            </p>
          </div>
        </section>

        {/* 2. Studio & Venture: Kre8mind */}
        <section className="studio-venture-card">
          <div>
            <div className="studio-eyebrow" style={{ marginBottom: '0.5rem' }}>INDEPENDENT VENTURE LAB</div>
            <h2 className="venture-title">Beyond Individual Craft: Kre8mind Studio</h2>
            <p className="venture-text">
              I also direct <strong>Kre8mind</strong>, an independent product design studio and venture incubator. We help early-stage to series-A founders rapidly discover product-market fit through tight 3-week design sprints.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="https://kre8mind.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <span>Explore Kre8mind Studio</span>
                <ArrowUpRight size={16} />
              </a>
              <button onClick={onOpenContact} className="btn-secondary">
                <span>Book a call</span>
              </button>
            </div>
          </div>

          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <img src="/assets/New website cover.jpg" alt="Kre8mind Design Studio" style={{ width: '100%' }} />
          </div>
        </section>

        {/* 3. Scope of Craft & Capabilities */}
        <section style={{ marginBottom: '4rem' }}>
          <div className="studio-eyebrow" style={{ marginBottom: '1rem' }}>DISCIPLINES &amp; COMPETENCIES</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem', color: '#ffffff' }}>
            Where I bring the highest leverage.
          </h2>

          <div className="capabilities-grid">
            <div className="cap-card">
              <div className="cap-num">01 // ARCHITECTURE</div>
              <div className="cap-title">Product &amp; Systems Design</div>
              <p className="cap-desc">
                Scalable token systems, multi-platform component libraries, and end-to-end user journey mapping.
              </p>
            </div>

            <div className="cap-card">
              <div className="cap-num">02 // FINANCIAL SYSTEMS</div>
              <div className="cap-title">Fintech &amp; Multi-Currency UX</div>
              <p className="cap-desc">
                High-security transaction corridors, KYC optimization, and frictionless remittance flows.
              </p>
            </div>

            <div className="cap-card">
              <div className="cap-num">03 // ARTIFICIAL INTELLIGENCE</div>
              <div className="cap-title">AI Workspaces &amp; Spatial 3D</div>
              <p className="cap-desc">
                Explainable reasoning trees, contextual prompts, and WebGL product configurators.
              </p>
            </div>

            <div className="cap-card">
              <div className="cap-num">04 // EXECUTION VELOCITY</div>
              <div className="cap-title">Prototyping &amp; Handoff</div>
              <p className="cap-desc">
                High-fidelity motion specs, React-ready token structures, and zero-loss engineering alignment.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Trusted by Teams */}
        <section style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="studio-eyebrow" style={{ marginBottom: '1.5rem' }}>TRUSTED BY TEAMS &amp; CLIENTS AT</div>
          <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', opacity: 0.75 }}>
            <img src="/assets/Trusted by team at/Swychr Logo PNG 1.png" alt="Swychr" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
            <img src="/assets/Trusted by team at/krea8 x banner new 2.png" alt="Kre8mind" style={{ height: '28px', filter: 'brightness(0) invert(1)' }} />
            <img src="/assets/Trusted by team at/talorify.png" alt="Talorify" style={{ height: '30px', filter: 'brightness(0) invert(1)' }} />
            <img src="/assets/Trusted by team at/xoria.png" alt="Xoria" style={{ height: '32px', filter: 'brightness(0) invert(1)' }} />
          </div>
        </section>
      </div>
    </div>
  );
};
