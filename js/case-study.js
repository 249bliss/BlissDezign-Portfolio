document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('case-study-container');
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');

    const projectData = {
        'neura': {
            title: 'NEURA Kicks',
            subtitle: 'AI-Powered E-Commerce App',
            heroImage: 'assets/Selected Project/nURAKICK.png',
            stats: {
                role: 'Product Designer',
                duration: '4 Weeks',
                tools: 'Figma, Midjourney',
                industry: 'E-commerce / AI'
            },
            problem: 'Sneaker enthusiasts often struggle with brand-specific sizing and endless scrolling, leading to decision paralysis and high return rates.',
            goal: 'Design a frictionless, fast, and highly personalized mobile shopping experience that leverages AI for discovery and perfect fitting.',
            features: [
                {
                    title: 'AI Discovery',
                    desc: 'A hyper-personalized feed that learns your style and recommends drops before you even search for them.'
                },
                {
                    title: 'Smart Sizing',
                    desc: 'AI-powered foot scanning and historical data analysis to ensure the perfect fit across every brand.'
                },
                {
                    title: 'Voice Search',
                    desc: 'The next big thing in commerce—allowing users to find specific models via natural conversation.'
                }
            ],
            imageBlocks: [
                'assets/Selected Project/nURAKICK.png',
                // Add more if available or use placeholders
            ]
        }
    };

    if (projectId && projectData[projectId]) {
        renderCaseStudy(projectData[projectId]);
    } else {
        renderComingSoon(projectId);
    }

    function renderCaseStudy(data) {
        container.innerHTML = `
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
                        <a href="work.html" class="btn btn-secondary">Explore More Work</a>
                    </div>
                </div>
            </section>
        `;
        
        // Re-trigger scroll reveal for dynamic content
        window.dispatchEvent(new Event('scroll'));
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
