import React, { useEffect, useRef } from 'react';
import type { ProjectData } from '../../data/projectsData';
import { X, ArrowUpRight, ArrowLeft, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { useContainerLenis } from '../../hooks/useLenis';
import './CaseStudyModal.css';

interface CaseStudyModalProps {
  project: ProjectData;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export const CaseStudyModal: React.FC<CaseStudyModalProps> = ({
  project,
  onClose,
  onNext,
  onPrev,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  const onPrevRef = useRef(onPrev);
  onPrevRef.current = onPrev;

  // Silky smooth momentum scrolling with Lenis
  useContainerLenis(modalRef, true);

  // Smooth entrance animation — ONLY triggers once per project ID
  useEffect(() => {
    if (modalRef.current && contentRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [project.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'ArrowRight') onNextRef.current();
      if (e.key === 'ArrowLeft') onPrevRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasScreens = project.visuals && project.visuals.length > 0;

  return (
    <div
      ref={modalRef}
      className="case-study-backdrop"
      onClick={(e) => {
        if (e.target === modalRef.current) onClose();
      }}
    >
      <div ref={contentRef} className="case-study-dialog">
        {/* Sticky Header */}
        <div className="cs-sticky-header">
          <div className="cs-header-left">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="cs-live-btn"
              >
                <span>Live Experience</span>
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>

          <div className="cs-header-actions">
            <button
              onClick={onClose}
              className="cs-close-btn"
              aria-label="Close Case Study"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="cs-content-body">
          {/* Title & Tagline */}
          <div className="cs-hero-section">
            {project.categoryTag && (
              <div className="cs-hero-tag-wrap">
                <span className="cs-tag-chip">
                  {project.categoryTag}
                </span>
              </div>
            )}
            <h1 className="cs-hero-main-title">{project.title}</h1>
            {project.tagline && <p className="cs-tagline">{project.tagline}</p>}
          </div>

          {/* Project Metadata Strip (Only show present fields) */}
          <div className="cs-metadata-bar">
            {project.role && (
              <div className="cs-meta-item">
                <span className="cs-meta-key">Role &amp; Discipline</span>
                <span className="cs-meta-val">{project.role}</span>
              </div>
            )}
            {project.industry && (
              <div className="cs-meta-item">
                <span className="cs-meta-key">Industry</span>
                <span className="cs-meta-val">{project.industry}</span>
              </div>
            )}
            {project.duration && (
              <div className="cs-meta-item">
                <span className="cs-meta-key">Timeline</span>
                <span className="cs-meta-val">{project.duration}</span>
              </div>
            )}
            {project.tools && project.tools.length > 0 && (
              <div className="cs-meta-item">
                <span className="cs-meta-key">Tools</span>
                <span className="cs-meta-val">{project.tools.join(' • ')}</span>
              </div>
            )}
          </div>

          {/* Real Case Study Screens Stream (from Supabase backend) */}
          {hasScreens ? (
            <div className={`cs-visuals-strip ${project.visuals.length > 1 ? 'is-sliced' : ''}`}>
              {project.visuals.map((vis, idx) => {
                const isVideo = vis.toLowerCase().match(/\.(mp4|webm|mov)$/);
                return (
                  <div key={idx} className="cs-visual-frame">
                    {isVideo ? (
                      <video src={vis} autoPlay loop muted playsInline controls />
                    ) : (
                      <img
                        src={vis}
                        alt={`${project.title} Section ${idx + 1}`}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cs-single-hero-frame">
              <img src={project.thumbnail} alt={project.title} loading="lazy" decoding="async" />
              <p className="cs-no-study-note">Visual design showcase. Full case study not attached.</p>
            </div>
          )}

          {/* Footer Navigation Next / Prev */}
          <div className="cs-footer-nav">
            <button onClick={onPrev} className="cs-nav-btn">
              <ArrowLeft size={16} />
              <span>Previous Project</span>
            </button>
            <button onClick={onNext} className="cs-nav-btn">
              <span>Next Project</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
