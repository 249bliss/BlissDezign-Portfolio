import React, { useState, useEffect, useRef } from 'react';
import {
  fetchPostsFromSupabase,
  upsertPostInSupabase,
  deletePostInSupabase,
  uploadAssetToSupabase,
  SupabasePost,
} from '../../../services/supabaseClient';
import { Plus, Edit3, Trash2, UploadCloud, X, FileText } from 'lucide-react';

interface Props {
  onShowToast: (message: string) => void;
  onConfirm: (message: string, action: () => Promise<void>) => void;
}

export const AdminJournal: React.FC<Props> = ({ onShowToast, onConfirm }) => {
  const [posts, setPosts] = useState<SupabasePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await fetchPostsFromSupabase();
    setPosts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormSlug('');
    setFormExcerpt('');
    setFormContent('');
    setFormCoverImage('');
    setFormIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: SupabasePost) => {
    setEditingId(p.id);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormExcerpt(p.excerpt || '');
    setFormContent(p.content || '');
    setFormCoverImage(p.cover_image || '');
    setFormIsPublished(p.is_published ?? true);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingId) {
      setFormSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadAssetToSupabase(file, 'blog');
      setFormCoverImage(url);
      onShowToast('Article cover uploaded');
    } catch (err: any) {
      onShowToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSlug.trim()) {
      onShowToast('Title and slug are required');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<SupabasePost> = {
        id: editingId || undefined,
        title: formTitle.trim(),
        slug: formSlug.trim().toLowerCase(),
        excerpt: formExcerpt.trim(),
        content: formContent.trim(),
        cover_image: formCoverImage.trim(),
        is_published: formIsPublished,
        published_at: formIsPublished ? new Date().toISOString() : undefined,
      };

      await upsertPostInSupabase(payload);
      onShowToast(`Post "${formTitle}" saved`);
      setIsModalOpen(false);
      loadPosts();
    } catch (err: any) {
      onShowToast(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = (post: SupabasePost) => {
    onConfirm(`Delete article "${post.title}"?`, async () => {
      try {
        await deletePostInSupabase(post.id);
        onShowToast(`Post deleted`);
        loadPosts();
      } catch (err: any) {
        onShowToast(`Error: ${err.message}`);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Panel Head */}
      <div className="adm-panel-head">
        <div className="adm-panel-title-area">
          <span className="adm-panel-eyebrow">Insights & Writing</span>
          <h2 className="adm-panel-title">Journal & Articles</h2>
          <p className="adm-panel-desc">Longform design thinking, frameworks, and product craft reflections.</p>
        </div>

        <div className="adm-panel-actions">
          <button className="adm-btn-primary" onClick={openNewModal}>
            <Plus size={16} />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          Loading articles...
        </div>
      ) : posts.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          No journal articles published yet. Tap "New Article" to start drafting.
        </div>
      ) : (
        <div className="adm-projects-grid">
          {posts.map((post) => (
            <div key={post.id} className="adm-project-card">
              <div className="adm-project-thumb-frame" style={{ height: 160 }}>
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="adm-project-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/favicon.png';
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-text-muted)' }}>
                    <FileText size={32} />
                  </div>
                )}

                <div className="adm-project-badges">
                  <span className={`adm-badge ${post.is_published ? 'case-study' : ''}`}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <div className="adm-project-body">
                <span className="adm-project-id">/{post.slug}</span>
                <h3 className="adm-project-title">{post.title}</h3>
                <p className="adm-project-subtitle">{post.excerpt || 'No excerpt written yet.'}</p>

                <div className="adm-project-actions" style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Draft'}
                  </span>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="adm-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => openEditModal(post)}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="adm-btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleDeletePost(post)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD / EDIT POST MODAL ── */}
      {isModalOpen && (
        <div className="adm-modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3 className="adm-modal-title">
                {editingId ? 'Edit Article' : 'Draft Article'}
              </h3>
              <button
                className="adm-icon-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSavePost}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-form-label">Article Title</label>
                  <input
                    type="text"
                    className="adm-form-input"
                    placeholder="e.g. Designing for High Velocity Systems"
                    value={formTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Slug URL Path</label>
                  <input
                    type="text"
                    className="adm-form-input"
                    placeholder="e.g. designing-high-velocity-systems"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Cover Image</label>
                  <div
                    className="adm-dropzone"
                    style={{ padding: '16px 12px' }}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleCoverUpload}
                    />
                    <UploadCloud size={20} color="var(--adm-text-muted)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {isUploadingCover ? 'Uploading Cover...' : 'Upload Cover Image'}
                    </span>
                  </div>
                  {formCoverImage && (
                    <div className="adm-dropzone-preview" style={{ height: 120, marginTop: 8 }}>
                      <img src={formCoverImage} alt="Cover Preview" />
                    </div>
                  )}
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Short Excerpt</label>
                  <textarea
                    className="adm-form-textarea"
                    placeholder="Brief 1-2 sentence preview..."
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Article Content (Markdown / HTML)</label>
                  <textarea
                    className="adm-form-textarea"
                    placeholder="Write article body..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={8}
                  />
                </div>

                <label className="adm-switch-wrap">
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.86rem' }}>Publish Immediately</strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                      Make visible on public journal feed.
                    </span>
                  </div>
                  <div className="adm-switch">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                    />
                    <span className="adm-switch-slider round" />
                  </div>
                </label>
              </div>

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
                  {isSaving ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
