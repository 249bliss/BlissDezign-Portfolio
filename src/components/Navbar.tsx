import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Sparkles } from 'lucide-react';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar-wrapper">
      <nav className="navbar glass-panel">
        <a href="#" className="navbar-brand">
          <img
            src="/assets/nav face logo.png"
            alt="Emmanuel Bliss"
            className="brand-avatar"
            onError={(e) => {
              // Fallback if image path differs
              (e.target as HTMLImageElement).src = '/assets/Aaron.png';
            }}
          />
          <span>Emmanuel Bliss</span>
        </a>

        <ul className="navbar-links">
          <li><a href="#work" className="nav-link">Work</a></li>
          <li><a href="#story" className="nav-link">Story</a></li>
          <li><a href="#experience" className="nav-link">Experience</a></li>
          <li><a href="#contact" className="nav-link">Contact</a></li>
        </ul>

        <div className="navbar-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <a href="#contact" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
            <Sparkles size={16} />
            <span>Let's Talk</span>
          </a>
        </div>
      </nav>
    </header>
  );
};
