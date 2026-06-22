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
       2. CUSTOM CURSOR
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
    let mX = -300, mY = -300;
    // interpolated positions
    let dotX = -300, dotY = -300;
    let ringX = -300, ringY = -300;
    let labelX = -300, labelY = -300;

    let cursorState = 'default'; // 'default' | 'hover' | 'view' | 'hidden'

    // ── Track mouse ─────────────────────────
    window.addEventListener('mousemove', e => {
        mX = e.clientX;
        mY = e.clientY;
    }, { passive: true });

    document.addEventListener('mouseleave', () => { cursorState = 'hidden'; });
    document.addEventListener('mouseenter', () => { cursorState = 'default'; });

    // ── Hover detection ──────────────────────
    document.addEventListener('mouseover', e => {
        const t = e.target;
        if (!t) return;
        if (t.closest('[data-cursor="view"]')) {
            cursorState = 'view';
        } else if (t.closest('a, button, [role="button"], .btn, .nav-btn-lux, .service-card, .portfolio-card-large, .masonry-card, .experience-card')) {
            cursorState = 'hover';
        } else {
            cursorState = 'default';
        }
    }, { passive: true });

    // ── Click ripple ─────────────────────────
    document.addEventListener('mousedown', () => {
        ring.classList.add('clicking');
        dot.classList.add('clicking');
        setTimeout(() => {
            ring.classList.remove('clicking');
            dot.classList.remove('clicking');
        }, 300);
    });

    // ── Lerp helper ──────────────────────────
    function lerp(a, b, t) { return a + (b - a) * t; }

    // ── rAF render loop ─────────────────────
    function tick() {
        // Dot: very snappy — tracks cursor closely
        dotX = lerp(dotX, mX, 0.75);
        dotY = lerp(dotY, mY, 0.75);

        // Ring: smooth trailing rubber-band (faster than before)
        ringX = lerp(ringX, mX, 0.38);
        ringY = lerp(ringY, mY, 0.38);

        // Label: matches ring speed
        labelX = lerp(labelX, mX, 0.38);
        labelY = lerp(labelY, mY, 0.38);

        const hidden  = cursorState === 'hidden';
        const isView  = cursorState === 'view';
        const isHover = cursorState === 'hover';

        // -- Dot --
        const dotScale = isHover ? ' scale(0)' : '';
        dot.style.transform = `translate3d(${dotX - 5}px, ${dotY - 5}px, 0)${dotScale}`;
        dot.style.opacity   = hidden || isView ? '0' : '1';

        // -- Ring --
        ring.style.transform = `translate3d(${ringX - 22}px, ${ringY - 22}px, 0)`;
        ring.style.opacity   = hidden || isView ? '0' : '1';

        if (isHover) {
            ring.style.width  = '52px';
            ring.style.height = '52px';
            ring.style.transform = `translate3d(${ringX - 26}px, ${ringY - 26}px, 0)`;
            ring.style.background = 'rgba(108, 59, 255, 0.08)';
            ring.style.borderColor = 'rgba(108, 59, 255, 0.6)';
        } else {
            ring.style.width  = '44px';
            ring.style.height = '44px';
            ring.style.background = 'transparent';
            ring.style.borderColor = 'rgba(108, 59, 255, 0.5)';
        }

        // -- View label --
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
