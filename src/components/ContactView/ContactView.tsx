import React, { useState } from 'react';
import { ArrowUpRight, Check, Calendar } from 'lucide-react';
import './ContactView.css';

export const ContactView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const email = 'bliss@kre8mind.com';

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const socials = [
    { name: 'LinkedIn', url: 'https://www.linkedin.com/in/emmanuelbliss/' },
    { name: 'X (Twitter)', url: 'https://x.com/BlissDezigns' },
    { name: 'Behance', url: 'https://www.behance.net/blissstudionuelly' },
    { name: 'Contra', url: 'https://contra.com/bliss_studio_3jxtcxob/work' },
    { name: 'Instagram', url: 'https://www.instagram.com/blissdezigns_' }
  ];

  return (
    <div className="contact-page">
      <div className="contact-page-inner">
        <header className="contact-page-header">
          <span className="contact-eyebrow">TRANSMISSION // INITIATE DIALOGUE</span>
          <div className="contact-status-chip">
            <span className="status-dot-pulse"></span>
            <span>AVAILABLE FOR SELECT COLLABORATIONS • 2026</span>
          </div>
        </header>

        {/* Giant Click-to-Copy / Direct Email */}
        <section className="contact-email-headline">
          <div className="contact-email-label">DIRECT CHANNEL // CLICK TO COPY OR MAILTO</div>
          <a
            href={`mailto:${email}`}
            onClick={handleCopyEmail}
            className="contact-huge-email"
            title="Click to copy email address"
          >
            {email}
          </a>

          {copied && (
            <div className="contact-copy-notice">
              <Check size={16} />
              <span>Email copied to clipboard!</span>
            </div>
          )}
        </section>

        {/* 3-Column Info & Action Matrix */}
        <section className="contact-info-grid">
          <div className="contact-info-col">
            <span className="contact-col-title">01 // DIRECT BOOKING</span>
            <p className="contact-col-text">
              Have an upcoming product launch or need advisory on design systems?
            </p>
            <div style={{ marginTop: '0.75rem' }}>
              <a
                href="https://cal.com/blissdezigns/discovery-call"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Calendar size={16} />
                <span>Book a call</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          <div className="contact-info-col">
            <span className="contact-col-title">02 // STUDIO BASE &amp; TIMEZONE</span>
            <p className="contact-col-text">
              <strong>Emmanuel Bliss</strong><br />
              Founder at Kre8mind Lab<br />
              Global Remote // Operating across GMT, EST, and CET timezones.
            </p>
          </div>

          <div className="contact-info-col">
            <span className="contact-col-title">03 // SOCIAL &amp; ARCHIVE</span>
            <div className="contact-social-links">
              {socials.map((s, idx) => (
                <a
                  key={idx}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-social-a"
                >
                  <span>{s.name}</span>
                  <ArrowUpRight size={12} />
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
