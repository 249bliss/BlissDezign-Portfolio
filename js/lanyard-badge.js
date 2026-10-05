/**
 * BlissDezign Studio Pass & Lanyard Physics Engine v2
 * ─────────────────────────────────────────────────────────────
 * • Realistic 3D Physical Lanyard & Hardware Clasp
 * • Natural drop entrance on page load
 * • Swing physics & 3D tilt
 * • Pulling/dragging or clicking card navigates to 'my-story.html'
 * • Scroll pull-up reveals centered hero story
 * • Live HUD telemetry (Lagos WAT time + 60fps counter)
 * ─────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    // ── 1. Live HUD Telemetry (Lagos Clock + FPS Monitor) ─────
    function initHudTelemetry() {
        const clockEl = document.getElementById('hud-clock');
        const fpsEl = document.getElementById('hud-fps');

        function updateLagosTime() {
            if (!clockEl) return;
            try {
                const now = new Date();
                const lagosTime = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Africa/Lagos',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(now);
                clockEl.textContent = `${lagosTime} WAT`;
            } catch (e) {
                const now = new Date();
                const h = String(now.getHours()).padStart(2, '0');
                const m = String(now.getMinutes()).padStart(2, '0');
                const s = String(now.getSeconds()).padStart(2, '0');
                clockEl.textContent = `${h}:${m}:${s} WAT`;
            }
        }
        updateLagosTime();
        setInterval(updateLagosTime, 1000);

        if (fpsEl) {
            let frameCount = 0;
            let lastTime = performance.now();
            function calcFps(now) {
                frameCount++;
                if (now - lastTime >= 1000) {
                    const fps = Math.round((frameCount * 1000) / (now - lastTime));
                    fpsEl.textContent = String(Math.min(fps, 60));
                    frameCount = 0;
                    lastTime = now;
                }
                requestAnimationFrame(calcFps);
            }
            requestAnimationFrame(calcFps);
        }
    }

    // ── 2. Interactive Lanyard & Studio Pass Physics ──────────
    function initLanyardBadge() {
        const stage = document.getElementById('lanyard-stage');
        const badge = document.getElementById('lanyard-badge-card');
        const strapPath = document.getElementById('lanyard-strap-path');
        const strapSvg = document.getElementById('lanyard-strap-svg');
        const lanyardAssembly = document.getElementById('lanyard-assembly');
        const shineOverlay = document.getElementById('badge-hologram-shine');
        const hintEl = document.getElementById('lanyard-hint');
        const passTriggerBtn = document.getElementById('hud-pass-btn');

        if (!stage || !badge || !lanyardAssembly) return;

        let stageWidth = window.innerWidth;
        let stageHeight = window.innerHeight;
        let anchorX = stageWidth / 2;
        let anchorY = 0;

        // Drop entrance animation
        let isDropped = false;
        let currentY = -600; // drops from above
        let targetRestY = Math.max(140, Math.min(stageHeight * 0.24, 210));
        let dropVy = 0;
        const dropK = 0.055;
        const dropDamping = 0.82;

        // Pendulum Swing physics
        let theta = 0;
        let omega = 0;
        const gravity = 0.0035;
        const angularDamping = 0.985;
        let idleSwayTime = 0;

        // Dragging & Story Navigation
        let isDragging = false;
        let dragStartY = 0;
        let dragStartX = 0;
        let totalDragDistance = 0;
        let dragOffset = { x: 0, y: 0 };
        let lastPointerX = 0;
        let lastPointerY = 0;
        let pointerVx = 0;
        let hasTriggeredNav = false;

        // 3D Tilt on Hover
        let tiltX = 0, tiltY = 0;
        let targetTiltX = 0, targetTiltY = 0;

        // Scroll pull-up
        let scrollPullY = 0;

        function updateDimensions() {
            stageWidth = window.innerWidth;
            stageHeight = window.innerHeight;
            anchorX = stageWidth / 2;
            targetRestY = Math.max(140, Math.min(stageHeight * 0.24, 210));
            if (strapSvg) {
                strapSvg.setAttribute('viewBox', `0 0 ${stageWidth} ${stageHeight}`);
                strapSvg.style.width = stageWidth + 'px';
                strapSvg.style.height = stageHeight + 'px';
            }
        }
        window.addEventListener('resize', updateDimensions, { passive: true });
        updateDimensions();

        // ── Drag & Navigation Handlers ──
        badge.addEventListener('pointerdown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            totalDragDistance = 0;
            badge.classList.add('is-grabbing');
            badge.setPointerCapture(e.pointerId);

            const badgeRect = badge.getBoundingClientRect();
            dragOffset.x = e.clientX - (badgeRect.left + badgeRect.width / 2);
            dragOffset.y = e.clientY - (badgeRect.top + 30);

            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            pointerVx = 0;
        });

        window.addEventListener('pointermove', (e) => {
            if (isDragging) {
                pointerVx = e.clientX - lastPointerX;
                lastPointerX = e.clientX;
                lastPointerY = e.clientY;

                const currentBadgeX = e.clientX - dragOffset.x;
                const dx = currentBadgeX - anchorX;
                const ropeLen = Math.max(180, targetRestY + 120);
                theta = Math.max(-0.6, Math.min(0.6, dx / ropeLen));
                omega = 0;

                totalDragDistance = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);

                // If user drags card significantly downward or sideways, cue visual feedback
                if (totalDragDistance > 70 && !hasTriggeredNav) {
                    badge.style.boxShadow = '0 0 35px rgba(108, 59, 255, 0.6)';
                }
            } else {
                // 3D perspective tilt on hover
                const badgeRect = badge.getBoundingClientRect();
                const centerX = badgeRect.left + badgeRect.width / 2;
                const centerY = badgeRect.top + badgeRect.height / 2;
                const distFromCenter = Math.hypot(e.clientX - centerX, e.clientY - centerY);

                if (distFromCenter < 550) {
                    const nx = (e.clientX - centerX) / (badgeRect.width / 2);
                    const ny = (e.clientY - centerY) / (badgeRect.height / 2);
                    targetTiltX = Math.max(-18, Math.min(18, -ny * 16));
                    targetTiltY = Math.max(-20, Math.min(20, nx * 20));

                    if (shineOverlay) {
                        const shineX = (nx * 50) + 50;
                        const shineY = (ny * 50) + 50;
                        shineOverlay.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.08) 45%, transparent 75%)`;
                    }
                } else {
                    targetTiltX = 0;
                    targetTiltY = 0;
                }
            }
        });

        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            badge.classList.remove('is-grabbing');
            try { badge.releasePointerCapture(e.pointerId); } catch (err) {}

            // If user pulled/dragged the card or clicked it, navigate to my-story.html!
            // Per user request: "when someone drags the card, it should take them to the story page!"
            if (totalDragDistance > 55 || e.type === 'click') {
                if (!hasTriggeredNav) {
                    hasTriggeredNav = true;
                    // Provide a slight elastic feedback before navigating
                    badge.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
                    badge.style.transform += ' scale(0.96)';
                    badge.style.opacity = '0.7';
                    setTimeout(() => {
                        window.location.href = 'my-story.html';
                    }, 200);
                    return;
                }
            }

            omega = Math.max(-0.08, Math.min(0.08, (pointerVx * 0.0035)));
        };

        badge.addEventListener('click', (e) => {
            // Clicking badge directly also navigates to story page
            if (totalDragDistance < 10 && !hasTriggeredNav) {
                hasTriggeredNav = true;
                window.location.href = 'my-story.html';
            }
        });

        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);

        // Toggle badge drop from HUD button
        if (passTriggerBtn) {
            passTriggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.scrollY > 200) {
                    if (window.lenis) {
                        window.lenis.scrollTo(0, { duration: 1.2 });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
                currentY = targetRestY - 140;
                dropVy = 8;
                omega = 0.05;
            });
        }

        // ── Scroll Parallax Pull-Up Handler ──
        function handleScroll() {
            const scrollY = window.scrollY || window.pageYOffset || 0;
            const threshold = 340;
            const progress = Math.min(1, Math.max(0, scrollY / threshold));

            // Pull ONLY the badge upward off screen
            scrollPullY = progress * (stageHeight * 0.95 + 320);

            // Hide hint on scroll
            if (hintEl) {
                hintEl.style.opacity = scrollY > 30 ? '0' : '1';
                hintEl.style.pointerEvents = scrollY > 30 ? 'none' : 'auto';
            }

            // Unveil centered hero story smoothly as card pulls up
            const heroCenteredContent = document.querySelector('.hero-content-centered');
            if (heroCenteredContent) {
                if (scrollY > 25) {
                    const reveal = Math.min(1, (scrollY - 25) / 160);
                    heroCenteredContent.style.opacity = String(reveal);
                    heroCenteredContent.style.transform = `translate3d(0, ${(1 - reveal) * 30}px, 0) scale(${0.97 + (reveal * 0.03)})`;
                    heroCenteredContent.style.pointerEvents = reveal > 0.5 ? 'auto' : 'none';
                } else {
                    heroCenteredContent.style.opacity = '0';
                    heroCenteredContent.style.transform = 'translate3d(0, 30px, 0) scale(0.97)';
                    heroCenteredContent.style.pointerEvents = 'none';
                }
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        if (window.lenis) {
            window.lenis.on('scroll', handleScroll);
        }
        handleScroll();

        // ── 60FPS Physics Engine Loop ──
        function tick() {
            if (!isDropped) {
                const force = (targetRestY - currentY) * dropK;
                dropVy = (dropVy + force) * dropDamping;
                currentY += dropVy;

                if (Math.abs(targetRestY - currentY) < 0.5 && Math.abs(dropVy) < 0.2) {
                    currentY = targetRestY;
                    isDropped = true;
                }
            } else {
                currentY = targetRestY;
            }

            if (!isDragging) {
                idleSwayTime += 0.018;
                const naturalSway = Math.sin(idleSwayTime) * 0.0006;
                const restoringTorque = -gravity * Math.sin(theta);
                omega = (omega + restoringTorque + naturalSway) * angularDamping;
                theta += omega;
            }

            tiltX += (targetTiltX - tiltX) * 0.12;
            tiltY += (targetTiltY - tiltY) * 0.12;

            const ropeLength = Math.max(160, currentY);
            const badgeCenterX = anchorX + Math.sin(theta) * ropeLength;
            const badgeCenterY = (Math.cos(theta) * ropeLength) - scrollPullY;

            const deg = (theta * 180) / Math.PI;
            lanyardAssembly.style.transform = `translate3d(${badgeCenterX}px, ${badgeCenterY}px, 0)`;

            if (!hasTriggeredNav) {
                badge.style.transform = `rotate(${deg}deg) perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }

            // Realistic SVG Ribbon curve from ceiling (anchorX, 0) to hardware clip
            if (strapPath) {
                const clipTopX = badgeCenterX;
                const clipTopY = Math.max(0, badgeCenterY - 24);

                const cp1X = anchorX;
                const cp1Y = clipTopY * 0.45;
                const cp2X = clipTopX;
                const cp2Y = clipTopY * 0.78;

                strapPath.setAttribute('d', `M ${anchorX} 0 C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${clipTopX} ${clipTopY}`);
            }

            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initHudTelemetry();
            initLanyardBadge();
        });
    } else {
        initHudTelemetry();
        initLanyardBadge();
    }

})();
