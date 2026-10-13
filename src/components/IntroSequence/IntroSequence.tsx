import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import './IntroSequence.css';

interface IntroSequenceProps {
  onComplete: () => void;
}

// Visual designs to cycle through at high speed (pure visual showcase)
const SHOWCASE_IMAGES = [
  '/assets/hero-images/2.png',            // OpenTag
  '/assets/hero-images/XORIA 1.png',      // Xoria
  '/assets/hero-images/5.png',            // Nurakick
  '/assets/Selected Project/sWYCHR.webp', // Swychr
  '/assets/hero-images/6.png',            // Avenor
  '/assets/hero-images/8.png',            // Mōs Health
];

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [isExpanding, setIsExpanding] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLDivElement>(null);
  const rightTextRef = useRef<HTMLDivElement>(null);
  const neCursorRef = useRef<HTMLDivElement>(null);
  const swCursorRef = useRef<HTMLDivElement>(null);
  const mouseCursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const shuffleCardRef = useRef<HTMLDivElement>(null);
  const videoLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 1. Strictly hardware-accelerated sequence (transforms & opacity ONLY — zero width/height/layout reflows)
  const startDragAndZoom = useCallback(() => {
    if (!viewportRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // 1. Mouse glides into center with smooth ease
    if (mouseCursorRef.current) {
      tl.to(mouseCursorRef.current, {
        x: 0,
        y: 0,
        opacity: 1,
        duration: 0.38,
        ease: 'power2.out',
        force3D: true,
      });

      // Brief hover pause (~0.18s) so user clearly registers the cursor over the sky video
      tl.to({}, { duration: 0.18 });

      // 2. Visible spring-click (press down then release with ripple)
      tl.to(mouseCursorRef.current, {
        scale: 0.8,
        duration: 0.09,
        ease: 'power2.in',
        force3D: true,
      });
      tl.to(
        viewportRef.current,
        {
          scale: 0.98,
          duration: 0.09,
          ease: 'power2.in',
          force3D: true,
        },
        '<'
      );

      tl.to(mouseCursorRef.current, {
        scale: 1,
        duration: 0.12,
        ease: 'back.out(2)',
        force3D: true,
      });
      tl.to(
        viewportRef.current,
        {
          scale: 1,
          duration: 0.12,
          ease: 'back.out(1.8)',
          force3D: true,
        },
        '<'
      );

      // Radial click ripple
      if (rippleRef.current) {
        tl.fromTo(
          rippleRef.current,
          { scale: 0.2, opacity: 0.85, force3D: true },
          { scale: 2.2, opacity: 0, duration: 0.28, ease: 'power2.out', force3D: true },
          '<'
        );
      }
    }

    // 3. Pause slightly after click before opening corners & expanding viewport
    tl.to({}, { duration: 0.08 });
    tl.add(() => setIsExpanding(true));

    // Split text slides away smoothly using GPU translate3d & opacity
    if (leftTextRef.current) {
      tl.to(
        leftTextRef.current,
        {
          x: -120,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.inOut',
          force3D: true,
        },
        '<'
      );
    }
    if (rightTextRef.current) {
      tl.to(
        rightTextRef.current,
        {
          x: 120,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.inOut',
          force3D: true,
        },
        '<'
      );
    }

    // Dual corner cursors pull outward strictly via GPU transform
    if (neCursorRef.current) {
      tl.to(
        neCursorRef.current,
        {
          x: 160,
          y: -110,
          scale: 1.2,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.inOut',
          force3D: true,
        },
        '<'
      );
    }
    if (swCursorRef.current) {
      tl.to(
        swCursorRef.current,
        {
          x: -160,
          y: 110,
          scale: 1.2,
          opacity: 0,
          duration: 0.55,
          ease: 'power3.inOut',
          force3D: true,
        },
        '<'
      );
    }

    // Center mouse fades out as corners pull
    if (mouseCursorRef.current) {
      tl.to(
        mouseCursorRef.current,
        {
          opacity: 0,
          scale: 0.6,
          duration: 0.2,
          ease: 'power2.in',
          force3D: true,
        },
        '<'
      );
    }

    // 4. Viewport expands outward to fill screen strictly via GPU transform: scale (zero width/height layout reflow)
    const targetScale = Math.max(window.innerWidth / 300, window.innerHeight / 200) * 1.15;
    tl.to(
      viewportRef.current,
      {
        scale: targetScale,
        duration: 0.55,
        ease: 'power3.inOut',
        force3D: true,
      },
      '<'
    );

    // Concurrently fade out the intro overlay as the viewport opens so the live 3D sphere is immediately visible
    if (overlayRef.current) {
      tl.to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.out',
        },
        '-=0.25'
      );
    }
  }, [onComplete]);

  // 2. Strict Image Preloader: All showcase images are fully loaded & decoded in GPU cache BEFORE intro begins
  useEffect(() => {
    let isCancelled = false;

    const preloadAllImages = async () => {
      try {
        await Promise.all(
          SHOWCASE_IMAGES.map((src) => {
            return new Promise<void>((resolve) => {
              const img = new Image();
              img.src = src;

              const onFinish = () => {
                if (img.decode) {
                  img.decode().then(() => resolve()).catch(() => resolve());
                } else {
                  resolve();
                }
              };

              if (img.complete && img.naturalWidth !== 0) {
                onFinish();
              } else {
                img.onload = onFinish;
                img.onerror = () => resolve();
              }
            });
          })
        );
      } catch {
        // Fallback
      }

      if (!isCancelled) {
        setIsPreloaded(true);
      }
    };

    preloadAllImages();

    // Start video playback early so frames are already buffered
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // 3. Butter-Smooth 60fps Image Switching with requestAnimationFrame, strictly starting AFTER preload completes
  useEffect(() => {
    if (!isPreloaded) return;

    // Initial state setup strictly on GPU
    gsap.set(overlayRef.current, { opacity: 1 });
    if (mouseCursorRef.current) {
      gsap.set(mouseCursorRef.current, { x: 50, y: 70, opacity: 0, scale: 0.9, force3D: true });
    }

    // Show initial slide immediately once preloaded
    if (slideRefs.current[0]) {
      slideRefs.current[0].classList.add('is-visible');
    }

    let currentIndex = 0;
    let flipCount = 0;
    const totalFlips = 11;
    let timerId: ReturnType<typeof setTimeout>;
    let isActive = true;

    // Fast, fluid, organic deceleration switch tempo (starts snappy at 65ms and gently tapers to 125ms)
    const runFlip = () => {
      if (!isActive) return;

      // Hide current slide
      if (slideRefs.current[currentIndex]) {
        slideRefs.current[currentIndex]?.classList.remove('is-visible');
      }

      currentIndex = (currentIndex + 1) % SHOWCASE_IMAGES.length;
      flipCount++;

      // Show next slide
      if (slideRefs.current[currentIndex]) {
        slideRefs.current[currentIndex]?.classList.add('is-visible');
      }

      if (flipCount < totalFlips) {
        // Smooth organic deceleration ramp
        const nextDelay = 65 + Math.floor(flipCount * 6);
        timerId = setTimeout(runFlip, nextDelay);
      } else {
        // Landing reached: cleanly reveal living background sky video
        isActive = false;
        if (shuffleCardRef.current) {
          gsap.to(shuffleCardRef.current, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.out',
            onComplete: () => {
              timerId = setTimeout(startDragAndZoom, 260);
            },
          });
        } else {
          timerId = setTimeout(startDragAndZoom, 260);
        }
      }
    };

    timerId = setTimeout(runFlip, 80);

    return () => {
      isActive = false;
      clearTimeout(timerId);
    };
  }, [isPreloaded, startDragAndZoom]);

  return (
    <div ref={overlayRef} className="intro-sequence-overlay" role="dialog" aria-label="Intro Experience">
      {/* ── SPLIT TEXT FLANKING VIEWPORT ── */}
      <div ref={leftTextRef} className="intro-split-text intro-split-text--left">
        Clarity
      </div>
      <div ref={rightTextRef} className="intro-split-text intro-split-text--right">
        By Design
      </div>

      {/* ── CENTRED FLOATING VIEWPORT (NO BORDER RADIUS, NO SHADOW) ── */}
      <div ref={viewportRef} className="canvas-viewport-container">
        {/* Landing: Natural Sky Background Video Layer (Rendered underneath with instant poster fallback) */}
        <div ref={videoLayerRef} className="intro-bg-video-layer">
          <video
            ref={videoRef}
            className="intro-bg-video"
            src="/assets/bg-video-new.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>

        {/* Pre-rendered Stack of Project Showcase Images (Hardware Accelerated, Zero Frame Drops) */}
        <div ref={shuffleCardRef} className="intro-shuffle-card">
          {SHOWCASE_IMAGES.map((imgSrc, idx) => (
            <div
              key={idx}
              ref={(el) => {
                slideRefs.current[idx] = el;
              }}
              className="intro-preloaded-slide"
            >
              <img src={imgSrc} alt="Showcase" loading="eager" />
            </div>
          ))}
        </div>

        {/* Dual Corner Drag Cursors (Top-Right NE and Bottom-Left SW) */}
        {!isExpanding && (
          <>
            <div ref={neCursorRef} className="corner-drag-cursor corner-drag-cursor--ne" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 19L19 5M19 5H9M19 5V15"
                  stroke="#09090b"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 19L19 5H9M19 5V15"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div ref={swCursorRef} className="corner-drag-cursor corner-drag-cursor--sw" aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M19 5L5 19M5 19H15M5 19V9"
                  stroke="#09090b"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 5L5 19M5 19H15M5 19V9"
                  stroke="#ffffff"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        )}

        {/* Center Mouse Pointer that enters and Spring-Clicks */}
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

      {/* Discreet Skip Button */}
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
