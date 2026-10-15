import React from 'react';
import { Globe, LayoutGrid } from 'lucide-react';
import './TopViewSwitcher.css';

export type ViewMode = 'sphere' | 'grid';

export interface TopViewSwitcherProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  visible?: boolean;
}

export const TopViewSwitcher: React.FC<TopViewSwitcherProps> = ({
  currentView,
  onViewChange,
  visible = true,
}) => {
  return (
    <div
      className={`top-view-switcher-wrap ${visible ? 'is-visible' : 'is-hidden'}`}
      role="region"
      aria-label="View Mode Toggle"
    >
      <div className="top-view-switcher">
        <button
          type="button"
          className={`top-view-btn ${currentView === 'sphere' ? 'is-active' : ''}`}
          onClick={() => onViewChange('sphere')}
          aria-pressed={currentView === 'sphere'}
        >
          <Globe size={13} className="top-view-icon" />
          <span>Sphere</span>
        </button>

        <button
          type="button"
          className={`top-view-btn ${currentView === 'grid' ? 'is-active' : ''}`}
          onClick={() => onViewChange('grid')}
          aria-pressed={currentView === 'grid'}
        >
          <LayoutGrid size={13} className="top-view-icon" />
          <span>Grid</span>
        </button>
      </div>
    </div>
  );
};
