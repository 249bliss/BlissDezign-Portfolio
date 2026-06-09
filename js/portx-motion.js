/**
 * PORTX-STYLE MOTION SYSTEM v2
 * - Hardware-accelerated custom cursor (rAF loop, translate3d)
 * - CSS handles size/opacity, JS handles ONLY the position transform
 * - No CSS/JS transform conflicts
 */
(function () {
    'use strict';

    // ── Smooth Scroll (Lenis) ──
    function loadLenis() {
        if (window.Lenis) {
            initLenis();
            return;
        }
        const s = document.createElement('script');
        s.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
        s.onload = initLenis;
        document.head.appendChild(s);
    }

    function initLenis() {
        const lenis = new Lenis({
            duration: 1.2,
            easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
            wheelMultiplier: 0.9,
        });

        window.lenis = lenis;

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Intercept hash anchor clicks for smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const id = this.getAttribute('href');
                if (!id || id === '#') return;
                const el = document.querySelector(id);
                if (el) {
                    e.preventDefault();
                    lenis.scrollTo(el, { offset: -80, duration: 1.4 });
                }
            });
        });

        // Handle hash on page load (e.g. about.html#career-journey)
        if (window.location.hash) {
            setTimeout(() => {
                const el = document.querySelector(window.location.hash);
                if (el) lenis.scrollTo(el, { offset: -100, duration: 1.5 });
            }, 700);
        }
    }

    // ── Custom Cursor ──
    // CSS sets top:-9999px; left:-9999px as default (off-screen).
    // JS exclusively sets `style.transform` to position each element.
    // We never set top/left in JS — only transform.

    // Only run cursor on devices with a fine pointer (mouse).
    // Matches the CSS `@media (pointer: coarse)` hide rule.
    if (!window.matchMedia('(pointer: fine)').matches) {
        // Touch device – skip cursor init and go straight to Lenis
        loadLenis();
        return;
    }

    const dot  = document.createElement('div');
    dot.className = 'cursor-dot';

    const ring = document.createElement('div');
    ring.className = 'cursor-ring';

    const bubble = document.createElement('div');
    bubble.className = 'cursor-view-bubble';
    bubble.textContent = 'VIEW';

    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.appendChild(bubble);

    // DOT size (px) – must match CSS width/height
    const DOT_R  = 4;   // 8px / 2
    const RING_R = 18;  // 36px / 2

    // Mouse target coordinates
    let mX = -500, mY = -500;

    // Interpolated (lagging) positions for ring and dot
    let dX = -500, dY = -500;
    let rX = -500, rY = -500;

    let hoveringView = false;
    let isRunning = false;

    // Track raw mouse position
    window.addEventListener('mousemove', e => {
        mX = e.clientX;
        mY = e.clientY;

        if (!isRunning) {
            isRunning = true;
            requestAnimationFrame(tick);
        }
    });

    function tick() {
        // Dot: snappier interpolation (0.35 easing)
        dX += (mX - dX) * 0.35;
        dY += (mY - dY) * 0.35;

        // Ring: slower trailing (0.12 easing)
        rX += (mX - rX) * 0.12;
        rY += (mY - rY) * 0.12;

        // Position dot: center it by subtracting radius
        dot.style.transform  = `translate3d(${dX - DOT_R}px, ${dY - DOT_R}px, 0)`;

        // Position ring: center it by subtracting radius
        ring.style.transform = `translate3d(${rX - RING_R}px, ${rY - RING_R}px, 0)`;

        // Position bubble: center via translate(-50%,-50%) after moving to cursor
        // This works because translate percentages in a transform chain apply
        // to the element's own size, not the viewport.
        bubble.style.transform = `translate3d(${mX}px, ${mY}px, 0) translate(-50%, -50%)`;

        requestAnimationFrame(tick);
    }

    // ── Hover state management ──
    document.addEventListener('mouseover', e => {
        const t = e.target;
        if (!t) return;

        if (t.closest('[data-cursor="view"]')) {
            hoveringView = true;
            dot.style.opacity   = '0';
            ring.style.opacity  = '0';
            bubble.classList.add('visible');
        } else if (t.closest('a, button, .btn, .service-card, .experience-card, .masonry-card, .portfolio-card-large')) {
            ring.classList.add('hovered');
        }
    });

    document.addEventListener('mouseout', e => {
        const t = e.target;
        if (!t) return;

        if (t.closest('[data-cursor="view"]')) {
            hoveringView = false;
            dot.style.opacity  = '';
            ring.style.opacity = '';
            bubble.classList.remove('visible');
        }
        if (t.closest('a, button, .btn, .service-card, .experience-card, .masonry-card, .portfolio-card-large')) {
            ring.classList.remove('hovered');
        }
    });

    // Hide cursor when mouse leaves window
    document.addEventListener('mouseleave', () => {
        dot.style.opacity  = '0';
        ring.style.opacity = '0';
        bubble.classList.remove('visible');
    });
    document.addEventListener('mouseenter', () => {
        dot.style.opacity  = '';
        ring.style.opacity = '';
    });

    // ── CTA Section entrance animation ──
    const ctaSection = document.querySelector('.cta-modern');
    if (ctaSection) {
        new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('cta-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 }).observe(ctaSection);
    }

    // ── Hero image parallax tilt ──
    const heroImage   = document.querySelector('.hero-image-container');
    const heroSection = document.querySelector('.hero');
    if (heroImage && heroSection) {
        heroSection.addEventListener('mousemove', e => {
            const r = heroSection.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width  - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            heroImage.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
        });
        heroSection.addEventListener('mouseleave', () => {
            heroImage.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
            heroImage.style.transform  = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
            setTimeout(() => { heroImage.style.transition = ''; }, 600);
        });
    }

    // Start Lenis
    loadLenis();

})();
