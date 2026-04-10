document.addEventListener('DOMContentLoaded', () => {
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
    const revealElements = document.querySelectorAll('.service-card, .stats-container, .masonry-card, .experience-card, .testimonial-card, .section-title, .contact-text, .contact-form, .tools-section .container, .portfolio-gallery, .reveal-on-scroll');
    
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
    
    revealElements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        revealOnScroll.observe(el);
    });

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

    // Video Performance Optimization (Play only when in viewport)
    const marqueeVideos = document.querySelectorAll('.marquee-card video');
    if (marqueeVideos.length > 0) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.play().catch(e => console.log("Autoplay prevented", e));
                } else {
                    entry.target.pause();
                }
            });
        }, { threshold: 0.1 });

        marqueeVideos.forEach(video => {
            videoObserver.observe(video);
        });
    }
});

// Project Gallery Filtering Logic (for work.html)
document.addEventListener('DOMContentLoaded', () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.filter-item');

    if (filterButtons.length > 0 && projectItems.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');

                // Update active button state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter projects
                projectItems.forEach(item => {
                    item.classList.add('hidden'); // Start by hiding all

                    // If 'all' or specific category matches
                    if (filter === 'all' || item.classList.contains(filter)) {
                        // Small delay for smooth exit animation of others
                        setTimeout(() => {
                            item.classList.remove('hidden');
                            
                            // Re-trigger reveal animation if it hasn't been seen yet
                            if (!item.classList.contains('visible')) {
                                item.classList.add('visible');
                            }
                        }, 100);
                    }
                });
            });
        });
    }
});
