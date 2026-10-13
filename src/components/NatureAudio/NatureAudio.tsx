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
      title={isPlaying ? 'Mute nature ambiance' : 'Play peaceful nature sounds (birds & breeze)'}
      aria-label="Toggle nature ambiance"
    >
      <div className="nature-sound-icon-wrap">
        {isPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </div>
      <span className="nature-sound-label">
        {isPlaying ? 'Nature Ambiance' : 'Sound'}
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
