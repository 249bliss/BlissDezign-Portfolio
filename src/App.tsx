import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CelestialSphere } from './components/CelestialSphere/CelestialSphere';
import { NatureAudio } from './components/NatureAudio/NatureAudio';
import { fetchProjectsFromSupabase, fetchCaseStudyFromSupabase, SupabaseProject } from './services/supabaseClient';
import { TopViewSwitcher, ViewMode } from './components/Navigation/TopViewSwitcher';
import { TopSocialLinks } from './components/Navigation/TopSocialLinks';
import { ProcessSection } from './components/ProcessSection/ProcessSection';
import { AboutMeSection } from './components/AboutMe/AboutMeSection';
import { LiquidDock } from './components/InteractiveHero/LiquidDock';
import { CaseStudyModal } from './components/CaseStudyModal/CaseStudyModal';
import { CustomCursor } from './components/Cursor/CustomCursor';
import { IntroSequence } from './components/IntroSequence/IntroSequence';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { ProjectData } from './data/projectsData';
import './styles/index.css';
import './components/WorksView/WorksView.css';
import './components/StudioView/StudioView.css';
import './components/ContactView/ContactView.css';

export const App: React.FC = () => {
  const checkIsAdmin = () => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return path.startsWith('/admin') || hash === '#admin';
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(checkIsAdmin);
  const [hoveredProject, setHoveredProject] = useState<ProjectData | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [supabaseProjects, setSupabaseProjects] = useState<SupabaseProject[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('sphere');
  const [isProcessOpen, setIsProcessOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isIntroActive, setIsIntroActive] = useState(true);

  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdmin(checkIsAdmin());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    fetchProjectsFromSupabase().then((data) => {
      if (data && data.length > 0) {
        setSupabaseProjects(data);
      }
    });
  }, []);

  const handleSelectSupabaseProject = useCallback(async (sbProj: SupabaseProject) => {
    const cs = await fetchCaseStudyFromSupabase(sbProj.id);
    const hasCaseStudy = Boolean(cs && cs.full_image_chunks && cs.full_image_chunks.length > 0);
    const visuals = (hasCaseStudy && cs?.full_image_chunks)
      ? cs.full_image_chunks
      : [sbProj.hero_image];

    const tools = cs?.tools
      ? cs.tools.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Figma'];

    const adapted: ProjectData = {
      id: sbProj.id,
      title: sbProj.title,
      client: cs?.industry || 'Client Partner',
      year: '2025 - 2026',
      role: cs?.role || 'Product Designer (UX UI)',
      duration: cs?.duration || '',
      tools: tools,
      industry: cs?.industry || '',
      category: sbProj.category_tags?.[0] || 'Product Design',
      categoryTag: sbProj.category_tags?.join(' • ') || 'PRODUCT DESIGN',
      tagline: sbProj.subtitle || '',
      overview: '',
      challenge: cs?.problem || '',
      solution: cs?.goal || '',
      impact: [],
      thumbnail: sbProj.hero_image,
      visuals: visuals,
      colorAccent: '#18181b',
      metrics: [],
      liveUrl: cs?.project_link || undefined,
      hasCaseStudy: hasCaseStudy,
    };
    setSelectedProject(adapted);
  }, []);

  const handleNextProject = useCallback(() => {
    if (!selectedProject || supabaseProjects.length === 0) return;
    const currentIndex = supabaseProjects.findIndex((p) => p.id === selectedProject.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % supabaseProjects.length : 0;
    handleSelectSupabaseProject(supabaseProjects[nextIndex]);
  }, [selectedProject, supabaseProjects, handleSelectSupabaseProject]);

  const handlePrevProject = useCallback(() => {
    if (!selectedProject || supabaseProjects.length === 0) return;
    const currentIndex = supabaseProjects.findIndex((p) => p.id === selectedProject.id);
    const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + supabaseProjects.length) % supabaseProjects.length : 0;
    handleSelectSupabaseProject(supabaseProjects[prevIndex]);
  }, [selectedProject, supabaseProjects, handleSelectSupabaseProject]);

  const handleCloseProject = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Global Escape key listener to close active overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsStudioOpen(false);
        setIsProcessOpen(false);
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isAdmin) {
    return (
      <AdminDashboard
        onExit={() => {
          window.history.pushState(null, '', '/');
          setIsAdmin(false);
        }}
      />
    );
  }

  return (
    <div
      ref={mainContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        overflow: 'hidden',
        background: '#ffffff',
        color: '#09090b',
      }}
    >
      {/* Dynamic Cursor Badge (Suppressed when overlays or modals or intro are open) */}
      <CustomCursor
        hoveredProject={(!isProcessOpen && !isStudioOpen && !selectedProject && !isIntroActive) ? hoveredProject : null}
        enabled={!isProcessOpen && !isStudioOpen && !selectedProject && !isIntroActive}
      />

      {/* ── CINEMATIC INTRO SEQUENCE (DESIGNS FLIP ➔ CURSOR DRAG ➔ HYPERSPACE PLUNGE) ── */}
      {isIntroActive && (
        <IntroSequence onComplete={() => setIsIntroActive(false)} />
      )}

      {/* Nature Ambiance Sound Toggle (Birdsong & Breeze) */}
      <NatureAudio />

      {/* Top Left Social Links Capsule (X & LinkedIn) - Hidden when modal/case study is open */}
      <TopSocialLinks visible={!selectedProject && !isProcessOpen && !isStudioOpen && !isIntroActive} />

      {/* Top View Switcher (Sphere <-> Grid) */}
      <TopViewSwitcher
        currentView={viewMode}
        onViewChange={(mode) => {
          setViewMode(mode);
        }}
      />

      {/* ── PHASE 1: PROJECTS INTERFACE (IN-PLACE 3D SPHERE ⟷ GRID MORPH) ── */}
      <section
        id="projects-stage"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <CelestialSphere
          viewMode={viewMode}
          isOverlayActive={isProcessOpen || isStudioOpen || !!selectedProject || isIntroActive}
          onSelectProject={handleSelectSupabaseProject}
          onHoverProject={(sbProj) => {
            if (sbProj) {
              setHoveredProject({
                id: sbProj.id,
                title: sbProj.title,
                client: 'Client',
                year: '2025',
                role: 'Designer',
                duration: 'Sprint',
                tools: ['Figma'],
                industry: 'Tech',
                category: 'Work',
                categoryTag: sbProj.category_tags?.join(' • ') || 'WORK',
                tagline: sbProj.subtitle || '',
                overview: '',
                challenge: '',
                solution: '',
                impact: [],
                thumbnail: sbProj.hero_image,
                visuals: [sbProj.hero_image],
                metrics: [],
                colorAccent: '#18181b',
              });
            } else {
              setHoveredProject(null);
            }
          }}
          onNavigateWorks={() => {
            setViewMode('grid');
          }}
        />
      </section>

      {/* ── ABOUT ME / STUDIO OVERLAY ("ABOUT ME") ── */}
      {isStudioOpen && (
        <AboutMeSection
          onClose={() => setIsStudioOpen(false)}
          onNavigateHowIWork={() => {
            setIsStudioOpen(false);
            setIsProcessOpen(true);
          }}
        />
      )}

      {/* ── DESIGN PROCESS MODAL OVERLAY ("HOW I WORK" / "HOW I HELP BRANDS GROW") ── */}
      {isProcessOpen && (
        <ProcessSection
          onClose={() => setIsProcessOpen(false)}
          onOpenContact={() => {
            setIsProcessOpen(false);
            setIsStudioOpen(true);
          }}
        />
      )}

      {/* ── CASE STUDY IN-DEPTH MODAL READER ── */}
      {selectedProject && (
        <CaseStudyModal
          project={selectedProject}
          onClose={handleCloseProject}
          onNext={handleNextProject}
          onPrev={handlePrevProject}
        />
      )}

      {/* ── PERSISTENT BOTTOM NAVIGATION DOCK (MUST APPEAR ON ALL PAGES) ── */}
      <LiquidDock
        visible={!isIntroActive}
        activeSection={
          isProcessOpen
            ? 'how-i-work'
            : isStudioOpen
            ? 'about-me'
            : 'projects'
        }
        onNavigateProjects={() => {
          setIsProcessOpen(false);
          setIsStudioOpen(false);
        }}
        onNavigateHowIWork={() => {
          setIsStudioOpen(false);
          setIsProcessOpen(true);
        }}
        onNavigateAboutMe={() => {
          setIsProcessOpen(false);
          setIsStudioOpen(true);
        }}
        onBookCall={() => {
          window.open('https://cal.com/blissdezigns/discovery-call', '_blank');
        }}
      />
    </div>
  );
};
