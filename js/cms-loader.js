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

    // 1. Fetch Projects for Homepage (Selected Projects)
    loadHomeProjects: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching home projects...");
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);

        if (error) {
            console.error("Error loading home projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No projects found. Use the admin panel to add some!</p>';
            return;
        }

        container.innerHTML = projects.map((project, index) => {
            const isLarge = index === 0;
            return `
                <a href="case-study.html?project=${project.id}" class="masonry-card ${isLarge ? 'masonry-large' : ''} reveal-on-scroll">
                    <div class="masonry-image">
                        <img src="${project.hero_image}" alt="${project.title}" loading="lazy">
                    </div>
                    <div class="masonry-info">
                        <h3>${project.title}</h3>
                        <div class="masonry-tags">
                            ${(project.category_tags || []).map(tag => `<span>${tag}</span>`).join('')}
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        CMSLoader.triggerReveal(container);
    },

    // 2. Fetch All Projects for Work Page
    loadAllProjects: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching all projects...");
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading all projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No projects found.</p>';
            return;
        }

        container.innerHTML = projects.map((project, index) => {
            const isLarge = index === 0;
            const filterClass = (project.category_tags || [])
                .map(t => t.toLowerCase().replace(/\s+/g, '-'))
                .join(' ');

            return `
                <a href="case-study.html?project=${project.id}" 
                   class="masonry-card ${isLarge ? 'masonry-large' : ''} filter-item ${filterClass} reveal-on-scroll" 
                   data-reveal>
                    <div class="masonry-image">
                        <img src="${project.hero_image}" alt="${project.title}" loading="lazy">
                    </div>
                    <div class="masonry-info">
                        <h3>${project.title}</h3>
                        <div class="masonry-tags">
                            ${(project.category_tags || []).map(tag => `<span>${tag}</span>`).join('')}
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        CMSLoader.triggerReveal(container);
        
        // Re-initialize filtering logic if on work page
        if (typeof window.initProjectFilters === 'function') {
            window.initProjectFilters();
        }
    },

    // 3. Fetch Testimonials for Marquee
    loadDynamicTestimonials: async (containerId) => {
        const marquee = document.querySelector(`.${containerId}`);
        if (!marquee) return;

        console.log("Fetching testimonials...");
        const { data: reviews, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading reviews:", error);
            return;
        }

        if (!reviews || reviews.length === 0) return;

        // Structure for the marquee (dual set for infinite scroll)
        const renderSet = (items) => items.map(rev => `
            <div class="testimonial-card">
                <div class="testimonial-header">
                    <div class="author-avatar">
                        <img src="${rev.avatar_url}" alt="${rev.author_name}">
                    </div>
                    <div class="author-info">
                        <h4>${rev.author_name}</h4>
                        <span>${rev.author_role}</span>
                    </div>
                    <div class="social-icon"><i class="fa-brands fa-x-twitter"></i></div>
                </div>
                <p class="testimonial-text">"${rev.review_text}"</p>
            </div>
        `).join('');

        marquee.innerHTML = `
            <div class="testimonial-marquee-content">
                ${renderSet(reviews)}
            </div>
            <div class="testimonial-marquee-content" aria-hidden="true">
                ${renderSet(reviews)}
            </div>
        `;

        // Re-apply pause logic
        CMSLoader.initMarqueeInteractivity(marquee);
    },

    initMarqueeInteractivity: (marquee) => {
        marquee.addEventListener('click', () => {
            const contents = marquee.querySelectorAll('.testimonial-marquee-content');
            contents.forEach(content => {
                const currentPlayState = window.getComputedStyle(content).animationPlayState;
                content.style.animationPlayState = currentPlayState === 'paused' ? 'running' : 'paused';
            });
            marquee.classList.toggle('is-paused');
        });
    }
};

window.CMSLoader = CMSLoader;
