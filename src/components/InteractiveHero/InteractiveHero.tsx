import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { LiquidDock } from './LiquidDock';
import type { ActivePage } from '../Navigation/AppNav';
import './InteractiveHero.css';

interface InteractiveHeroProps {
  currentPage?: ActivePage;
  onNavigateWorks: () => void;
  onNavigateStudio: () => void;
  onNavigateContact: () => void;
  onBookCall: () => void;
  onSelectProject?: (projectIndex: number) => void;
  onHoverProject?: (projectIndex: number | null) => void;
}

export interface OrbitCardItem {
  id: string;
  projectIndex: number;
  title: string;
  image: string;
  client: string;
  year: string;
  tagline: string;
  overview: string;
}

export const ORBIT_CARDS: OrbitCardItem[] = [
  {
    id: 'opentag',
    projectIndex: 0,
    title: 'OpenTag - Autonomous Workflow AI',
    client: 'OpenTag Inc.',
    year: '2025',
    tagline: 'Turn conversations into finished work automatically.',
    overview: 'An integrated workspace integration that automates review and resolution cycles directly within team communication rails.',
    image: '/assets/hero-images/2.png',
  },
  {
    id: 'analytics',
    projectIndex: 1,
    title: 'Collaborative Agentic Workspace',
    client: 'Nurakick Studio',
    year: '2025 - 2026',
    tagline: 'One workspace where projects, reviews, and design systems converge.',
    overview: 'Designing multi-tenant dashboards, telemetry data visualization, and tokenized design systems.',
    image: '/assets/hero-images/5.png',
  },
  {
    id: 'avenor',
    projectIndex: 2,
    title: 'Avenor - Exceptional Architectural Living',
    client: 'Avenor Group',
    year: '2025',
    tagline: 'High-end showcase for luxury architectural properties and residential ventures.',
    overview: 'Interactive web experience featuring immersive spatial tours and conversion funnels.',
    image: '/assets/hero-images/6.png',
  },
  {
    id: 'xoria',
    projectIndex: 3,
    title: 'Xoria Protocol - Institutional Liquidity Interface',
    client: 'Xoria Protocol',
    year: '2024 - 2026',
    tagline: 'Cross-chain liquidity interfaces with sub-second execution.',
    overview: 'Designed high-security cryptographic transaction rails, real-time depth charts, and automated staking flows.',
    image: '/assets/hero-images/XORIA 1.png',
  },
  {
    id: 'mos-health',
    projectIndex: 4,
    title: 'Mōs Health - Telemetry & Bio-Care Platform',
    client: 'Hevy Labs',
    year: '2025',
    tagline: 'Personalized telemetry and health insights designed into your day.',
    overview: 'Mobile app architecture featuring longitudinal health scorecards, wearable sensor sync, and frictionless scheduling.',
    image: '/assets/hero-images/8.png',
  },
  {
    id: 'swychr',
    projectIndex: 0,
    title: 'Swychr - Multi-Currency Remittance Flow',
    client: 'Swychr Inc.',
    year: '2025 - 2026',
    tagline: 'Cross-border transaction funnels and multi-currency banking architecture.',
    overview: 'High-speed remittance platform built to eliminate opacity and delays in payment corridors.',
    image: '/assets/Selected Project/sWYCHR.webp',
  },
];

