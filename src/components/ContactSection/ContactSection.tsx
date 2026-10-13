import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowUpRight, Copy, Check, Calendar, Mail } from 'lucide-react';
import gsap from 'gsap';
import './ContactSection.css';

interface ContactSectionProps {
  onClose: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const email = 'bliss@kre8mind.com';

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, []);

  const handleCopyEmail = () => {
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
    <div className="contact-overlay-section" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button onClick={onClose} className="studio-close-floating" aria-label="Return to Spatial Scene">
        <span>Back to 3D View</span>
        <X size={16} />
      </button>

      <div ref={containerRef} className="contact-inner-container">
        <div className="contact-terminal-header">
          <div className="terminal-title-row">
            <span className="terminal-status-light"></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
              TRANSMISSION // INITIATE DIALOGUE
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>STATUS: ACTIVE • 2026</span>
        </div>

        <h1 className="contact-main-heading">Let’s build something clear and impactful.</h1>
        <p className="contact-sub-text">
          Whether you're looking for a founding product designer, a comprehensive design systems overhaul, or a strategic sprint for your startup, let's talk.
        </p>

        <div className="contact-actions-row">
          <a
            href="https://cal.com/blissdezigns/discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: '0.9rem 1.85rem' }}
          >
            <Calendar size={18} />
            <span>Book a call</span>
            <ArrowUpRight size={16} />
          </a>

          <button onClick={handleCopyEmail} className="copy-email-btn">
            {copied ? <Check size={18} style={{ color: '#10b981' }} /> : <Mail size={18} />}
            <span>{copied ? 'Email Copied to Clipboard!' : email}</span>
            {!copied && <Copy size={14} style={{ opacity: 0.6 }} />}
          </button>
        </div>

        <div className="contact-socials-grid">
          {socials.map((s, idx) => (
            <a
              key={idx}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link-pill"
            >
              <span>{s.name}</span>
              <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
