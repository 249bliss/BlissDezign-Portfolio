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
        return url.match(/\.(mp4|webm|ogg|mov)$/i);
    },

    // Helper to render image or video
    renderMedia: (url, alt) => {
        if (CMSLoader.isMediaVideo(url)) {
            return `<video src="${url}" autoplay muted loop playsinline></video>`;
        }
        return `<img src="${url}" alt="${alt}" loading="lazy">`;
    },

    // 1. Fetch Projects for Homepage (Selected Projects)
    loadHomeProjects: async (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        console.log("Fetching home projects...");
        const { data: projects, error } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('is_featured', true)
            .order('display_order', { ascending: true })
            .limit(10);

        if (error) {
            console.error("Error loading home projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No projects found. Use the admin panel to add some!</p>';
            return;
        }

        container.innerHTML = projects.map((project, index) => {
            const isLarge = project.grid_layout === 'large';
            return `
                <a href="case-study.html?project=${project.id}" class="masonry-card ${isLarge ? 'masonry-large' : ''} reveal-on-scroll">
                    <div class="masonry-image">
                        ${CMSLoader.renderMedia(project.hero_image, project.title)}
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
            .order('display_order', { ascending: true });

        if (error) {
            console.error("Error loading all projects:", error);
            return;
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<p class="text-muted">No projects found.</p>';
            return;
        }

        container.innerHTML = projects.map((project, index) => {
            const isLarge = project.grid_layout === 'large';
            const filterClass = (project.category_tags || [])
                .map(t => t.toLowerCase().replace(/\s+/g, '-'))
                .join(' ');

            return `
                <a href="case-study.html?project=${project.id}" 
                   class="masonry-card ${isLarge ? 'masonry-large' : ''} filter-item ${filterClass} reveal-on-scroll" 
                   data-reveal>
                    <div class="masonry-image">
                        ${CMSLoader.renderMedia(project.hero_image, project.title)}
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
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading blog posts:", error);
            return;
        }

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="empty-blog-state reveal-on-scroll" style="grid-column: 1/-1; padding: 100px 20px; text-align: center; width: 100%;">
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 50px; border-radius: 30px; backdrop-filter: blur(10px); max-width: 500px; margin: 0 auto; box-shadow: 0 30px 60px rgba(0,0,0,0.2);">
                        <i class="fa-solid fa-pen-nib" style="font-size: 3rem; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 25px;"></i>
                        <h2 style="margin-bottom: 15px;">The lab is brewing.</h2>
                        <p class="text-muted" style="font-size: 1.1rem; line-height: 1.6;">I'm currently crafting my next set of design insights. Subscribe below to be the first to read them when they drop.</p>
                    </div>
                </div>
            `;
            CMSLoader.triggerReveal(container);
            return;
        }

        container.innerHTML = posts.map(post => `
            <a href="post.html?slug=${post.slug}" class="masonry-card reveal-on-scroll">
                <div class="masonry-image">
                    <img src="${post.cover_image}" alt="${post.title}" loading="lazy">
                </div>
                <div class="masonry-info">
                    <div class="post-date-tag">${new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
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
        document.title = `${post.title} | BlissDezign`;
        titleEl.innerText = post.title;
        dateEl.innerText = new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        coverEl.src = post.cover_image;
        coverEl.alt = post.title;

        // Simple Markdown-ish processing for content (replaces newlines with paragraphs)
        // In a real app, you might use a library like 'marked'
        const formattedContent = post.content
            .split('\n\n')
            .map(para => {
                if (para.startsWith('## ')) return `<h2>${para.replace('## ', '')}</h2>`;
                if (para.startsWith('### ')) return `<h3>${para.replace('### ', '')}</h3>`;
                if (para.startsWith('> ')) return `<blockquote>${para.replace('> ', '')}</blockquote>`;
                return `<p>${para.replace(/\n/g, '<br>')}</p>`;
            })
            .join('');

        bodyEl.innerHTML = formattedContent;

        // Update share links
        const tweetBtn = document.getElementById('share-twitter');
        const linkBtn = document.getElementById('share-linkedin');
        const currentUrl = encodeURIComponent(window.location.href);
        const currentTitle = encodeURIComponent(post.title);
        
        if (tweetBtn) tweetBtn.href = `https://twitter.com/intent/tweet?text=${currentTitle}&url=${currentUrl}`;
        if (linkBtn) linkBtn.href = `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}`;

        // Trigger animations
        const container = document.getElementById('post-content-area');
        if (container) CMSLoader.triggerReveal(container);
    }
};

window.CMSLoader = CMSLoader;
