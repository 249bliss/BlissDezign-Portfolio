document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('case-study-container');
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');

    const projectData = {
        'neura': {
            title: 'NEURA Kicks',
            subtitle: 'AI-Powered E-Commerce App',
            heroImage: 'assets/Selected Project/nURAKICK.webp',
            layoutType: 'full-image',
            fullImage: [
                'assets/Nurakick_slice_0.jpg',
                'assets/Nurakick_slice_1.jpg',
                'assets/Nurakick_slice_2.jpg',
                'assets/Nurakick_slice_3.jpg'
            ],
            stats: {
                role: 'Product Designer',
                duration: '4 Weeks',
                tools: 'Figma, Midjourney',
                industry: 'E-commerce / AI'
            }
        }
    };

    if (projectId && projectData[projectId]) {
        renderCaseStudy(projectData[projectId]);
    } else {
        renderComingSoon(projectId);
    }

    function renderCaseStudy(data) {
        let content = '';

        if (data.layoutType === 'full-image') {
            content = `
                <section class="cs-hero">
                    <div class="container text-center reveal-on-scroll">
                        <span class="badge">Case Study</span>
                        <h1>${data.title} <br> <span class="gradient-text-gray">${data.subtitle}</span></h1>
                    </div>
                </section>

                <section class="cs-stats">
                    <div class="container cs-stats-grid">
                        <div class="cs-stat-item">
                            <h4>Role</h4>
                            <p>${data.stats.role}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Duration</h4>
                            <p>${data.stats.duration}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Tools</h4>
                            <p>${data.stats.tools}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Industry</h4>
                            <p>${data.stats.industry}</p>
                        </div>
                    </div>
                </section>

                <section class="cs-full-image-container">
                    <div class="cs-full-image-inner reveal-on-scroll" style="display: flex; flex-direction: column;">
                        ${Array.isArray(data.fullImage) 
                            ? data.fullImage.map(img => `<img src="${img}" alt="${data.title} Full Case Study" style="width: 100%; display: block; border: none; margin: 0; padding: 0;">`).join('')
                            : `<img src="${data.fullImage}" alt="${data.title} Full Case Study" style="width: 100%; display: block;">`
                        }
                    </div>
                </section>

                <section class="vision-cta-section" style="padding: 100px 0;">
                    <div class="container text-center reveal-on-scroll">
                        <h2>Liked what you saw?</h2>
                        <p>Let's collaborate on your next big project.</p>
                        <div class="hero-actions" style="justify-content: center; margin-top: 40px;">
                            <a href="work.html" class="btn btn-primary">Back to Work</a>
                            <a href="contact.html" class="btn btn-secondary">Get in Touch</a>
                        </div>
                    </div>
                </section>
            `;
        } else {
            // Original structured layout
            content = `
                <section class="cs-hero">
                    <div class="container text-center reveal-on-scroll">
                        <span class="badge">Case Study</span>
                        <h1>${data.title} <br> <span class="gradient-text-gray">${data.subtitle}</span></h1>
                        <div class="cs-hero-image">
                            <img src="${data.heroImage}" alt="${data.title}">
                        </div>
                    </div>
                </section>

                <section class="cs-stats">
                    <div class="container cs-stats-grid">
                        <div class="cs-stat-item">
                            <h4>Role</h4>
                            <p>${data.stats.role}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Duration</h4>
                            <p>${data.stats.duration}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Tools</h4>
                            <p>${data.stats.tools}</p>
                        </div>
                        <div class="cs-stat-item">
                            <h4>Industry</h4>
                            <p>${data.stats.industry}</p>
                        </div>
                    </div>
                </section>

                <section class="cs-content-section">
                    <div class="container cs-content-grid">
                        <div class="cs-section-label">
                            <h2>The Challenge</h2>
                        </div>
                        <div class="cs-section-body">
                            <p>${data.problem}</p>
                            <div class="philosophy-box" style="margin-top: 50px;">
                                <h3 style="margin-bottom: 20px; color: var(--accent-purple);">The Goal</h3>
                                <p>${data.goal}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="cs-content-section" style="background: var(--bg-card);">
                    <div class="container cs-content-grid">
                        <div class="cs-section-label">
                            <h2>Core Features</h2>
                        </div>
                        <div class="cs-section-body">
                            <ul class="cs-feature-list">
                                ${data.features.map(f => `
                                    <li>
                                        <i class="fa-solid fa-circle-check"></i>
                                        <div class="cs-feature-text">
                                            <h4>${f.title}</h4>
                                            <p>${f.desc}</p>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </section>

                <section class="cs-image-gallery">
                    <div class="container text-center">
                        <h2 class="section-title">Design Showcase</h2>
                        <div class="cs-gallery-grid">
                            ${data.imageBlocks.map(img => `
                                <div class="cs-image-block">
                                    <img src="${img}" alt="App Screen">
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="vision-cta" style="margin-top: 100px;">
                            <a href="work.html" class="btn btn-secondary">Back to Work</a>
                        </div>
                    </div>
                </section>
            `;
        }

        container.innerHTML = content;
        
        // Observe newly injected dynamic content so they aren't stuck at opacity:0
        const dynamicRevealElements = container.querySelectorAll('.reveal-on-scroll');
        const observerOptions = {
            threshold: 0,
            rootMargin: '0px 0px -50px 0px'
        };
        const dynamicObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        dynamicRevealElements.forEach(el => dynamicObserver.observe(el));
    }

    function renderComingSoon(id) {
        const projectName = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Project';
        container.innerHTML = `
            <section class="cs-coming-soon container">
                <i class="fa-solid fa-compass-drafting"></i>
                <h1>${projectName} Story <br> <span class="gradient-text-gray">is under build.</span></h1>
                <p>I'm currently documenting the design process, research, and results for this project. Check back soon for the full deep dive.</p>
                <a href="work.html" class="btn btn-primary">Back to Work</a>
            </section>
        `;
    }
});
