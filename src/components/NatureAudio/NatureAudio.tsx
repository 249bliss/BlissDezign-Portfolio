import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { natureAudio } from '../../services/natureAudioService';
import './NatureAudio.css';

export const NatureAudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(natureAudio.isPlaying());

  useEffect(() => {
    const unsubscribe = natureAudio.subscribe(setIsPlaying);
    return unsubscribe;
  }, []);

  return (
    <button
      type="button"
      className={`nature-sound-toggle ${isPlaying ? 'is-active' : ''}`}
      onClick={() => natureAudio.toggle()}
      title={isPlaying ? 'Mute sky ambiance' : 'Play atmospheric sky ambiance (clouds & distant jet)'}
      aria-label="Toggle sky ambiance"
    >
      <div className="nature-sound-icon-wrap">
        {isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </div>
      <span className="nature-sound-label">
        {isPlaying ? 'Sky Ambiance' : 'Sound'}
      </span>
      {isPlaying && (
        <div className="nature-sound-bars" aria-hidden="true">
          <span className="sound-bar bar-1" />
          <span className="sound-bar bar-2" />
          <span className="sound-bar bar-3" />
        </div>
      )}
    </button>
  );
};
