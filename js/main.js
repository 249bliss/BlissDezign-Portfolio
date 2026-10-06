document.addEventListener('DOMContentLoaded', () => {
    // --- Analytics: Track Page View ---
    if (typeof supabaseClient !== 'undefined') {
        const hasVisited = localStorage.getItem('unique_visitor_view');
        if (!hasVisited) {
            supabaseClient.from('analytics').insert([
                { page_path: window.location.pathname, event_type: 'view' }
            ]).then(({ error }) => { 
                if (error) console.error('Analytics Error:', error); 
                else localStorage.setItem('unique_visitor_view', 'true');
            });
        }
    }

    // Theme Logic - Pure Crisp Light Mode
    const body = document.body;
    body.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');

    // Update Cal.com config for light theme
    document.querySelectorAll('a[href*="cal.com/blissdezigns"]').forEach(link => {
        link.setAttribute('data-cal-config', JSON.stringify({
            layout: 'month_view',
            theme: 'light'
        }));
    });

    // ─── Floating Pill Capsule Drop Navigation Logic ──────────────────
    const capsuleMenuTrigger = document.getElementById('capsule-menu-trigger');
    const capsuleDropCard = document.getElementById('capsule-drop-card');
    const capsuleBackdrop = document.getElementById('capsule-backdrop');
    const dropNavLinks = document.querySelectorAll('.drop-card-nav-list a');

    const toggleCapsuleMenu = (open) => {
        const shouldOpen = typeof open === 'boolean' ? open : !capsuleDropCard?.classList.contains('active');
        if (!capsuleDropCard) return;

        if (shouldOpen) {
            capsuleDropCard.classList.add('active');
            capsuleMenuTrigger?.classList.add('active');
            capsuleBackdrop?.classList.add('active');
            capsuleMenuTrigger?.setAttribute('aria-expanded', 'true');
        } else {
            capsuleDropCard.classList.remove('active');
            capsuleMenuTrigger?.classList.remove('active');
            capsuleBackdrop?.classList.remove('active');
            capsuleMenuTrigger?.setAttribute('aria-expanded', 'false');
        }
    };

    if (capsuleMenuTrigger && capsuleDropCard) {
        capsuleMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCapsuleMenu();
        });

        if (capsuleBackdrop) {
            capsuleBackdrop.addEventListener('click', () => toggleCapsuleMenu(false));
        }

        // Close on clicking outside the capsule drop menu
        document.addEventListener('click', (e) => {
            if (!capsuleDropCard.contains(e.target) && !capsuleMenuTrigger.contains(e.target)) {
                toggleCapsuleMenu(false);
            }
        });

        // Close on pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && capsuleDropCard.classList.contains('active')) {
                toggleCapsuleMenu(false);
            }
        });

        // Close on navigating
        dropNavLinks.forEach(link => {
            link.addEventListener('click', () => toggleCapsuleMenu(false));
        });
    }

    // Scroll Effect for Header (Optimized with IntersectionObserver)
    const header = document.querySelector('header');
    if (header) {
        const headerSentinel = document.createElement('div');
        headerSentinel.style.position = 'absolute';
        headerSentinel.style.top = '0';
        headerSentinel.style.height = '50px';
        headerSentinel.style.width = '1px';
        headerSentinel.style.pointerEvents = 'none';
        document.body.prepend(headerSentinel);

        const headerObserver = new IntersectionObserver((entries) => {
            const isOffTop = !entries[0].isIntersecting;
            if (isOffTop) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { threshold: 0 });

        headerObserver.observe(headerSentinel);
    }

    // Scroll To Top Logic (Optimized)
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) return;
            scrollTimeout = requestAnimationFrame(() => {
                if (window.scrollY > 300) {
                    scrollTopBtn.classList.add('show');
                } else {
                    scrollTopBtn.classList.remove('show');
                }
                scrollTimeout = null;
            });
        }, { passive: true });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Scroll Animations (Reveal on scroll)
    const revealElements = document.querySelectorAll('.service-card, .stats-container, .masonry-card, .experience-card, .testimonial-marquee, .section-title, .contact-text, .contact-form, .tools-section .container, .portfolio-gallery, .reveal-on-scroll');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Expose observer globally
    window.revealOnScrollObserver = revealOnScroll;

    revealElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        revealOnScroll.observe(el);
    });

    // Testimonial Marquee: Toggle pause on click/tap for mobile
    const testimonialMarquee = document.querySelector('.testimonial-marquee');
    if (testimonialMarquee) {
        testimonialMarquee.addEventListener('click', () => {
            const contents = testimonialMarquee.querySelectorAll('.testimonial-marquee-content');
            contents.forEach(content => {
                const currentPlayState = window.getComputedStyle(content).animationPlayState;
                content.style.animationPlayState = currentPlayState === 'paused' ? 'running' : 'paused';
            });
            testimonialMarquee.classList.toggle('is-paused');
        });
    }

    // ─── Stat Counter Animation ───────────────────────────────────────────────
    // Animates each .stat-number from 0 to its target value when scrolled into view
    const animateCounter = (el, target, duration = 1800) => {
        let start = null;
        const suffix = el.querySelector('.stat-plus')?.textContent || '';
        const plus = el.querySelector('.stat-plus');

        // Easing: easeOutExpo for snappy deceleration
        const easeOutExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            const current = Math.round(eased * target);

            // Update only the text node (not the .stat-plus child)
            el.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.textContent = current;
                }
            });

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    const statsContainers = document.querySelectorAll('.stats-container, .testimonials-stats');
    if (statsContainers.length > 0) {
        const counterObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const statNumbers = entry.target.querySelectorAll('.stat-number');
                    statNumbers.forEach(statEl => {
                        // Read target from the text node or data attribute
                        let targetValue = statEl.getAttribute('data-target');
                        if (!targetValue) {
                            statEl.childNodes.forEach(node => {
                                if (node.nodeType === Node.TEXT_NODE) {
                                    targetValue = parseInt(node.textContent.trim(), 10) || 0;
                                }
                            });
                            statEl.setAttribute('data-target', targetValue);
                        } else {
                            targetValue = parseInt(targetValue, 10);
                        }

                        // Clear the content immediately so it starts from 0 visually right away
                        statEl.childNodes.forEach(node => {
                            if (node.nodeType === Node.TEXT_NODE) node.textContent = '0';
                        });
                        animateCounter(statEl, targetValue);
                    });
                }
            });
        }, { threshold: 0.4 });

        statsContainers.forEach(container => counterObserver.observe(container));
    }


    // Smooth navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Form submission handling
    const form = document.querySelector('.contact-form');
    if (form) {
        const submitBtn = document.getElementById('contact-submit-btn') || form.querySelector('button[type="submit"]');
        const nameInput  = form.querySelector('#name');
        const emailInput = form.querySelector('#email');
        const messageInput = form.querySelector('#message');

        // ── Custom error helpers ──────────────────────────────────────────
        function showError(fieldId, msg) {
            const el = document.getElementById(fieldId + '-error');
            if (el) { el.textContent = msg; el.classList.add('visible'); }
            const input = document.getElementById(fieldId);
            if (input) input.classList.add('field-invalid');
        }
        function clearError(fieldId) {
            const el = document.getElementById(fieldId + '-error');
            if (el) { el.textContent = ''; el.classList.remove('visible'); }
            const input = document.getElementById(fieldId);
            if (input) input.classList.remove('field-invalid');
        }
        function clearAllErrors() {
            ['name','email','message'].forEach(clearError);
        }

        // ── Button state — always active on contact page (no name field required) ───
        if (submitBtn) submitBtn.disabled = false;

        function checkFormFilled() {
            // Only email is required now (name field was removed from redesigned form)
            if (submitBtn) submitBtn.disabled = false;
        }

        // Listen to input + change (covers autofill from some browsers)
        [nameInput, emailInput, messageInput].forEach(field => {
            if (!field) return;
            field.addEventListener('input',  checkFormFilled);
            field.addEventListener('change', checkFormFilled);
            // Autofill CSS animation trick
            field.addEventListener('animationstart', (e) => {
                if (e.animationName === 'autofillDetect') checkFormFilled();
            });
        });

        // Polling fallback for autofill (Chrome/mobile often silently fills)
        let pollCount = 0;
        const pollInterval = setInterval(() => {
            checkFormFilled();
            if (++pollCount >= 20) clearInterval(pollInterval); // stop after 10s
        }, 500);

        // ── Inline validation on blur ─────────────────────────────────────
        if (nameInput) {
            nameInput.addEventListener('blur', () => {
                if (!nameInput.value.trim()) {
                    showError('name', '↑ Please enter your full name');
                } else {
                    clearError('name');
                }
            });
        }
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const val = emailInput.value.trim();
                if (!val) {
                    showError('email', '↑ Please enter your email address');
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                    showError('email', '↑ Please include a valid @ in your email address');
                } else {
                    clearError('email');
                }
            });
        }
        // Message is optional, no blur validation needed

        // ── Reset custom dropdown display ─────────────────────────────────
        function resetCustomSelect() {
            const display = document.querySelector('.custom-select-display');
            if (display) display.textContent = 'Select a service';
            const options = document.querySelectorAll('.custom-option');
            options.forEach(o => o.classList.remove('selected'));
            const wrapper = document.getElementById('custom-service-select');
            if (wrapper) wrapper.classList.remove('open');
        }

        // ── Submit ────────────────────────────────────────────────────────
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Manual validation — email required, message optional, name optional if removed from form
            let valid = true;
            if (nameInput) {
                if (!nameInput.value.trim()) {
                    showError('name', '↑ Please enter your full name'); valid = false;
                } else { clearError('name'); }
            }

            const emailVal = emailInput ? emailInput.value.trim() : '';
            if (!emailVal) {
                showError('email', '↑ Please enter your email address'); valid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                showError('email', '↑ Please include a valid @ in your email address'); valid = false;
            } else { clearError('email'); }

            if (!valid) return;

            const originalText = submitBtn.innerText;
            const formData = new FormData(form);

            // Lock button width so text-change doesn't resize it
            submitBtn.style.minWidth = submitBtn.offsetWidth + 'px';

            // Loading state
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                // Analytics
                if (typeof supabaseClient !== 'undefined') {
                    const name = formData.get('name');
                    const email = formData.get('email');
                    const msg = formData.get('message');
                    await supabaseClient.from('messages').insert([{ name, email, message: msg }]);
                    await supabaseClient.from('analytics').insert([{ page_path: window.location.pathname, event_type: 'message' }]);
                }

                if (response.ok) {
                    // ✅ Branded success with Modal & Confetti
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 150,
                            spread: 80,
                            origin: { y: 0.6 },
                            colors: ['#6c3bff', '#a855f7', '#ffffff']
                        });
                    }
                    
                    const successModal = document.getElementById('success-modal');
                    if (successModal) {
                        successModal.classList.remove('hidden');
                    }
                    
                    submitBtn.innerText = 'Message Sent ✓';
                    submitBtn.style.background = 'linear-gradient(135deg, #4c1d95 0%, #6c3bff 100%)';
                    submitBtn.style.boxShadow = '0 0 20px rgba(108, 59, 255, 0.35)';
                    submitBtn.style.color = '#fff';
                    form.reset();
                    resetCustomSelect();
                    clearAllErrors();
                } else {
                    const data = await response.json();
                    if (Object.hasOwn(data, 'errors')) {
                        submitBtn.innerText = 'Error : Try Again ✗';
                        submitBtn.style.background = 'linear-gradient(135deg, #3b0a0a 0%, #7f1d1d 100%)';
                        submitBtn.style.color = '#fca5a5';
                        console.error('Submission errors:', data.errors.map(e => e.message).join(', '));
                    } else {
                        throw new Error('Submission failed');
                    }
                }
            } catch (error) {
                submitBtn.innerText = 'Error : Try Again ✗';
                submitBtn.style.background = 'linear-gradient(135deg, #3b0a0a 0%, #7f1d1d 100%)';
                submitBtn.style.color = '#fca5a5';
                console.error('Submission error:', error);
            } finally {
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    submitBtn.style.cssText = '';
                    // Re-check: re-enable if name+email still filled
                    checkFormFilled();
                }, 3500);
            }

            // Newsletter Form Handling
            const newsletterForm = document.querySelector('.newsletter-form');
            if (newsletterForm) {
                newsletterForm.addEventListener('submit', async () => {
                    const emailInput = newsletterForm.querySelector('input[type="email"]');
                    if (emailInput && emailInput.value && typeof supabaseClient !== 'undefined') {
                        await supabaseClient.from('subscribers').upsert([{ email: emailInput.value }]);
                        await supabaseClient.from('analytics').insert([{ page_path: window.location.pathname, event_type: 'subscribe' }]);
                    }
                });
            }
        });
    }
    // Floating Pills Drag and Drop Logic
    const floatingPills = document.querySelectorAll('.floating-pill-wrapper');
    if (floatingPills.length > 0) {
        floatingPills.forEach(pill => {
            let isDragging = false;
            let startClientX, startClientY;
            let startPillLeft, startPillTop;

            const onPointerDown = (e) => {
                isDragging = true;
                pill.classList.add('dragging');
                pill.style.transition = 'none';

                startClientX = e.clientX;
                startClientY = e.clientY;

                startPillLeft = pill.offsetLeft;
                startPillTop = pill.offsetTop;

                pill.setPointerCapture(e.pointerId);
                e.preventDefault();
            };

            const onPointerMove = (e) => {
                if (!isDragging) return;

                const deltaX = e.clientX - startClientX;
                const deltaY = e.clientY - startClientY;

                pill.style.left = `${startPillLeft + deltaX}px`;
                pill.style.top = `${startPillTop + deltaY}px`;
            };

            const onPointerUp = (e) => {
                if (!isDragging) return;
                isDragging = false;
                pill.classList.remove('dragging');

                // Snap back to original position with a spring-like ease
                pill.style.transition = 'top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';

                pill.style.top = pill.getAttribute('data-orig-top');
                pill.style.left = pill.getAttribute('data-orig-left');

                pill.releasePointerCapture(e.pointerId);
            };

            pill.addEventListener('pointerdown', onPointerDown);
            pill.addEventListener('pointermove', onPointerMove);
            pill.addEventListener('pointerup', onPointerUp);
            pill.addEventListener('pointercancel', onPointerUp);
        });
    }

    // ─── Video Performance: Lazy-load + play-only-when-visible ───────────────
    // Step 1: For Set-2 duplicate videos (aria-hidden), defer src loading
    // by storing it in data-lazy-src and only assigning it on intersection.
    // This halves the initial video download weight.
    document.querySelectorAll('.marquee-card--video-placeholder video').forEach(video => {
        const src = video.getAttribute('src');
        if (src) {
            video.setAttribute('data-lazy-src', src);
            video.removeAttribute('src'); // prevent eager download
        }
    });

    // Step 2: Watch ALL videos — play when visible, pause when not, and
    // trigger deferred src load for Set-2 videos on first intersection.
    const allMarqueeVideos = document.querySelectorAll('.marquee-card video');
    if (allMarqueeVideos.length > 0) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Lazy-load deferred src on first sight
                    const lazySrc = video.getAttribute('data-lazy-src');
                    if (lazySrc) {
                        video.src = lazySrc;
                        video.removeAttribute('data-lazy-src');
                    }
                    video.play().catch(e => console.log('Autoplay prevented', e));
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.1 });

        allMarqueeVideos.forEach(video => videoObserver.observe(video));
    }

    // Add Cal.com data attributes dynamically to all booking links and prevent tab redirection
    const bookCallLinks = document.querySelectorAll('a[href*="cal.com/blissdezigns"]');
    bookCallLinks.forEach(link => {
        link.setAttribute('data-cal-link', 'blissdezigns/discovery-call');
        link.setAttribute('href', 'javascript:void(0)');
        link.removeAttribute('target');
        
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        link.setAttribute('data-cal-config', JSON.stringify({
            layout: 'month_view',
            theme: currentTheme
        }));
    });

    // --- Cal.com Embed Integration ---
    (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
            let cal = C.Cal;
            let ar = arguments;
            if (!cal.loaded) {
                cal.ns = {};
                cal.q = cal.q || [];
                d.head.appendChild(d.createElement("script")).src = A;
                cal.loaded = true;
            }
            if (ar[0] === L) {
                const api = function () { p(api, arguments); };
                const namespace = ar[1];
                api.q = api.q || [];
                if (typeof namespace === "string") {
                    cal.ns[namespace] = cal.ns[namespace] || api;
                    p(cal.ns[namespace], ar);
                    p(cal, ["initNamespace", namespace]);
                } else p(cal, ar);
                return;
            }
            p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    Cal("init", { origin: "https://cal.com" });

    Cal("ui", {
        styles: {
            branding: {
                brandColor: "#8b5cf6"
            }
        },
        hideEventTypeDetails: false,
        layout: "month_view"
    });

    // Preload the booking link for instant response on click
    Cal("preload", { calLink: "blissdezigns/discovery-call" });

});

