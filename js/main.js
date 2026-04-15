document.addEventListener('DOMContentLoaded', () => {
    // --- Analytics: Track Page View ---
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.from('analytics').insert([
            { page_path: window.location.pathname, event_type: 'view' }
        ]).then(({ error }) => { if (error) console.error('Analytics Error:', error); });
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Subtle feedback
            themeToggle.style.transform = 'scale(1.2) rotate(360deg)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 300);
        });
    }

    // Mobile Navigation Logic
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');

    if (mobileBtn && mobileOverlay) {
        // Toggle menu visibility and animated burger state
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
            
            // Prevent body scrolling when menu is open
            body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : '';
        });

        // Close mobile overlay whenever a link is clicked to navigate
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileBtn.classList.remove('active');
                mobileOverlay.classList.remove('active');
                body.style.overflow = '';
            });
        });
    }

    // Scroll Effect for Header
    const header = document.querySelector('header');
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    // Scroll To Top Logic
    const scrollTopBtn = document.getElementById('scroll-top-btn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });

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
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            const formData = new FormData(form);
            
            // UI Loading state
            btn.innerText = 'Sending...';
            btn.disabled = true;

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                // --- Analytics: Save Message to Supabase ---
                if (typeof supabaseClient !== 'undefined') {
                    const name = formData.get('name') || formData.get('Full Name');
                    const email = formData.get('email') || formData.get('Email Address');
                    const msg = formData.get('message') || formData.get('Message');
                    
                    await supabaseClient.from('messages').insert([{ name, email, message: msg }]);
                    await supabaseClient.from('analytics').insert([{ page_path: window.location.pathname, event_type: 'message' }]);
                }

                if (response.ok) {
                    // Success UI
                    btn.innerText = 'Message Sent! ✓';
                    btn.style.background = '#22c55e';
                    form.reset();
                } else {
                    // Server error response
                    const data = await response.json();
                    if (Object.hasOwn(data, 'errors')) {
                        btn.innerText = 'Error! ✗';
                        btn.style.background = '#ef4444';
                        console.error('Submission errors:', data.errors.map(error => error.message).join(", "));
                    } else {
                        throw new Error('Oops! There was a problem submitting your form');
                    }
                }
            } catch (error) {
                // Network error
                btn.innerText = 'Error! ✗';
                btn.style.background = '#ef4444';
                console.error('Submission error:', error);
            } finally {
                // Return button to original state after delay
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
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
});

// Project Gallery Filtering Logic (for work.html)
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

document.addEventListener('DOMContentLoaded', window.initProjectFilters);
