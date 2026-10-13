import React, { useState, useEffect, useRef } from 'react';
import {
  fetchReviewsFromSupabase,
  upsertReviewInSupabase,
  deleteReviewInSupabase,
  uploadAssetToSupabase,
  SupabaseReview,
} from '../../../services/supabaseClient';
import { Plus, Edit3, Trash2, UploadCloud, X, Quote } from 'lucide-react';

interface Props {
  onShowToast: (message: string) => void;
  onConfirm: (message: string, action: () => Promise<void>) => void;
}

export const AdminReviews: React.FC<Props> = ({ onShowToast, onConfirm }) => {
  const [reviews, setReviews] = useState<SupabaseReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formText, setFormText] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    const data = await fetchReviewsFromSupabase();
    setReviews(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setFormName('');
    setFormRole('');
    setFormText('');
    setFormOrder(reviews.length > 0 ? Math.max(...reviews.map((r) => r.display_order || 0)) + 1 : 1);
    setFormAvatarUrl('');
    setFormLogoUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (rev: SupabaseReview) => {
    setEditingId(rev.id);
    setFormName(rev.author_name);
    setFormRole(rev.author_role);
    setFormText(rev.review_text);
    setFormOrder(rev.display_order ?? 0);

    const parts = rev.avatar_url ? rev.avatar_url.split('|||') : [];
    setFormAvatarUrl(parts[0] || '');
    setFormLogoUrl(parts[1] || '');

    setIsModalOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadAssetToSupabase(file, 'reviews');
      setFormAvatarUrl(url);
      onShowToast('Avatar uploaded successfully');
    } catch (err: any) {
      onShowToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadAssetToSupabase(file, 'reviews');
      setFormLogoUrl(url);
      onShowToast('Company logo uploaded successfully');
    } catch (err: any) {
      onShowToast(`Upload error: ${err.message}`);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) {
      onShowToast('Author name and testimonial text are required');
      return;
    }

    setIsSaving(true);
    try {
      const combinedAvatar = formLogoUrl.trim()
        ? `${formAvatarUrl.trim()}|||${formLogoUrl.trim()}`
        : formAvatarUrl.trim();

      const payload: Partial<SupabaseReview> = {
        id: editingId || undefined,
        author_name: formName.trim(),
        author_role: formRole.trim(),
        review_text: formText.trim(),
        avatar_url: combinedAvatar,
        display_order: Number(formOrder) || 0,
      };

      await upsertReviewInSupabase(payload);
      onShowToast(`Testimonial by "${formName}" saved`);
      setIsModalOpen(false);
      loadReviews();
    } catch (err: any) {
      onShowToast(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = (rev: SupabaseReview) => {
    onConfirm(`Delete testimonial from "${rev.author_name}"?`, async () => {
      try {
        await deleteReviewInSupabase(rev.id);
        onShowToast(`Testimonial deleted`);
        loadReviews();
      } catch (err: any) {
        onShowToast(`Error: ${err.message}`);
      }
    });
  };

  const handleQuickOrderChange = async (rev: SupabaseReview, newOrder: number) => {
    try {
      await upsertReviewInSupabase({ id: rev.id, display_order: newOrder });
      loadReviews();
    } catch (err: any) {
      onShowToast(`Failed to update order: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Panel Header */}
      <div className="adm-panel-head">
        <div className="adm-panel-title-area">
          <span className="adm-panel-eyebrow">Client Validation</span>
          <h2 className="adm-panel-title">Endorsements & Testimonials</h2>
          <p className="adm-panel-desc">Testimonials from founders, leaders, and design executives.</p>
        </div>

        <div className="adm-panel-actions">
          <button className="adm-btn-primary" onClick={openNewModal}>
            <Plus size={16} />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          Loading testimonials...
        </div>
      ) : reviews.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
          No testimonials published yet. Tap "Add Testimonial" to create one.
        </div>
      ) : (
        <div className="adm-reviews-grid">
          {reviews.map((rev) => {
            const parts = rev.avatar_url ? rev.avatar_url.split('|||') : [];
            const avatarSrc = parts[0] || '';
            const logoSrc = parts[1] || '';

            return (
              <div key={rev.id} className="adm-review-card">
                {/* Header */}
                <div className="adm-review-header">
                  <div className="adm-review-author">
                    <img
                      src={avatarSrc || '/assets/favicon.png'}
                      alt={rev.author_name}
                      className="adm-review-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/favicon.png';
                      }}
                    />
                    <div className="adm-review-author-info">
                      <span className="adm-review-name">{rev.author_name}</span>
                      <span className="adm-review-role">{rev.author_role}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {logoSrc && (
                      <img
                        src={logoSrc}
                        alt="Client Logo"
                        style={{ height: 18, maxWidth: 60, objectFit: 'contain', opacity: 0.8 }}
                      />
                    )}
                    <Quote size={20} color="var(--adm-text-muted)" style={{ opacity: 0.4 }} />
                  </div>
                </div>

                {/* Review Text */}
                <p className="adm-review-quote">
                  "{rev.review_text}"
                </p>

                {/* Logos or Order and Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--adm-border-subtle)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)', fontWeight: 600 }}>Order:</span>
                    <input
                      type="number"
                      value={rev.display_order ?? 0}
                      onChange={(e) => handleQuickOrderChange(rev, parseInt(e.target.value) || 0)}
                      style={{
                        width: 44,
                        padding: '3px 6px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        borderRadius: 6,
                        border: '1px solid var(--adm-border)',
                        background: 'var(--adm-surface-active)',
                        color: 'var(--adm-text-primary)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="adm-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => openEditModal(rev)}
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      className="adm-btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                      onClick={() => handleDeleteReview(rev)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD / EDIT TESTIMONIAL MODAL ── */}
      {isModalOpen && (
        <div className="adm-modal-backdrop" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3 className="adm-modal-title">
                {editingId ? 'Edit Testimonial' : 'Add Testimonial'}
              </h3>
              <button
                className="adm-icon-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReview}>
              <div className="adm-modal-body">
                <div className="adm-form-grid-2">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Client / Executive Name</label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. Alexandre Delcroix"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">Role & Company</label>
                    <input
                      type="text"
                      className="adm-form-input"
                      placeholder="e.g. Founder & CEO, Swychr Global"
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">Testimonial Quote</label>
                  <textarea
                    className="adm-form-textarea"
                    placeholder="Paste executive endorsement here..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-form-label">
                    <span>Display Order</span>
                    <span className="adm-form-label-sub">Lower number appears first</span>
                  </label>
                  <input
                    type="number"
                    className="adm-form-input"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Avatar and Logo Upload */}
                <div className="adm-form-grid-2">
                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Author Portrait / Avatar</span>
                    </label>
                    <div
                      className="adm-dropzone"
                      style={{ padding: '16px 12px' }}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarUpload}
                      />
                      <UploadCloud size={20} color="var(--adm-text-muted)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                      </span>
                    </div>
                    {formAvatarUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <img
                          src={formAvatarUrl}
                          alt="Avatar Preview"
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>Avatar active</span>
                      </div>
                    )}
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">
                      <span>Company Logo (Optional)</span>
                    </label>
                    <div
                      className="adm-dropzone"
                      style={{ padding: '16px 12px' }}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleLogoUpload}
                      />
                      <UploadCloud size={20} color="var(--adm-text-muted)" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </span>
                    </div>
                    {formLogoUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                        <img
                          src={formLogoUrl}
                          alt="Logo Preview"
                          style={{ height: 24, objectFit: 'contain' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-text-muted)' }}>Logo active</span>
                      </div>
                    )}
                  </div>
                </div>
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
                  {isSaving ? 'Saving...' : editingId ? 'Update Testimonial' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
