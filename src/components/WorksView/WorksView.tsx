import React, { useState, useEffect, useRef } from 'react';
import { SupabaseProject } from '../../services/supabaseClient';
import { ArrowUpRight } from 'lucide-react';
import gsap from 'gsap';
import './WorksView.css';

interface WorksViewProps {
  projects: SupabaseProject[];
  onSelectProject: (project: SupabaseProject) => void;
}

export const WorksView: React.FC<WorksViewProps> = ({ projects, onSelectProject }) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract unique category tags dynamically from Supabase projects
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    set.add('ALL');
    projects.forEach((p) => {
      if (p.category_tags && p.category_tags.length > 0) {
        p.category_tags.forEach((t) => set.add(t.toUpperCase()));
      }
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    if (activeFilter === 'ALL') return projects;
    return projects.filter((p) => {
      if (!p.category_tags) return false;
      return p.category_tags.some((tag) => tag.toUpperCase() === activeFilter);
    });
  }, [projects, activeFilter]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll('.works-card'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [activeFilter, filteredProjects]);

  return (
    <div ref={containerRef} className="works-page">
      <header className="works-header">
        <div className="works-eyebrow-row">
          <span className="works-eyebrow">PORTFOLIO DIRECTORY // {projects.length} ARCHIVAL WORKS</span>
          <span className="works-eyebrow">EMMANUEL BLISS • 2024 - 2026</span>
        </div>

        <div className="works-title-row">
          <div>
            <h1 className="works-main-heading">All Works.</h1>
            <p style={{ color: '#71717a', fontSize: '1.1rem', marginTop: '0.5rem', maxWidth: '640px' }}>
              Selected UX systems, venture sprints, and interaction engines from our live project archive.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="works-filter-bar" role="tablist" aria-label="Project Category Filter">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`filter-chip ${activeFilter === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* 2-Column Architectural Project Grid */}
      <main className="works-grid-stage">
        {filteredProjects.map((project, idx) => {
          const isVideo = project.hero_image && project.hero_image.match(/\.(mp4|webm|mov)$/i);

          return (
            <article
              key={project.id}
              className="works-card"
              onClick={() => onSelectProject(project)}
              tabIndex={0}
              role="button"
              aria-label={`Open case study for ${project.title}`}
            >
              <div className="works-card__media-box">
                {isVideo ? (
                  <video
                    src={project.hero_image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="works-card__img"
                  />
                ) : (
                  <img
                    src={project.hero_image}
                    alt={project.title}
                    className="works-card__img"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/Aaron.png';
                    }}
                  />
                )}
                <div className="works-card__curtain">
                  <span>Case Study</span>
                  <ArrowUpRight size={14} />
                </div>
              </div>

              <div className="works-card__meta-bar">
                <div className="works-card__top-row">
                  <span className="works-card__num">{String(idx + 1).padStart(2, '0')}.</span>
                  <span className="works-card__category">
                    {project.category_tags?.join(' • ') || 'PRODUCT DESIGN'}
                  </span>
                </div>

                <h2 className="works-card__title">{project.title}</h2>
                {project.subtitle && <p className="works-card__tagline">{project.subtitle}</p>}

                <div className="works-card__footer-row">
                  <div className="works-card__cta">
                    <span>Inspect</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
};