// Project Gallery Filtering Logic (for projects.html)
window.initProjectFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.filter-item');

    if (filterButtons.length > 0 && projectItems.length > 0) {
        filterButtons.forEach(button => {
            // Remove existing listeners to avoid duplicates
            const newBtn = button.cloneNode(true);
            button.parentNode.replaceChild(newBtn, button);

            newBtn.addEventListener('click', () => {
                const filter = newBtn.getAttribute('data-filter');

                // Update active button state
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                newBtn.classList.add('active');

                // Filter projects
                document.querySelectorAll('.filter-item').forEach(item => {
                    item.classList.add('hidden'); // Start by hiding all

                    // If 'all' or specific category matches
                    if (filter === 'all' || item.classList.contains(filter)) {
                        setTimeout(() => {
                            item.classList.remove('hidden');
                            if (!item.classList.contains('visible')) {
                                item.classList.add('visible');
                            }
                        }, 100);
                    }
                });
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.initProjectFilters();

    // --- Newsletter Sync to Supabase ---
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm && typeof supabaseClient !== 'undefined') {
        newsletterForm.addEventListener('submit', async (e) => {
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput ? emailInput.value.trim() : null;

            if (email) {
                // We fire this silently so as not to block the Mailchimp redirect
                supabaseClient.from('subscribers').insert([
                    { email: email }
                ]).then(({ error }) => {
                    if (error) console.error('Subscription Sync Error:', error);
                    else console.log('Subscriber synced to dashboard.');
                });
            }
        });
    }

    // --- Localized Spotlight Grayscale, Particle Emitter & Spring Pill Tooltip with Alpha-Hit Testing ---
    const portraitWrap = document.querySelector('.hero-portrait-wrap');
    const baseImg = document.querySelector('.hero-portrait-base');
    const monoLayer = document.getElementById('hero-portrait-mono');
    const canvas = document.getElementById('hero-particle-canvas');
    const pill = document.getElementById('hero-cursor-pill');
    const pillText = document.getElementById('hero-pill-text');

    if (portraitWrap && canvas && baseImg) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let particleAnimId = null;
        let isOverOpaquePixel = false;
        let isInsideWrap = false;

        // Offscreen Hit-Test Canvas for alpha detection
        const hitCanvas = document.createElement('canvas');
        const hitCtx = hitCanvas.getContext('2d', { willReadFrequently: true });
        let hitData = null;
        let hitWidth = 0;
        let hitHeight = 0;

        const updateHitMap = () => {
            const imgEl = baseImg;
            if (!imgEl.naturalWidth || !imgEl.naturalHeight) return;
            hitWidth = Math.min(250, imgEl.naturalWidth);
            hitHeight = Math.round(hitWidth * (imgEl.naturalHeight / imgEl.naturalWidth));
            hitCanvas.width = hitWidth;
            hitCanvas.height = hitHeight;
            hitCtx.clearRect(0, 0, hitWidth, hitHeight);
            hitCtx.drawImage(imgEl, 0, 0, hitWidth, hitHeight);
            try {
                hitData = hitCtx.getImageData(0, 0, hitWidth, hitHeight).data;
            } catch (err) {
                hitData = null;
            }
        };

        if (baseImg.complete) {
            updateHitMap();
        } else {
            baseImg.addEventListener('load', updateHitMap);
        }

        const isPixelOpaque = (clientX, clientY) => {
            if (!hitData || !hitWidth || !hitHeight) return true; // Fallback
            const rect = baseImg.getBoundingClientRect();
            if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
                return false;
            }
            const normalizedX = (clientX - rect.left) / rect.width;
            const normalizedY = (clientY - rect.top) / rect.height;
            const px = Math.min(hitWidth - 1, Math.max(0, Math.floor(normalizedX * hitWidth)));
            const py = Math.min(hitHeight - 1, Math.max(0, Math.floor(normalizedY * hitHeight)));
            const alphaIndex = (py * hitWidth + px) * 4 + 3;
            return hitData[alphaIndex] > 25; // Opaque silhouette threshold
        };

        // --- Text Cycling Setup ---
        const phrases = [
            "Clarity by Design.",
            "Bliss is your designer.",
            "Let's grow the business."
        ];
        let currentPhraseIdx = 0;
        let cycleTimer = null;
        let isTransitioningText = false;

        const cycleToNextPhrase = () => {
            if (!pillText || isTransitioningText) return;
            isTransitioningText = true;
            currentPhraseIdx = (currentPhraseIdx + 1) % phrases.length;
            const nextText = phrases[currentPhraseIdx];

            // Slide up & fade out
            pillText.classList.add('slide-out');

            setTimeout(() => {
                pillText.textContent = nextText;
                pillText.classList.remove('slide-out');
                pillText.classList.add('slide-in-prep');

                // Force layout reflow
                void pillText.offsetHeight;

                pillText.classList.remove('slide-in-prep');
                pillText.classList.add('slide-in');

                setTimeout(() => {
                    pillText.classList.remove('slide-in');
                    isTransitioningText = false;
                }, 280);
            }, 260);
        };

        const startTextCycleTimer = () => {
            stopTextCycleTimer();
            cycleTimer = setInterval(() => {
                if (isOverOpaquePixel) {
                    cycleToNextPhrase();
                }
            }, 2500); // cycle every 2.5s while over silhouette
        };

        const stopTextCycleTimer = () => {
            if (cycleTimer) {
                clearInterval(cycleTimer);
                cycleTimer = null;
            }
        };

        // --- Spring Physics for Floating Pill ---
        let mouseX = -100;
        let mouseY = -100;
        let pillX = -100;
        let pillY = -100;
        let pillVx = 0;
        let pillVy = 0;
        let currentScale = 0;
        let targetScale = 0;
        let currentOpacity = 0;
        let targetOpacity = 0;
        let springAnimId = null;

        const springStiffness = 0.14; // Elasticity
        const springDamping = 0.72;   // Fluid smoothing drag

        const updateSpringPhysics = () => {
            const ax = (mouseX - pillX) * springStiffness;
            const ay = (mouseY - pillY) * springStiffness;

            pillVx = (pillVx + ax) * springDamping;
            pillVy = (pillVy + ay) * springDamping;

            pillX += pillVx;
            pillY += pillVy;

            currentScale += (targetScale - currentScale) * 0.18;
            currentOpacity += (targetOpacity - currentOpacity) * 0.2;

            if (pill) {
                pill.style.transform = `translate(${pillX}px, ${pillY}px) translate(-50%, -50%) scale(${currentScale})`;
                pill.style.opacity = currentOpacity;
            }

            if (isInsideWrap || currentScale > 0.01) {
                springAnimId = requestAnimationFrame(updateSpringPhysics);
            } else {
                if (pill) {
                    pill.style.opacity = '0';
                    pill.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) scale(0)`;
                }
                springAnimId = null;
            }
        };

        const resizeCanvas = () => {
            const rect = portraitWrap.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.resetTransform();
            ctx.scale(dpr, dpr);
            updateHitMap();
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        class SharpParticle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 2.0;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                this.size = 2 + Math.random() * 2.5;
                this.isSquare = Math.random() > 0.5;
                
                const grayValue = Math.floor(190 + Math.random() * 65);
                this.baseColor = `${grayValue}, ${grayValue}, ${grayValue}`;
                
                this.alpha = 0.95;
                this.decay = 0.04 + Math.random() * 0.04;
            }

            update(boundsWidth, boundsHeight) {
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;

                if (this.x < 0 || this.x > boundsWidth || this.y < 0 || this.y > boundsHeight) {
                    this.alpha = 0;
                }
            }

            draw(ctx) {
                if (this.alpha <= 0) return;
                ctx.save();
                ctx.fillStyle = `rgba(${this.baseColor}, ${this.alpha})`;
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';

                if (this.isSquare) {
                    ctx.fillRect(Math.round(this.x - this.size / 2), Math.round(this.y - this.size / 2), this.size, this.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        const renderParticles = () => {
            const rect = portraitWrap.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update(rect.width, rect.height);
                p.draw(ctx);
                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                }
            }

            if (particles.length > 0 || isInsideWrap) {
                particleAnimId = requestAnimationFrame(renderParticles);
            } else {
                particleAnimId = null;
            }
        };

        const onMouseMove = (e) => {
            const rect = portraitWrap.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            mouseX = x;
            mouseY = y;

            const overOpaque = isPixelOpaque(e.clientX, e.clientY);

            if (overOpaque) {
                if (!isOverOpaquePixel) {
                    // Just entered silhouette: activate dimming + spotlight + tooltip
                    isOverOpaquePixel = true;
                    portraitWrap.classList.add('is-hovered');
                    targetScale = 1;
                    targetOpacity = 1;
                    cycleToNextPhrase();
                    startTextCycleTimer();
                }

                // 1. Update Spotlight Radial Mask Coordinates
                if (monoLayer) {
                    monoLayer.style.setProperty('--mouse-x', `${x}px`);
                    monoLayer.style.setProperty('--mouse-y', `${y}px`);
                }

                // 2. Emit Sharp Non-Glowing Particles (only on opaque body)
                const count = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < count; i++) {
                    particles.push(new SharpParticle(x, y));
                }
            } else {
                if (isOverOpaquePixel) {
                    // Moved into transparent empty space around silhouette
                    isOverOpaquePixel = false;
                    portraitWrap.classList.remove('is-hovered');
                    targetScale = 0;
                    targetOpacity = 0;
                    stopTextCycleTimer();
                }
            }

            if (!particleAnimId) {
                particleAnimId = requestAnimationFrame(renderParticles);
            }
            if (!springAnimId) {
                springAnimId = requestAnimationFrame(updateSpringPhysics);
            }
        };

        portraitWrap.addEventListener('mouseenter', (e) => {
            isInsideWrap = true;
            resizeCanvas();

            const rect = portraitWrap.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            pillX = mouseX;
            pillY = mouseY;
            pillVx = 0;
            pillVy = 0;

            onMouseMove(e);
        });

        portraitWrap.addEventListener('mousemove', onMouseMove);

        portraitWrap.addEventListener('mouseleave', () => {
            isInsideWrap = false;
            isOverOpaquePixel = false;
            portraitWrap.classList.remove('is-hovered');
            targetScale = 0;
            targetOpacity = 0;
            stopTextCycleTimer();
        });
    }

    // --- Hero Section Motion Handled by js/lanyard-badge.js ---
    // (Old blur sink removed so hero storytelling stays crisp and legible as ID card pulls up)

    // --- Studio-Style Case Study Modal Viewer Controller ---
    const modal = document.getElementById('project-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalShareBtn = document.getElementById('modal-share-btn');
    const modalBrandTitle = document.getElementById('modal-brand-title');
    const modalBodyContent = document.getElementById('modal-body-content');

    let currentModalProjectId = null;

    window.openProjectModal = async (projectId) => {
        if (!modal) return;
        currentModalProjectId = projectId;
        
        // Show modal and lock background scroll
        modal.classList.add('is-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        if (modalBodyContent) {
            modalBodyContent.innerHTML = `
                <div class="modal-loading-state">
                    <div class="modal-spinner"></div>
                    <p>Loading project story...</p>
                </div>
            `;
        }

        try {
            // Fetch project & case study details
            const [projRes, csRes] = await Promise.all([
                supabaseClient.from('projects').select('*').eq('id', projectId).single(),
                supabaseClient.from('case_studies').select('*').eq('id', projectId).single()
            ]);

            const project = projRes.data;
            const caseStudy = csRes.data;

            if (!project) {
                throw new Error("Project not found");
            }

            if (modalBrandTitle) {
                modalBrandTitle.textContent = project.title || 'CASE STUDY';
            }

            const visualsArray = caseStudy && Array.isArray(caseStudy.full_image_chunks) ? caseStudy.full_image_chunks : [];
            const validVisuals = visualsArray.filter(v => typeof v === 'string' && v.trim() !== '');

            const role = (caseStudy && caseStudy.role) || 'Product Designer';
            const duration = (caseStudy && caseStudy.duration) || 'Varies';
            const tools = (caseStudy && caseStudy.tools) || 'Figma, Prototyping';
            const industry = (caseStudy && caseStudy.industry) || 'Digital Product';
            const projectLink = (caseStudy && caseStudy.project_link) || null;
            const categoryTag = (project.category_tags && project.category_tags[0]) || 'CASE STUDY';

            modalBodyContent.innerHTML = `
                <div class="modal-content-hero">
                    <div class="modal-main-info">
                        <span class="modal-tag">${categoryTag}</span>
                        <h1 class="modal-title">${project.title}</h1>
                        <p class="modal-subtitle">${project.subtitle || 'End-to-end design direction and user experience optimization.'}</p>
                    </div>
                    <div class="modal-meta-col">
                        <div class="modal-meta-item">
                            <h4>Services / Skills</h4>
                            <p>${tools}</p>
                        </div>
                        <div class="modal-meta-item">
                            <h4>Timeline</h4>
                            <p>${duration}</p>
                        </div>
                        <div class="modal-meta-item">
                            <h4>Role</h4>
                            <p>${role}</p>
                        </div>
                        ${projectLink ? `
                        <div class="modal-meta-item">
                            <h4>Live Experience</h4>
                            <a href="${projectLink}" target="_blank" class="live-link">
                                VISIT LIVE <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.8em; margin-left: 4px;"></i>
                            </a>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="modal-visuals-stream">
                    ${validVisuals.length > 0 
                        ? validVisuals.map(url => {
                            const isVideo = typeof url === 'string' && url.split('?')[0].split('#')[0].match(/\.(mp4|webm|ogg|mov)$/i);
                            if (isVideo) {
                                return `<video src="${url}" autoplay muted loop playsinline></video>`;
                            }
                            return `<img src="${url}" alt="${project.title} Visual" loading="lazy">`;
                        }).join('')
                        : (project.hero_image 
                            ? `<img src="${project.hero_image}" alt="${project.title} Cover" style="width: 100%; border-radius: 16px;">`
                            : `<div style="padding: 80px 20px; text-align: center; color: var(--text-muted);">Visual documentation in progress.</div>`
                        )
                    }
                </div>

                <!-- Custom Studio CTA Banner (No Services Button) -->
                <div class="modal-cta-banner">
                    <div class="modal-cta-left">
                        <h3>Interested in a similar redesign?</h3>
                        <p>I partner with high-conviction teams to design and build digital products that earn trust and retain users.</p>
                    </div>
                    <div class="modal-cta-actions">
                        <a href="https://cal.com/blissdezigns/discovery-call" target="_blank" class="modal-cta-btn-primary">
                            <span>Book a Call</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
            
            modalBodyContent.scrollTop = 0;
        } catch (err) {
            console.error("Modal fetch error:", err);
            if (modalBodyContent) {
                modalBodyContent.innerHTML = `
                    <div style="padding: 100px 20px; text-align: center;">
                        <p style="color: var(--text-muted); margin-bottom: 20px;">Could not load modal details.</p>
                        <a href="case-study.html?project=${projectId}" class="btn btn-primary">Open Dedicated Page</a>
                    </div>
                `;
            }
        }
    };

    window.closeProjectModal = () => {
        if (!modal) return;
        modal.classList.remove('is-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        currentModalProjectId = null;
    };

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', window.closeProjectModal);
    }
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', window.closeProjectModal);
    }

    // Share button in modal
    if (modalShareBtn) {
        modalShareBtn.addEventListener('click', () => {
            if (!currentModalProjectId) return;
            const shareUrl = `${window.location.origin}/case-study.html?project=${currentModalProjectId}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                const span = modalShareBtn.querySelector('span');
                if (span) {
                    span.textContent = 'Copied!';
                    setTimeout(() => {
                        span.textContent = 'Share';
                    }, 2000);
                }
            }).catch(err => {
                console.error("Failed to copy modal link", err);
            });
        });
    }

    // Guarantee mousewheel scrolling inside modal regardless of where mouse is positioned
    if (modal) {
        modal.addEventListener('wheel', (e) => {
            if (modal.classList.contains('is-active') && modalBodyContent) {
                // If cursor is on modal window or backdrop, scroll modal body directly
                if (e.target !== modalBodyContent && !modalBodyContent.contains(e.target)) {
                    modalBodyContent.scrollTop += e.deltaY;
                    e.preventDefault();
                }
            }
        }, { passive: false });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('is-active')) {
            window.closeProjectModal();
        }
    });
});





