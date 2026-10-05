/**
 * BlissDezign CMS Loader
 * Fetches dynamic content from Supabase to replace hardcoded placeholders.
 */

const CMSLoader = {
    // Utility to wait for standard reveal animations
    triggerReveal: (container) => {
        if (typeof window.revealOnScrollObserver !== 'undefined') {
            const elements = container.querySelectorAll('.reveal-on-scroll, [data-reveal]');
            elements.forEach(el => window.revealOnScrollObserver.observe(el));
        }
    },

    // Utility to determine if media is video
    isMediaVideo: (url) => {
        if (!url) return false;
        if (typeof url !== 'string') return false;
        // Remove query strings and hash before checking extension
        const cleanUrl = url.split('?')[0].split('#')[0];
        return cleanUrl.match(/\.(mp4|webm|ogg|mov)$/i) != null;
    },

    // Helper to render image or video
    renderMedia: (url, alt) => {
        if (CMSLoader.isMediaVideo(url)) {
            return `<video src="${url}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;display:block;"></video>`;
        }
        return `<img src="${url}" alt="${alt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">`;
    },

    // 1. Fetch Projects for Homepage (3D Physical Glass Folder Showcase)
    loadHomeProjects: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching home projects for 3D Physical Folder...");
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('is_featured', true)
            .order('display_order', { ascending: true })
            .limit(6);

        if (error) {
            console.error("Error loading home projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No projects found. Use the admin panel to add some!</p>';
            return;
        }

        let currentIndex = 0;

        const renderSleeve = (project) => {
            const tagsHtml = (project.category_tags || []).map(t => `<span class="sleeve-tag-pill">${t}</span>`).join('');
            return `
                <div class="folder-sheet-sleeve" id="current-folder-sleeve" data-project-id="${project.id}">
                    <div class="sleeve-media-viewport">
                        ${CMSLoader.renderMedia(project.hero_image, project.title)}
                        <div class="sleeve-hover-curtain">
                            <span class="sleeve-inspect-chip">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Case Study
                            </span>
                        </div>
                    </div>
                    <div class="sleeve-info-row">
                        <div class="sleeve-text-box">
                            <h3>${project.title}</h3>
                            <div class="sleeve-tags-wrap">
                                ${tagsHtml}
                            </div>
                        </div>
                        <button class="sleeve-action-btn" id="sleeve-open-cta" data-project-id="${project.id}">
                            <span>View Project</span>
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        };

        const renderIndicators = () => {
            return projects.map((_, i) => `
                <button class="folder-thumb-dot ${i === currentIndex ? 'active' : ''}" data-index="${i}" aria-label="Project ${i+1}"></button>
            `).join('');
        };

        container.innerHTML = `
            <div class="real-3d-folder-wrapper reveal-on-scroll">
                <div class="real-3d-folder">
                    <div class="folder-top-tab-lip">
                        <i class="fa-solid fa-folder-open"></i>
                        <span>Bliss Works Archive</span>
                    </div>

                    <div class="folder-controls-bar">
                        <span class="folder-counter-tag" id="folder-step-counter">
                            PROJECT ${String(currentIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}
                        </span>
                        <div class="folder-arrow-actions">
                            <button class="folder-arrow-btn" id="folder-prev-btn" aria-label="Previous Project" ${currentIndex === 0 ? 'disabled' : ''}>
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <button class="folder-arrow-btn" id="folder-next-btn" aria-label="Next Project" ${currentIndex === projects.length - 1 ? 'disabled' : ''}>
                                <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>

                    <div class="folder-pocket-stage" id="folder-pocket-stage">
                        ${renderSleeve(projects[currentIndex])}
                    </div>

                    <div class="folder-footer-strip">
                        <div class="folder-thumbnail-pills" id="folder-thumb-pills">
                            ${renderIndicators()}
                        </div>
                        <a href="projects.html" class="folder-all-projects-btn">
                            <span>View All Projects</span>
                            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.72rem;"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        const pocketStage = container.querySelector('#folder-pocket-stage');
        const prevBtn = container.querySelector('#folder-prev-btn');
        const nextBtn = container.querySelector('#folder-next-btn');
        const stepCounter = container.querySelector('#folder-step-counter');
        const thumbPills = container.querySelector('#folder-thumb-pills');

        const bindSleeveClicks = () => {
            const sleeve = container.querySelector('#current-folder-sleeve');
            const ctaBtn = container.querySelector('#sleeve-open-cta');

            const handleOpen = (e) => {
                const id = e.currentTarget.getAttribute('data-project-id');
                if (window.openProjectModal) {
                    window.openProjectModal(id);
                } else {
                    window.location.href = `case-study.html?project=${id}`;
                }
            };

            if (sleeve) sleeve.addEventListener('click', handleOpen);
            if (ctaBtn) ctaBtn.addEventListener('click', handleOpen);
        };

        const updateStage = (direction = 1) => {
            const project = projects[currentIndex];
            stepCounter.textContent = `PROJECT ${String(currentIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
            
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === projects.length - 1;

            thumbPills.innerHTML = renderIndicators();
            bindThumbClicks();

            // 3D slide sheet out & in
            const currentSleeve = container.querySelector('#current-folder-sleeve');
            if (currentSleeve) {
                currentSleeve.style.transform = `rotateX(${direction * 8}deg) translateY(${direction * -40}px) scale(0.92)`;
                currentSleeve.style.opacity = '0';
                currentSleeve.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
            }

            setTimeout(() => {
                pocketStage.innerHTML = renderSleeve(project);
                const newSleeve = container.querySelector('#current-folder-sleeve');
                if (newSleeve) {
                    newSleeve.style.transform = `rotateX(${direction * -8}deg) translateY(${direction * 40}px) scale(0.92)`;
                    newSleeve.style.opacity = '0';
                    setTimeout(() => {
                        newSleeve.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
                        newSleeve.style.transform = 'rotateX(2deg) translateY(-4px)';
                        newSleeve.style.opacity = '1';
                    }, 20);
                }
                bindSleeveClicks();
            }, 200);
        };

        const bindThumbClicks = () => {
            container.querySelectorAll('.folder-thumb-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const idx = parseInt(dot.getAttribute('data-index'), 10);
                    if (idx !== currentIndex) {
                        const dir = idx > currentIndex ? 1 : -1;
                        currentIndex = idx;
                        updateStage(dir);
                    }
                });
            });
        };

        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateStage(-1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < projects.length - 1) {
                currentIndex++;
                updateStage(1);
            }
        });

        bindSleeveClicks();
        bindThumbClicks();
        CMSLoader.triggerReveal(container);
    },

    // 2. Fetch All Projects for Work Page
    loadAllProjects: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching all projects for physical drafting gallery...");
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error("Error loading all projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted text-center" style="grid-column: 1 / -1; font-family: var(--font-mono); padding: 40px;">No projects found in archive.</p>';
            return;
        }

        const pinColors = ['coral', 'blue', 'amber', 'purple'];

        container.innerHTML = projects.map((project, index) => {
            const rawTags = project.category_tags || [];
            const primaryTag = (rawTags.length > 0 && rawTags[0]) ? String(rawTags[0]).toUpperCase() : 'CASE STUDY';
            const categoriesJoined = rawTags.join(' ').toLowerCase();
            const pinColor = pinColors[index % pinColors.length];
            const numStr = String(index + 1).padStart(2, '0');
            const rotDeg = ((index % 5) - 2) * 0.7; // Subtle tactile rotation (-1.4deg to +1.4deg)
            const safeDesc = (project.description || project.headline || '').replace(/"/g, '&quot;');
            const safeTitle = (project.title || 'Untitled Project').replace(/"/g, '&quot;');

            const isVideo = CMSLoader.isMediaVideo(project.hero_image);
            const mediaHtml = isVideo
                ? `<video src="${project.hero_image}" autoplay muted loop playsinline></video>`
                : `<img src="${project.hero_image}" alt="${safeTitle}" loading="lazy">`;

            return `
                <div class="landscape-post-card project-grid-card"
                     data-project-id="${project.id}"
                     data-project-title="${safeTitle}"
                     data-project-tag="${primaryTag} // CASE STUDY"
                     data-project-desc="${safeDesc}"
                     data-project-img="${project.hero_image || ''}"
                     data-project-link="case-study.html?project=${encodeURIComponent(project.id)}"
                     data-categories="${categoriesJoined}"
                     style="--card-base-rot: ${rotDeg}deg; transform: rotate(${rotDeg}deg);">
                    <!-- Tactile Physical Pushpin -->
                    <div class="board-pushpin ${pinColor}" style="top: -8px; left: 50%; transform: translateX(-50%); z-index: 10;"></div>
                    <div class="card-inner-surface">
                        <div class="card-media-box">
                            ${mediaHtml}
                            <div class="card-expand-badge"><i class="fa-solid fa-expand"></i> View</div>
                        </div>
                        <div class="card-meta-bar">
                            <span class="card-number">${numStr}</span>
                            <span class="card-title">${safeTitle.toUpperCase()}</span>
                            <span class="card-tag">${primaryTag} ↗</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Filtering engine for washi tape filter chips
        const filterChips = document.querySelectorAll('.project-filter-chip');
        const projectCards = container.querySelectorAll('.project-grid-card');

        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => {
                    c.classList.remove('active');
                    c.setAttribute('aria-selected', 'false');
                });
                chip.classList.add('active');
                chip.setAttribute('aria-selected', 'true');

                const filter = chip.getAttribute('data-filter') || 'all';

                projectCards.forEach(card => {
                    const categories = card.getAttribute('data-categories') || '';
                    let match = false;

                    if (filter === 'all') {
                        match = true;
                    } else if (filter === 'mobile' && (categories.includes('mobile') || categories.includes('app'))) {
                        match = true;
                    } else if (filter === 'website' && (categories.includes('web') || categories.includes('site') || categories.includes('landing'))) {
                        match = true;
                    } else if (filter === 'fintech' && categories.includes('fintech')) {
                        match = true;
                    } else if (filter === 'dashboard' && (categories.includes('dashboard') || categories.includes('saas'))) {
                        match = true;
                    } else if (filter === 'saas' && (categories.includes('saas') || categories.includes('ai') || categories.includes('tech'))) {
                        match = true;
                    } else if (categories.includes(filter)) {
                        match = true;
                    }

                    const baseRot = parseFloat(card.dataset.baseRot) || 0;
                    const pin = card.querySelector('.board-pushpin');

                    if (match) {
                        card.classList.remove('is-filtered-out');
                        if (card._st) card._st.enable();
                        if (typeof gsap !== 'undefined') {
                            gsap.killTweensOf(card);
                            if (pin) gsap.killTweensOf(pin);
                            gsap.to(card, {
                                opacity: 1,
                                scale: 1,
                                y: 0,
                                rotation: baseRot,
                                duration: 0.3,
                                ease: 'power2.out'
                            });
                            if (pin) gsap.to(pin, { scale: 1, rotation: 0, y: 0, duration: 0.3 });
                        } else {
                            card.style.opacity = '1';
                        }
                    } else {
                        card.classList.add('is-filtered-out');
                        if (card._st) card._st.disable();
                    }
                });

                // Crucial: Recalculate all scroll trigger positions immediately
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
                if (window.lenis) {
                    window.lenis.resize();
                }
            });
        });

        // ── TESTIMONIAL-STYLE SCROLL-TRIGGERED PUNCH-PINNING & TACTILE PHYSICS ──
        if (typeof gsap !== 'undefined') {
            projectCards.forEach((card, idx) => {
                const baseRot = parseFloat(card.style.getPropertyValue('--card-base-rot')) || 0;
                card.dataset.baseRot = baseRot;
                const pin = card.querySelector('.board-pushpin');
                const isEven = idx % 2 === 0;

                // Hardware-accelerated transform origin around the top pushpin
                card.style.transformOrigin = '50% 6px';
                card.style.willChange = 'transform, opacity';

                const rect = card.getBoundingClientRect();
                const inInitialViewport = rect.top < window.innerHeight;

                if (inInitialViewport) {
                    // Cards already in viewport start pinned and visible
                    gsap.set(card, {
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        rotation: baseRot
                    });
                    if (pin) {
                        gsap.set(pin, { scale: 1, rotation: 0, y: 0 });
                    }
                } else {
                    // Cards below viewport are lifted slightly off drafting board
                    gsap.set(card, {
                        opacity: 0,
                        scale: 1.10,
                        y: -44,
                        rotation: baseRot + (isEven ? -3.5 : 3.5)
                    });
                    if (pin) {
                        gsap.set(pin, {
                            scale: 1.3,
                            rotation: isEven ? -16 : 16,
                            y: -6
                        });
                    }
                }

                if (typeof ScrollTrigger !== 'undefined') {
                    card._st = ScrollTrigger.create({
                        trigger: card,
                        start: 'top 90%',
                        end: 'bottom 10%',
                        onEnter: () => {
                            gsap.killTweensOf(card);
                            if (pin) gsap.killTweensOf(pin);

                            // Visibly punches / slams onto drafting board in the viewport!
                            gsap.timeline()
                                .to(card, {
                                    opacity: 1,
                                    scale: 0.98,
                                    y: 0,
                                    rotation: baseRot + (isEven ? 2.5 : -2.5),
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
                                    duration: 0.36,
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
                            // Guard: ONLY unpin if card has scrolled completely below the viewport
                            const currentRect = card.getBoundingClientRect();
                            if (currentRect.top >= window.innerHeight) {
                                gsap.killTweensOf(card);
                                if (pin) gsap.killTweensOf(pin);
                                gsap.to(card, {
                                    opacity: 0,
                                    scale: 1.10,
                                    y: -38,
                                    rotation: baseRot + (isEven ? -3.5 : 3.5),
                                    duration: 0.22,
                                    ease: 'power2.in'
                                });
                                if (pin) {
                                    gsap.to(pin, {
                                        scale: 1.3,
                                        rotation: isEven ? -16 : 16,
                                        y: -6,
                                        duration: 0.22
                                    });
                                }
                            } else {
                                // Keep visible and pinned if in view or above
                                gsap.killTweensOf(card);
                                if (pin) gsap.killTweensOf(pin);
                                gsap.to(card, { opacity: 1, scale: 1, y: 0, rotation: baseRot, duration: 0.2 });
                                if (pin) gsap.to(pin, { scale: 1, rotation: 0, y: 0, duration: 0.2 });
                            }
                        }
                    });
                } else {
                    gsap.to(card, { opacity: 1, scale: 1, y: 0, rotation: baseRot, duration: 0.4 });
                }
            });

            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }

            if (window.initTactilePinSwingPhysics) {
                window.initTactilePinSwingPhysics();
            }
        } else {
            projectCards.forEach(c => { c.style.opacity = '1'; });
        }

        CMSLoader.triggerReveal(container);
    },

    // 3. Fetch Testimonials for Grid/Vertical List
    loadDynamicTestimonials: async (containerId) => {
        const gridContainer = document.querySelector(`.${containerId}`);
        if (!gridContainer) return;

        console.log("Fetching testimonials...");
        const { data: reviews, error } = await supabaseClient
            .from('reviews')
            .select('*');

        if (error) {
            console.error("Error loading reviews:", error);
            return;
        }

        if (!reviews || reviews.length === 0) return;

        reviews.sort((a, b) => {
            let orderA = parseInt(a.display_order);
            let orderB = parseInt(b.display_order);
            if (isNaN(orderA) || orderA === 0) orderA = 999;
            if (isNaN(orderB) || orderB === 0) orderB = 999;
            
            if (orderA === orderB) {
                return new Date(b.created_at) - new Date(a.created_at);
            }
            return orderA - orderB;
        });

        const renderSet = (items) => items.map(rev => {
            const urls = rev.avatar_url ? rev.avatar_url.split('|||') : [];
            const avatarUrl = urls[0] || 'assets/avatar_placeholder.png';
            const logoUrl = urls[1] || null;

            // Render company logo badge overlay
            let logoOverlay = '';
            if (logoUrl) {
                logoOverlay = `<div class="brand-badge-overlay"><img src="${logoUrl}" alt="Brand Logo"></div>`;
            } else {
                // Fallback detection from role name text
                const roleLower = (rev.author_role || '').toLowerCase();
                if (roleLower.includes('spotify')) {
                    logoOverlay = `<div class="brand-badge-overlay spotify"><i class="fa-brands fa-spotify"></i></div>`;
                } else if (roleLower.includes('meta') || roleLower.includes('facebook')) {
                    logoOverlay = `<div class="brand-badge-overlay meta"><i class="fa-brands fa-meta"></i></div>`;
                } else if (roleLower.includes('booking')) {
                    logoOverlay = `<div class="brand-badge-overlay booking"><span>B.</span></div>`;
                } else if (roleLower.includes('google')) {
                    logoOverlay = `<div class="brand-badge-overlay google"><i class="fa-brands fa-google"></i></div>`;
                } else if (roleLower.includes('apple')) {
                    logoOverlay = `<div class="brand-badge-overlay apple"><i class="fa-brands fa-apple"></i></div>`;
                }
            }

            return `
                <div class="modern-test-card reveal-on-scroll" data-reveal>
                    <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                    <p class="modern-test-text">${rev.review_text.startsWith('"') ? rev.review_text : `"${rev.review_text}"`}</p>
                    <div class="modern-test-author-row">
                        <div class="modern-test-avatar-container">
                            <img src="${avatarUrl}" alt="${rev.author_name}" onerror="this.src='assets/avatar_placeholder.png'">
                            ${logoOverlay}
                        </div>
                        <div class="modern-test-author-info">
                            <span class="author-name">${rev.author_name.toUpperCase()}</span>
                            <span class="author-company">${rev.author_role.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        gridContainer.innerHTML = renderSet(reviews);

        // Control see-all expand/collapse functionality
        const wrapper = document.getElementById('testimonials-grid-wrapper');
        const fadeOverlay = document.getElementById('testimonials-fade-overlay');
        const seeAllBtn = document.getElementById('see-all-btn');

        if (reviews.length <= 4) {
            if (fadeOverlay) fadeOverlay.style.display = 'none';
            if (wrapper) wrapper.classList.add('no-fade');
        } else {
            if (fadeOverlay) fadeOverlay.style.display = 'flex';
            if (seeAllBtn) {
                seeAllBtn.addEventListener('click', () => {
                    const isExpanded = wrapper.classList.contains('is-expanded');
                    if (isExpanded) {
                        wrapper.classList.remove('is-expanded');
                        seeAllBtn.innerHTML = 'See All';
                        const target = document.getElementById('testimonials');
                        if (target) target.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        wrapper.classList.add('is-expanded');
                        seeAllBtn.innerHTML = 'See Less';
                    }
                });
            }
        }

        CMSLoader.triggerReveal(gridContainer);
    },

    // 4. Fetch Blog Posts
    loadBlogPosts: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching blog posts...");
        const { data: posts, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading blog posts:", error);
            return;
        }

        if (!posts || posts.length === 0) {
            if (container.classList.contains('book-content-scroll')) {
                // Keep the tactile folder book's curated entries intact
                return;
            }
            container.innerHTML = `
                <div class="empty-blog-state reveal-on-scroll" style="grid-column: 1/-1; padding: 100px 20px; text-align: center; width: 100%;">
                    <div style="background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.12); padding: 60px 40px; border-radius: 32px; backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); max-width: 550px; margin: 0 auto; box-shadow: 0 8px 32px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
                        <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(168, 85, 247, 0.05) 0%, transparent 70%); pointer-events: none;"></div>
                        <i class="fa-solid fa-pen-nib" style="font-size: 3rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 25px;"></i>
                        <h2 style="margin-bottom: 15px;">The lab is brewing.</h2>
                        <p class="text-muted" style="font-size: 1.1rem; line-height: 1.6;">I'm currently crafting my next set of design insights. Subscribe below to be the first to read them when they drop.</p>
                    </div>
                </div>
            `;
            CMSLoader.triggerReveal(container);
            return;
        }

        if (container.classList.contains('book-content-scroll')) {
            container.innerHTML = posts.map(post => `
                <a href="post.html?slug=${post.slug}" class="book-entry-card">
                    <div>
                        <div class="book-entry-date">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} // ESSAY</div>
                        <h3 class="book-entry-title">${post.title}</h3>
                        <p class="book-entry-snippet">${post.excerpt || ''}</p>
                    </div>
                    <span class="book-entry-link">Read Entry &rarr;</span>
                </a>
            `).join('');
            return;
        }

        container.innerHTML = posts.map(post => `
            <a href="post.html?slug=${post.slug}" class="masonry-card reveal-on-scroll">
                <div class="masonry-image">
                    <img src="${post.cover_image}" alt="${post.title}" loading="lazy">
                </div>
                <div class="masonry-info">
                    <div class="post-date-tag">${new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <h3>${post.title}</h3>
                    <p class="post-excerpt-preview">${post.excerpt}</p>
                </div>
            </a>
        `).join('');

        CMSLoader.triggerReveal(container);
    },

    // 5. Fetch Single Blog Post
    loadSinglePost: async (slug) => {
        const titleEl = document.getElementById('post-title');
        const dateEl = document.getElementById('post-date');
        const coverEl = document.getElementById('post-cover');
        const bodyEl = document.getElementById('post-body');

        if (!titleEl || !bodyEl) return;

        console.log(`Fetching post: ${slug}...`);
        const { data: post, error } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !post) {
            console.error("Error loading post:", error);
            titleEl.innerText = "Post Not Found";
            return;
        }

        // Set metadata
        CMSLoader.updateMetaTags({
            title: `${post.title} | BlissDezign Insights`,
            description: post.excerpt || post.content.substring(0, 160),
            image: post.cover_image,
            url: window.location.href
        });

        titleEl.innerText = post.title;
        dateEl.innerText = new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        coverEl.src = post.cover_image;
        coverEl.alt = post.title;

        // Detect if content is HTML or needs processing
        const isHTML = post.content.includes('<p>') || post.content.includes('<div>') || post.content.includes('<br>') || post.content.includes('<b>');
        
        let formattedContent = '';
        if (isHTML) {
            formattedContent = post.content;
        } else {
            // Simple Markdown-ish processing for legacy content
            formattedContent = post.content
                .split('\n\n')
                .map(para => {
                    if (para.startsWith('## ')) return `<h2>${para.replace('## ', '')}</h2>`;
                    if (para.startsWith('### ')) return `<h3>${para.replace('### ', '')}</h3>`;
                    if (para.startsWith('> ')) return `<blockquote>${para.replace('> ', '')}</blockquote>`;
                    return `<p>${para.replace(/\n/g, '<br>')}</p>`;
                })
                .join('');
        }

        bodyEl.innerHTML = formattedContent;

        // Setup Engagement (Likes & Shares)
        CMSLoader.setupEngagement(post);

        // Trigger animations
        const container = document.getElementById('post-content-area');
        if (container) CMSLoader.triggerReveal(container);
    },

    // 6. Setup Post Engagement
    setupEngagement: (post) => {
        // --- Shares ---
        const tweetBtn = document.getElementById('share-twitter');
        const linkBtn = document.getElementById('share-linkedin');
        const copyBtn = document.getElementById('copy-link-btn');
        const currentUrl = encodeURIComponent(window.location.href);
        const currentTitle = encodeURIComponent(post.title);
        
        if (tweetBtn) {
            tweetBtn.onclick = (e) => {
                e.preventDefault();
                window.open(`https://twitter.com/intent/tweet?text=${currentTitle}&url=${currentUrl}`, '_blank', 'width=600,height=400');
            };
        }
        if (linkBtn) {
            linkBtn.onclick = (e) => {
                e.preventDefault();
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`, '_blank', 'width=600,height=400');
            };
        }
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    CMSLoader.showToast('Link copied to clipboard!', 'success');
                });
            };
        }

        // --- Likes ---
        const likeBtn = document.getElementById('like-button');
        const likeCountEl = document.getElementById('like-count');
        
        if (likeBtn && likeCountEl) {
            // Set initial likes (default to 0 if null/undefined)
            let currentLikes = post.likes || 0;
            likeCountEl.innerText = currentLikes;
            
            // Check if already liked in local storage
            let likedPosts = JSON.parse(localStorage.getItem('liked_posts') || '[]');
            if (likedPosts.includes(post.id)) {
                likeBtn.classList.add('liked');
            }

            likeBtn.onclick = async () => {
                const isLiked = likedPosts.includes(post.id);
                
                if (isLiked) {
                    // --- UNLIKE ---
                    currentLikes = Math.max(0, currentLikes - 1);
                    likeCountEl.innerText = currentLikes;
                    likeBtn.classList.remove('liked');
                    
                    // Update local storage
                    likedPosts = likedPosts.filter(id => id !== post.id);
                    localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
                    
                    // Update in Supabase
                    const { error } = await supabaseClient.rpc('decrement_likes', { post_id: post.id });
                    if (error) {
                        console.error("Error unliking:", error);
                        // Revert
                        currentLikes++;
                        likeCountEl.innerText = currentLikes;
                        likeBtn.classList.add('liked');
                        likedPosts.push(post.id);
                        localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
                    }
                } else {
                    // --- LIKE ---
                    currentLikes++;
                    likeCountEl.innerText = currentLikes;
                    likeBtn.classList.add('liked');
                    
                    // Update local storage
                    likedPosts.push(post.id);
                    localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
                    
                    // Update in Supabase via Atomic Increment (RPC)
                    const { error } = await supabaseClient
                        .rpc('increment_likes', { post_id: post.id });
                        
                    if (error) {
                        console.error("Error liking:", error);
                        // Revert
                        currentLikes--;
                        likeCountEl.innerText = currentLikes;
                        likeBtn.classList.remove('liked');
                        likedPosts = likedPosts.filter(id => id !== post.id);
                        localStorage.setItem('liked_posts', JSON.stringify(likedPosts));
                    }
                }
            };
        }
    },
    
    // 8. Fetch Life Gallery for About Page
    loadLifeGallery: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching life gallery...");
        const { data: items, error } = await supabaseClient
            .from('life_gallery')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) {
            console.error("Error loading gallery:", error);
            return;
        }

        if (!items || items.length === 0) {
            container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">Gallery is currently empty.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="life-item">
                ${CMSLoader.renderMedia(item.url, 'Life Moment')}
            </div>
        `).join('');

        CMSLoader.triggerReveal(container);
    },

    // Toast Notification utility
    showToast: (message, type = 'success') => {
        let container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>' 
                                      : '<i class="fa-solid fa-circle-exclamation" style="color: #ef4444;"></i>';
                                      
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // 7. SEO Helper: Dynamic Meta Tags
    updateMetaTags: (metadata) => {
        const { title, description, image, url } = metadata;
        
        // Basic Title
        document.title = title;

        // Meta Description
        let descMeta = document.querySelector('meta[name="description"]');
        if (descMeta) descMeta.setAttribute('content', description);

        // Open Graph
        const ogTags = {
            'og:title': title,
            'og:description': description,
            'og:image': image,
            'og:url': url
        };

        for (const [property, content] of Object.entries(ogTags)) {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (tag) tag.setAttribute('content', content);
        }

        // Twitter
        const twitterTags = {
            'twitter:title': title,
            'twitter:description': description,
            'twitter:image': image
        };

        for (const [name, content] of Object.entries(twitterTags)) {
            let tag = document.querySelector(`meta[name="${name}"]`);
            if (tag) tag.setAttribute('content', content);
        }

        // Canonical
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) canonical.setAttribute('href', url);

        // JSON-LD Update
        const schemaEl = document.getElementById('post-schema');
        if (schemaEl) {
            try {
                const schema = JSON.parse(schemaEl.innerHTML);
                schema.headline = title;
                schema.image = image;
                schema.datePublished = metadata.date || new Date().toISOString();
                schemaEl.innerHTML = JSON.stringify(schema, null, 2);
            } catch (e) {
                console.warn("Failed to update JSON-LD schema", e);
            }
        }
    }
};

window.CMSLoader = CMSLoader;
