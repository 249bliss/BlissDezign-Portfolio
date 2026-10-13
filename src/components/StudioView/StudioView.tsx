import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './StudioView.css';

interface StudioViewProps {
  onOpenContact: () => void;
}

export const StudioView: React.FC<StudioViewProps> = ({ onOpenContact }) => {
  const [openServiceIdx, setOpenServiceIdx] = useState<number | null>(0);

  const services = [
    {
      num: '01',
      title: 'PRODUCT DESIGN & SYSTEMS ARCHITECTURE',
      desc: 'End-to-end UX/UI architecture for high-velocity software products. Engineering tokenized component libraries, rigorous multi-tenant states, and design-to-code pipelines.',
      tags: ['Token Architecture', 'Component Variants', 'User Journeys', 'Multi-Platform Parity']
    },
    {
      num: '02',
      title: 'FINTECH & MULTI-CURRENCY FLOWS',
      desc: 'High-security transaction funnels, KYC/AML optimization, and frictionless remittance rails that build trust, reduce abandonment, and accelerate settlement velocity.',
      tags: ['Remittance Corridors', 'KYC Onboarding', 'Transaction Ledgers', 'Biometric Verification']
    },
    {
      num: '03',
      title: 'AI INTERACTION & SPATIAL 3D CANVAS',
      desc: 'Designing cognitive interfaces for LLMs, autonomous reasoning trees, generative configurators, and 60fps WebGL/Three.js spatial product demonstrations.',
      tags: ['Explainable AI', 'Contextual Prompting', 'Spatial 3D', 'Three.js Configurator']
    },
    {
      num: '04',
      title: 'KRE8MIND VENTURE DESIGN SPRINTS',
      desc: 'Our private venture studio sprint model for early-stage to series-A founders. Validating core unit economics, building MVP prototypes, and de-risking go-to-market execution in 3 weeks.',
      tags: ['3-Week MVP Sprint', 'Founder Advisory', 'Pitch Prototypes', 'Unit Economics']
    }
  ];

  const records = [
    { year: '2025 - 2026', client: 'Swychr Inc.', project: 'Cross-Border Fintech Ecosystem', role: 'Lead Product Designer' },
    { year: '2025', client: 'Nurakick Studio', project: 'AI 3D Sneaker Configurator', role: 'Senior Interaction Designer' },
    { year: '2025', client: 'Hevy Labs', project: 'Performance Telemetry Platform', role: 'Principal Product Designer' },
    { year: '2025', client: 'Ricki Labs Inc.', project: 'Autonomous Knowledge Graph', role: 'Founding Product Designer' },
    { year: '2024 - 2026', client: 'Kre8mind Lab', project: 'Venture Incubation Studio', role: 'Founder & Design Director' },
    { year: '2024', client: 'Xoria Protocol', project: 'Institutional DeFi Interface', role: 'Lead UX Strategist' }
  ];

  return (
    <div className="studio-view-page">
      <div className="studio-view-container">
        {/* 1. Giant Architectural Headline Section */}
        <section className="studio-hero-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.12em', color: '#71717a', textTransform: 'uppercase' }}>
              EMMANUEL BLISS // STUDIO
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#09090b', textTransform: 'uppercase' }}>
              GLOBAL • REMOTE
            </span>
          </div>

          <h1 className="studio-huge-title">
            Clarity By Design.
          </h1>

          <div className="studio-hero-lead-grid">
            <span className="studio-lead-label">CORE THESIS // 01</span>
            <p className="studio-lead-statement">
              We turn complex ideas into <strong>products people understand, trust, and use</strong> - eliminating unnecessary noise to unlock measurable growth.
            </p>
          </div>
        </section>

        {/* 2. Photographic Dossier & Studio Philosophy */}
        <section className="studio-narrative-split">
          <div className="studio-photo-card">
            <img
              src="/assets/MY UPDATED PICS.png"
              alt="Emmanuel Bliss"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/Profile12341.png';
              }}
            />
            <div className="studio-photo-meta">
              <h2 className="studio-photo-name">Emmanuel Bliss</h2>
              <span className="studio-photo-role">Product Designer &amp; Systems Strategist</span>
            </div>
          </div>

          <div className="studio-story-copy">
            <span className="studio-lead-label">PHILOSOPHY // 02</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#09090b' }}>
              Bridging user intuition, high-craft aesthetics, and engineering velocity.
            </h2>
            <p className="studio-story-p">
              Over the last 6+ years, I’ve worked with founders, tech executives, and product teams across Europe, North America, and Africa. I operate at the intersection of business strategy and interaction mechanics.
            </p>

            <div className="studio-quote-banner">
              &ldquo;Design is not how a product is decorated. Design is how the system communicates, builds confidence, and converts friction into effortless flow.&rdquo;
            </div>

            <p className="studio-story-p">
              Beyond individual consulting, I lead <strong>Kre8mind</strong>, an independent design lab built around the same conviction: shipping products with uncompromising clarity and structural integrity.
            </p>

            <div style={{ marginTop: '1rem' }}>
              <button type="button" onClick={onOpenContact} className="btn-primary">
                <span>Start a Project Dialogue</span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* 3. Expandable Services Ledger */}
        <section className="studio-services-section">
          <span className="studio-lead-label" style={{ display: 'block', marginBottom: '1rem' }}>CAPABILITIES // 03</span>
          <h2 className="studio-section-title">Scope of Craft.</h2>

          <div className="studio-services-table">
            {services.map((srv, idx) => {
              const isOpen = openServiceIdx === idx;
              return (
                <div
                  key={idx}
                  className={`studio-service-row ${isOpen ? 'open' : ''}`}
                  onClick={() => setOpenServiceIdx(isOpen ? null : idx)}
                >
                  <div className="studio-service-header">
                    <span className="service-num">{srv.num}</span>
                    <h3 className="service-name">{srv.title}</h3>
                    <span className="service-toggle-icon">{isOpen ? '×' : '+'}</span>
                  </div>

                  <div className="studio-service-body">
                    <p className="service-desc-text">{srv.desc}</p>
                    <div className="service-tags-row">
                      {srv.tags.map((t, tIdx) => (
                        <span key={tIdx} className="service-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Selected Recognitions & Client Records */}
        <section className="studio-records-section">
          <span className="studio-lead-label" style={{ display: 'block', marginBottom: '1rem' }}>RECORDS // 04</span>
          <h2 className="studio-section-title">Selected Track Record.</h2>

          <table className="studio-records-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Timeline</th>
                <th style={{ width: '25%' }}>Client / Company</th>
                <th style={{ width: '35%' }}>Domain &amp; Deliverables</th>
                <th style={{ width: '25%' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, rIdx) => (
                <tr key={rIdx}>
                  <td className="record-year">{rec.year}</td>
                  <td className="record-project">{rec.client}</td>
                  <td>{rec.project}</td>
                  <td className="record-role">{rec.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};
