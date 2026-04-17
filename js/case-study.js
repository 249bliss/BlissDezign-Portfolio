document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('case-study-container');
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');

    if (!projectId) {
        renderComingSoon('Project');
        return;
    }

    try {
        console.log(`Fetching project and case study for ID: ${projectId}`);
        
        // --- 1. Fetch Project & Case Study from Supabase ---
        const { data: project, error: pError } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (pError || !project) {
            console.error("Project fetch error:", pError);
            renderComingSoon("Project");
            return;
        }

        console.log("Project data found:", project);

        const { data: caseStudy, error: csError } = await supabaseClient
            .from('case_studies')
            .select('*')
            .eq('id', projectId)
            .single();

        if (csError) {
            console.warn("Case study metadata not found or error:", csError);
        }

        // --- 2. Logic Check ---
        const visualsArray = caseStudy && Array.isArray(caseStudy.full_image_chunks) ? caseStudy.full_image_chunks : [];
        const validVisuals = visualsArray.filter(v => typeof v === 'string' && v.trim() !== '');
        const hasVisuals = validVisuals.length > 0;

        console.log(`Case Study Status - is_case_study: ${project.is_case_study}, chunks found: ${validVisuals.length}`);

        // If it's NOT marked as a case study at all, or missing data, show the global "Coming Soon" screen
        if (!project.is_case_study || !caseStudy) {
            console.log("Rendering Coming Soon state: Project NOT marked as case study or no details saved.");
            renderComingSoon(project.title);
            return;
        }

        // Prepare data object for rendering - Safe defaults if caseStudy record is missing
        const data = {
            title: project.title,
            subtitle: project.subtitle,
            layoutType: 'full-image', 
            fullImage: validVisuals,
            hasVisuals: hasVisuals,
            stats: {
                role: (caseStudy && caseStudy.role) ? caseStudy.role : 'Product Designer',
                duration: (caseStudy && caseStudy.duration) ? caseStudy.duration : 'Varies',
                tools: (caseStudy && caseStudy.tools) ? caseStudy.tools : 'Figma',
                industry: (caseStudy && caseStudy.industry) ? caseStudy.industry : 'Digital Product'
            }
        };

        renderCaseStudy(data);

    } catch (err) {
        console.error("General error loading case study:", err);
        renderComingSoon("Project");
    }

    function renderCaseStudy(data) {
        let content = `
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
                    ${data.hasVisuals 
                        ? data.fullImage.map(img => `<img src="${img}" alt="${data.title} Full Case Study" style="width: 100%; display: block; border: none; margin: -1px 0; padding: 0;">`).join('')
                        : `
                        <div class="cs-content-placeholder" style="padding: 150px 20px; text-align: center; background: var(--bg-card); border-radius: 32px; border: 1px dashed rgba(223, 0, 255, 0.3); margin: 60px auto; max-width: 800px; box-shadow: 0 0 60px rgba(0,0,0,0.08);">
                            <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 3rem; color: var(--accent-purple); margin-bottom: 25px; opacity: 0.6; display: block;"></i>
                            <h2 style="color: var(--text-main); margin-bottom: 16px;">Visuals are in the lab.</h2>
                            <p style="color: var(--text-muted); font-size: 1rem; max-width: 500px; margin: 0 auto; line-height: 1.7;">I'm currently finalizing the high-resolution renders and design documentation for this project. Check back in a few hours!</p>
                        </div>
                        `
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
