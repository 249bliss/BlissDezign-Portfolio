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

    /* 2. CUSTOM CURSOR REMOVED PER USER REQUEST */

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
    
    /* ═══════════════════════════════════════
       5. INTERACTIVE BACKGROUND DOT-MATRIX ENGINE
       ═══════════════════════════════════════ */
    function initAmbientDotGrid() {
        const canvas = document.getElementById('ambient-dot-grid');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0, height = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const spacing = 38;
        let mousePos = { x: -1000, y: -1000, active: false };

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        window.addEventListener('resize', resize, { passive: true });
        resize();

        window.addEventListener('mousemove', function(e) {
            mousePos.x = e.clientX;
            mousePos.y = e.clientY;
            mousePos.active = true;
        }, { passive: true });

        window.addEventListener('mouseleave', function() {
            mousePos.active = false;
        });

        const radiusInfluence = 150;

        function drawDots() {
            ctx.clearRect(0, 0, width, height);

            const isDark = document.body.getAttribute('data-theme') === 'dark';
            const baseColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(25, 25, 25, 0.075)';
            const activeColor = isDark ? 'rgba(167, 139, 250, 0.45)' : 'rgba(108, 59, 255, 0.45)';

            const cols = Math.ceil(width / spacing) + 1;
            const rows = Math.ceil(height / spacing) + 1;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * spacing;
                    const y = j * spacing;

                    let radius = 1.2;
                    let fill = baseColor;

                    if (mousePos.active) {
                        const dx = mousePos.x - x;
                        const dy = mousePos.y - y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < radiusInfluence) {
                            const factor = 1 - (dist / radiusInfluence);
                            radius = 1.2 + factor * 2.8;
                            fill = activeColor;
                        }
                    }

                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = fill;
                    ctx.fill();
                }
            }

            requestAnimationFrame(drawDots);
        }

        requestAnimationFrame(drawDots);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAmbientDotGrid);
    } else {
        initAmbientDotGrid();
    }

    loadLenis();

})();
