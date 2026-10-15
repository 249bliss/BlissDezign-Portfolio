import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectData, PROJECTS } from '../../data/projectsData';
import { ArrowUpRight, X } from 'lucide-react';
import './SpatialSphere.css';

interface SpatialSphereProps {
  onSelectProject: (project: ProjectData) => void;
  onHoverProject?: (project: ProjectData | null) => void;
  onNavigateWorks?: () => void;
}

export const SpatialSphere: React.FC<SpatialSphereProps> = ({
  onSelectProject,
  onHoverProject,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pivotRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const targetRot = useRef({ x: -6, y: 0 });
  const currentRot = useRef({ x: -6, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const isTransitioningToCenter = useRef(false);

  const totalCards = PROJECTS.length;

  // Spherical Fibonacci point distribution
  const getCardTransform = useCallback((index: number, total: number, isHovered: boolean, isActive: boolean) => {
    // Fibonacci sphere lattice math
    const phi = Math.acos(-1 + (2 * index + 1) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const radius = 620; // sphere radius in px

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi) * 0.85; // slightly flattened poles
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Orient card facing outwards from sphere center
    const ry = (-(theta * 180) / Math.PI) + 90;
    const rx = ((phi * 180) / Math.PI) - 90;

    const scale = isActive ? 1.15 : isHovered ? 1.08 : 1.0;

    return {
      x,
      y,
      z,
      rx,
      ry,
      scale,
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateX(${rx}deg) scale(${scale})`,
    };
  }, []);

  // 60fps Physics & Inertial Momentum Loop
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isDragging.current && !isTransitioningToCenter.current && !isZoomedIn) {
        // Continuous ambient rotation
        targetRot.current.y += 0.09;
      }

      currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.08;
      currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.08;

      if (pivotRef.current) {
        const zoomZ = isZoomedIn ? 350 : -180;
        pivotRef.current.style.transform = `translateZ(${zoomZ}px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isZoomedIn]);

  // Pointer drag to spin the sphere in any 3D direction
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isZoomedIn) return;
    isDragging.current = true;
    isTransitioningToCenter.current = false;
    startMouse.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || isZoomedIn) return;
    const dx = e.clientX - startMouse.current.x;
    const dy = e.clientY - startMouse.current.y;

    targetRot.current.y += dx * 0.32;
    targetRot.current.x -= dy * 0.22;
    // Clamp vertical roll so sphere stays upright
    targetRot.current.x = Math.max(-55, Math.min(55, targetRot.current.x));

    velocity.current = { x: dx, y: dy };
    startMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Wheel to rotate
  const handleWheel = (e: React.WheelEvent) => {
    if (isZoomedIn) return;
    targetRot.current.y += e.deltaY * 0.16;
    targetRot.current.x = Math.max(-55, Math.min(55, targetRot.current.x));
  };

  // Card Click Interaction:
  // 1st Click: Rotates sphere smoothly to bring card directly to center
  // 2nd Click: Zooms user forward into the project (dive-in zoom)
  const handleCardClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeCardIdx === index) {
      // 2nd Click: Zoom inside
      setIsZoomedIn(true);
    } else {
      // 1st Click: Rotate sphere to align this card directly to center front
      setActiveCardIdx(index);
      isTransitioningToCenter.current = true;

      const phi = Math.acos(-1 + (2 * index + 1) / totalCards);
      const theta = Math.sqrt(totalCards * Math.PI) * phi;

      // Desired camera rotation to face this card directly
      const desiredY = ((theta * 180) / Math.PI) - 90;
      const desiredX = -(((phi * 180) / Math.PI) - 90);

      // Smoothly shortest angular delta
      let deltaY = (desiredY - (targetRot.current.y % 360));
      while (deltaY > 180) deltaY -= 360;
      while (deltaY < -180) deltaY += 360;

      targetRot.current.y += deltaY;
      targetRot.current.x = Math.max(-50, Math.min(50, desiredX));

      setTimeout(() => {
        isTransitioningToCenter.current = false;
      }, 700);
    }
  };

  // Reset / Exit zoom
  const handleExitZoom = () => {
    setIsZoomedIn(false);
  };

  const activeProject = activeCardIdx !== null ? PROJECTS[activeCardIdx] : null;

  return (
    <div
      ref={containerRef}
      className={`spatial-sphere-stage ${isZoomedIn ? 'is-zoomed' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging.current ? 'grabbing' : isZoomedIn ? 'default' : 'grab' }}
    >
      {/* ── ARCHITECTURAL BLUEPRINT GRID BACKGROUND & TECHNICAL LINES ── */}
      <div className="bg-blueprint-grid" aria-hidden="true" />
      <div className="bg-architectural-stripes" aria-hidden="true" />
      <div className="bg-grid-lines" aria-hidden="true">
        <span className="bg-axis axis-x" />
        <span className="bg-axis axis-y" />
      </div>

      {/* 4 Corner Precision Technical Crop Marks (+) */}
      <span className="bg-crop bg-crop-tl" aria-hidden="true">+</span>
      <span className="bg-crop bg-crop-tr" aria-hidden="true">+</span>
      <span className="bg-crop bg-crop-bl" aria-hidden="true">+</span>
      <span className="bg-crop bg-crop-br" aria-hidden="true">+</span>

      {/* ── 3D SPHERICAL PIVOT GROUP ── */}
      <div
        ref={pivotRef}
        className="spatial-sphere-pivot"
        style={{
          transform: `translateZ(${isZoomedIn ? 350 : -180}px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`,
          willChange: 'transform',
        }}
      >
        {PROJECTS.map((proj, idx) => {
          const isHovered = hoveredIdx === idx;
          const isActive = activeCardIdx === idx;
          const { transform } = getCardTransform(idx, totalCards, isHovered, isActive);

          return (
            <div
              key={proj.id}
              className={`sphere-card-plane ${isActive ? 'is-active' : ''} ${isHovered ? 'is-hovered' : ''}`}
              style={{
                transform,
                transition: isTransitioningToCenter.current
                  ? 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s'
                  : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s',
              }}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                onHoverProject?.(proj);
              }}
              onMouseLeave={() => {
                setHoveredIdx(null);
                onHoverProject?.(null);
              }}
              onClick={(e) => handleCardClick(idx, e)}
              title={proj.title}
            >
              <div className="sphere-card-inner">
                {/* Front: High-res visual design without tags */}
                <div className="sphere-card-face sphere-card-front">
                  <img
                    src={proj.thumbnail}
                    alt={proj.title}
                    draggable={false}
                    loading="eager"
                  />
                  {isActive && !isZoomedIn && (
                    <div className="sphere-card-hint-pill">
                      <span>Click to dive in</span>
                    </div>
                  )}
                </div>

                {/* Back: Clean frosted chassis */}
                <div className="sphere-card-face sphere-card-back">
                  <div className="sphere-card-emblem">
                    <span>EB</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── IMMERSIVE DIVE-IN MODAL (When user clicks 2nd time to zoom inside) ── */}
      {isZoomedIn && activeProject && (
        <div className="sphere-divein-overlay" onClick={handleExitZoom}>
          <div className="sphere-divein-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="sphere-divein-close"
              onClick={handleExitZoom}
              title="Return to 3D Sphere"
            >
              <X size={20} />
            </button>

            <div className="sphere-divein-media-wrap">
              <img
                src={activeProject.thumbnail}
                alt={activeProject.title}
              />
            </div>

            <div className="sphere-divein-footer">
              <div>
                <h2 className="sphere-divein-title">{activeProject.title}</h2>
                <p className="sphere-divein-tagline">{activeProject.tagline}</p>
              </div>

              <div className="sphere-divein-actions">
                <button
                  type="button"
                  className="sphere-divein-btn secondary"
                  onClick={handleExitZoom}
                >
                  Back to Sphere
                </button>
                <button
                  type="button"
                  className="sphere-divein-btn primary"
                  onClick={() => {
                    handleExitZoom();
                    onSelectProject(activeProject);
                  }}
                >
                  <span>View Case Study</span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
