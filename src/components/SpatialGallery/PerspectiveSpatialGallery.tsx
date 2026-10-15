import React, { useState, useEffect, useRef } from 'react';
import { ProjectData } from '../../data/projectsData';
import type { SpatialMode } from './SpatialScene';
import './PerspectiveSpatialGallery.css';

interface PerspectiveSpatialGalleryProps {
  mode: SpatialMode;
  onSelectProject: (project: ProjectData) => void;
  onHoverProject: (project: ProjectData | null, index: number) => void;
}

export const PerspectiveSpatialGallery: React.FC<PerspectiveSpatialGalleryProps> = ({
  mode,
  onSelectProject,
  onHoverProject,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const pivotRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startMouse = useRef({ x: 0, y: 0 });
  const targetRot = useRef({ x: -5, y: 0 });
  const currentRot = useRef({ x: -5, y: 0 });

  // Calculate CSS 3D transform for each card based on active mode
  const getCardTransform = (index: number, total: number, activeMode: SpatialMode, isHovered: boolean) => {
    let tx = 0;
    let ty = 0;
    let tz = 0;
    let rx = 0;
    let ry = 0;
    let rz = 0;
    const scale = isHovered ? 1.08 : 1.0;

    if (activeMode === 'RINGS') {
      const isOuter = index % 2 === 0;
      const ringIndex = Math.floor(index / 2);
      const ringCount = Math.ceil(total / 2);
      const angle = (ringIndex / ringCount) * 360 + (isOuter ? 0 : 360 / (ringCount * 2));
      const radius = isOuter ? 720 : 540;
      const yOffset = isOuter ? -50 : 60;

      const rad = (angle * Math.PI) / 180;
      tx = Math.sin(rad) * radius;
      tz = Math.cos(rad) * radius;
      ty = yOffset + Math.sin(rad * 2) * 30;
      ry = angle + 180;
      rx = isOuter ? -4 : 4;
    } else if (activeMode === 'SPIRAL') {
      const angle = (index / total) * 480;
      const radius = 620;
      const heightStep = 90;
      const startY = -((total * heightStep) / 2) + 60;

      const rad = (angle * Math.PI) / 180;
      tx = Math.sin(rad) * radius;
      tz = Math.cos(rad) * radius;
      ty = startY + index * heightStep;
      ry = angle + 180;
      rx = -6;
      rz = Math.sin(rad) * 4;
    } else if (activeMode === 'SPHERE') {
      const phi = Math.acos(-1 + (2 * index) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = 660;

      tx = radius * Math.cos(theta) * Math.sin(phi);
      ty = radius * Math.sin(theta) * Math.sin(phi);
      tz = radius * Math.cos(phi);

      ry = -(theta * 180) / Math.PI + 90;
      rx = (phi * 180) / Math.PI - 90;
    } else {
      // FLOW Mode
      const span = 1400;
      tx = ((index - (total - 1) / 2) / total) * span;
      tz = -Math.cos(((index - (total - 1) / 2) / total) * Math.PI) * 320 + 200;
      ty = Math.sin((index / total) * Math.PI * 2) * 40;
      ry = -((index - (total - 1) / 2) / total) * 45;
    }

    return `translate3d(${tx}px, ${ty}px, ${tz}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`;
  };

  // 60fps physics loop modifying DOM transform directly with ZERO React re-renders
  useEffect(() => {
    let animId: number;

    const loop = () => {
      if (!isDragging.current) {
        targetRot.current.y += 0.08;
      }
      currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.08;
      currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.08;

      if (pivotRef.current) {
        pivotRef.current.style.transform = `translateZ(-200px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - startMouse.current.x;
    const dy = e.clientY - startMouse.current.y;

    targetRot.current.y += dx * 0.35;
    targetRot.current.x -= dy * 0.2;
    targetRot.current.x = Math.max(-30, Math.min(30, targetRot.current.x));

    startMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    targetRot.current.y += e.deltaY * 0.15;
    targetRot.current.x -= e.deltaX * 0.1;
    targetRot.current.x = Math.max(-30, Math.min(30, targetRot.current.x));
  };

  return (
    <div
      className="spatial-perspective-stage"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      {/* Curved Architectural Wireframe Grid Background */}
      <div className="spatial-grid-cage" />

      {/* 3D Pivot Group */}
      <div
        ref={pivotRef}
        className="spatial-world-pivot"
        style={{
          transform: `translateZ(-200px) rotateX(${currentRot.current.x}deg) rotateY(${currentRot.current.y}deg)`,
          willChange: 'transform',
        }}
      >
        {/* Center Chrome Monogram Sculpture */}
        <div className="spatial-center-emblem">
          <div className="chrome-faceted-orb">
            <span>EB</span>
          </div>
        </div>

        {/* 3D Project Planes */}
        {PROJECTS.map((proj, idx) => {
          const isHovered = hoveredIdx === idx;
          const transformStr = getCardTransform(idx, PROJECTS.length, mode, isHovered);

          return (
            <div
              key={proj.id}
              className={`spatial-card-plane ${isHovered ? 'hovered' : ''}`}
              style={{
                transform: transformStr,
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={() => {
                setHoveredIdx(idx);
                onHoverProject(proj, idx);
              }}
              onMouseLeave={() => {
                setHoveredIdx(null);
                onHoverProject(null, -1);
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(proj);
              }}
            >
              <img
                src={proj.thumbnail}
                alt={proj.title}
                className="card-media-layer"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/Aaron.png';
                }}
              />

              <div className="card-overlay-badge">
                <span className="card-tag-pill" style={{ color: proj.colorAccent }}>
                  {proj.categoryTag}
                </span>
                <span className="card-heading">{proj.title}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
