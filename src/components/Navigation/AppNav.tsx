import React from 'react';
import type { SpatialMode } from '../SpatialGallery/SpatialScene';
import { ArrowUpRight } from 'lucide-react';
import './AppNav.css';

export type ActivePage = 'home' | 'works' | 'studio' | 'contacts';

interface AppNavProps {
  currentPage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  spatialMode: SpatialMode;
  onModeChange: (mode: SpatialMode) => void;
}

export const AppNav: React.FC<AppNavProps> = ({
  currentPage,
  onNavigate,
  spatialMode,
  onModeChange,
}) => {
  const modes: SpatialMode[] = ['RINGS', 'SPIRAL', 'SPHERE', 'FLOW'];

  // Character roll label component inspired by Studio K95
  const RollingText: React.FC<{ text: string }> = ({ text }) => {
    return (
      <span className="k95-char-roll">
        <span className="k95-char-top">{text}</span>
        <span className="k95-char-bot" aria-hidden="true">{text}</span>
      </span>
    );
  };

  return (
    <header className="k95-nav">
      {/* Brand Logo & Monogram */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('home');
        }}
        className="k95-nav__logo"
      >
        <div className="k95-nav__monogram">
          <span>EB</span>
        </div>
        <span className="k95-nav__logo-title">Emmanuel Bliss</span>
      </a>

      {/* Center Layout Switcher (Active on Home 3D Spatial Page) */}
      <div className="k95-nav__center">
        {currentPage === 'home' && (
          <div className="k95-mode-pill">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={`k95-mode-btn ${spatialMode === m ? 'is-active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links with Dot Indicator & Character Roll */}
      <nav aria-label="Main Navigation">
        <ul className="k95-nav__links">
          <li>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`k95-nav__link ${currentPage === 'home' ? 'is-active' : ''}`}
            >
              <span className="k95-nav__dot"></span>
              <RollingText text="3D SPATIAL" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onNavigate('works')}
              className={`k95-nav__link ${currentPage === 'works' ? 'is-active' : ''}`}
            >
              <span className="k95-nav__dot"></span>
              <RollingText text="ALL WORKS" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onNavigate('studio')}
              className={`k95-nav__link ${currentPage === 'studio' ? 'is-active' : ''}`}
            >
              <span className="k95-nav__dot"></span>
              <RollingText text="STUDIO" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => onNavigate('contacts')}
              className={`k95-nav__link k95-nav__cta`}
            >
              <RollingText text="CONTACT" />
              <ArrowUpRight size={14} />
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};
