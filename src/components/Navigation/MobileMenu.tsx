import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ArrowUpRight, Volume2, VolumeX, X } from 'lucide-react';
import { natureAudio } from '../../services/natureAudioService';
import './MobileMenu.css';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: 'projects' | 'how-i-work' | 'about-me' | 'contact';
  onNavigateProjects: () => void;
  onNavigateHowIWork: () => void;
  onNavigateAboutMe: () => void;
  onBookCall: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  activeSection = 'projects',
  onNavigateProjects,
  onNavigateHowIWork,
  onNavigateAboutMe,
  onBookCall,
}) => {
  const [isSoundPlaying, setIsSoundPlaying] = useState(natureAudio.isPlaying());

  useEffect(() => {
    const unsub = natureAudio.subscribe(setIsSoundPlaying);
    return unsub;
  }, []);

  // Prevent background scroll when menu is open and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const navItems = [
    {
      num: '01',
      label: 'Projects',
      desc: 'Selected works & product architectures',
      action: () => {
        onNavigateProjects();
        onClose();
      },
      isActive: activeSection === 'projects',
    },
    {
      num: '02',
      label: 'How I work',
      desc: 'Value pillars, metrics & testimonials',
      action: () => {
        onNavigateHowIWork();
        onClose();
      },
      isActive: activeSection === 'how-i-work',
    },
    {
      num: '03',
      label: 'About me',
      desc: 'Philosophy, background & capabilities',
      action: () => {
        onNavigateAboutMe();
        onClose();
      },
      isActive: activeSection === 'about-me',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="mobile-menu-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Frosted Glass Sheet Anchored from Nav */}
          <motion.div
            className="mobile-menu-sheet"
            initial={{ y: 28, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Top Bar */}
            <div className="mobile-menu-header">
              <div className="mobile-menu-brand">
                <div className="mobile-menu-avatar">
                  <img
                    src="/assets/nav face logo.png"
                    alt="Emmanuel Bliss"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/favicon.png';
                    }}
                  />
                </div>
                <div className="mobile-menu-brand-text">
                  <span className="mobile-menu-name">EMMANUEL BLISS</span>
                  <span className="mobile-menu-role">Product Designer</span>
                </div>
              </div>

              <button
                type="button"
                className="mobile-menu-close-btn"
                onClick={onClose}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="mobile-menu-nav">
              {navItems.map((item, idx) => (
                <motion.button
                  key={item.num}
                  type="button"
                  className={`mobile-menu-item ${item.isActive ? 'is-active' : ''}`}
                  onClick={item.action}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08 + idx * 0.06 }}
                >
                  <div className="mobile-menu-item-left">
                    <span className="mobile-menu-item-num">{item.num}</span>
                    <div className="mobile-menu-item-info">
                      <span className="mobile-menu-item-label">{item.label}</span>
                      <span className="mobile-menu-item-desc">{item.desc}</span>
                    </div>
                  </div>
                  <ArrowUpRight size={18} className="mobile-menu-item-arrow" />
                </motion.button>
              ))}
            </nav>

            {/* Nature Ambiance Sound Toggle Inside Menu */}
            <motion.div
              className="mobile-menu-sound-box"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <div className="mobile-menu-sound-info">
                <div className={`mobile-menu-sound-icon ${isSoundPlaying ? 'is-active' : ''}`}>
                  {isSoundPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </div>
                <div className="mobile-menu-sound-text">
                  <span className="mobile-menu-sound-title">Sky Ambiance</span>
                  <span className="mobile-menu-sound-sub">Atmospheric clouds &amp; distant jet</span>
                </div>
              </div>

              <button
                type="button"
                className={`mobile-menu-sound-btn ${isSoundPlaying ? 'is-playing' : ''}`}
                onClick={() => natureAudio.toggle()}
                aria-label="Toggle sky ambiance sound"
              >
                {isSoundPlaying && (
                  <div className="mobile-sound-wave" aria-hidden="true">
                    <span className="wave-bar wb-1" />
                    <span className="wave-bar wb-2" />
                    <span className="wave-bar wb-3" />
                  </div>
                )}
                <span>{isSoundPlaying ? 'Playing' : 'Muted'}</span>
              </button>
            </motion.div>

            {/* Primary Action: Book a Call */}
            <motion.div
              className="mobile-menu-cta-wrap"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
            >
              <button
                type="button"
                className="mobile-menu-cta-btn"
                onClick={() => {
                  onBookCall();
                  onClose();
                }}
              >
                <Calendar size={17} />
                <span>Book a discovery call</span>
                <ArrowUpRight size={16} />
              </button>
            </motion.div>

            {/* Footer */}
            <div className="mobile-menu-footer">
              <span className="mobile-menu-copy">
                &copy; {new Date().getFullYear()} Emmanuel Bliss
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
