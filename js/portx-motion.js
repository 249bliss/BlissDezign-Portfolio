/**
 * BlissDezign Motion System v3
 * ─────────────────────────────────────────────────────
 * • Hardware-accelerated custom cursor (rAF, translate3d only)
 * • 3 states: default | hover (links/buttons) | view (project images)
 * • Click ripple on mousedown
 * • Hero image parallax tilt
 * • Smooth scroll via Lenis
 * • Lightweight — zero external dependencies for cursor
 * ─────────────────────────────────────────────────────
 */
(function () {
    'use strict';

    /* ═══════════════════════════════════════
       1. SMOOTH SCROLL  (Lenis)
    ═══════════════════════════════════════ */
    function loadLenis() {
        if (window.Lenis) { initLenis(); return; }
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
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);

        document.querySelectorAll('a[href^="#"]').forEach(a => {
            a.addEventListener('click', function (e) {
                const id = this.getAttribute('href');
                if (!id || id === '#') return;
                const el = document.querySelector(id);
                if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80, duration: 1.4 }); }
            });
        });
        if (window.location.hash) {
            setTimeout(() => {
                const el = document.querySelector(window.location.hash);
                if (el) lenis.scrollTo(el, { offset: -100, duration: 1.5 });
            }, 700);
        }
    }

    /* ═══════════════════════════════════════
       2. CUSTOM CURSOR (Luxury Magnet & Elastic System)
       ═══════════════════════════════════════ */

    // Only on desktop/mouse devices
    if (!window.matchMedia('(pointer: fine)').matches) {
        loadLenis();
        return;
    }

    // Hide the native cursor globally
    document.documentElement.style.cursor = 'none';

    // ── Build elements ──────────────────────
    const dot    = document.createElement('div');   // Small snappy dot
    const ring   = document.createElement('div');   // Large lagging ring
    const label  = document.createElement('div');   // "VIEW" pill on project hover

    dot.className   = 'bd-cursor-dot';
    ring.className  = 'bd-cursor-ring';
    label.className = 'bd-cursor-label';
    label.textContent = 'VIEW';

    // Inject into DOM once body exists
    function mountCursor() {
        document.body.appendChild(dot);
        document.body.appendChild(ring);
        document.body.appendChild(label);
    }
    if (document.body) {
        mountCursor();
    } else {
        document.addEventListener('DOMContentLoaded', mountCursor);
    }

    // ── State ────────────────────────────────
    // current mouse (fixed coords)
    let mX = -100, mY = -100;
    // interpolated positions
    let dotX = -100, dotY = -100;
    let ringX = -100, ringY = -100;
    let labelX = -100, labelY = -100;

    // velocity calculations
    let lastMX = -100, lastMY = -100;
    let vx = 0, vy = 0;

    // magnetic pull tracking
    let magneticTarget = null;
    let isMagnetic = false;
    let targetRect = null;
    let isClicking = false;

    let cursorState = 'default'; // 'default' | 'hover' | 'magnetic' | 'view' | 'hidden'

    // ── Track mouse ─────────────────────────
    window.addEventListener('mousemove', e => {
        if (mX === -100) {
            mX = e.clientX;
            mY = e.clientY;
            dotX = mX;
            dotY = mY;
            ringX = mX;
            ringY = mY;
            labelX = mX;
            labelY = mY;
            lastMX = mX;
            lastMY = mY;
        } else {
            mX = e.clientX;
            mY = e.clientY;
        }

        if (isMagnetic && magneticTarget && targetRect) {
            const cX = targetRect.left + targetRect.width / 2;
            const cY = targetRect.top + targetRect.height / 2;
            
            // Distance from mouse to target center
            const distX = mX - cX;
            const distY = mY - cY;
            
            // Pull factor (0.22 works perfectly for luxury softness)
            const maxPull = 12; // px limit
            const pullX = Math.max(-maxPull, Math.min(maxPull, distX * 0.22));
            const pullY = Math.max(-maxPull, Math.min(maxPull, distY * 0.22));
            
            magneticTarget.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { cursorState = 'hidden'; });
    document.addEventListener('mouseenter', () => { cursorState = 'default'; });

    // Helper to safely restore a magnetic target position
    function resetMagneticTarget(el) {
        el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
        el.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
            if (el.style.transform === 'translate3d(0px, 0px, 0px)') {
                el.style.transition = '';
            }
        }, 400);
    }

    // ── Hover & Magnetism detection ──────────────────────
    document.addEventListener('mouseover', e => {
        const t = e.target;
        if (!t) return;

        // Interactive targets that get magnetic locking and button pull
        const mag = t.closest('.magnetic, a, button, [role="button"], .btn, .nav-btn-lux, .footer-social-icons a, .theme-toggle, .mobile-menu-btn');
        // Larger cards/interactive areas that just scale the ring but don't lock/pull
        const hoverArea = t.closest('.service-card, .portfolio-card-large, .masonry-card, .experience-card');
        const viewArea = t.closest('[data-cursor="view"]');

        if (viewArea) {
            cursorState = 'view';
            isMagnetic = false;
            if (magneticTarget) { resetMagneticTarget(magneticTarget); magneticTarget = null; }
        } else if (mag) {
            cursorState = 'magnetic';
            isMagnetic = true;
            if (magneticTarget && magneticTarget !== mag) {
                resetMagneticTarget(magneticTarget);
            }
            magneticTarget = mag;
            targetRect = mag.getBoundingClientRect();
            // Clear transition for snappy real-time tracking
            mag.style.transition = 'none';
        } else if (hoverArea) {
            cursorState = 'hover';
            isMagnetic = false;
            if (magneticTarget) { resetMagneticTarget(magneticTarget); magneticTarget = null; }
        } else {
            cursorState = 'default';
            isMagnetic = false;
            if (magneticTarget) { resetMagneticTarget(magneticTarget); magneticTarget = null; }
        }
    }, { passive: true });

    document.addEventListener('mouseout', e => {
        const t = e.target;
        if (!t || !magneticTarget) return;

        // If we are leaving the magnetic lock bounds
        if (!t.closest('.magnetic, a, button, [role="button"], .btn, .nav-btn-lux, .footer-social-icons a, .theme-toggle, .mobile-menu-btn')) {
            cursorState = 'default';
            isMagnetic = false;
            resetMagneticTarget(magneticTarget);
            magneticTarget = null;
        }
    }, { passive: true });

    // ── Click interactions ─────────────────────────
    document.addEventListener('mousedown', () => { isClicking = true; });
    document.addEventListener('mouseup', () => { isClicking = false; });

    // ── Lerp helper ──────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── rAF render loop ─────────────────────
    function tick() {
        // Calculate velocity for stretching
        if (lastMX === -100) {
            lastMX = mX;
            lastMY = mY;
        }
        vx = mX - lastMX;
        vy = mY - lastMY;
        lastMX = mX;
        lastMY = mY;

        const speed = Math.sqrt(vx * vx + vy * vy);
        const angle = Math.atan2(vy, vx) * 180 / Math.PI;

        // Targets for cursor parts
        let targetRingX = mX;
        let targetRingY = mY;
        let targetDotX = mX;
        let targetDotY = mY;

        let ringW = 20;
        let ringH = 20;
        let ringBg = 'transparent';
        let ringBorderColor = 'rgba(124, 58, 237, 0.7)';
        let ringRadius = '50%';

        const hidden  = cursorState === 'hidden';
        const isView  = cursorState === 'view';
        const isHover = cursorState === 'hover';
        const isMag   = cursorState === 'magnetic';

        if (isMag && magneticTarget) {
            // Keep target rect updated in case of scrolls/reflows
            targetRect = magneticTarget.getBoundingClientRect();
            const cX = targetRect.left + targetRect.width / 2;
            const cY = targetRect.top + targetRect.height / 2;

            targetRingX = cX;
            targetRingY = cY;

            // Dot locks to center but pulls slightly toward raw mouse
            targetDotX = cX + (mX - cX) * 0.15;
            targetDotY = cY + (mY - cY) * 0.15;

            // Expand ring to wrap around button
            ringW = targetRect.width + 12;
            ringH = targetRect.height + 12;
            
            // Extract target border-radius
            const comp = window.getComputedStyle(magneticTarget);
            ringRadius = comp.borderRadius;
            
            ringBg = 'rgba(124, 58, 237, 0.05)';
            ringBorderColor = 'rgba(124, 58, 237, 0.85)';
        } else if (isHover) {
            ringW = 56;
            ringH = 56;
            ringBg = 'rgba(124, 58, 237, 0.08)';
            ringBorderColor = 'rgba(124, 58, 237, 0.85)';
        }

        // Lerp positions
        // Dot: Snappy
        dotX = lerp(dotX, targetDotX, 0.45);
        dotY = lerp(dotY, targetDotY, 0.45);

        // Ring: Smooth trailing rubber-band (faster when locking to feel magnetic)
        const ringLerp = isMag ? 0.28 : 0.16;
        ringX = lerp(ringX, targetRingX, ringLerp);
        ringY = lerp(ringY, targetRingY, ringLerp);

        // Label: trailing view indicator
        labelX = lerp(labelX, mX, 0.18);
        labelY = lerp(labelY, mY, 0.18);

        const isHiddenOrView = hidden || isView;

        // -- Render Dot --
        const clickScale = isClicking ? 0.5 : 1.0;
        const dotScale = (isHover || isMag) ? ' scale(0)' : ` scale(${clickScale})`;
        dot.style.transform = `translate3d(${dotX - 4}px, ${dotY - 4}px, 0)${dotScale}`;
        dot.style.opacity   = isHiddenOrView ? '0' : '1';

        // -- Render Ring --
        ring.style.width  = `${ringW}px`;
        ring.style.height = `${ringH}px`;
        ring.style.borderRadius = ringRadius;
        ring.style.background = ringBg;
        ring.style.borderColor = ringBorderColor;
        ring.style.opacity   = isHiddenOrView ? '0' : '1';

        const ringClickScale = isClicking ? 0.85 : 1.0;
        let transformStr = `translate3d(${ringX - ringW / 2}px, ${ringY - ringH / 2}px, 0)`;

        if (!isMag && !isHover && speed > 1.5) {
            // Apply velocity-based stretch deformation
            const maxStretch = 0.35;
            const stretchX = (1 + Math.min(speed * 0.015, maxStretch)) * ringClickScale;
            const stretchY = (1 - Math.min(speed * 0.008, maxStretch * 0.5)) * ringClickScale;
            transformStr += ` rotate(${angle}deg) scale(${stretchX}, ${stretchY}) rotate(${-angle}deg)`;
        } else {
            transformStr += ` scale(${ringClickScale})`;
        }
        ring.style.transform = transformStr;

        // -- Render View Label --
        label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0) translate(-50%, -50%)`;
        label.style.opacity   = isView && !hidden ? '1' : '0';
        label.style.visibility = isView && !hidden ? 'visible' : 'hidden';

        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    /* ═══════════════════════════════════════
       3. HERO IMAGE PARALLAX TILT
    ═══════════════════════════════════════ */
    const heroImage   = document.querySelector('.hero-image-container');
    const heroSection = document.querySelector('.hero');
    if (heroImage && heroSection) {
        heroSection.addEventListener('mousemove', e => {
            const r = heroSection.getBoundingClientRect();
            const x = (e.clientX - r.left)  / r.width  - 0.5;
            const y = (e.clientY - r.top)   / r.height - 0.5;
            heroImage.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) scale(1.02)`;
        });
        heroSection.addEventListener('mouseleave', () => {
            heroImage.style.transition = 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)';
            heroImage.style.transform  = 'perspective(900px) rotateY(0deg) rotateX(0deg) scale(1)';
            setTimeout(() => { heroImage.style.transition = ''; }, 700);
        });
    }

    /* ═══════════════════════════════════════
       4. CTA SECTION ENTRANCE
    ═══════════════════════════════════════ */
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

    /* ═══════════════════════════════════════
       5. START LENIS
    ═══════════════════════════════════════ */
    loadLenis();

})();
