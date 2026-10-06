/**
 * PORTFOLIO REDESIGN : PHYSICAL MOOD BOARD & STORYBOARD INTERACTION ENGINE
 * Emmanuel Bliss : Product Designer & UX Therapist
 */

document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── 0. LENIS LUXURIOUS SMOOTH SCROLL (FRAMER MOTION FEEL) ───────────────
    function initLenisSmoothScroll() {
        if (prefersReducedMotion) return;

        function startLenis() {
            if (!window.Lenis) return;
            const lenis = new window.Lenis({
                duration: 1.4,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                wheelMultiplier: 0.85,
                touchMultiplier: 1.4,
                infinite: false
            });

            window.lenis = lenis;

            if (typeof ScrollTrigger !== 'undefined') {
                lenis.on('scroll', ScrollTrigger.update);
                gsap.ticker.add((time) => {
                    lenis.raf(time * 1000);
                });
                gsap.ticker.lagSmoothing(0);
            } else {
                function raf(time) {
                    lenis.raf(time);
                    requestAnimationFrame(raf);
                }
                requestAnimationFrame(raf);
            }

            document.querySelectorAll('a[href^="#"]').forEach((a) => {
                a.addEventListener('click', (e) => {
                    const targetId = a.getAttribute('href');
                    if (targetId && targetId !== '#' && document.querySelector(targetId)) {
                        e.preventDefault();
                        lenis.scrollTo(targetId, { offset: -60, duration: 1.5 });
                    }
                });
            });
        }

        if (window.Lenis) {
            startLenis();
        } else {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/lenis@1.1.18/dist/lenis.min.js';
            script.onload = startLenis;
            document.head.appendChild(script);
        }
    }

    initLenisSmoothScroll();

    // ── 1. HERO SECTION: STUDIO PASS, TYPEWRITER & HANDWRITTEN SUBTITLE ────
    const lanyardBadge = document.getElementById('lanyard-badge-card');
    const lanyardAssembly = document.getElementById('lanyard-assembly');
    const strapRibbon = document.getElementById('lanyard-strap-ribbon-line');
    const cardFlipper = document.getElementById('badge-card-3d-wrapper');
    const cardFront = document.getElementById('badge-card-front');
    const cardBack = document.getElementById('badge-card-back');
    const badgeShine = document.getElementById('badge-hologram-shine');
    const lanyardHint = document.getElementById('lanyard-hint');
    let hintDismissed = false;

    function dismissLanyardHint() {
        if (hintDismissed) return;
        hintDismissed = true;
        if (lanyardHint) {
            lanyardHint.classList.add('is-dismissed');
            lanyardHint.style.opacity = '0';
            lanyardHint.style.pointerEvents = 'none';
            setTimeout(() => {
                if (lanyardHint && hintDismissed) {
                    lanyardHint.style.display = 'none';
                }
            }, 380);
        }
    }
    const navStrapAnchor = document.getElementById('navbar-strap-anchor');
    const hudPassBtn = document.getElementById('hud-pass-btn');
    const heroPullWrap = document.getElementById('hero-card-pull-wrap');
    const heroTextLayer = document.getElementById('hero-dragged-text-layer');
    const heroSub = document.getElementById('hero-dragged-sub');
    const heroActions = document.getElementById('hero-dragged-actions');
    const heroSection = document.getElementById('home');
    const typewriterChars = document.querySelectorAll('.typewriter-char');
    const caret = document.getElementById('typewriter-caret');

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    // ── 1a. ELASTIC PENDULUM PHYSICS ──────────────────────────────────────
    // The pass swings from the clasp (top of .lanyard-assembly). Dragging
    // sets the angle directly; on release gravity + damping take over and
    // the strap behaves like a stiff elastic (stretch springs back).
    let pendulum = null;

    function createPendulum() {
        if (!lanyardBadge || !lanyardAssembly || !heroPullWrap) return null;

        const OMEGA_SQ = 9.5;        // gravity / length -> ~2s swing period
        const SWING_DAMPING = 1.25;  // per second
        const STRETCH_K = 210;       // strap stiffness
        const STRETCH_C = 15;        // strap damping (bouncy, not jelly)
        const MAX_ANGLE = 1.05;      // ~60deg either side
        const MAX_STRETCH = 46;      // px

        let angle = 0, angVel = 0;
        let stretch = 0, stretchVel = 0;
        let tiltX = 0, tiltY = 0;
        let pointerNX = 0, pointerNY = 0;
        let ribbonH = strapRibbon ? strapRibbon.offsetHeight : 0;
        let running = false, lastT = 0, heroVisible = true, interacted = false;

        const drag = {
            active: false, moved: false, id: null,
            startX: 0, startY: 0, startT: 0, lastX: 0, lastY: 0,
            lastMoveT: 0, velX: 0,
            pivotX: 0, pivotY: 0, grabAngle: 0, grabDist: 0,
            hasFlippedThisDrag: false
        };

        if (strapRibbon) strapRibbon.style.transformOrigin = 'top center';

        function markInteracted() {
            dismissLanyardHint();
            if (interacted) return;
            interacted = true;
        }

        // Untransformed clasp position (offsetLeft/Top ignore our own transform)
        function getPivot() {
            const wrapRect = heroPullWrap.getBoundingClientRect();
            return {
                x: wrapRect.left + lanyardAssembly.offsetLeft + lanyardAssembly.offsetWidth / 2,
                y: wrapRect.top + lanyardAssembly.offsetTop
            };
        }

        function render() {
            lanyardAssembly.style.transform =
                `translate3d(0, ${stretch.toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad)`;
            lanyardBadge.style.transform =
                `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
            if (strapRibbon && ribbonH) {
                strapRibbon.style.transform =
                    `translateX(-50%) scaleY(${((ribbonH + stretch) / ribbonH).toFixed(4)})`;
            }
            if (badgeShine) {
                const sx = 50 + tiltY * 2.6;
                const sy = 50 - tiltX * 3.2;
                badgeShine.style.background =
                    `radial-gradient(circle at ${sx.toFixed(1)}% ${sy.toFixed(1)}%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`;
            }
        }

        function step(now) {
            if (!heroVisible && !drag.active) { running = false; return; }
            const dt = Math.min(0.033, (now - lastT) / 1000 || 0.016);
            lastT = now;

            if (drag.active && drag.moved) {
                const dx = drag.lastX - drag.pivotX;
                const dy = drag.lastY - drag.pivotY;
                const targetAngle = clamp(-Math.atan2(dx, dy) - drag.grabAngle, -MAX_ANGLE, MAX_ANGLE);
                const targetStretch = clamp(Math.hypot(dx, dy) - drag.grabDist, 0, MAX_STRETCH);
                const follow = 1 - Math.exp(-dt * 22);
                const prevAngle = angle, prevStretch = stretch;
                angle += (targetAngle - angle) * follow;
                stretch += (targetStretch - stretch) * follow;
                // keep a smoothed velocity so the release "throws" the card
                angVel = angVel * 0.6 + ((angle - prevAngle) / dt) * 0.4;
                stretchVel = stretchVel * 0.6 + ((stretch - prevStretch) / dt) * 0.4;
            } else {
                angVel += -OMEGA_SQ * Math.sin(angle) * dt;
                angVel *= Math.exp(-SWING_DAMPING * dt);
                angle = clamp(angle + angVel * dt, -MAX_ANGLE * 1.2, MAX_ANGLE * 1.2);

                // elastic strap: spring back + slight centrifugal pull while swinging
                const stretchAcc = -STRETCH_K * stretch - STRETCH_C * stretchVel + angVel * angVel * 30;
                stretchVel += stretchAcc * dt;
                stretch = clamp(stretch + stretchVel * dt, -8, MAX_STRETCH);
            }

            // 3D tilt follows the pointer and twists slightly with the swing
            const targetTiltX = -pointerNY * 7;
            const targetTiltY = pointerNX * 10 - angVel * 9;
            const ease = 1 - Math.exp(-dt * 8);
            tiltX += (targetTiltX - tiltX) * ease;
            tiltY += (targetTiltY - tiltY) * ease;

            render();

            const settled = !drag.active &&
                Math.abs(angle) < 0.0005 && Math.abs(angVel) < 0.0005 &&
                Math.abs(stretch) < 0.05 && Math.abs(stretchVel) < 0.05 &&
                Math.abs(targetTiltX - tiltX) < 0.02 && Math.abs(targetTiltY - tiltY) < 0.02;

            if (settled) { running = false; return; }
            requestAnimationFrame(step);
        }

        function start() {
            if (running || prefersReducedMotion) return;
            running = true;
            lastT = performance.now();
            requestAnimationFrame(step);
        }

        // Drag to swing + twist in 3D (auto-flip on horizontal twist / swipe)
        lanyardBadge.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || e.target.closest('a, button')) return;
            dismissLanyardHint();
            const p = getPivot();
            const dx = e.clientX - p.x;
            const dy = e.clientY - p.y;
            const now = performance.now();
            Object.assign(drag, {
                active: true, moved: false, id: e.pointerId,
                startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY,
                startT: now, lastMoveT: now, velX: 0,
                pivotX: p.x, pivotY: p.y,
                grabAngle: -Math.atan2(dx, dy) - angle,
                grabDist: Math.hypot(dx, dy) - stretch,
                hasFlippedThisDrag: false
            });
            if (lanyardBadge.setPointerCapture) lanyardBadge.setPointerCapture(e.pointerId);
            start();
        });

        lanyardBadge.addEventListener('pointermove', (e) => {
            if (!drag.active || e.pointerId !== drag.id) return;
            const now = performance.now();
            const dt = Math.max(1, now - (drag.lastMoveT || now));
            drag.velX = (e.clientX - drag.lastX) / dt;
            drag.lastMoveT = now;

            const totalDx = e.clientX - drag.startX;
            const totalDy = e.clientY - drag.startY;

            if (!drag.moved && Math.hypot(totalDx, totalDy) > 6) {
                drag.moved = true;
                lanyardBadge.classList.add('is-grabbing');
                markInteracted();
            }

            // REAL-TIME 3D TWIST FEEDBACK:
            // Dragging horizontally twists the card around its vertical Y-axis.
            const twistDeg = (totalDx / 85) * 60;

            if (drag.moved && cardFlipper && !drag.hasFlippedThisDrag) {
                cardFlipper.style.transition = 'none';
                const baseDeg = isFlipped ? 180 : 0;
                cardFlipper.style.transform = `rotateY(${baseDeg + twistDeg}deg)`;

                // AUTO-FLIP THRESHOLD WHILE DRAGGING:
                // If twisted past 50 degrees or dragged horizontally > 70px
                if (Math.abs(twistDeg) > 50 || Math.abs(totalDx) > 70) {
                    drag.hasFlippedThisDrag = true;
                    cardFlipper.style.transition = '';
                    cardFlipper.style.transform = '';
                    toggleFlip();
                    if (pendulum) pendulum.kick(totalDx > 0 ? 0.75 : -0.75);
                }
            }

            drag.lastX = e.clientX;
            drag.lastY = e.clientY;
        });

        const endDrag = (e) => {
            if (!drag.active || e.pointerId !== drag.id) return;
            const now = performance.now();
            const duration = now - drag.startT;
            const wasTap = e.type === 'pointerup' && !drag.moved && duration < 450;
            const totalDx = e.clientX - drag.startX;

            // Clear any inline drag twist transform so CSS transition smoothly completes flip or snap-back
            if (cardFlipper) {
                cardFlipper.style.transition = '';
                cardFlipper.style.transform = '';
            }

            if (!drag.hasFlippedThisDrag) {
                if (wasTap) {
                    markInteracted();
                    toggleFlip();
                } else if (drag.moved) {
                    // Release with high horizontal flick velocity OR twist > 32deg
                    const flick = Math.abs(drag.velX) > 0.32;
                    const twistExceeded = Math.abs((totalDx / 85) * 60) > 32;
                    if (flick || twistExceeded) {
                        markInteracted();
                        toggleFlip();
                        if (pendulum) pendulum.kick(totalDx > 0 ? 0.7 : -0.7);
                    }
                }
            }

            drag.active = false;
            drag.moved = false;
            drag.hasFlippedThisDrag = false;
            lanyardBadge.classList.remove('is-grabbing');
            start();
        };
        lanyardBadge.addEventListener('pointerup', endDrag);
        lanyardBadge.addEventListener('pointercancel', endDrag);

        // Pointer position drives tilt; brushing past the card nudges it
        window.addEventListener('pointermove', (e) => {
            pointerNX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
            pointerNY = (e.clientY - window.innerHeight * 0.45) / (window.innerHeight * 0.45);
            if (!drag.active && e.pointerType === 'mouse') {
                const r = lanyardBadge.getBoundingClientRect();
                const pad = 40;
                if (e.clientX > r.left - pad && e.clientX < r.right + pad &&
                    e.clientY > r.top - pad && e.clientY < r.bottom + pad) {
                    angVel += clamp(-(e.movementX || 0) * 0.0035, -0.25, 0.25);
                }
            }
            start();
        }, { passive: true });

        window.addEventListener('resize', () => {
            if (strapRibbon) ribbonH = strapRibbon.offsetHeight;
        });

        // Sleep when the hero is off-screen
        if (heroSection && 'IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                heroVisible = entry.isIntersecting;
                if (heroVisible) start();
            }).observe(heroSection);
        }

        return {
            kick(v) { angVel += v; start(); },
            markInteracted
        };
    }

    // ── 1b. DOUBLE-SIDED CARD FLIP ────────────────────────────────────────
    let isFlipped = false;

    function setFlipped(next) {
        dismissLanyardHint();
        if (!cardFlipper) return;
        const hidingFace = next ? cardFront : cardBack;
        const showingFace = next ? cardBack : cardFront;
        const focusWasInside = hidingFace && hidingFace.contains(document.activeElement);

        isFlipped = next;
        cardFlipper.classList.toggle('is-flipped', next);
        if (hidingFace) { hidingFace.inert = true; hidingFace.setAttribute('aria-hidden', 'true'); }
        if (showingFace) { showingFace.inert = false; showingFace.setAttribute('aria-hidden', 'false'); }

        // don't strand keyboard focus on a face that just became inert
        if (focusWasInside && showingFace) {
            const target = showingFace.querySelector('[data-badge-flip]');
            if (target) target.focus({ preventScroll: true });
        }
        if (pendulum) pendulum.kick(next ? -0.9 : 0.9);
    }

    function toggleFlip() { 
        dismissLanyardHint();
        setFlipped(!isFlipped); 
    }

    if (lanyardBadge && cardFlipper) {
        pendulum = createPendulum();

        lanyardBadge.querySelectorAll('[data-badge-flip]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                dismissLanyardHint();
                if (pendulum) pendulum.markInteracted();
                toggleFlip();
            });
        });

        lanyardBadge.addEventListener('keydown', (e) => {
            if (e.target !== lanyardBadge) return;
            dismissLanyardHint();
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFlip();
            } else if (pendulum && e.key === 'ArrowLeft') {
                e.preventDefault();
                pendulum.kick(0.8);
            } else if (pendulum && e.key === 'ArrowRight') {
                e.preventDefault();
                pendulum.kick(-0.8);
            }
        });

        if (hudPassBtn) {
            hudPassBtn.addEventListener('click', () => {
                dismissLanyardHint();
                toggleFlip();
            });
        }
    }

    // ── 1b-2. UNIVERSAL ARCHITECTURAL SPLASH INTRO + PASS DROP ───
    function playIntroSequence() {
        const splash = document.getElementById('architect-splash');
        const seal = document.getElementById('architect-seal');
        const loaderBar = document.getElementById('splash-loader-bar');
        const loaderStatus = document.getElementById('splash-loader-status');
        const loaderPct = document.getElementById('splash-loader-pct');
        const loaderWrap = document.querySelector('.splash-loader-wrap');

        if (!splash || !seal || prefersReducedMotion || typeof gsap === 'undefined') {
            if (splash) splash.classList.add('is-hidden');
            return;
        }

        const grommetRing = document.querySelector('.navbar-grommet-ring');
        const sweepEl = document.getElementById('badge-intro-sweep');

        if (lanyardHint) {
            lanyardHint.style.opacity = '0';
            lanyardHint.style.transform = 'translateY(10px)';
        }

        // Prep lanyard assembly slightly above until splash completes (on home)
        if (lanyardAssembly && window.scrollY <= 100) {
            gsap.set(lanyardAssembly, { y: -190, opacity: 0.15 });
            if (strapRibbon) gsap.set(strapRibbon, { scaleY: 0, transformOrigin: 'top center' });
        }

        const tl = gsap.timeline({
            onComplete: () => {
                splash.classList.add('is-hidden');
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            }
        });

        // Phase 1 & 2: Crop marks, axes, and seal medallion arrive briskly and concurrently
        tl.fromTo('.splash-crop', 
            { opacity: 0, scale: 0.85 }, 
            { opacity: 1, scale: 1, duration: 0.12, ease: 'power2.out' }
        )
        .fromTo('.splash-axis', 
            { opacity: 0, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 0.12, ease: 'power2.out' }, 
            '-=0.08'
        )
        // Authentic Wax Seal Medallion stamps down briskly
        .fromTo(seal, 
            { opacity: 0, scale: 1.25, rotate: -5 },
            { opacity: 1, scale: 1, rotate: -2, duration: 0.22, ease: 'back.out(1.8)' },
            '-=0.06'
        );

        // Phase 3: High-tech precision loader progress (0 to 100% briskly in 0.32s)
        const progressObj = { val: 0 };
        tl.to(progressObj, {
            val: 100,
            duration: 0.32,
            ease: 'power2.out',
            onUpdate: () => {
                const current = Math.min(100, Math.round(progressObj.val));
                if (loaderBar) loaderBar.style.width = `${current}%`;
                if (loaderPct) loaderPct.textContent = `${current}%`;
                if (current >= 100 && loaderStatus) {
                    loaderStatus.textContent = 'AUTHENTICATED // READY';
                }
            }
        }, '-=0.15')
        // Brief hold on 100% READY
        .to({}, { duration: 0.08 })
        // Phase 4: Stamp, loader and blueprint marks dissolve smoothly
        .to(seal, { opacity: 0, scale: 1.04, duration: 0.16, ease: 'power2.in' })
        .to(loaderWrap, { opacity: 0, duration: 0.14 }, '-=0.12')
        .to('.splash-crop', { opacity: 0, duration: 0.12 }, '-=0.10')
        .to(splash, { opacity: 0, duration: 0.20, ease: 'power2.out' }, '-=0.08')
        // Phase 5: Pass drop triggers right as splash clears (if at top on home)
        .add(() => {
            if (lanyardAssembly && window.scrollY <= 100) {
                if (strapRibbon) {
                    gsap.to(strapRibbon, { scaleY: 1, duration: 0.75, ease: 'power2.out' });
                }
                gsap.to(lanyardAssembly, {
                    y: 0,
                    opacity: 1,
                    duration: 0.95,
                    ease: 'back.out(1.5)',
                    onComplete: () => {
                        if (pendulum) pendulum.kick(0.35);
                        if (grommetRing) {
                            grommetRing.classList.remove('clasp');
                            void grommetRing.offsetWidth;
                            grommetRing.classList.add('clasp');
                        }
                        if (sweepEl) {
                            sweepEl.classList.remove('play');
                            void sweepEl.offsetWidth;
                            sweepEl.classList.add('play');
                        }
                        if (lanyardHint && !hintDismissed) {
                            gsap.to(lanyardHint, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' });
                        }
                    }
                });
            } else {
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            }
        }, '-=0.15');
    }

    // Trigger intro drop immediately without stalling for slow resource downloads
    playIntroSequence();

    // ── 1c. HANDWRITTEN SUBTITLE WITH INK NIB (SCRUB-SYNCED) ──────────────
    const NIB_SVG =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(35 12 12)">' +
        '<path d="M8.5 2h7l1.6 7.6L12 22 6.9 9.6z"/>' +
        '<path class="nib-slit" d="M12 11.6v7"/>' +
        '<circle cx="12" cy="10" r="1.3" fill="#fff"/></g></svg>';
    const NIB_TIP_X = 5.7;
    const NIB_TIP_Y = 18.5;

    function createHandwriter(el) {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        el.textContent = '';

        const srText = document.createElement('span');
        srText.textContent = text;
        srText.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

        const ink = document.createElement('span');
        ink.setAttribute('aria-hidden', 'true');
        const chars = [];
        const words = text.split(' ');
        words.forEach((word, wi) => {
            const w = document.createElement('span');
            w.className = 'handwrite-word';
            w.style.whiteSpace = 'nowrap';
            for (const ch of word) {
                const c = document.createElement('span');
                c.className = 'handwrite-char';
                c.textContent = ch;
                w.appendChild(c);
                chars.push(c);
            }
            ink.appendChild(w);
            if (wi < words.length - 1) {
                const sp = document.createElement('span');
                sp.className = 'handwrite-char handwrite-space';
                sp.textContent = ' ';
                ink.appendChild(sp);
                chars.push(sp);
            }
        });

        const nib = document.createElement('span');
        nib.className = 'handwrite-pen-nib';
        nib.setAttribute('aria-hidden', 'true');
        nib.innerHTML = NIB_SVG;
        el.append(srText, ink, nib);

        // Pre-cache character coordinate positions relative to `el`
        // completely eliminates layout thrashing during scroll!
        let charPositions = [];

        function measurePositions() {
            const elRect = el.getBoundingClientRect();
            const fontSize = parseFloat(getComputedStyle(el).fontSize) || 24;
            charPositions = chars.map((c) => {
                const r = c.getBoundingClientRect();
                return {
                    x: r.right - elRect.left - NIB_TIP_X,
                    y: r.bottom - elRect.top - fontSize * 0.22 - NIB_TIP_Y
                };
            });
        }

        // Measure once layout is ready
        setTimeout(measurePositions, 80);
        window.addEventListener('resize', () => {
            requestAnimationFrame(measurePositions);
        }, { passive: true });

        return {
            measure: measurePositions,
            setProgress(progress) {
                if (prefersReducedMotion) {
                    chars.forEach(c => c.classList.add('revealed'));
                    nib.style.opacity = '0';
                    return;
                }
                if (progress <= 0) {
                    chars.forEach(c => c.classList.remove('revealed'));
                    nib.style.opacity = '0';
                    nib.classList.remove('active');
                    return;
                }

                if (charPositions.length === 0) {
                    measurePositions();
                }

                const total = chars.length;
                const floatIdx = progress * (total - 1);
                const activeIndex = Math.min(total - 1, Math.floor(floatIdx));
                const frac = floatIdx - activeIndex;

                for (let i = 0; i < total; i++) {
                    if (i <= activeIndex) {
                        chars[i].classList.add('revealed');
                    } else {
                        chars[i].classList.remove('revealed');
                    }
                }

                if (progress < 0.995 && activeIndex >= 0 && charPositions.length === total) {
                    // Anchor nib to the last revealed printable character (never hover in blank space)
                    let nibIndex = activeIndex;
                    while (nibIndex > 0 && chars[nibIndex].classList.contains('handwrite-space')) {
                        nibIndex--;
                    }
                    const p1 = charPositions[nibIndex];

                    let nextIndex = nibIndex + 1;
                    while (nextIndex < total && chars[nextIndex].classList.contains('handwrite-space')) {
                        nextIndex++;
                    }
                    const p2 = charPositions[Math.min(total - 1, nextIndex)] || p1;

                    let x = p1.x;
                    let y = p1.y;

                    // Smooth continuous glide between letters on the SAME line
                    if (Math.abs(p2.y - p1.y) < 18 && activeIndex === nibIndex) {
                        x = p1.x + (p2.x - p1.x) * frac;
                        y = p1.y + (p2.y - p1.y) * frac;
                    }

                    nib.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
                    nib.style.opacity = '1';
                    nib.classList.add('active');
                } else {
                    nib.style.opacity = '0';
                    nib.classList.remove('active');
                }
            },
            revealAll() {
                chars.forEach(c => c.classList.add('revealed'));
                nib.style.opacity = '0';
                nib.classList.remove('active');
            }
        };
    }

    const handwriteEl = document.querySelector('[data-handwrite]');
    const handwriter = handwriteEl ? createHandwriter(handwriteEl) : null;

    if (lanyardBadge && heroPullWrap && heroTextLayer) {
        if (typeof ScrollTrigger !== 'undefined' && heroSection && typeof gsap !== 'undefined') {
            const totalChars = typewriterChars.length;

            function applyHeroState(p) {
                // 1. Studio Pass ID Card: Elevates and fades cleanly out of the way EARLY (0.00 -> 0.22)
                const cardProg = clamp(p / 0.22, 0, 1);
                const cardEase = Math.pow(cardProg, 1.4);
                const cardY = -cardEase * (window.innerHeight * 1.15);
                const cardAlpha = Math.max(0, 1 - cardProg * 1.25);

                heroPullWrap.style.transform = `translate3d(0, ${cardY.toFixed(1)}px, 0)`;
                heroPullWrap.style.opacity = cardAlpha.toFixed(3);
                heroPullWrap.style.pointerEvents = p < 0.08 ? 'auto' : 'none';

                if (strapRibbon) {
                    strapRibbon.style.opacity = Math.max(0, 1 - cardProg * 2.2).toFixed(3);
                }
                if (p > 0.02) {
                    dismissLanyardHint();
                }
                if (lanyardHint) {
                    if (hintDismissed) {
                        lanyardHint.style.opacity = '0';
                        lanyardHint.style.pointerEvents = 'none';
                    } else {
                        lanyardHint.style.opacity = Math.max(0, 1 - cardProg * 3.0).toFixed(3);
                    }
                }
                if (navStrapAnchor) {
                    navStrapAnchor.classList.toggle('is-detached', p > 0.16);
                }

                // 2. The Text Layer: Centered & ascending gently into view (0.06 -> 0.28)
                const textProg = clamp((p - 0.06) / 0.22, 0, 1);
                const textAlpha = Math.min(1, textProg * 1.5);
                const textY = (1 - textProg) * 20;
                heroTextLayer.style.transform = `translate(-50%, -50%) translate3d(0, ${textY.toFixed(1)}px, 0)`;
                heroTextLayer.style.opacity = textAlpha.toFixed(3);
                heroTextLayer.style.pointerEvents = p > 0.40 ? 'auto' : 'none';

                // 3. Typewriter Character Reveal (letters appear smoothly from p = 0.12 to 0.40)
                if (totalChars > 0) {
                    const typeStart = 0.12;
                    const typeEnd = 0.40;
                    let revealedIndex = -1;

                    if (p >= typeStart) {
                        const typeProg = clamp((p - typeStart) / (typeEnd - typeStart), 0, 1);
                        revealedIndex = Math.min(totalChars - 1, Math.floor(typeProg * totalChars));
                    }

                    for (let idx = 0; idx < totalChars; idx++) {
                        if (idx <= revealedIndex) {
                            typewriterChars[idx].classList.add('revealed');
                        } else {
                            typewriterChars[idx].classList.remove('revealed');
                        }
                    }

                    // Sleek active typewriter caret
                    if (caret) {
                        if (revealedIndex >= 0 && revealedIndex < totalChars - 1 && p >= typeStart && p < typeEnd) {
                            if (typewriterChars[revealedIndex]) {
                                typewriterChars[revealedIndex].after(caret);
                            }
                            caret.classList.add('active');
                        } else {
                            caret.classList.remove('active');
                        }
                    }
                }

                // 4. Subtitle handwriting reveal (p = 0.38 to 0.82)
                if (heroSub) {
                    heroSub.style.opacity = p > 0.32 ? '1' : '0';
                }
                if (handwriter) {
                    const subStart = 0.38;
                    const subEnd = 0.82;
                    const subProg = clamp((p - subStart) / (subEnd - subStart), 0, 1);
                    handwriter.setProgress(subProg);
                }

                // 5. Action buttons illuminate cleanly (p = 0.78 to 0.90)
                if (heroActions) {
                    const btnStart = 0.78;
                    const btnEnd = 0.90;
                    const btnProg = clamp((p - btnStart) / (btnEnd - btnStart), 0, 1);
                    if (btnProg > 0) {
                        heroActions.style.opacity = btnProg.toFixed(3);
                        heroActions.style.transform = `translate3d(0, ${((1 - btnProg) * 12).toFixed(1)}px, 0)`;
                        heroActions.style.pointerEvents = btnProg > 0.6 ? 'auto' : 'none';
                        heroActions.classList.toggle('active', btnProg >= 0.5);
                    } else {
                        heroActions.style.opacity = '0';
                        heroActions.style.pointerEvents = 'none';
                        heroActions.classList.remove('active');
                    }
                }
            }

            // Initial render
            applyHeroState(0);

            // GSAP 60fps/120fps physics tween with 0.8s inertial scrub
            // Provides continuous floating-point updates with zero wheel jumping
            const heroState = { p: 0 };
            gsap.to(heroState, {
                p: 1,
                ease: 'none',
                onUpdate: () => {
                    applyHeroState(heroState.p);
                },
                scrollTrigger: {
                    trigger: heroSection,
                    start: 'top top',
                    end: '+=260%',
                    pin: true,
                    scrub: 0.8,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (self.progress === 0) applyHeroState(0);
                    }
                }
            });
        } else {
            // Fallback if ScrollTrigger is disabled or unavailable
            if (heroSub) heroSub.style.opacity = '1';
            if (handwriter) handwriter.revealAll();
            if (typewriterChars) typewriterChars.forEach(c => c.classList.add('revealed'));
            if (heroActions) heroActions.classList.add('active');
        }
    }

    // ── 1c. TRUSTED BY: PINNED PAPER LABELS REVERSIBLE SWING & DROP ENGINE 
    function initPinnedLabels() {
        const trustedSection = document.querySelector('.board-trusted-section');
        const labels = document.querySelectorAll('.pinned-client-label');
        if (!trustedSection || labels.length === 0) return;

        labels.forEach((label, idx) => {
            const tilt = parseFloat(label.dataset.tilt) || (idx % 2 === 0 ? -1.8 : 2.0);
            label.dataset.baseAngle = tilt;

            if (prefersReducedMotion || typeof gsap === 'undefined') {
                label.style.transform = `rotate(${tilt}deg)`;
                label.style.opacity = '1';
                return;
            }

            // Initial state: hidden slightly above ready to pin down
            gsap.set(label, {
                opacity: 0,
                y: -26,
                scale: 0.9,
                rotation: tilt + (idx % 2 === 0 ? -6 : 6),
                transformOrigin: '50% 4px'
            });
        });

        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        let isPinned = false;

        function startIdleSwing(label, baseAngle, idx) {
            if (prefersReducedMotion) return;
            const duration = 3.2 + (idx * 0.35);
            const amp = 0.85 + (idx % 2) * 0.35;
            
            gsap.to(label, {
                rotation: baseAngle + amp,
                duration: duration,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
                delay: idx * 0.12
            });
        }

        // Reversible Entrance: drops down and swings into board
        function playPinSequence() {
            if (isPinned) return;
            isPinned = true;

            labels.forEach((label, idx) => {
                gsap.killTweensOf(label);
                const baseAngle = parseFloat(label.dataset.baseAngle) || 0;
                const delay = idx * 0.11;
                const swingDir = idx % 2 === 0 ? 1 : -1;

                const tl = gsap.timeline({ delay });

                tl.to(label, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.22,
                    ease: 'power3.in'
                })
                .to(label, {
                    rotation: baseAngle + swingDir * 6.5,
                    duration: 0.2,
                    ease: 'sine.out'
                })
                .to(label, {
                    rotation: baseAngle - swingDir * 3.8,
                    duration: 0.24,
                    ease: 'sine.inOut'
                })
                .to(label, {
                    rotation: baseAngle + swingDir * 1.5,
                    duration: 0.26,
                    ease: 'sine.inOut'
                })
                .to(label, {
                    rotation: baseAngle,
                    duration: 0.32,
                    ease: 'power2.out',
                    onComplete: () => {
                        startIdleSwing(label, baseAngle, idx);
                    }
                });
            });
        }

        // Reversible Exit: when scrolling away, pack away cleanly
        function leavePinSequence() {
            if (!isPinned) return;
            isPinned = false;

            labels.forEach((label, idx) => {
                gsap.killTweensOf(label);
                const baseAngle = parseFloat(label.dataset.baseAngle) || 0;
                gsap.to(label, {
                    opacity: 0,
                    y: -24,
                    scale: 0.9,
                    rotation: baseAngle + (idx % 2 === 0 ? -4 : 4),
                    duration: 0.28,
                    delay: idx * 0.04,
                    ease: 'power2.in'
                });
            });
        }

        // ScrollTrigger: bidirectional entrance and exit
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: trustedSection,
                start: 'top 85%',
                end: 'bottom 15%',
                onEnter: () => playPinSequence(),
                onEnterBack: () => playPinSequence(),
                onLeave: () => leavePinSequence(),
                onLeaveBack: () => leavePinSequence()
            });
        } else {
            playPinSequence();
        }

        // Interactive hover: dynamic pendulum kick swing
        labels.forEach((label, idx) => {
            label.addEventListener('mouseenter', () => {
                if (!isPinned) return;
                gsap.killTweensOf(label);
                const baseAngle = parseFloat(label.dataset.baseAngle) || 0;
                const kickDir = idx % 2 === 0 ? 1 : -1;

                gsap.timeline()
                    .to(label, {
                        rotation: baseAngle + kickDir * 7.5,
                        duration: 0.18,
                        ease: 'sine.out'
                    })
                    .to(label, {
                        rotation: baseAngle - kickDir * 4.2,
                        duration: 0.22,
                        ease: 'sine.inOut'
                    })
                    .to(label, {
                        rotation: baseAngle + kickDir * 1.6,
                        duration: 0.26,
                        ease: 'sine.inOut'
                    })
                    .to(label, {
                        rotation: baseAngle,
                        duration: 0.3,
                        ease: 'power2.out',
                        onComplete: () => {
                            startIdleSwing(label, baseAngle, idx);
                        }
                    });
            });
        });
    }

    initPinnedLabels();

    // ── 2. SELECTED WORKS: LANDSCAPE CARD FAN-OUT DECK ──
    function initSelectedWorksDeck() {
        const workSection = document.getElementById('work');
        const cards = document.querySelectorAll('#deck-cards-wrap .landscape-post-card');
        const deckHeadline = document.getElementById('deck-center-headline');

        if (!workSection || cards.length === 0) return;

        // Dynamic distance calculation based on viewport width & height
        function getDeckGeometry() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const isMobile = w < 768;

            return {
                xDist: isMobile ? Math.min(95, w * 0.25) : Math.min(540, Math.max(290, w * 0.35)),
                yDist: isMobile ? Math.min(230, h * 0.30) : Math.min(250, Math.max(170, h * 0.30)),
                bottomDockY: isMobile ? Math.min(240, h * 0.32) : Math.min(320, h * 0.35),
                isMobile
            };
        }

        // Stacked deck coordinates at scroll progress = 0: docked cleanly at bottom edge (Stories in Motion reference)
        function getStartDeckStates() {
            const { bottomDockY, isMobile } = getDeckGeometry();
            if (isMobile) {
                return [
                    { x: -42, y: bottomDockY + 12, rot: -6.5, scale: 0.88, zIndex: 1 },
                    { x: -14, y: bottomDockY + 6,  rot: -3.0, scale: 0.90, zIndex: 2 },
                    { x: 14,  y: bottomDockY + 4,  rot: 2.5,  scale: 0.92, zIndex: 3 },
                    { x: 42,  y: bottomDockY + 10, rot: 5.5,  scale: 0.90, zIndex: 4 }
                ];
            }
            return [
                { x: -65, y: bottomDockY + 16, rot: -7.5, scale: 0.86, zIndex: 1 },
                { x: -22, y: bottomDockY + 8,  rot: -3.5, scale: 0.88, zIndex: 2 },
                { x: 22,  y: bottomDockY + 6,  rot: 3.0,  scale: 0.90, zIndex: 3 },
                { x: 65,  y: bottomDockY + 14, rot: 6.8,  scale: 0.88, zIndex: 4 }
            ];
        }

        let deckTimeline = null;

        function buildDeckTimeline() {
            if (deckTimeline) {
                if (deckTimeline.scrollTrigger) deckTimeline.scrollTrigger.kill();
                deckTimeline.kill();
                deckTimeline = null;
            }

            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                // On mobile, reset GSAP inline transforms so CSS lays out cards in a clean vertical column
                gsap.set(cards, { clearProps: "all" });
                if (deckHeadline) gsap.set(deckHeadline, { clearProps: "all" });
                return;
            }

            const { xDist, yDist } = getDeckGeometry();
            const startDeckStates = getStartDeckStates();

            // Target fanned-out corner coordinates at progress = 1
            const targetCornerStates = [
                { x: -xDist, y: -yDist, rot: -5.5 },        // 0: Top-Left
                { x: xDist, y: -yDist * 0.94, rot: 4.5 },   // 1: Top-Right
                { x: -xDist * 0.96, y: yDist, rot: 3.0 },   // 2: Bottom-Left
                { x: xDist * 0.98, y: yDist * 0.96, rot: -4.0 } // 3: Bottom-Right
            ];

            // Position cards initially docked cleanly at bottom
            cards.forEach((card, idx) => {
                const start = startDeckStates[idx] || startDeckStates[0];
                gsap.set(card, {
                    xPercent: -50,
                    yPercent: -50,
                    x: start.x,
                    y: start.y,
                    rotation: start.rot,
                    scale: start.scale,
                    opacity: 1,
                    zIndex: start.zIndex
                });
            });

            if (deckHeadline) {
                gsap.set(deckHeadline, { scale: 0.96, opacity: 1 });
            }

            // GSAP Continuous Subpixel Scrub Timeline (Desktop only)
            deckTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: workSection,
                    start: 'top top',
                    end: '+=160%',
                    pin: true,
                    scrub: 1.2,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        const isExpanded = self.progress > 0.4;
                        cards.forEach((card, idx) => {
                            card.style.zIndex = isExpanded ? (10 + idx) : (startDeckStates[idx]?.zIndex || 1);
                        });
                    }
                }
            });

            cards.forEach((card, idx) => {
                const target = targetCornerStates[idx] || targetCornerStates[0];
                deckTimeline.to(card, {
                    x: target.x,
                    y: target.y,
                    rotation: target.rot,
                    scale: 1,
                    ease: 'power1.inOut',
                    duration: 1
                }, 0);
            });

            if (deckHeadline) {
                deckTimeline.to(deckHeadline, {
                    scale: 1.02,
                    ease: 'power1.inOut',
                    duration: 1
                }, 0);
            }
        }

        // Initialize or fallback
        if (typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
            buildDeckTimeline();

            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    buildDeckTimeline();
                    ScrollTrigger.refresh();
                }, 150);
            });
        } else {
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                gsap.set(cards, { clearProps: "all" });
                if (deckHeadline) gsap.set(deckHeadline, { clearProps: "all" });
            } else {
                const { xDist, yDist } = getDeckGeometry();
                const targetCornerStates = [
                    { x: -xDist, y: -yDist, rot: -5.5 },
                    { x: xDist, y: -yDist * 0.94, rot: 4.5 },
                    { x: -xDist * 0.96, y: yDist, rot: 3.0 },
                    { x: xDist * 0.98, y: yDist * 0.96, rot: -4.0 }
                ];
                cards.forEach((card, idx) => {
                    const target = targetCornerStates[idx] || targetCornerStates[0];
                    gsap.set(card, {
                        xPercent: -50,
                        yPercent: -50,
                        x: target.x,
                        y: target.y,
                        rotation: target.rot,
                        scale: 1,
                        opacity: 1
                    });
                });
            }
        }

        // Supabase dynamic background sync (updates data-attributes and media if Supabase responds)
        async function syncSupabaseProjects() {
            if (typeof supabaseClient === 'undefined') return;
            try {
                const { data: projects, error } = await supabaseClient
                    .from('projects')
                    .select('*')
                    .eq('is_featured', true)
                    .order('display_order', { ascending: true })
                    .limit(4);

                if (error || !projects || projects.length === 0) return;

                projects.forEach((proj, idx) => {
                    if (!cards[idx]) return;
                    const card = cards[idx];
                    card.dataset.projectId = proj.id;
                    card.dataset.projectTitle = proj.title;
                    card.dataset.projectTag = (proj.category_tags && proj.category_tags.length > 0)
                        ? proj.category_tags.join(' // ').toUpperCase()
                        : 'CASE STUDY';
                    card.dataset.projectDesc = proj.description || proj.headline || '';
                    if (proj.hero_image) card.dataset.projectImg = proj.hero_image;
                    card.dataset.projectLink = `case-study.html?project=${encodeURIComponent(proj.id)}`;

                    const titleEl = card.querySelector('.card-title');
                    if (titleEl) titleEl.textContent = proj.title.toUpperCase();

                    const tagEl = card.querySelector('.card-tag');
                    if (tagEl) {
                        const primaryTag = (proj.category_tags && proj.category_tags[0])
                            ? proj.category_tags[0].toUpperCase()
                            : 'CASE STUDY';
                        tagEl.textContent = `${primaryTag} ↗`;
                    }

                    const mediaBox = card.querySelector('.card-media-box');
                    if (mediaBox && proj.hero_image) {
                        const isMp4 = proj.hero_image.toLowerCase().endsWith('.mp4') || proj.hero_image.toLowerCase().includes('.mp4');
                        if (isMp4) {
                            mediaBox.innerHTML = `
                                <video src="${proj.hero_image}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>
                                <div class="card-expand-badge"><i class="fa-solid fa-expand"></i> View</div>
                            `;
                        } else {
                            mediaBox.innerHTML = `
                                <img src="${proj.hero_image}" alt="${proj.title}" loading="lazy">
                                <div class="card-expand-badge"><i class="fa-solid fa-expand"></i> View</div>
                            `;
                        }
                    }
                });
            } catch (err) {
                console.warn("Supabase project sync note:", err);
            }
        }

        syncSupabaseProjects();
    }

    initSelectedWorksDeck();

    // ── FULL IN-MODAL CASE STUDY READER ENGINE ──
    function initCaseStudyExpandModal() {
        const modal = document.getElementById('case-study-expand-modal');
        const modalCard = document.getElementById('expand-modal-card');
        const modalBackdrop = document.getElementById('expand-modal-backdrop');
        const modalCloseBtn = document.getElementById('expand-modal-close');
        const modalScrollArea = document.getElementById('expand-modal-scroll-area');

        if (!modal || !modalCard) return;

        let activeSourceCard = null;

        // Static fallback case study visual assets dictionary for instant zero-latency loading
        const fallbackCaseStudies = {
            'swychr': {
                role: 'Lead Product Designer',
                duration: '6 months',
                tools: 'Figma, Principle, Next.js',
                industry: 'Fintech & Cross-Border Payments',
                projectLink: 'https://swychr.com',
                fullVisuals: [
                    'assets/Aaron.webp',
                    'assets/final-cover.webp'
                ]
            },
            'neura': {
                role: 'Senior UI/UX Designer',
                duration: '3 weeks',
                tools: 'Figma, Blender',
                industry: 'AI E-Commerce',
                projectLink: null,
                fullVisuals: []
            },
            'wagestream': {
                role: 'Product Designer (UX/UI)',
                duration: '2 weeks',
                tools: 'Figma, AI',
                industry: 'Fintech & Financial Wellness',
                projectLink: null,
                fullVisuals: []
            },
            'riki-ai': {
                role: 'Founding Designer',
                duration: '4 months',
                tools: 'Figma, Framer, React',
                industry: 'AI Productivity & Knowledge Systems',
                projectLink: null,
                fullVisuals: []
            }
        };

        async function openCardModal(card) {
            const rawTitle = card.dataset.projectTitle || card.querySelector('.card-title, .project-title')?.textContent?.trim() || 'Featured Case Study';
            const rawTag = card.dataset.projectTag || card.querySelector('.card-tag, .project-tag')?.textContent?.trim() || 'CASE STUDY';
            const rawDesc = card.dataset.projectDesc || card.querySelector('.project-desc')?.textContent?.trim() || '';
            const link = card.dataset.projectLink || '';
            const imgSrc = card.dataset.projectImg || card.querySelector('img, video')?.src || '';

            // Extract project id
            let projectId = card.dataset.projectId || '';
            if (!projectId && link) {
                try {
                    const url = new URL(link, window.location.origin);
                    projectId = url.searchParams.get('project') || '';
                } catch(e) {
                    const m = link.match(/project=([^&]+)/);
                    if (m) projectId = decodeURIComponent(m[1]);
                }
            }
            if (!projectId) {
                projectId = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            }

            const modalTag = document.getElementById('modal-project-tag');
            const modalTopTitle = document.getElementById('modal-top-bar-title');
            const modalTitle = document.getElementById('modal-project-title');
            const modalDesc = document.getElementById('modal-project-desc');
            const modalRole = document.getElementById('modal-stat-role');
            const modalDuration = document.getElementById('modal-stat-duration');
            const modalTools = document.getElementById('modal-stat-tools');
            const modalIndustry = document.getElementById('modal-stat-industry');
            const modalLiveBtn = document.getElementById('modal-live-project-btn');
            const visualsInner = document.getElementById('modal-cs-visuals-inner');
            const visualsLoading = document.getElementById('modal-cs-loading');

            if (modalTag) modalTag.textContent = rawTag;
            if (modalTopTitle) modalTopTitle.textContent = rawTitle;
            if (modalTitle) modalTitle.textContent = rawTitle;
            if (modalDesc) modalDesc.textContent = rawDesc || 'A comprehensive product design case study exploring end-to-end user journeys, systems design, and interface metrics.';

            // Reset initial stats with fallback defaults
            const fb = fallbackCaseStudies[projectId.toLowerCase()] || fallbackCaseStudies[projectId.toLowerCase().replace(/redesign/g, '').trim()] || {};
            if (modalRole) modalRole.textContent = fb.role || 'Product Designer';
            if (modalDuration) modalDuration.textContent = fb.duration || 'Varies';
            if (modalTools) modalTools.textContent = fb.tools || 'Figma';
            if (modalIndustry) modalIndustry.textContent = fb.industry || rawTag || 'Digital Product';

            if (modalLiveBtn) {
                if (fb.projectLink) {
                    modalLiveBtn.href = fb.projectLink;
                    modalLiveBtn.style.display = 'inline-flex';
                } else {
                    modalLiveBtn.style.display = 'none';
                }
            }

            // Clear previous visuals and show loading
            if (visualsInner) {
                visualsInner.innerHTML = '';
                if (imgSrc) {
                    const isVideo = imgSrc.toLowerCase().match(/\.(mp4|webm|mov)$/i);
                    visualsInner.innerHTML = isVideo 
                        ? `<video src="${imgSrc}" autoplay loop muted playsinline style="width:100%; display:block; border:none; margin:-1px 0;"></video>`
                        : `<img src="${imgSrc}" alt="${rawTitle}" style="width:100%; display:block; border:none; margin:-1px 0;">`;
                }
            }
            if (visualsLoading) visualsLoading.style.display = 'block';

            activeSourceCard = card;

            // Compute center-to-center zoom origin
            const rect = card.getBoundingClientRect();
            const sourceCenterX = rect.left + rect.width / 2;
            const sourceCenterY = rect.top + rect.height / 2;
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            const startDx = sourceCenterX - screenCenterX;
            const startDy = sourceCenterY - screenCenterY;
            const targetModalWidth = Math.min(1080, window.innerWidth * 0.94);
            const startScale = Math.max(0.25, rect.width / targetModalWidth);

            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            if (modalScrollArea) modalScrollArea.scrollTop = 0;

            document.body.classList.add('modal-scroll-locked');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();

            gsap.killTweensOf(modalCard);
            if (modalBackdrop) gsap.killTweensOf(modalBackdrop);

            gsap.fromTo(modalCard,
                {
                    x: startDx,
                    y: startDy,
                    scale: startScale,
                    opacity: 0.4
                },
                {
                    x: 0,
                    y: 0,
                    scale: 1,
                    opacity: 1,
                    duration: 0.42,
                    ease: 'power3.out'
                }
            );

            if (modalBackdrop) {
                gsap.fromTo(modalBackdrop,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.3, ease: 'power2.out' }
                );
            }

            // Fetch case study details & full visual chunks asynchronously from Supabase
            try {
                if (typeof supabaseClient !== 'undefined') {
                    // Try fetch by project ID
                    const { data: csData } = await supabaseClient
                        .from('case_studies')
                        .select('*')
                        .or(`id.eq.${projectId},id.ilike.%${projectId}%`)
                        .limit(1)
                        .maybeSingle();

                    if (csData) {
                        if (modalRole && csData.role) modalRole.textContent = csData.role;
                        if (modalDuration && csData.duration) modalDuration.textContent = csData.duration;
                        if (modalTools && csData.tools) modalTools.textContent = csData.tools;
                        if (modalIndustry && csData.industry) modalIndustry.textContent = csData.industry;
                        if (modalLiveBtn && csData.project_link) {
                            modalLiveBtn.href = csData.project_link;
                            modalLiveBtn.style.display = 'inline-flex';
                        }

                        const visuals = Array.isArray(csData.full_image_chunks) ? csData.full_image_chunks.filter(v => typeof v === 'string' && v.trim() !== '') : [];
                        if (visuals.length > 0 && visualsInner) {
                            visualsInner.innerHTML = visuals.map(url => {
                                const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                                return isVideo 
                                    ? `<video src="${url}" autoplay loop muted playsinline style="width:100%; display:block; border:none; margin:-1px 0;"></video>`
                                    : `<img src="${url}" alt="${rawTitle} Visual" loading="lazy" style="width:100%; display:block; border:none; margin:-1px 0;">`;
                            }).join('');
                        }
                    }
                }
            } catch (err) {
                console.warn("In-modal case study fetch:", err);
            } finally {
                if (visualsLoading) visualsLoading.style.display = 'none';
            }
        }

        function closeCardModal() {
            if (!modal || !modal.classList.contains('active')) return;

            document.body.classList.remove('modal-scroll-locked');
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();

            modal.setAttribute('aria-hidden', 'true');

            // Pause any playing videos inside modal
            const videos = modal.querySelectorAll('video');
            videos.forEach(v => { try { v.pause(); } catch(e) {} });

            if (activeSourceCard) {
                const rect = activeSourceCard.getBoundingClientRect();
                const sourceCenterX = rect.left + rect.width / 2;
                const sourceCenterY = rect.top + rect.height / 2;
                const screenCenterX = window.innerWidth / 2;
                const screenCenterY = window.innerHeight / 2;
                const endDx = sourceCenterX - screenCenterX;
                const endDy = sourceCenterY - screenCenterY;
                const targetModalWidth = Math.min(1080, window.innerWidth * 0.94);
                const endScale = Math.max(0.25, rect.width / targetModalWidth);

                gsap.to(modalCard, {
                    x: endDx,
                    y: endDy,
                    scale: endScale,
                    opacity: 0,
                    duration: 0.32,
                    ease: 'power2.in',
                    onComplete: () => {
                        modal.classList.remove('active');
                        gsap.set(modalCard, { clearProps: 'all' });
                        activeSourceCard = null;
                    }
                });

                if (modalBackdrop) {
                    gsap.to(modalBackdrop, {
                        opacity: 0,
                        duration: 0.28,
                        ease: 'power2.in'
                    });
                }
            } else {
                gsap.to(modalCard, {
                    scale: 0.94,
                    opacity: 0,
                    duration: 0.24,
                    ease: 'power2.in',
                    onComplete: () => {
                        modal.classList.remove('active');
                        gsap.set(modalCard, { clearProps: 'all' });
                    }
                });
                if (modalBackdrop) {
                    gsap.to(modalBackdrop, { opacity: 0, duration: 0.24 });
                }
            }
        }

        // Global delegated click listener: captures any card click across home and gallery
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.landscape-post-card, .project-card, .portfolio-card-large');
            if (card && !e.target.closest('#case-study-expand-modal')) {
                e.preventDefault();
                e.stopPropagation();
                openCardModal(card);
            }
        });

        // Close triggers
        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeCardModal);
        if (modalBackdrop) modalBackdrop.addEventListener('click', closeCardModal);

        document.querySelectorAll('.modal-close-trigger-btn, #modal-bottom-close-btn').forEach(btn => {
            btn.addEventListener('click', closeCardModal);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeCardModal();
            }
        });
    }

        window.openCardModal = openCardModal;
        window.closeCardModal = closeCardModal;
    }

    initCaseStudyExpandModal();

    // ── 3. TESTIMONIALS: 4 VISIBLE + "UNFOLD ALL" ACCORDION ───────────────
    const unfoldBtn = document.getElementById('unfold-testimonials-btn');
    const cascadeContainer = document.getElementById('testimonials-cascade-container');
    const unfoldBtnText = document.getElementById('unfold-btn-text');
    const unfoldBtnArrow = document.getElementById('unfold-btn-arrow');

    async function loadCascadeTestimonials() {
        if (!cascadeContainer || typeof supabaseClient === 'undefined') return;

        try {
            const { data: reviews, error } = await supabaseClient
                .from('reviews')
                .select('*')
                .order('display_order', { ascending: true });

            if (error || !reviews) return;

            // Skip first 4 (already visible) and put the rest in cascade
            const remaining = reviews.slice(4);
            if (remaining.length === 0) {
                if (unfoldBtn) unfoldBtn.style.display = 'none';
                return;
            }

            if (unfoldBtnText) {
                unfoldBtnText.textContent = `Unfold All Testimonials (${reviews.length})`;
            }

            let html = '';
            const pushpinColors = ['coral', 'blue', 'amber', 'purple'];
            remaining.forEach((rev, idx) => {
                const pin = pushpinColors[idx % pushpinColors.length];
                const rot = (idx % 2 === 0) ? '-2deg' : '2.5deg';
                const alignStyle = (idx % 2 === 0)
                    ? `align-self: flex-start; margin-left: 5%; transform: rotate(${rot});`
                    : `align-self: flex-end; margin-right: 5%; transform: rotate(${rot}); margin-top: -15px;`;

                html += `
                    <div class="modern-test-card" style="${alignStyle}">
                        <div class="board-pushpin ${pin}" style="top: -6px; right: 24px;"></div>
                        <div class="test-memo-stamp">CLIENT MEMO // ${(rev.company || 'FEEDBACK').toUpperCase()}</div>
                        <p class="modern-test-text">"${rev.feedback}"</p>
                        <div class="modern-test-author-row">
                            <div class="modern-test-avatar-container">
                                <img src="${rev.avatar_url || 'assets/nav face logo.png'}" alt="${rev.name}" onerror="this.src='assets/nav face logo.png'">
                            </div>
                            <div class="modern-test-author-info">
                                <span class="author-name">${(rev.name || '').toUpperCase()}</span>
                                <span class="author-company">${(rev.role || '').toUpperCase()} // ${(rev.company || '').toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            cascadeContainer.innerHTML = html;
        } catch (e) {
            console.error("Error loading cascade reviews:", e);
        }
    }

    loadCascadeTestimonials();

    if (unfoldBtn && cascadeContainer) {
        unfoldBtn.addEventListener('click', () => {
            const isOpen = cascadeContainer.classList.contains('open');
            if (isOpen) {
                cascadeContainer.classList.remove('open');
                unfoldBtnText.textContent = 'Unfold All Testimonials';
                unfoldBtnArrow.textContent = '↓';
            } else {
                cascadeContainer.classList.add('open');
                unfoldBtnText.textContent = 'Fold Testimonials';
                unfoldBtnArrow.textContent = '↑';

                // Subtle GSAP entrance animation for unfolded cards
                const newCards = cascadeContainer.querySelectorAll('.modern-test-card');
                if (typeof gsap !== 'undefined' && newCards.length > 0) {
                    gsap.from(newCards, {
                        y: 20,
                        opacity: 0,
                        stagger: 0.08,
                        duration: 0.4,
                        ease: 'power2.out'
                    });
                }
            }
        });
    }

    // ── 4. CAPABILITIES ("HOW I HELP BRANDS GROW") SEQUENTIAL PINNING & PENCIL DRAWING ──
    function initValuePillarsJourney() {
        const section = document.getElementById('services');
        const path = document.getElementById('pencil-dashed-path');
        const notes = document.querySelectorAll('.journey-sticky-note[data-journey-note]');
        const badge = document.getElementById('journey-partner-badge');
        const avatar = document.getElementById('journey-avatar-img');
        const partnerText = document.getElementById('journey-partner-text');

        if (!section || notes.length === 0) return;

        let pathLen = 1200;
        if (path && typeof path.getTotalLength === 'function') {
            try {
                pathLen = path.getTotalLength();
            } catch (e) {
                pathLen = 1200;
            }
        }

        if (path) {
            path.style.strokeDasharray = `${pathLen} ${pathLen}`;
            path.style.strokeDashoffset = `${pathLen}`;
        }

        const baseRotations = [-2.5, 2.8, -1.8, 3.0];
        notes.forEach((note, idx) => {
            note.dataset.baseRot = baseRotations[idx] || 0;
            if (prefersReducedMotion || typeof gsap === 'undefined') {
                note.style.opacity = '1';
                note.style.transform = `rotate(${baseRotations[idx]}deg)`;
            } else {
                gsap.set(note, {
                    opacity: 0,
                    y: -32,
                    scale: 0.94,
                    rotation: (baseRotations[idx] || 0) + (idx % 2 === 0 ? -4 : 4)
                });
            }
        });

        if (badge && typeof gsap !== 'undefined') gsap.set(badge, { opacity: 0 });
        if (avatar && typeof gsap !== 'undefined') gsap.set(avatar, { opacity: 0, scale: 0.5, y: -20 });

        const partnerHandwriter = partnerText ? createHandwriter(partnerText) : null;
        if (partnerHandwriter) partnerHandwriter.setProgress(0);

        if (prefersReducedMotion || typeof gsap === 'undefined') {
            if (path) path.style.strokeDashoffset = '0';
            if (badge) badge.style.opacity = '1';
            if (avatar) avatar.style.opacity = '1';
            if (partnerHandwriter) partnerHandwriter.revealAll();
            return;
        }

        const tl = gsap.timeline({ paused: true });

        // Note 01 drops & pins down
        tl.to(notes[0], {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: baseRotations[0],
            duration: 0.32,
            ease: 'back.out(1.8)'
        })
        // Pencil line draws from Note 01 to Note 02
        .to(path, {
            strokeDashoffset: pathLen * 0.74,
            duration: 0.42,
            ease: 'power1.inOut'
        }, '-=0.06')
        // Note 02 drops & pins down
        .to(notes[1], {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: baseRotations[1],
            duration: 0.32,
            ease: 'back.out(1.8)'
        }, '-=0.1')
        // Pencil line draws from Note 02 to Note 03
        .to(path, {
            strokeDashoffset: pathLen * 0.48,
            duration: 0.42,
            ease: 'power1.inOut'
        }, '-=0.06')
        // Note 03 drops & pins down
        .to(notes[2], {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: baseRotations[2],
            duration: 0.32,
            ease: 'back.out(1.8)'
        }, '-=0.1')
        // Pencil line draws from Note 03 to Note 04
        .to(path, {
            strokeDashoffset: pathLen * 0.20,
            duration: 0.42,
            ease: 'power1.inOut'
        }, '-=0.06')
        // Note 04 drops & pins down
        .to(notes[3], {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: baseRotations[3],
            duration: 0.32,
            ease: 'back.out(1.8)'
        }, '-=0.1')
        // Pencil line curves down to destination partner badge
        .to(path, {
            strokeDashoffset: 0,
            duration: 0.36,
            ease: 'power1.out'
        }, '-=0.06')
        // Partner badge and avatar drop with an authentic stamp impact
        .to(badge, { opacity: 1, duration: 0.12 }, '-=0.08')
        .to(avatar, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.38,
            ease: 'back.out(2.2)'
        }, '-=0.08');

        // Ink pen writes out "Your all-in-one design partner."
        if (partnerHandwriter) {
            const hwObj = { p: 0 };
            tl.to(hwObj, {
                p: 1,
                duration: 0.72,
                ease: 'none',
                onUpdate: () => {
                    partnerHandwriter.setProgress(hwObj.p);
                }
            }, '-=0.06');
        } else if (partnerText) {
            tl.to(partnerText, { opacity: 1, duration: 0.25 }, '-=0.06');
        }

        // Bidirectional ScrollTrigger: play on enter, reverse cleanly on leave back
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 75%',
                end: 'bottom 15%',
                onEnter: () => tl.play(),
                onEnterBack: () => tl.play(),
                onLeaveBack: () => tl.reverse()
            });
        } else {
            tl.play();
        }

        // Interactive hover micro-swing on notes
        notes.forEach((note) => {
            note.addEventListener('mouseenter', () => {
                const base = parseFloat(note.dataset.baseRot) || 0;
                gsap.to(note, {
                    rotation: base + (base < 0 ? -1.8 : 1.8),
                    y: -5,
                    scale: 1.02,
                    duration: 0.22,
                    ease: 'power2.out'
                });
            });
            note.addEventListener('mouseleave', () => {
                const base = parseFloat(note.dataset.baseRot) || 0;
                gsap.to(note, {
                    rotation: base,
                    y: 0,
                    scale: 1,
                    duration: 0.32,
                    ease: 'power2.out'
                });
            });
        });
    }

    initValuePillarsJourney();

    // ── 5. CURRICULUM VITAE: ARCHIVAL SHEET HOVER PENDULUM SWING ───────────
    function initResumePhysics() {
        const resumeDoc = document.getElementById('resume-paper-document');
        if (!resumeDoc || prefersReducedMotion || typeof gsap === 'undefined') return;

        let isSwinging = false;
        resumeDoc.addEventListener('mouseenter', () => {
            if (isSwinging) return;
            isSwinging = true;
            gsap.killTweensOf(resumeDoc);

            gsap.timeline({
                onComplete: () => { isSwinging = false; }
            })
            .to(resumeDoc, { rotation: -3.6, duration: 0.22, ease: 'sine.out' })
            .to(resumeDoc, { rotation: 2.2, duration: 0.25, ease: 'sine.inOut' })
            .to(resumeDoc, { rotation: -1.4, duration: 0.28, ease: 'sine.inOut' })
            .to(resumeDoc, { rotation: 0.6, duration: 0.30, ease: 'sine.inOut' })
            .to(resumeDoc, { rotation: -0.8, duration: 0.35, ease: 'power2.out' });
        });
    }

    initResumePhysics();

    // ── 6. STATS: BIDIRECTIONAL PINNING & PIN SHAKE / TAPE LIFT ────────────
    function initStatsMemos() {
        const section = document.querySelector('.board-stats-section');
        const notes = document.querySelectorAll('.stat-paper-note');
        if (!section || notes.length === 0) return;

        const baseRots = [-2.5, 1.8, -1.2, 2.8];

        notes.forEach((note, idx) => {
            const baseRot = baseRots[idx] || 0;
            note.dataset.baseRot = baseRot;
            // Always ensure fully visible by default!
            gsap.set(note, {
                opacity: 1,
                y: 0,
                rotation: baseRot
            });
        });

        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.create({
                trigger: section,
                start: 'top 88%',
                once: true,
                onEnter: () => {
                    notes.forEach((note, idx) => {
                        const baseRot = parseFloat(note.dataset.baseRot) || 0;
                        const isPin = note.dataset.statType === 'pin';
                        gsap.fromTo(note,
                            { y: -16, rotation: baseRot + (isPin ? 3 : -2) },
                            { y: 0, rotation: baseRot, duration: 0.35, delay: idx * 0.08, ease: isPin ? 'back.out(1.6)' : 'power2.out' }
                        );
                    });
                }
            });
        }

        // Interactive hover: Pinned notes (Card 2 & 4) shake; Taped notes (Card 1 & 3) lift
        notes.forEach((note, idx) => {
            const isPin = note.dataset.statType === 'pin';
            const baseRot = parseFloat(note.dataset.baseRot) || 0;

            if (isPin) {
                note.addEventListener('mouseenter', () => {
                    gsap.killTweensOf(note);
                    gsap.timeline()
                        .to(note, { rotation: baseRot + 5.5, duration: 0.16, ease: 'sine.out' })
                        .to(note, { rotation: baseRot - 3.8, duration: 0.20, ease: 'sine.inOut' })
                        .to(note, { rotation: baseRot + 1.8, duration: 0.24, ease: 'sine.inOut' })
                        .to(note, { rotation: baseRot, duration: 0.28, ease: 'power2.out' });
                });
            } else {
                note.addEventListener('mouseenter', () => {
                    gsap.to(note, { y: -5, scale: 1.02, duration: 0.22, ease: 'power2.out' });
                });
                note.addEventListener('mouseleave', () => {
                    gsap.to(note, { y: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
                });
            }
        });
    }

    initStatsMemos();

    // ── 7. TESTIMONIALS: INDIVIDUAL SCROLL-TRIGGERED PUNCH-PINNING ──────────
    function initTestimonialsPinning() {
        const cards = document.querySelectorAll('.testimonials-storyboard-canvas .modern-test-card');
        if (cards.length === 0) return;

        const baseRots = [-2.2, 2.8, -1.5, -2.4];

        cards.forEach((card, idx) => {
            const baseRot = baseRots[idx] || 0;
            card.dataset.baseRot = baseRot;
            // Always ensure fully visible by default!
            gsap.set(card, {
                opacity: 1,
                scale: 1,
                y: 0,
                rotation: baseRot
            });
        });

        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        if (typeof ScrollTrigger !== 'undefined') {
            cards.forEach((card, idx) => {
                const baseRot = parseFloat(card.dataset.baseRot) || 0;
                const pin = card.querySelector('.board-pushpin, .washi-tape-strip');

                ScrollTrigger.create({
                    trigger: card,
                    start: 'top 85%',
                    once: true,
                    onEnter: () => {
                        gsap.fromTo(card,
                            { y: -24, scale: 1.03, rotation: baseRot + (idx % 2 === 0 ? 2.5 : -2.5) },
                            { y: 0, scale: 1, rotation: baseRot, duration: 0.36, ease: 'power2.out' }
                        );

                        if (pin) {
                            gsap.fromTo(pin,
                                { rotation: -12, scale: 1.2 },
                                { rotation: 0, scale: 1, duration: 0.32, ease: 'elastic.out(1, 0.4)' }
                            );
                        }
                    }
                });
            });
        }
    }

    initTestimonialsPinning();

    // ── 8. SERVICES MENU & FINAL NOTE: BOARD PHYSICS & SWINGS ─────────────
    function initServiceMenuAndFinalNotePhysics() {
        const serviceSheet = document.getElementById('service-menu-sheet');
        const finalNote = document.getElementById('final-paper-note');
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        [
            { el: serviceSheet, baseRot: 0.6, kick: 3.2 },
            { el: finalNote, baseRot: -0.5, kick: 3.5 }
        ].forEach(({ el, baseRot, kick }) => {
            if (!el) return;

            let isSwinging = false;
            function triggerSwing() {
                if (isSwinging) return;
                isSwinging = true;
                gsap.killTweensOf(el);
                gsap.timeline({
                    onComplete: () => { isSwinging = false; }
                })
                .to(el, { rotation: baseRot + kick, duration: 0.22, ease: 'sine.out' })
                .to(el, { rotation: baseRot - kick * 0.65, duration: 0.26, ease: 'sine.inOut' })
                .to(el, { rotation: baseRot + kick * 0.35, duration: 0.28, ease: 'sine.inOut' })
                .to(el, { rotation: baseRot, duration: 0.32, ease: 'power2.out' });
            }

            el.addEventListener('mouseenter', triggerSwing);

            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 85%',
                    onEnter: triggerSwing,
                    onEnterBack: triggerSwing
                });
            }
        });
    }

    // ── 15. JOURNAL DOSSIER ESSAYS VIEWER ENGINE ───────────────────────
    function initJournalDossiers() {
        const folderCards = document.querySelectorAll('.journal-folder-card');
        const readingSheet = document.getElementById('journal-reading-sheet');
        const backdrop = document.getElementById('journal-reading-backdrop');
        const foldBtn = document.getElementById('paper-fold-btn');

        if (!folderCards.length || !readingSheet) return;

        const articles = {
            1: {
                meta: 'JOURNAL :: N°01 // ESSAY • 5 MIN READ',
                category: 'PRODUCT UX & STRATEGY',
                title: 'Designing for Trust Over Fleeting Trends',
                byline: 'Emmanuel Bliss • Product Designer & UX Therapist • 2026',
                quote: '“Great products aren’t remembered because they’re flashy. They’re remembered because they feel effortless, predictable, and calm.”',
                body: `
                    <p>Every quarter, a new design trend sweeps Twitter and Dribbble. Gradients get more aggressive, border-radii inflate, glassmorphism morphs into claymorphism, and interfaces begin to resemble arcade games rather than tools built for human intent.</p>
                    <p>Yet if you look at the products that retain users over five to ten years, products that command multi-billion-dollar retention engines, they share a profound, almost stubborn restraint. They prioritize <strong>predictable cognitive models</strong> over aesthetic vanity.</p>
                    <h3>1. The Cost of Digital Hesitation</h3>
                    <p>When a user opens an app, their subconscious asks three immediate questions within 400 milliseconds: <em>Where am I? What can I do here? And what happens if I tap this?</em></p>
                    <p>When designers hide essential navigation under playful micro-interactions or swap familiar confirmation states for trendy gestures, friction accumulates. Users do not think, "Oh, what a clever animation." They experience micro-hesitation. And micro-hesitation is the precursor to churn.</p>
                    <div class="margin-note">&ldquo;Every unnecessary millisecond of doubt weakens user trust.&rdquo;</div>
                    <h3>2. The Heuristic of Zero Hesitation</h3>
                    <p>Clarity is not the absence of beauty; it is the presence of purpose. By designing transparent states, establishing unmistakable visual hierarchy, and respecting established platform mental models, we allow the user's mind to focus entirely on their goal.</p>
                    <p>When you build for clarity first, beauty emerges naturally as a byproduct of elegance and effortless utility.</p>
                `
            },
            2: {
                meta: 'JOURNAL :: N°02 // ESSAY • 4 MIN READ',
                category: 'HUMAN BEHAVIOR // PRODUCT EMOTION',
                title: 'Why Emotional Intelligence is a Competitive Advantage',
                byline: 'Emmanuel Bliss • Product Designer & UX Therapist • 2026',
                quote: '“Users don’t merely process your product; they feel it. When things go wrong, empathy is the only design pattern that matters.”',
                body: `
                    <p>In the rush to automate every possible workflow and squeeze conversion metrics through relentless A/B tests, teams often optimize for logic while completely ignoring emotion.</p>
                    <p>Software is not evaluated in an emotional vacuum. A user opening a fintech app may be stressed about payroll. A patient logging into a telehealth portal may be anxious about lab results. A founder configuring a dashboard may be overwhelmed by impending deadlines.</p>
                    <h3>1. Designing for Vulnerability</h3>
                    <p>Emotionally intelligent software acknowledges the psychological state of the person on the other side of the glass. It avoids patronizing celebratory modals when a routine task is finished, and it never leaves users in an ambiguous error state without a clear path forward.</p>
                    <div class="margin-note">&ldquo;Software without empathy is just cold machinery.&rdquo;</div>
                    <h3>2. De-escalating Friction</h3>
                    <p>By designing reassuring micro-copy, providing undo actions instead of aggressive confirmation dialogs, and preserving user data across form failures, products cultivate deep psychological safety. And psychological safety is what turns first-time visitors into lifelong advocates.</p>
                `
            },
            3: {
                meta: 'JOURNAL :: N°03 // ESSAY • 6 MIN READ',
                category: 'FRICTION HEURISTICS // RETENTION',
                title: 'Why Users Drop Off: Understanding Cognitive Friction',
                byline: 'Emmanuel Bliss • Product Designer & UX Therapist • 2026',
                quote: '“Drop-offs aren’t always a sign of disinterest, they signal that your interface demanded too much cognitive effort too early in the journey.”',
                body: `
                    <p>When product analytics reveal a sharp drop-off between step two and step three of an onboarding funnel, the default reaction is often: "We need more incentives, better banners, or a promotional discount."</p>
                    <p>Rarely do teams pause to examine the <strong>cognitive taxation</strong> imposed by the interface itself.</p>
                    <h3>1. Cognitive Load Theory in Product Design</h3>
                    <p>Human working memory is finite. Every choice you present, every field you demand, every inconsistent icon you introduce consumes a unit of mental bandwidth. When the total cognitive load exceeds the user's perceived payoff, they close the tab.</p>
                    <div class="margin-note">&ldquo;Don’t ask for user commitment before demonstrating undeniable value.&rdquo;</div>
                    <h3>2. The Law of Progressive Disclosure</h3>
                    <p>Great product designers are editors. We don't reveal every feature on the first screen. We stage information progressively: give the user immediate clarity on their current step, anticipate their next logical question, and defer advanced complexity until the moment it becomes relevant.</p>
                `
            },
            4: {
                meta: 'JOURNAL :: N°04 // ESSAY • 5 MIN READ',
                category: 'PRODUCT DISCOVERY // REALITY TESTING',
                title: 'Why User Research Is the Foundation of Great Products',
                byline: 'Emmanuel Bliss • Product Designer & UX Therapist • 2026',
                quote: '“Research does not exist to validate pre-existing biases. It exists to reveal where your assumptions are wrong before they become expensive mistakes.”',
                body: `
                    <p>Too many product teams treat user research as a ceremonial compliance checkbox: write a hypothesis, draft questions that prompt the desired answer, interview three friendly customers, and celebrate validation.</p>
                    <p>True research is adversarial to ego. It is the deliberate, rigorous pursuit of being proven wrong early, when pixels are cheap and engineering time hasn't been squandered.</p>
                    <h3>1. Listening vs. Observing</h3>
                    <p>What users say they do and what they actually do when faced with a real interface are almost never identical. By observing behavioral hesitation, tracking where the cursor lingers in confusion, and noting the workarounds users invent, designers uncover the unvarnished truth.</p>
                    <div class="margin-note">&ldquo;Watch where users hesitate. That is where your product is leaking trust.&rdquo;</div>
                    <h3>2. Translating Insights Into Shipped Impact</h3>
                    <p>Research only creates value when it alters what gets engineered. By pairing rigorous user observation with pragmatic business strategy, we build software that solves real pain points and creates durable business defensibility.</p>
                `
            }
        };

        const metaEl = document.getElementById('paper-sheet-meta');
        const catEl = document.getElementById('paper-article-category');
        const titleEl = document.getElementById('paper-article-title');
        const bylineEl = document.querySelector('.paper-article-byline');
        const quoteEl = document.querySelector('.paper-pull-quote');
        const bodyEl = document.getElementById('paper-article-body');

        let currentActiveCard = null;
        let isClosing = false;

        function openArticle(index, card) {
            const article = articles[index] || articles[1];
            currentActiveCard = card;

            if (metaEl) metaEl.textContent = article.meta;
            if (catEl) catEl.textContent = article.category;
            if (titleEl) titleEl.textContent = article.title;
            if (bylineEl) bylineEl.innerHTML = `<span>${article.byline}</span>`;
            if (quoteEl) quoteEl.textContent = article.quote;
            if (bodyEl) bodyEl.innerHTML = article.body;

            document.body.classList.add('modal-scroll-locked');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();
            readingSheet.setAttribute('data-lenis-prevent', 'true');

            if (typeof gsap !== 'undefined' && card) {
                const cardRect = card.getBoundingClientRect();
                const cover = card.querySelector('.journal-folder-cover');
                const sheet = card.querySelector('.journal-sliding-sheet');

                // Step 1: Physical folder opens flap & paper slides out of pocket
                if (cover) gsap.to(cover, { rotateX: -24, duration: 0.32, ease: 'power2.out' });
                if (sheet) gsap.to(sheet, { y: -65, duration: 0.32, ease: 'power2.out' });

                // Step 2: Target reading dimensions in viewport
                const targetW = Math.min(window.innerWidth * 0.92, 820);
                const targetH = Math.min(window.innerHeight * 0.84, 780);
                const targetL = (window.innerWidth - targetW) / 2;
                const targetT = (window.innerHeight - targetH) / 2;

                // Initial position matching the paper sliding out from the folder
                const startL = cardRect.left + 22;
                const startT = cardRect.top - 28;
                const startW = cardRect.width - 44;
                const startH = 190;

                readingSheet.style.overflowY = 'hidden';
                readingSheet.scrollTop = 0;
                readingSheet.classList.add('active');
                backdrop.classList.add('active');

                gsap.killTweensOf(readingSheet);
                gsap.killTweensOf(backdrop);

                // Fade in backdrop
                gsap.set(backdrop, { opacity: 0 });
                gsap.to(backdrop, { opacity: 1, duration: 0.42, ease: 'power2.out' });

                // Set reading sheet at folder position, folded
                gsap.set(readingSheet, {
                    left: startL,
                    top: startT,
                    width: startW,
                    height: startH,
                    opacity: 1,
                    visibility: 'visible',
                    pointerEvents: 'auto',
                    scaleY: 0.35,
                    rotationX: 28,
                    transformOrigin: 'top center',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)'
                });

                // Step 3: Paper translates across screen to center and unfolds into reading sheet
                gsap.to(readingSheet, {
                    left: targetL,
                    top: targetT,
                    width: targetW,
                    height: targetH,
                    scaleY: 1,
                    rotationX: 0,
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.32)',
                    duration: 0.52,
                    ease: 'power3.out',
                    onComplete: () => {
                        readingSheet.style.overflowY = 'auto';
                    }
                });
            } else {
                readingSheet.classList.add('active');
                if (backdrop) backdrop.classList.add('active');
                readingSheet.scrollTop = 0;
            }
        }

        function closeArticle() {
            if (isClosing) return;
            isClosing = true;
            readingSheet.style.overflowY = 'hidden';

            if (currentActiveCard && typeof gsap !== 'undefined') {
                const cardRect = currentActiveCard.getBoundingClientRect();
                const cover = currentActiveCard.querySelector('.journal-folder-cover');
                const sheet = currentActiveCard.querySelector('.journal-sliding-sheet');

                const startL = cardRect.left + 22;
                const startT = cardRect.top - 28;
                const startW = cardRect.width - 44;
                const startH = 190;

                const closeTl = gsap.timeline({
                    onComplete: () => {
                        readingSheet.classList.remove('active');
                        backdrop.classList.remove('active');
                        readingSheet.style.visibility = 'hidden';
                        readingSheet.style.pointerEvents = 'none';
                        document.body.classList.remove('modal-scroll-locked');
                        document.body.style.overflow = '';
                        if (window.lenis) window.lenis.start();

                        // Step 4: Folder flap shuts flush & paper returns inside
                        if (cover) gsap.to(cover, { rotateX: 0, duration: 0.3, ease: 'power2.out' });
                        if (sheet) gsap.to(sheet, { y: -14, duration: 0.3, ease: 'power2.out' });

                        currentActiveCard = null;
                        isClosing = false;
                    }
                });

                closeTl.to(backdrop, { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 0);
                // Paper folds along horizontal crease and translates back into folder
                closeTl.to(readingSheet, {
                    left: startL,
                    top: startT,
                    width: startW,
                    height: startH,
                    scaleY: 0.35,
                    rotationX: 28,
                    opacity: 0,
                    duration: 0.42,
                    ease: 'power2.in'
                }, 0);
            } else {
                readingSheet.classList.remove('active');
                if (backdrop) backdrop.classList.remove('active');
                document.body.classList.remove('modal-scroll-locked');
                document.body.style.overflow = '';
                if (window.lenis) window.lenis.start();
                isClosing = false;
                currentActiveCard = null;
            }
        }

        // Prevent wheel event propagation to window while scrolling reading sheet
        readingSheet.addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });

        folderCards.forEach(card => {
            card.addEventListener('click', () => {
                const idx = card.getAttribute('data-index') || 1;
                openArticle(idx, card);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const idx = card.getAttribute('data-index') || 1;
                    openArticle(idx, card);
                }
            });
        });

        if (foldBtn) foldBtn.addEventListener('click', closeArticle);
        if (backdrop) backdrop.addEventListener('click', closeArticle);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && readingSheet.classList.contains('active')) {
                closeArticle();
            }
        });
    }

    // ── 17. CONTACT DESK: TACTILE CANVAS SIGNATURE PAD & RULED FORM ─────────
    function initContactDeskAndSignaturePad() {
        const signatureSlot = document.getElementById('signature-slot');
        const signatureModal = document.getElementById('signature-board-modal');
        const modalBackdrop = document.getElementById('signature-board-backdrop');
        const modalCloseBtn = document.getElementById('signature-modal-close');
        const clearBtn = document.getElementById('signature-clear-btn');
        const applyBtn = document.getElementById('signature-apply-btn');
        const redoBtn = document.getElementById('signature-redo-btn');
        const canvas = document.getElementById('signature-canvas');
        const signatureImgWrap = document.getElementById('signature-img-wrap');
        const signatureDataInput = document.getElementById('signature-data');
        const contactForm = document.getElementById('contact-desk-form');
        const dispatchNotice = document.getElementById('dispatch-sent-notice');
        const submitBtn = document.getElementById('contact-seal-btn');

        if (!signatureSlot || !canvas) return;

        let ctx = null;
        let isDrawing = false;
        let hasDrawnStrokes = false;
        let lastX = 0;
        let lastY = 0;

        function setupCanvas() {
            ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            
            // Set internal buffer size for high-DPI retina display
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#111111';
            ctx.lineWidth = 2.4;
        }

        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return {
                    x: e.touches[0].clientX - rect.left,
                    y: e.touches[0].clientY - rect.top
                };
            }
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }

        function startDrawing(e) {
            e.preventDefault();
            isDrawing = true;
            const pos = getPos(e);
            lastX = pos.x;
            lastY = pos.y;
            // Draw dot
            ctx.beginPath();
            ctx.arc(lastX, lastY, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = '#111111';
            ctx.fill();
        }

        function draw(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            lastX = pos.x;
            lastY = pos.y;
            hasDrawnStrokes = true;
        }

        function stopDrawing() {
            isDrawing = false;
        }

        function clearCanvas() {
            if (!ctx) return;
            const dpr = window.devicePixelRatio || 1;
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            hasDrawnStrokes = false;
        }

        // Pointer / touch / mouse listeners on canvas
        canvas.addEventListener('pointerdown', startDrawing);
        canvas.addEventListener('pointermove', draw);
        window.addEventListener('pointerup', stopDrawing);
        canvas.addEventListener('pointercancel', stopDrawing);

        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDrawing);

        function openSignatureModal() {
            if (modalBackdrop) modalBackdrop.classList.add('active');
            if (signatureModal) {
                signatureModal.classList.add('active');
                signatureModal.setAttribute('data-lenis-prevent', 'true');
            }
            document.body.classList.add('modal-scroll-locked');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();
            setTimeout(() => {
                setupCanvas();
                clearCanvas();
            }, 60);
        }

        function closeSignatureModal() {
            if (modalBackdrop) modalBackdrop.classList.remove('active');
            if (signatureModal) signatureModal.classList.remove('active');
            document.body.classList.remove('modal-scroll-locked');
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }

        signatureSlot.addEventListener('click', (e) => {
            if (e.target.closest('#signature-redo-btn')) return;
            openSignatureModal();
        });

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', closeSignatureModal);
        }
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeSignatureModal);
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', clearCanvas);
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                if (!hasDrawnStrokes) {
                    closeSignatureModal();
                    return;
                }
                const dataUrl = canvas.toDataURL('image/png');
                if (signatureDataInput) signatureDataInput.value = dataUrl;
                if (signatureImgWrap) {
                    signatureImgWrap.innerHTML = `<img src="${dataUrl}" class="signature-preview-img" alt="Authorized Client Signature">`;
                }
                signatureSlot.classList.add('has-signature');
                closeSignatureModal();
            });
        }

        if (redoBtn) {
            redoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                signatureSlot.classList.remove('has-signature');
                if (signatureDataInput) signatureDataInput.value = '';
                if (signatureImgWrap) signatureImgWrap.innerHTML = '';
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && signatureModal && signatureModal.classList.contains('active')) {
                closeSignatureModal();
            }
        });

        // Form submission handling with physical dispatch notice
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const emailInput = document.getElementById('client-email');
                const messageInput = document.getElementById('client-message');

                if (!emailInput || !emailInput.value.trim() || !emailInput.checkValidity()) {
                    if (emailInput) {
                        emailInput.focus();
                        if (typeof gsap !== 'undefined') {
                            gsap.fromTo(emailInput, { x: -6 }, { x: 6, duration: 0.08, repeat: 3, yoyo: true, ease: 'power2.inOut' });
                        }
                    }
                    return;
                }

                if (!messageInput || !messageInput.value.trim()) {
                    if (messageInput) {
                        messageInput.focus();
                        if (typeof gsap !== 'undefined') {
                            gsap.fromTo(messageInput, { x: -6 }, { x: 6, duration: 0.08, repeat: 3, yoyo: true, ease: 'power2.inOut' });
                        }
                    }
                    return;
                }

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<span>SEALING DISPATCH...</span>`;
                }

                const formData = new FormData(contactForm);

                try {
                    const response = await fetch(contactForm.action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    contactForm.style.display = 'none';
                    if (dispatchNotice) {
                        dispatchNotice.classList.add('active');
                        dispatchNotice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } catch (err) {
                    contactForm.style.display = 'none';
                    if (dispatchNotice) {
                        dispatchNotice.classList.add('active');
                        dispatchNotice.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            });
        }
    }

    // ── 14b. ABOUT ME / MY STORY: SCROLL-TRIGGERED PUNCH-PINNING ARTIFACTS ──
    function initAboutStoryPinning() {
        const storyCards = document.querySelectorAll(
            '.dossier-photo-card, ' +
            '.dossier-ruled-notepad, ' +
            '.dossier-studio-slip, ' +
            '.collab-ledger-card, ' +
            '.capabilities-ledger-card, ' +
            '.dossier-journal-spread, ' +
            '.dossier-closing-dispatch'
        );
        if (storyCards.length === 0 || prefersReducedMotion || typeof gsap === 'undefined') return;

        storyCards.forEach((card, idx) => {
            const styleRot = card.style.getPropertyValue('--card-base-rot');
            const baseRot = styleRot ? parseFloat(styleRot) : (idx % 2 === 0 ? -1.8 : 1.8);
            card.dataset.baseRot = baseRot;

            const pin = card.querySelector('.ledger-pin, .clipboard-top-clamp, .dossier-washi-tape');
            const isEven = idx % 2 === 0;

            // Set hardware-accelerated transform origin around top anchor
            let pivotX = '50%';
            let pivotY = '6px';
            const clamp = card.querySelector('.clipboard-top-clamp');
            if (clamp) {
                const clampLeft = clamp.style.left;
                if (clampLeft && clampLeft !== '50%') pivotX = clampLeft;
                pivotY = '8px';
            }
            card.style.transformOrigin = `${pivotX} ${pivotY}`;
            card.style.willChange = 'transform, opacity';

            // Initially lifted slightly off the desk
            gsap.set(card, {
                opacity: 0,
                scale: 1.10,
                y: -46,
                rotation: baseRot + (isEven ? -3.5 : 3.5)
            });

            if (pin) {
                gsap.set(pin, {
                    scale: 1.3,
                    rotation: isEven ? -14 : 14,
                    y: -6
                });
            }

            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top 85%',
                    end: 'bottom 15%',
                    onEnter: () => {
                        gsap.killTweensOf(card);
                        if (pin) gsap.killTweensOf(pin);

                        // Card slams / punches onto the desk right in the viewport!
                        gsap.timeline()
                            .to(card, {
                                opacity: 1,
                                scale: 0.98,
                                y: 0,
                                rotation: baseRot + (isEven ? 2.8 : -2.8),
                                duration: 0.28,
                                ease: 'back.out(2)'
                            })
                            .to(card, {
                                scale: 1,
                                rotation: baseRot,
                                duration: 0.22,
                                ease: 'power2.out'
                            });

                        if (pin) {
                            gsap.to(pin, {
                                scale: 1,
                                rotation: 0,
                                y: 0,
                                duration: 0.38,
                                ease: 'elastic.out(1.2, 0.4)'
                            });
                        }
                    },
                    onEnterBack: () => {
                        gsap.killTweensOf(card);
                        if (pin) gsap.killTweensOf(pin);
                        gsap.to(card, {
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            rotation: baseRot,
                            duration: 0.25,
                            ease: 'power2.out'
                        });
                        if (pin) {
                            gsap.to(pin, { scale: 1, rotation: 0, y: 0, duration: 0.25 });
                        }
                    },
                    onLeaveBack: () => {
                        const rect = card.getBoundingClientRect();
                        if (rect.top >= window.innerHeight * 0.85) {
                            gsap.killTweensOf(card);
                            if (pin) gsap.killTweensOf(pin);
                            // Lifts smoothly off the desk when user scrolls up
                            gsap.to(card, {
                                opacity: 0,
                                scale: 1.10,
                                y: -40,
                                rotation: baseRot + (isEven ? -3.5 : 3.5),
                                duration: 0.22,
                                ease: 'power2.in'
                            });
                            if (pin) {
                                gsap.to(pin, {
                                    scale: 1.3,
                                    rotation: isEven ? -14 : 14,
                                    y: -6,
                                    duration: 0.22
                                });
                            }
                        } else {
                            gsap.killTweensOf(card);
                            gsap.to(card, { opacity: 1, scale: 1, y: 0, rotation: baseRot, duration: 0.2 });
                        }
                    }
                });
            } else {
                gsap.to(card, { opacity: 1, scale: 1, y: 0, rotation: baseRot, duration: 0.4 });
            }
        });
    }

    // ── 15. PHYSICAL PIN & PENDULUM SWING ENGINE (CARDS, NOTEPADS & MEMOS) ──
    function initTactilePinSwingPhysics() {
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        // Select all cards across all pages that are hung or pinned by top pushpins/clamps
        const pinnedCards = document.querySelectorAll(
            '.landscape-post-card.project-grid-card, ' +
            '.collab-ledger-card, ' +
            '.capabilities-ledger-card, ' +
            '.dossier-photo-card, ' +
            '.dossier-ruled-notepad, ' +
            '.dossier-closing-dispatch, ' +
            '.journal-folder-card, ' +
            '.contact-pinned-card, ' +
            '.final-paper-note'
        );

        pinnedCards.forEach((card) => {
            if (card.dataset.swingPhysicsBound === 'true') return;
            card.dataset.swingPhysicsBound = 'true';

            // Extract initial design tilt or base rotation
            const styleRot = card.style.getPropertyValue('--card-base-rot');
            let baseRot = 0;
            if (styleRot) {
                baseRot = parseFloat(styleRot) || 0;
            } else {
                // Check if card has a static base tilt from CSS
                const computedTransform = window.getComputedStyle(card).transform;
                if (computedTransform && computedTransform !== 'none') {
                    const values = computedTransform.split('(')[1].split(')')[0].split(',');
                    const a = parseFloat(values[0]);
                    const b = parseFloat(values[1]);
                    baseRot = Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
                }
            }

            // Detect pin location to accurately set the physical pivot point
            const pin = card.querySelector('.board-pushpin, .contact-pushpin, .ledger-pin');
            const clamp = card.querySelector('.clipboard-top-clamp');
            let pivotX = '50%';
            let pivotY = '0px';

            if (pin) {
                const pinLeft = pin.style.left;
                if (pinLeft && pinLeft !== '50%') {
                    pivotX = pinLeft;
                }
                pivotY = '6px';
            } else if (clamp) {
                const clampLeft = clamp.style.left;
                if (clampLeft && clampLeft !== '50%') {
                    pivotX = clampLeft;
                }
                pivotY = '8px';
            }

            // Set hardware-accelerated transform origin around the pin
            card.style.transformOrigin = `${pivotX} ${pivotY}`;
            card.style.willChange = 'transform';

            let isHovered = false;
            let cardRect = null;

            // 1. Natural Damped Harmonic Swing on Hover
            card.addEventListener('mouseenter', (e) => {
                isHovered = true;
                cardRect = card.getBoundingClientRect();
                const entersFromLeft = (e.clientX - cardRect.left) < cardRect.width / 2;
                // Impelling swing in the direction of cursor entry (crisp, dynamic 4.5deg swing)
                const swingMagnitude = 4.5;
                const initialSwing = entersFromLeft ? swingMagnitude : -swingMagnitude;

                gsap.timeline({ overwrite: 'auto' })
                    .to(card, {
                        rotation: baseRot + initialSwing,
                        duration: 0.26,
                        ease: 'power2.out'
                    })
                    .to(card, {
                        rotation: baseRot - (initialSwing * 0.65),
                        duration: 0.34,
                        ease: 'sine.inOut'
                    })
                    .to(card, {
                        rotation: baseRot + (initialSwing * 0.25),
                        duration: 0.30,
                        ease: 'sine.inOut'
                    })
                    .to(card, {
                        rotation: baseRot,
                        duration: 0.55,
                        ease: 'elastic.out(1.1, 0.38)'
                    });

                if (pin) {
                    gsap.fromTo(pin, 
                        { rotation: -initialSwing * 1.2 },
                        { rotation: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.35)' }
                    );
                }
            });

            // 2. Interactive Cursor Tilt while moving over card
            card.addEventListener('mousemove', (e) => {
                if (!isHovered) return;
                if (!cardRect) cardRect = card.getBoundingClientRect();
                const relX = (e.clientX - cardRect.left) / cardRect.width - 0.5; // -0.5 to +0.5
                gsap.to(card, {
                    rotation: baseRot + (relX * 3.8),
                    duration: 0.20,
                    ease: 'power1.out',
                    overwrite: 'auto'
                });
            });

            // 3. Elastic Spring Back when mouse leaves
            card.addEventListener('mouseleave', () => {
                isHovered = false;
                cardRect = null;
                gsap.to(card, {
                    rotation: baseRot,
                    duration: 0.70,
                    ease: 'elastic.out(1.2, 0.4)',
                    overwrite: 'auto'
                });
                if (pin) {
                    gsap.to(pin, { rotation: 0, duration: 0.4, ease: 'power2.out' });
                }
            });
        });
    }

    window.initTactilePinSwingPhysics = initTactilePinSwingPhysics;

    initServiceMenuAndFinalNotePhysics();
    initJournalDossiers();
    initContactDeskAndSignaturePad();
    initAboutStoryPinning();
    initTactilePinSwingPhysics();
});
