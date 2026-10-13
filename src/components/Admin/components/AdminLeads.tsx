import React, { useState, useEffect } from 'react';
import {
  fetchMessagesFromSupabase,
  fetchSubscribersFromSupabase,
  SupabaseMessage,
  SupabaseSubscriber,
} from '../../../services/supabaseClient';
import { Mail, Copy, Check, Search, RefreshCw } from 'lucide-react';

interface Props {
  onShowToast: (message: string) => void;
}

export const AdminLeads: React.FC<Props> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'subscribers'>('messages');
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [subscribers, setSubscribers] = useState<SupabaseSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const loadAll = async () => {
    setIsLoading(true);
    const [msgs, subs] = await Promise.all([
      fetchMessagesFromSupabase(),
      fetchSubscribersFromSupabase(),
    ]);
    setMessages(msgs);
    setSubscribers(subs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredMessages = messages.filter((m) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubscribers = subscribers.filter((s) =>
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopySubscribers = () => {
    const emails = subscribers.map((s) => s.email).filter(Boolean).join(', ');
    if (!emails) {
      onShowToast('No subscriber emails to copy');
      return;
    }
    navigator.clipboard.writeText(emails);
    setHasCopied(true);
    onShowToast(`Copied ${subscribers.length} subscriber emails to clipboard`);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Panel Head */}
      <div className="adm-panel-head">
        <div className="adm-panel-title-area">
          <span className="adm-panel-eyebrow">Direct Relations</span>
          <h2 className="adm-panel-title">Inquiries & Audience</h2>
          <p className="adm-panel-desc">Direct communications submitted through your portfolio contact touchpoints.</p>
        </div>

        <div className="adm-panel-actions">
          <div className="adm-filter-pills">
            <button
              className={`adm-filter-pill ${activeTab === 'messages' ? 'active' : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Direct Leads ({messages.length})
            </button>
            <button
              className={`adm-filter-pill ${activeTab === 'subscribers' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscribers')}
            >
              Subscribers ({subscribers.length})
            </button>
          </div>

          <button
            className="adm-icon-btn"
            onClick={loadAll}
            title="Refresh Inquiries"
            disabled={isLoading}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search and Secondary Action */}
      <div className="adm-controls-bar">
        <div className="adm-search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="adm-search-input"
            placeholder={activeTab === 'messages' ? 'Search sender, email or message...' : 'Search subscriber email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'subscribers' && (
          <button className="adm-btn-secondary" onClick={handleCopySubscribers}>
            {hasCopied ? <Check size={14} /> : <Copy size={14} />}
            <span>Copy All Emails</span>
          </button>
        )}
      </div>

      {/* Messages Feed View */}
      {activeTab === 'messages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {isLoading ? (
            <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
              Loading direct messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="adm-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
              No messages found.
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const dateStr = new Date(msg.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const timeStr = new Date(msg.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={msg.id} className="adm-card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--adm-font-display)' }}>
                        {msg.name}
                      </h4>
                      <a
                        href={`mailto:${msg.email}`}
                        style={{ fontSize: '0.82rem', color: 'var(--adm-text-muted)', textDecoration: 'none' }}
                      >
                        {msg.email}
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>
                        {dateStr} at {timeStr}
                      </span>
                      <a
                        href={`mailto:${msg.email}?subject=Re: Inquiring with Emmanuel Bliss`}
                        className="adm-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '0.78rem', textDecoration: 'none' }}
                      >
                        <Mail size={13} />
                        <span>Reply</span>
                      </a>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'var(--adm-surface-active)',
                      padding: '14px 18px',
                      borderRadius: 14,
                      fontSize: '0.88rem',
                      lineHeight: 1.55,
                      color: 'var(--adm-text-secondary)',
                      border: '1px solid var(--adm-border-subtle)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subscribers Table View */}
      {activeTab === 'subscribers' && (
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
              Loading subscribers...
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-muted)' }}>
              No subscribers found.
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-surface-active)', borderBottom: '1px solid var(--adm-border)' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--adm-text-muted)' }}>Subscriber Email</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--adm-text-muted)' }}>Date Joined</th>
                    <th style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--adm-text-muted)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((sub, idx) => (
                    <tr
                      key={sub.id || idx}
                      style={{ borderBottom: '1px solid var(--adm-border-subtle)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 500, color: 'var(--adm-text-primary)' }}>
                        {sub.email}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'var(--adm-text-muted)', fontSize: '0.8rem' }}>
                        {new Date(sub.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          className="adm-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          onClick={() => {
                            navigator.clipboard.writeText(sub.email);
                            onShowToast(`Copied ${sub.email}`);
                          }}
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
