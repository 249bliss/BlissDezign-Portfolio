import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { AdminInsights } from './components/AdminInsights';
import { AdminProjects } from './components/AdminProjects';
import { AdminReviews } from './components/AdminReviews';
import { AdminLeads } from './components/AdminLeads';
import { AdminJournal } from './components/AdminJournal';
import {
  TrendingUp,
  Briefcase,
  Star,
  Mail,
  FileText,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import './AdminDashboard.css';

const WHITELISTED_ADMINS = ['bliss@kre8mind.com', 'workwithblissdezign@gmail.com'];

interface Props {
  onExit?: () => void;
}

export type AdminTab = 'insights' | 'projects' | 'reviews' | 'leads' | 'journal';

export const AdminDashboard: React.FC<Props> = ({ onExit }) => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.search.includes('preview=true');
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? !window.location.search.includes('preview=true') : true;
  });
  const [userEmail, setUserEmail] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Dashboard Navigation & Theme
  const [activeTab, setActiveTab] = useState<AdminTab>('insights');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('admin-theme') as 'light' | 'dark') || 'light';
  });

  // Global Toasts & Confirmations
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    message: '',
    action: async () => {},
  });

  // Enable native window and body scrolling for Admin dashboard
  useEffect(() => {
    document.documentElement.classList.add('adm-active');
    document.body.classList.add('adm-active');
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.classList.add('adm-active');

    return () => {
      document.documentElement.classList.remove('adm-active');
      document.body.classList.remove('adm-active');
      if (rootEl) rootEl.classList.remove('adm-active');
    };
  }, []);

  // Verify Session on Load
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.search.includes('preview=true')) {
          setIsAuthenticated(true);
          setUserEmail('bliss@kre8mind.com');
          setIsCheckingAuth(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const email = session.user.email.toLowerCase().trim();
          if (WHITELISTED_ADMINS.includes(email)) {
            setIsAuthenticated(true);
            setUserEmail(email);
          } else {
            setIsAuthenticated(false);
            setAuthError('Access Denied: This account is not authorized to access CMS Studio.');
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase().trim();
        if (WHITELISTED_ADMINS.includes(email)) {
          setIsAuthenticated(true);
          setUserEmail(email);
        }
      } else if (typeof window !== 'undefined' && !window.location.search.includes('preview=true')) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const trimmedEmail = loginEmail.toLowerCase().trim();

    if (!WHITELISTED_ADMINS.includes(trimmedEmail)) {
      setAuthError('Access Denied: Unauthorized admin email.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: loginPassword,
      });

      if (error) {
        setAuthError(error.message);
      } else if (data.session) {
        setIsAuthenticated(true);
        setUserEmail(trimmedEmail);
        showToast('Welcome back, Emmanuel');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    showToast('Logged out');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('admin-theme', nextTheme);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  };

  const requestConfirm = (message: string, action: () => Promise<void>) => {
    setConfirmDialog({
      isOpen: true,
      message,
      action,
    });
  };

  const handleConfirmAction = async () => {
    const actionToRun = confirmDialog.action;
    setConfirmDialog({ isOpen: false, message: '', action: async () => {} });
    await actionToRun();
  };

  const handleReturnToSite = () => {
    if (onExit) {
      onExit();
    } else {
      window.history.pushState(null, '', '/');
      window.location.href = '/';
    }
  };

  // ── AUTHENTICATION SCREEN ──
  if (isCheckingAuth) {
    return (
      <div className="adm-app" data-admin-theme={theme} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--adm-text-muted)', fontSize: '0.88rem' }}>Loading CMS Studio...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="adm-app" data-admin-theme={theme}>
        <div className="adm-bg-glow" />
        <div className="adm-auth-overlay">
          <div className="adm-auth-card">
            <div className="adm-auth-header">
              <img
                src="/assets/favicon.png"
                alt="Emmanuel Bliss"
                className="adm-auth-logo"
              />
              <h2 className="adm-auth-title">Welcome Back</h2>
              <p className="adm-auth-desc">Login to manage your portfolio architecture & exhibits.</p>
            </div>

            {authError && (
              <div className="adm-auth-error">
                <AlertCircle size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="adm-form-group">
                <label className="adm-form-label">Email Address</label>
                <input
                  type="email"
                  className="adm-form-input"
                  placeholder="bliss@kre8mind.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="adm-form-input"
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--adm-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="adm-btn-primary"
                style={{ width: '100%', height: 46, marginTop: 8 }}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Authenticating...' : 'Secure Studio Access'}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleReturnToSite}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--adm-text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Return to Live Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED DASHBOARD ──
  return (
    <div className="adm-app" data-admin-theme={theme}>
      <div className="adm-bg-glow" />

      {/* Top Navigation Bar */}
      <header className="adm-topbar">
        {/* Brand */}
        <div className="adm-brand-area" onClick={() => setActiveTab('insights')}>
          <img
            src="/assets/favicon.png"
            alt="Emmanuel Bliss"
            className="adm-brand-avatar"
          />
          <span className="adm-brand-title">
            Emmanuel Bliss
            <span className="adm-brand-badge">CMS Studio</span>
          </span>
        </div>

        {/* Central Tab Dock (Desktop) */}
        <nav className="adm-nav-dock">
          <button
            className={`adm-nav-pill ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <TrendingUp size={15} />
            <span>Insights</span>
          </button>

          <button
            className={`adm-nav-pill ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <Briefcase size={15} />
            <span>Projects</span>
          </button>

          <button
            className={`adm-nav-pill ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Star size={15} />
            <span>Endorsements</span>
          </button>

          <button
            className={`adm-nav-pill ${activeTab === 'leads' ? 'active' : ''}`}
            onClick={() => setActiveTab('leads')}
          >
            <Mail size={15} />
            <span>Inquiries</span>
          </button>

          <button
            className={`adm-nav-pill ${activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            <FileText size={15} />
            <span>Journal</span>
          </button>
        </nav>

        {/* Actions Area */}
        <div className="adm-topbar-actions">
          {/* Theme Toggle */}
          <button
            className="adm-icon-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Daylight Theme'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* View Live Site */}
          <button
            className="adm-exit-btn"
            onClick={handleReturnToSite}
            title="Return to the live portfolio interface"
          >
            <ExternalLink size={14} />
            <span>Live Site</span>
          </button>

          {/* Logout */}
          <button
            className="adm-icon-btn"
            onClick={handleLogout}
            title={userEmail ? `Log Out (${userEmail})` : 'Log Out'}
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="adm-main">
        {activeTab === 'insights' && <AdminInsights />}
        {activeTab === 'projects' && (
          <AdminProjects onShowToast={showToast} onConfirm={requestConfirm} />
        )}
        {activeTab === 'reviews' && (
          <AdminReviews onShowToast={showToast} onConfirm={requestConfirm} />
        )}
        {activeTab === 'leads' && <AdminLeads onShowToast={showToast} />}
        {activeTab === 'journal' && (
          <AdminJournal onShowToast={showToast} onConfirm={requestConfirm} />
        )}
      </main>

      {/* Mobile Bottom Navigation Dock */}
      <nav className="adm-mobile-dock">
        <button
          className={`adm-mobile-tab ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <TrendingUp size={18} />
          <span>Insights</span>
        </button>

        <button
          className={`adm-mobile-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <Briefcase size={18} />
          <span>Projects</span>
        </button>

        <button
          className={`adm-mobile-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <Star size={18} />
          <span>Reviews</span>
        </button>

        <button
          className={`adm-mobile-tab ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Mail size={18} />
          <span>Leads</span>
        </button>

        <button
          className={`adm-mobile-tab ${activeTab === 'journal' ? 'active' : ''}`}
          onClick={() => setActiveTab('journal')}
        >
          <FileText size={18} />
          <span>Journal</span>
        </button>
      </nav>

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="adm-modal-backdrop" onClick={() => setConfirmDialog({ isOpen: false, message: '', action: async () => {} })}>
          <div className="adm-modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-head">
              <h3 className="adm-modal-title">Confirm Action</h3>
            </div>
            <div className="adm-modal-body" style={{ padding: '20px 24px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--adm-text-secondary)' }}>
                {confirmDialog.message}
              </p>
            </div>
            <div className="adm-modal-foot">
              <button
                className="adm-btn-secondary"
                onClick={() => setConfirmDialog({ isOpen: false, message: '', action: async () => {} })}
              >
                Cancel
              </button>
              <button className="adm-btn-danger" onClick={handleConfirmAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toastMessage && (
        <div className="adm-toast-container">
          <div className="adm-toast">
            <CheckCircle size={15} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
