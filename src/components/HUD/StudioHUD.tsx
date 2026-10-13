import React from 'react';
import type { SpatialMode } from '../SpatialGallery/SpatialScene';
import type { ProjectData } from '../../data/projectsData';
import { ArrowUpRight, Sparkles, Compass } from 'lucide-react';
import './StudioHUD.css';

interface StudioHUDProps {
  mode: SpatialMode;
  onModeChange: (mode: SpatialMode) => void;
  hoveredProject: ProjectData | null;
  hoveredIndex: number;
  totalProjects: number;
  onOpenSection: (section: 'spatial' | 'studio' | 'process' | 'contact') => void;
  activeSection: string;
}

export const StudioHUD: React.FC<StudioHUDProps> = ({
  mode,
  onModeChange,
  hoveredProject,
  hoveredIndex,
  totalProjects,
  onOpenSection,
  activeSection,
}) => {
  const modes: SpatialMode[] = ['RINGS', 'SPIRAL', 'SPHERE', 'FLOW'];

  return (
    <div className="studio-hud-wrapper">
      {/* Top Bar */}
      <header className="hud-header">
        <a href="#" onClick={(e) => { e.preventDefault(); onOpenSection('spatial'); }} className="hud-brand">
          <div className="hud-monogram-box">
            <span>EB</span>
          </div>
          <div className="hud-brand-text">
            <span className="hud-brand-name">Emmanuel Bliss</span>
            <span className="hud-brand-sub">Product Designer // Studio</span>
          </div>
        </a>

        {/* Spatial Mode Selector */}
        {activeSection === 'spatial' && (
          <nav className="hud-mode-switcher" aria-label="Spatial layout arrangement">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`hud-mode-btn ${mode === m ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </nav>
        )}

        {/* Navigation Tabs */}
        <div className="hud-nav-group">
          <button
            onClick={() => onOpenSection('spatial')}
            className={`hud-nav-link ${activeSection === 'spatial' ? 'active' : ''}`}
          >
            Spatial Gallery
          </button>
          <button
            onClick={() => onOpenSection('studio')}
            className={`hud-nav-link ${activeSection === 'studio' ? 'active' : ''}`}
          >
            Studio &amp; Story
          </button>
          <button
            onClick={() => onOpenSection('process')}
            className={`hud-nav-link ${activeSection === 'process' ? 'active' : ''}`}
          >
            Design Process
          </button>
          <button
            onClick={() => onOpenSection('contact')}
            className="hud-contact-cta"
          >
            <span>Let's Talk</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </header>

      {/* Bottom Bar */}
      <footer className="hud-footer">
        <div className="hud-meta-left">
          <span><strong>CLARITY BY DESIGN</strong> // PRODUCT LAB</span>
          <span>SAAS • FINTECH • AI SYSTEMS</span>
        </div>

        {/* Live Hover / Active Project Ticker */}
        {activeSection === 'spatial' && (
          <div className="hud-project-ticker">
            {hoveredProject ? (
              <>
                <div className="ticker-counter">
                  {String(hoveredIndex + 1).padStart(2, '0')} / {String(totalProjects).padStart(2, '0')} • {hoveredProject.categoryTag}
                </div>
                <div className="ticker-title">{hoveredProject.title}</div>
                <div className="ticker-prompt">
                  <Sparkles size={12} style={{ color: hoveredProject.colorAccent }} />
                  <span>Click to open full case study</span>
                </div>
              </>
            ) : (
              <>
                <div className="ticker-counter">
                  {totalProjects} SELECTED ARCHIVES // K95 SPATIAL ENGINE
                </div>
                <div className="ticker-title" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Interactive 3D Universe
                </div>
                <div className="ticker-prompt">
                  <Compass size={12} />
                  <span>Drag or scroll to orbit • Click any project to inspect</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="hud-meta-right">
          <span className="status-dot-pulse"></span>
          <span>OPEN FOR COLLABORATIONS • 2026</span>
        </div>
      </footer>
    </div>
  );
};
