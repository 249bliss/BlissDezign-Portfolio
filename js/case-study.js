document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('case-study-container');
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');

    if (!projectId) {
        renderComingSoon('Project');
        return;
    }

    try {
        // --- 1. Fetch Project & Case Study from Supabase ---
        const { data: project, error: pError } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (pError || !project) {
            console.error("Project not found:", pError);
            renderComingSoon("Project");
            return;
        }

        const { data: caseStudy, error: csError } = await supabaseClient
            .from('case_studies')
            .select('*')
            .eq('id', projectId)
            .single();

        // --- 2. Check for 'Under Build' State ---
        // Stricter visuals check: Must have at least one non-empty string URL
        const visualsArray = caseStudy && Array.isArray(caseStudy.full_image_chunks) ? caseStudy.full_image_chunks : [];
        const validVisuals = visualsArray.filter(v => typeof v === 'string' && v.trim() !== '');
        const hasVisuals = validVisuals.length > 0;

        if (!project.is_case_study || !hasVisuals) {
            renderComingSoon(project.title);
            return;
        }

        // Prepare data object for rendering
        const data = {
            title: project.title,
            subtitle: project.subtitle,
            layoutType: 'full-image', 
            fullImage: validVisuals,
            stats: {
                role: caseStudy.role || 'Product Designer',
                duration: caseStudy.duration || 'Varies',
                tools: caseStudy.tools || 'Figma',
                industry: caseStudy.industry || 'Digital Product'
            }
        };

        renderCaseStudy(data);

    } catch (err) {
        console.error("General error loading case study:", err);
        renderComingSoon("Project");
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
                        ${data.fullImage.map(img => `<img src="${img}" alt="${data.title} Full Case Study" style="width: 100%; display: block; border: none; margin: -1px 0; padding: 0;">`).join('')}
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
        }

        container.innerHTML = content;
        
        // --- Re-trigger reveal animations ---
        if (typeof window.revealOnScrollObserver !== 'undefined') {
            const dynamicRevealElements = container.querySelectorAll('.reveal-on-scroll');
            dynamicRevealElements.forEach(el => window.revealOnScrollObserver.observe(el));
        }
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
