import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import './IntroSequence.css';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const cardFrameRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const mouseCursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const animationTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasTriggeredRef = useRef(false);

  // Trigger the click-and-zoom sequence (either automatically from cursor or on user click)
  const triggerZoomSequence = useCallback(() => {
    if (hasTriggeredRef.current || !cardFrameRef.current) return;
    hasTriggeredRef.current = true;

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // 1. Tactile click feedback on the card
    tl.to(cardFrameRef.current, {
      scale: 0.96,
      duration: 0.12,
      ease: 'power2.in',
      force3D: true,
    });

    // Shockwave ripple at click point
    if (rippleRef.current) {
      tl.fromTo(
        rippleRef.current,
        { scale: 0.2, opacity: 0.85, force3D: true },
        { scale: 2.5, opacity: 0, duration: 0.35, ease: 'power2.out', force3D: true },
        '<'
      );
    }

    if (mouseCursorRef.current) {
      tl.to(
        mouseCursorRef.current,
        {
          scale: 0.8,
          duration: 0.1,
          ease: 'power2.in',
        },
        '<'
      );
      tl.to(mouseCursorRef.current, {
        opacity: 0,
        scale: 0.5,
        duration: 0.2,
        ease: 'power2.out',
      });
    }

    // 2. Split text slides away seamlessly
    if (leftTextRef.current) {
      tl.to(
        leftTextRef.current,
        {
          x: -140,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.inOut',
          force3D: true,
        },
        '-=0.1'
      );
    }
    if (rightTextRef.current) {
      tl.to(
        rightTextRef.current,
        {
          x: 140,
          opacity: 0,
          duration: 0.6,
          ease: 'power3.inOut',
          force3D: true,
        },
        '<'
      );
    }

    // 3. Card blooms and expands into the screen (hyperspace dive into project space)
    const targetScale = Math.max(window.innerWidth / 360, window.innerHeight / 240) * 1.35;
    tl.to(
      cardFrameRef.current,
      {
        scale: targetScale,
        opacity: 0,
        duration: 0.75,
        ease: 'power3.inOut',
        force3D: true,
      },
      '<'
    );

    // 4. Fade out overlay concurrently so 3D celestial sphere zooms in seamlessly
    if (overlayRef.current) {
      tl.to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
        '-=0.35'
      );
    }
  }, [onComplete]);

  // Preload intro image for 0.0ms instant visual render
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/intro-image.webp';
    const onDone = () => setIsLoaded(true);
    if (img.complete) {
      onDone();
    } else {
      img.onload = onDone;
      img.onerror = () => {
        // Fallback to png
        const fb = new Image();
        fb.src = '/assets/intro-image.png';
        fb.onload = onDone;
        fb.onerror = onDone;
      };
    }
  }, []);

  // Run autonomous cursor animation once image is loaded
  useEffect(() => {
    if (!isLoaded) return;

    // Initial GPU state
    gsap.set(overlayRef.current, { opacity: 1 });
    if (cardFrameRef.current) {
      gsap.fromTo(
        cardFrameRef.current,
        { opacity: 0, scale: 0.94, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'power2.out', force3D: true }
      );
    }
    if (leftTextRef.current) {
      gsap.fromTo(
        leftTextRef.current,
        { opacity: 0, x: -30 },
        { opacity: 1, x: 0, duration: 0.65, ease: 'power2.out', delay: 0.1 }
      );
    }
    if (rightTextRef.current) {
      gsap.fromTo(
        rightTextRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.65, ease: 'power2.out', delay: 0.1 }
      );
    }

    // Cursor entry timeline
    const tl = gsap.timeline({ delay: 0.35 });
    animationTimelineRef.current = tl;

    if (mouseCursorRef.current) {
      // 1. Cursor glides into the center over "Meet Emmanuel Bliss"
      tl.fromTo(
        mouseCursorRef.current,
        { x: 160, y: 120, opacity: 0, scale: 0.85 },
        {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          ease: 'power2.out',
          force3D: true,
        }
      );

      // 2. Organic hover pause so the user can read the card (0.8s)
      tl.to({}, { duration: 0.8 });

      // 3. Trigger click and zoom
      tl.add(() => {
        triggerZoomSequence();
      });
    }

    return () => {
      tl.kill();
    };
  }, [isLoaded, triggerZoomSequence]);

  return (
    <div
      ref={overlayRef}
      className="intro-sequence-overlay"
      role="dialog"
      aria-label="Welcome to Emmanuel Bliss Portfolio"
    >
      {/* ── Split Typographic Framing ── */}
      <div ref={leftTextRef} className="intro-split-text intro-split-text--left">
        Clarity
      </div>
      <div ref={rightTextRef} className="intro-split-text intro-split-text--right">
        By Design
      </div>

      {/* ── Centered Hero Card ("Meet Emmanuel Bliss") ── */}
      <div
        ref={cardFrameRef}
        className="intro-hero-card-container"
        onClick={triggerZoomSequence}
        title="Click to dive in"
      >
        <picture>
          <source srcSet="/assets/intro-image.webp" type="image/webp" />
          <img
            src="/assets/intro-image.png"
            alt="Meet Emmanuel Bliss - Product Architecture & Design Systems"
            className="intro-hero-card-img"
            loading="eager"
            decoding="async"
          />
        </picture>

        {/* Animated Mouse Cursor */}
        <div ref={mouseCursorRef} className="intro-center-mouse-cursor" style={{ opacity: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="intro-mouse-pointer-svg">
            <path
              d="M3 3L10.07 20.97L12.58 13.58L19.97 11.07L3 3Z"
              fill="#09090b"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          <div ref={rippleRef} className="intro-mouse-ripple" />
        </div>
      </div>

      {/* Skip Button */}
      <button
        type="button"
        className="intro-skip-btn"
        onClick={onComplete}
        title="Skip intro animation"
      >
        Skip intro
      </button>
    </div>
  );
};
