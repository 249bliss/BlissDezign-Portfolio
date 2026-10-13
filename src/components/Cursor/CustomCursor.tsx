import React, { useEffect, useRef } from 'react';
import type { ProjectData } from '../../data/projectsData';
import { ArrowUpRight } from 'lucide-react';
import './CustomCursor.css';

interface CustomCursorProps {
  hoveredProject: ProjectData | null;
  enabled?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ hoveredProject, enabled = true }) => {
  const dotRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId: number;
    const render = () => {
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.2;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * 0.2;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (badgeRef.current) {
        badgeRef.current.style.transform = `translate3d(${currentPos.current.x + 16}px, ${currentPos.current.y + 16}px, 0)`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef} className="k95-cursor-dot" />
      <div
        ref={badgeRef}
        className={`k95-cursor-badge ${hoveredProject ? 'visible' : ''}`}
      >
        {hoveredProject && (
          <div className="k95-cursor-pill">
            <span className="k95-cursor-title">{hoveredProject.title}</span>
            <ArrowUpRight size={13} className="k95-cursor-arrow" />
          </div>
        )}
      </div>
    </>
  );
};