export const InteractiveHero: React.FC<InteractiveHeroProps> = ({
  currentPage = 'home',
  onNavigateWorks,
  onNavigateStudio,
  onNavigateContact: _onNavigateContact,
  onBookCall,
  onSelectProject,
  onHoverProject,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [zoomedCardIndex, setZoomedCardIndex] = useState<number | null>(null);

  const pivotRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const targetRot = useRef({ x: -4, y: 0 });
  const currentRot = useRef({ x: -4, y: 0 });

  // 3D Orbit Transform Calculation
  const getCardTransform = (index: number, total: number, isHovered: boolean) => {
    const angle = (index / total) * 360;
    const rad = (angle * Math.PI) / 180;
    const radius = 690;

    const tx = Math.sin(rad) * radius;
    const tz = Math.cos(rad) * radius;
    const ty = Math.sin(rad * 2) * 16 + 20;
    const ry = angle + 180;
    const rx = -3;
    const scale = isHovered ? 1.08 : 1.0;

    return `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`;
  };

  // 60fps Physics & Continuous Auto-Orbit Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isDragging.current && zoomedCardIndex === null) {
        targetRot.current.y += 0.12;
      }

      currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.08;
      currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.08;

      if (pivotRef.current) {
        pivotRef.current.style.transform = `translateZ(-220px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [zoomedCardIndex]);

  // Pointer Drag Physics (Mouse + Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startMouse.current.x;
    const dy = e.clientY - startMouse.current.y;

    targetRot.current.y += dx * 0.28;
    targetRot.current.x -= dy * 0.14;
    targetRot.current.x = Math.max(-18, Math.min(18, targetRot.current.x));

    startMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Scroll to Orbit
  const handleWheel = (e: React.WheelEvent) => {
    targetRot.current.y += e.deltaY * 0.18;
    targetRot.current.x = Math.max(-18, Math.min(18, targetRot.current.x));
  };

  // Lightbox Modal Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (zoomedCardIndex === null) return;
      if (e.key === 'Escape') {
        setZoomedCardIndex(null);
      } else if (e.key === 'ArrowRight') {
        setZoomedCardIndex((prev) => (prev !== null ? (prev + 1) % ORBIT_CARDS.length : null));
      } else if (e.key === 'ArrowLeft') {
        setZoomedCardIndex((prev) => (prev !== null ? (prev - 1 + ORBIT_CARDS.length) % ORBIT_CARDS.length : null));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedCardIndex]);

  const activeZoomedCard = zoomedCardIndex !== null ? ORBIT_CARDS[zoomedCardIndex] : null;

  return (
    <div
      className="spatial-hero-stage"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      {/* Subtle Background Ambience */}
      <div className="spatial-stage-bg-grid" aria-hidden="true" />
      <div className="spatial-stage-bg-glow" aria-hidden="true" />

      {/* ── 3D PIVOT CONTAINER (REVOLVING ORBIT) ── */}
      <div
        ref={pivotRef}
        className="spatial-world-pivot"
        style={{
          transform: `translateZ(-220px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`,
          willChange: 'transform',
        }}
      >
        {ORBIT_CARDS.map((card, idx) => {
          const isHovered = hoveredIdx === idx;
          const transformStr = getCardTransform(idx, ORBIT_CARDS.length, isHovered);

          return (
            <div
              key={card.id}
              className={`spatial-card-plane ${isHovered ? 'hovered' : ''}`}
              style={{
                transform: transformStr,
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                if (onHoverProject) onHoverProject(card.projectIndex);
              }}
              onMouseLeave={() => {
                setHoveredIdx(null);
                if (onHoverProject) onHoverProject(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setZoomedCardIndex(idx);
              }}
              title={card.title}
            >
              <div className="spatial-card-inner">
                {/* Front Face */}
                <div className="spatial-card-face spatial-card-front">
                  <img
                    src={card.image}
                    alt={card.title}
                    draggable={false}
                  />
                </div>
                {/* Back Face (clean frosted chassis, no mirrored text) */}
                <div className="spatial-card-face spatial-card-back">
                  <div className="spatial-card-back-emblem">
                    <span>EB</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CENTER CORE: "Designing for Clarity." ── */}
      <div className="spatial-hero-center">
        <h1 className="spatial-hero-title">
          Designing for
          <br />
          <span>Clarity.</span>
        </h1>
        <button
          type="button"
          className="spatial-hero-cta"
          onClick={onNavigateWorks}
        >
          <span>Explore selected works</span>
          <ArrowDown size={15} />
        </button>
      </div>

      {/* ── CLICK-TO-INSPECT LIGHTBOX MODAL ── */}
      {zoomedCardIndex !== null && activeZoomedCard && (
        <div
          className="card-zoom-overlay"
          onClick={() => setZoomedCardIndex(null)}
        >
          <div
            className="card-zoom-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev & Next Controls */}
            <button
              type="button"
              className="card-zoom-nav-btn card-zoom-nav-btn--prev"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedCardIndex((prev) => (prev !== null ? (prev - 1 + ORBIT_CARDS.length) % ORBIT_CARDS.length : null));
              }}
              title="Previous"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="card-zoom-nav-btn card-zoom-nav-btn--next"
              onClick={(e) => {
                e.stopPropagation();
                setZoomedCardIndex((prev) => (prev !== null ? (prev + 1) % ORBIT_CARDS.length : null));
              }}
              title="Next"
            >
              <ChevronRight size={22} />
            </button>

            {/* Header */}
            <div className="card-zoom-header">
              <h2 className="card-zoom-title">{activeZoomedCard.title}</h2>
              <button
                type="button"
                className="card-zoom-close-btn"
                onClick={() => setZoomedCardIndex(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Media */}
            <div className="card-zoom-image-wrapper">
              <img
                src={activeZoomedCard.image}
                alt={activeZoomedCard.title}
              />
            </div>

            {/* Footer */}
            <div className="card-zoom-footer">
              <p className="card-zoom-tagline">
                {activeZoomedCard.tagline}
              </p>
              {onSelectProject && (
                <button
                  type="button"
                  className="card-zoom-cta-btn"
                  onClick={() => {
                    setZoomedCardIndex(null);
                    onSelectProject(activeZoomedCard.projectIndex);
                  }}
                >
                  <span>Full Case Study</span>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIQUID GLASS DOCK ── */}
      <LiquidDock
        activeSection={currentPage === 'works' ? 'projects' : currentPage === 'studio' ? 'about-me' : 'projects'}
        onNavigateProjects={onNavigateWorks}
        onNavigateHowIWork={onNavigateWorks}
        onNavigateAboutMe={onNavigateStudio}
        onBookCall={onBookCall}
      />
    </div>
  );
};
