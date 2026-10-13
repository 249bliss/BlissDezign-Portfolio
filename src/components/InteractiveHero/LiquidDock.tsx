import React, { useState } from 'react';
import { MobileMenu } from '../Navigation/MobileMenu';
import './LiquidDock.css';

export interface LiquidDockProps {
  activeSection?: 'projects' | 'how-i-work' | 'about-me' | 'contact';
  onNavigateProjects: () => void;
  onNavigateHowIWork: () => void;
  onNavigateAboutMe: () => void;
  onBookCall: () => void;
}

export const LiquidDock: React.FC<LiquidDockProps> = ({
  activeSection = 'projects',
  onNavigateProjects,
  onNavigateHowIWork,
  onNavigateAboutMe,
  onBookCall,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getSectionLabel = () => {
    switch (activeSection) {
      case 'how-i-work':
        return 'How I work';
      case 'about-me':
        return 'About me';
      default:
        return 'Projects';
    }
  };

  return (
    <>
      <div className="liquid-dock-wrapper" role="navigation" aria-label="Bottom Navigation Dock">
        <div className="liquid-dock">
          {/* Monogram Brand Pill */}
          <button
            type="button"
            className="liquid-dock__brand"
            onClick={onNavigateProjects}
            title="Return to Projects Hero"
          >
            <div className="liquid-dock__logo-circle">
              <img
                src="/assets/nav face logo.png"
                alt="Emmanuel Bliss"
                className="liquid-dock__logo-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/favicon.png';
                }}
              />
            </div>
            <span className="liquid-dock__brand-text">BLISS</span>
          </button>

          <div className="liquid-dock__divider" />

          {/* Desktop Links (Hidden on Mobile) */}
          <div className="liquid-dock__nav">
            <button
              type="button"
              className={`liquid-dock__link ${activeSection === 'projects' ? 'is-active' : ''}`}
              onClick={onNavigateProjects}
            >
              Projects
            </button>
            <button
              type="button"
              className={`liquid-dock__link ${activeSection === 'how-i-work' ? 'is-active' : ''}`}
              onClick={onNavigateHowIWork}
            >
              How I work
            </button>
            <button
              type="button"
              className={`liquid-dock__link ${activeSection === 'about-me' ? 'is-active' : ''}`}
              onClick={onNavigateAboutMe}
            >
              About me
            </button>
          </div>

          {/* Desktop Primary CTA: Book a call (Hidden on Mobile) */}
          <button
            type="button"
            className="liquid-dock__cta"
            onClick={onBookCall}
          >
            Book a call
          </button>

          {/* Mobile Active Section Tag (Visible only on mobile) */}
          <div className="liquid-dock__mobile-active-tag">
            <span>{getSectionLabel()}</span>
          </div>

          {/* Mobile Stylish Hamburger Menu Button (Visible only on mobile) */}
          <button
            type="button"
            className={`liquid-dock__hamburger-btn ${isMobileMenuOpen ? 'is-open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="hamburger-lines" aria-hidden="true">
              <span className="hamburger-line line-1" />
              <span className="hamburger-line line-2" />
            </div>
            <span className="hamburger-label">{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Frosted Glass Mobile Navigation Sheet */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeSection={activeSection}
        onNavigateProjects={onNavigateProjects}
        onNavigateHowIWork={onNavigateHowIWork}
        onNavigateAboutMe={onNavigateAboutMe}
        onBookCall={onBookCall}
      />
    </>
  );
};
