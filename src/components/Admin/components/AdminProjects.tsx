import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  fetchProjectsFromSupabase,
  fetchCaseStudyFromSupabase,
  upsertProjectInSupabase,
  deleteProjectInSupabase,
  uploadAssetToSupabase,
  sliceAndUploadCaseStudyImage,
  SupabaseProject,
  SupabaseCaseStudy,
} from '../../../services/supabaseClient';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  UploadCloud,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  onShowToast: (message: string) => void;
  onConfirm: (message: string, action: () => Promise<void>) => void;
}

export const AdminProjects: React.FC<Props> = ({ onShowToast, onConfirm }) => {
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'case_study' | 'featured'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formHeroImage, setFormHeroImage] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formGridLayout, setFormGridLayout] = useState('standard');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsCaseStudy, setFormIsCaseStudy] = useState(false);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Case Study Fields
  const [csRole, setCsRole] = useState('Product Designer');
  const [csDuration, setCsDuration] = useState('4 Weeks');
  const [csTools, setCsTools] = useState('Figma, Systems');
  const [csIndustry, setCsIndustry] = useState('Fintech');
  const [csProjectLink, setCsProjectLink] = useState('');
  const [csChunks, setCsChunks] = useState<string[]>([]);
  const [newChunkUrlInput, setNewChunkUrlInput] = useState('');

  // File Uploading Indicators
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingChunk, setIsUploadingChunk] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const chunkFileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = async () => {
    setIsLoading(true);
    const data = await fetchProjectsFromSupabase();
    setProjects(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category_tags && p.category_tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;
      if (filterType === 'case_study') return p.is_case_study;
      if (filterType === 'featured') return p.is_featured;
      return true;
    });
  }, [projects, searchQuery, filterType]);

  const openNewModal = () => {
    setEditingId(null);
    setFormId('');
    setFormTitle('');
    setFormSubtitle('');
    setFormHeroImage('');
    setFormOrder(projects.length > 0 ? Math.max(...projects.map((p) => p.display_order || 0)) + 1 : 1);
    setFormGridLayout('standard');
    setFormIsFeatured(false);
    setFormIsCaseStudy(false);
    setFormTags(['Product Design']);
    setNewTagInput('');
    setCsRole('Lead Product Designer');
    setCsDuration('4-6 Weeks');
    setCsTools('Figma, UI Systems');
    setCsIndustry('Fintech');
    setCsProjectLink('');
    setCsChunks([]);
    setNewChunkUrlInput('');
    setIsModalOpen(true);
  };

  const openEditModal = async (proj: SupabaseProject) => {
    setEditingId(proj.id);
    setFormId(proj.id);
    setFormTitle(proj.title);
    setFormSubtitle(proj.subtitle || '');
    setFormHeroImage(proj.hero_image || '');
    setFormOrder(proj.display_order ?? 0);
    setFormGridLayout(proj.grid_layout || 'standard');
    setFormIsFeatured(!!proj.is_featured);
    setFormIsCaseStudy(!!proj.is_case_study);
    setFormTags(proj.category_tags || ['Product Design']);
    setNewTagInput('');
    setNewChunkUrlInput('');

    if (proj.is_case_study) {
      const cs = await fetchCaseStudyFromSupabase(proj.id);
      if (cs) {
        setCsRole(cs.role || 'Product Designer');
        setCsDuration(cs.duration || '');
        setCsTools(cs.tools || '');
        setCsIndustry(cs.industry || '');
        setCsProjectLink(cs.project_link || '');
        setCsChunks(cs.full_image_chunks || []);
      } else {
        setCsChunks([]);
      }
    } else {
      setCsChunks([]);
    }

    setIsModalOpen(true);
  };

  const handleAddTag = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    const trimmed = newTagInput.trim();
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormTags(formTags.filter((t) => t !== tagToRemove));
  };

  // Hero File Upload
  const handleHeroFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    try {
      const url = await uploadAssetToSupabase(file, 'projects');
      setFormHeroImage(url);
      onShowToast('Hero asset uploaded successfully');
    } catch (err: any) {
      onShowToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingHero(false);
    }
  };

  // Case Study Chunk Upload (Supports multiple files, auto-slicing tall images, & clean input reset)
  const handleChunkFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingChunk(true);
    let totalUploaded = 0;
    try {
      for (const file of files) {
        try {
          const urls = await sliceAndUploadCaseStudyImage(file, (msg) => {
            onShowToast(msg);
          });
          setCsChunks((prev) => [...prev, ...urls]);
          totalUploaded += urls.length;
        } catch (itemErr: any) {
          console.error('Chunk upload error:', itemErr);
          onShowToast(`Failed to upload ${file.name}: ${itemErr.message}`);
        }
      }
      if (totalUploaded > 0) {
        onShowToast(`Added ${totalUploaded} visual section${totalUploaded > 1 ? 's' : ''} to case study gallery`);
      }
    } finally {
      setIsUploadingChunk(false);
      if (chunkFileInputRef.current) {
        chunkFileInputRef.current.value = '';
      }
    }
  };

  const handleAddManualChunk = () => {
    const trimmed = newChunkUrlInput.trim();
    if (!trimmed) {
      onShowToast('Please paste a valid image or video URL');
      return;
    }
    setCsChunks((prev) => [...prev, trimmed]);
    setNewChunkUrlInput('');
    onShowToast('Visual chunk added to gallery');
  };

  const handleRemoveChunk = (index: number) => {
    setCsChunks(csChunks.filter((_, i) => i !== index));
  };

  const handleMoveChunk = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= csChunks.length) return;
    const copy = [...csChunks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setCsChunks(copy);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = formId.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanId) {
      onShowToast('Project ID slug is required');
      return;
    }
    if (!formTitle.trim()) {
      onShowToast('Project title is required');
      return;
    }
    if (!formHeroImage.trim()) {
      onShowToast('Hero visual is required');
      return;
    }

    setIsSaving(true);
    try {
      const projPayload: Partial<SupabaseProject> & { id: string } = {
        id: cleanId,
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        hero_image: formHeroImage.trim(),
        display_order: Number(formOrder) || 0,
        grid_layout: formGridLayout,
        is_featured: formIsFeatured,
        is_case_study: formIsCaseStudy,
        category_tags: formTags,
      };

      let csPayload: Partial<SupabaseCaseStudy> | null = null;
      if (formIsCaseStudy) {
        csPayload = {
          role: csRole.trim(),
          duration: csDuration.trim(),
          tools: csTools.trim(),
          industry: csIndustry.trim(),
          project_link: csProjectLink.trim() || null,
          full_image_chunks: csChunks,
        };
      }

      await upsertProjectInSupabase(projPayload, csPayload);
      onShowToast(`Project "${formTitle}" saved successfully`);
      setIsModalOpen(false);
      loadProjects();
    } catch (err: any) {
      console.error(err);
      onShowToast(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = (proj: SupabaseProject) => {
    onConfirm(`Are you sure you want to delete "${proj.title}"? This will permanently remove its case study and media references.`, async () => {
      try {
        await deleteProjectInSupabase(proj.id);
        onShowToast(`Deleted "${proj.title}"`);
        loadProjects();
      } catch (err: any) {
        onShowToast(`Error: ${err.message}`);
      }
    });
  };

  const handleQuickReorder = async (proj: SupabaseProject, direction: 'up' | 'down') => {
    const currentOrder = proj.display_order ?? 0;
    const newOrder = direction === 'up' ? Math.max(0, currentOrder - 1) : currentOrder + 1;
    try {
      await upsertProjectInSupabase({ id: proj.id, display_order: newOrder });
      loadProjects();
    } catch (err: any) {
      onShowToast(`Failed to update order: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Panel Header */}
      <div className="adm-panel-head">
        <div className="adm-panel-title-area">
          <span className="adm-panel-eyebrow">Portfolio CMS</span>
          <h2 className="adm-panel-title">Project Library</h2>
          <p className="adm-panel-desc">Manage 3D sphere exhibits, case studies, and grid presentations.</p>
        </div>

        <div className="adm-panel-actions">
          <button className="adm-btn-primary" onClick={openNewModal}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="adm-controls-bar">
        <div className="adm-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="adm-search-input"
            placeholder="Search projects by title, slug, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="adm-filter-pills">
          <button
            className={`adm-filter-pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Projects ({projects.length})
          </button>
          <button
            className={`adm-filter-pill ${filterType === 'case_study' ? 'active' : ''}`}
            onClick={() => setFilterType('case_study')}
          >
            Case Studies ({projects.filter((p) => p.is_case_study).length})
          </button>
          <button
            className={`adm-filter-pill ${filterType === 'featured' ? 'active' : ''}`}
            onClick={() => setFilterType('featured')}
          >
            Featured ({projects.filter((p) => p.is_featured).length})
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          Loading your projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          No projects match your filter. Tap "New Project" to add one.
        </div>
      ) : (
        <div className="adm-projects-grid">
          {filteredProjects.map((proj) => {
            const isVideo = proj.hero_image?.match(/\.(mp4|webm|ogg|mov)$/i);
            return (
              <div key={proj.id} className="adm-project-card">
                {/* Visual Thumbnail */}
                <div className="adm-project-thumb-frame">
                  {isVideo ? (
                    <video
                      src={proj.hero_image}
                      className="adm-project-thumb"
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : (
                    <img
                      src={proj.hero_image}
                      alt={proj.title}
                      className="adm-project-thumb"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/favicon.png';
                      }}
                    />
                  )}

                  {/* Badges */}
                  <div className="adm-project-badges">
                    {proj.is_case_study && <span className="adm-badge case-study">Case Study</span>}
                    {proj.is_featured && <span className="adm-badge featured">Featured</span>}
                  </div>

                  <span className="adm-project-order-tag" title="Display Order Sequence">
                    #{proj.display_order ?? 0}
                  </span>
                </div>

                {/* Content */}
                <div className="adm-project-body">
                  <span className="adm-project-id">{proj.id}</span>
                  <h3 className="adm-project-title">{proj.title}</h3>
                  <p className="adm-project-subtitle">{proj.subtitle || 'No subtitle specified.'}</p>

                  <div className="adm-project-tags">
                    {proj.category_tags?.map((t, i) => (
                      <span key={i} className="adm-tag">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="adm-project-actions">
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="adm-icon-btn"
                        style={{ width: 30, height: 30 }}
                        onClick={() => handleQuickReorder(proj, 'up')}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        className="adm-icon-btn"
                        style={{ width: 30, height: 30 }}
                        onClick={() => handleQuickReorder(proj, 'down')}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="adm-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => openEditModal(proj)}
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        className="adm-btn-danger"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => handleDeleteProject(proj)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT PROJECT MODAL ── */}
      {isModalOpen && (
        <div className="adm-modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3 className="adm-modal-title">
                {editingId ? `Edit Project: ${formTitle}` : 'Create New Project'}
              </h3>
              <button
                className="adm-icon-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProject}>
              <div className="adm-modal-body">
                {/* Basic Identifiers */}
                <div className="adm-form-grid-2">
                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Project Slug / ID</span>
                      <span className="adm-form-label-sub">Lowercase URL key</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. swychr-global"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={!!editingId}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Project Title</span>
                    </label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. Swychr Global"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    <span>Subtitle / Short Editorial Pitch</span>
                  </label>
                  <textarea
                    className="adm-form-textarea"
                    placeholder="Describe the product vision in 1-2 compelling sentences..."
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Hero Asset Upload */}
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    <span>Hero Visual Asset (Image or MP4 Video)</span>
                    <span className="adm-form-label-sub">Stored in portfolio-assets</span>
                  </label>

                  <div
                    className="adm-dropzone"
                    onClick={() => heroFileInputRef.current?.click()}
                  >
                    <input
                      ref={heroFileInputRef}
                      type="file"
                      accept="image/*,video/mp4"
                      style={{ display: 'none' }}
                      onChange={handleHeroFileUpload}
                    />
                    <UploadCloud size={24} color="var(--adm-text-muted)" />
                    <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                      {isUploadingHero ? 'Uploading to Supabase...' : 'Click or drop to upload hero visual'}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                      Supports PNG, JPG, WebP, MP4 (max 50MB)
                    </span>
                  </div>

                  {formHeroImage && (
                    <div className="adm-dropzone-preview">
                      {formHeroImage.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                        <video src={formHeroImage} muted loop playsInline autoPlay />
                      ) : (
                        <img src={formHeroImage} alt="Hero Preview" />
                      )}
                    </div>
                  )}

                  <input
                    type="url"
                    className="adm-form-input"
                    style={{ marginTop: 8 }}
                    placeholder="Or paste external asset URL directly"
                    value={formHeroImage}
                    onChange={(e) => setFormHeroImage(e.target.value)}
                  />
                </div>

                {/* Tags & Order */}
                <div className="adm-form-grid-2">
                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Display Sequence Order</span>
                      <span className="adm-form-label-sub">Lower appears first</span>
                    </label>
                    <input
                      type="number"
                      className="adm-form-input"
                      value={formOrder}
                      onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Grid Layout Type</span>
                    </label>
                    <select
                      className="adm-form-select"
                      value={formGridLayout}
                      onChange={(e) => setFormGridLayout(e.target.value)}
                    >
                      <option value="standard">Standard Card (1x1)</option>
                      <option value="wide">Wide Editorial Banner (2x1)</option>
                      <option value="tall">Tall Portrait Card (1x2)</option>
                    </select>
                  </div>
                </div>

                {/* Category Tags */}
                <div className="adm-form-group">
                  <label className="adm-form-label">
                    <span>Category Tags</span>
                    <span className="adm-form-label-sub">Press Enter to add tag</span>
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="Add tag (e.g. Fintech, Design System, Mobile)"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    <button
                      type="button"
                      className="adm-btn-secondary"
                      onClick={() => handleAddTag()}
                    >
                      Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {formTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="adm-tag"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 9px' }}
                      >
                        {tag}
                        <X
                          size={12}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feature Toggle */}
                <label className="adm-switch-wrap">
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.86rem' }}>Featured Exhibit</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                      Highlighted on the home celestial stage and top grid slots.
                    </span>
                  </div>
                  <div className="adm-switch">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                    />
                    <span className="adm-switch-slider round" />
                  </div>
                </label>

                {/* Case Study Toggle */}
                <label className="adm-switch-wrap">
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.86rem' }}>Interactive Case Study</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                      Unlocks full editorial modal with visual gallery chunks and deep design narrative.
                    </span>
                  </div>
                  <div className="adm-switch">
                    <input
                      type="checkbox"
                      checked={formIsCaseStudy}
                      onChange={(e) => setFormIsCaseStudy(e.target.checked)}
                    />
                    <span className="adm-switch-slider round" />
                  </div>
                </label>

                {/* ── CASE STUDY DETAILS SECTION ── */}
                {formIsCaseStudy && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      padding: 18,
                      borderRadius: 16,
                      background: 'var(--adm-surface-active)',
                      border: '1px solid var(--adm-border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--adm-text-muted)',
                      }}
                    >
                      Case Study Editorial Metadata
                    </span>

                    <div className="adm-form-grid-2">
                      <div className="adm-form-group">
                        <label className="adm-form-label">Role</label>
                        <input
                          type="text"
                          className="adm-form-input"
                          placeholder="e.g. Lead Product Designer"
                          value={csRole}
                          onChange={(e) => setCsRole(e.target.value)}
                        />
                      </div>
                      <div className="adm-form-group">
                        <label className="adm-form-label">Duration</label>
                        <input
                          type="text"
                          className="adm-form-input"
                          placeholder="e.g. 6 Weeks"
                          value={csDuration}
                          onChange={(e) => setCsDuration(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="adm-form-grid-2">
                      <div className="adm-form-group">
                        <label className="adm-form-label">Tools Used</label>
                        <input
                          type="text"
                          className="adm-form-input"
                          placeholder="e.g. Figma, Miro, Protopie"
                          value={csTools}
                          onChange={(e) => setCsTools(e.target.value)}
                        />
                      </div>
                      <div className="adm-form-group">
                        <label className="adm-form-label">Industry</label>
                        <input
                          type="text"
                          className="adm-form-input"
                          placeholder="e.g. Fintech / Cross-border Payments"
                          value={csIndustry}
                          onChange={(e) => setCsIndustry(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="adm-form-group">
                      <label className="adm-form-label">Live Product URL (Optional)</label>
                      <input
                        type="url"
                        className="adm-form-input"
                        placeholder="e.g. https://swychr.com"
                        value={csProjectLink}
                        onChange={(e) => setCsProjectLink(e.target.value)}
                      />
                    </div>

                    {/* Chunks Gallery Manager */}
                    <div className="adm-form-group">
                      <label className="adm-form-label">
                        <span>Visual Narrative Chunks ({csChunks.length})</span>
                        <span className="adm-form-label-sub">Stacked inside case study modal</span>
                      </label>

                      <div
                        className="adm-dropzone"
                        style={{ padding: '16px 12px' }}
                        onClick={() => chunkFileInputRef.current?.click()}
                      >
                        <input
                          ref={chunkFileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/mp4"
                          style={{ display: 'none' }}
                          onChange={handleChunkFileUpload}
                        />
                        <ImageIcon size={18} color="var(--adm-text-muted)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {isUploadingChunk ? 'Uploading Visual Chunk...' : '+ Upload Screenshot Chunk(s)'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>
                          Supports PNG, JPG, WebP, MP4 (select one or multiple)
                        </span>
                      </div>

                      {/* Direct URL input fallback */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                          type="url"
                          className="adm-form-input"
                          placeholder="Or paste image/video URL directly (e.g. /assets/... or https://...)"
                          value={newChunkUrlInput}
                          onChange={(e) => setNewChunkUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddManualChunk();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="adm-btn-secondary"
                          style={{ whiteSpace: 'nowrap', padding: '0 16px', fontSize: '0.8rem' }}
                          onClick={handleAddManualChunk}
                        >
                          + Add Link
                        </button>
                      </div>

                      {/* Chunks List */}
                      {csChunks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                          {csChunks.map((url, idx) => {
                            const isVid = url.match(/\.(mp4|webm|ogg|mov)$/i);
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 12,
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  background: 'var(--adm-surface)',
                                  border: '1px solid var(--adm-border)',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--adm-text-muted)' }}>
                                    #{idx + 1}
                                  </span>
                                  {isVid ? (
                                    <video src={url} style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                                  ) : (
                                    <img src={url} alt={`Chunk ${idx}`} style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 4 }} />
                                  )}
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                                    {url.split('/').pop()}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    type="button"
                                    className="adm-icon-btn"
                                    style={{ width: 26, height: 26 }}
                                    onClick={() => handleMoveChunk(idx, 'up')}
                                    disabled={idx === 0}
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    className="adm-icon-btn"
                                    style={{ width: 26, height: 26 }}
                                    onClick={() => handleMoveChunk(idx, 'down')}
                                    disabled={idx === csChunks.length - 1}
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    className="adm-btn-danger"
                                    style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                    onClick={() => handleRemoveChunk(idx)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="adm-modal-foot">
                <button
                  type="button"
                  className="adm-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="adm-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving to Database...' : editingId ? 'Update Project' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
