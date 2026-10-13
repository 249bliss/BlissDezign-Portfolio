import React from 'react';
import './TopSocialLinks.css';

// Minimalist X (Twitter) SVG Icon
const XIcon: React.FC<{ size?: number; className?: string }> = ({ size = 13, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Minimalist LinkedIn SVG Icon
const LinkedInIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 0 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.4 9.74v-8.37H5.06v8.37h2.8z" />
  </svg>
);

// Minimalist Contra Sparkle SVG Icon (Monochrome Matching X & LinkedIn)
const ContraIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
    />
  </svg>
);

export const TopSocialLinks: React.FC = () => {
  return (
    <nav className="top-social-wrap" aria-label="Social Profiles & Contra">
      <div className="top-social-capsule">
        <a
          href="https://x.com/BlissDezigns"
          target="_blank"
          rel="noopener noreferrer"
          className="top-social-link"
          aria-label="X (formerly Twitter)"
          title="X (Twitter)"
        >
          <XIcon size={13} className="top-social-icon" />
        </a>

        <div className="top-social-divider" />

        <a
          href="https://www.linkedin.com/in/emmanuelbliss/"
          target="_blank"
          rel="noopener noreferrer"
          className="top-social-link"
          aria-label="LinkedIn Profile"
          title="LinkedIn"
        >
          <LinkedInIcon size={14} className="top-social-icon" />
        </a>

        <div className="top-social-divider" />

        <a
          href="https://contra.com/bliss_studio_3jxtcxob/work"
          target="_blank"
          rel="noopener noreferrer"
          className="top-social-link"
          aria-label="Hire Emmanuel Bliss on Contra"
          title="Hire Me on Contra"
        >
          <ContraIcon size={15} className="top-social-icon top-contra-icon" />
        </a>
      </div>
    </nav>
  );
};
