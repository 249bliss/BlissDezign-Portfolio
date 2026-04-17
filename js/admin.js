document.addEventListener('DOMContentLoaded', async () => {
    console.log("Admin Dashboard JS initialized");

    // Check if Supabase Client is initialized
    if (typeof supabaseClient === 'undefined') {
        console.error("Supabase client not found! Check supabase-config.js");
        alert("CRITICAL ERROR: Supabase Client is not initialized. Check your config.");
        return;
    }

    // --- UI Elements ---
    const authScreen = document.getElementById('auth-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const authError = document.getElementById('auth-error');

    // --- SECURITY: Master Whitelist ---
    const WHITELISTED_ADMINS = ['blissstudio44@gmail.com'];
    const logoutBtn = document.getElementById('logout-btn');
    const userDisplay = document.getElementById('user-display');
    
    if (!loginForm) {
        console.error("Login form not found in the DOM!");
        return;
    }

    const showSignup = document.getElementById('show-signup');
    const showLogin = document.getElementById('show-login');
    
    const tabs = document.querySelectorAll('.nav-item');
    const mobileTabs = document.querySelectorAll('.m-nav-item');
    const chartCtx = document.getElementById('analytics-chart')?.getContext('2d');
    const categoryList = document.getElementById('category-sessions-list');
    const themeToggle = document.getElementById('admin-theme-toggle');
    const adminBody = document.body;
    let analyticsChart;
    const panels = document.querySelectorAll('.admin-panel');
    
    const projectsForm = document.getElementById('projects-form');
    const reviewsForm = document.getElementById('reviews-form');
    const hasCaseStudyCheckbox = document.getElementById('has-case-study');
    const isFeaturedCheckbox = document.getElementById('is-featured');
    const caseStudyFields = document.getElementById('case-study-fields');
    
    const projectsList = document.getElementById('projects-list');
    const reviewsList = document.getElementById('reviews-list');
    const postsList = document.getElementById('posts-list');
    
    const blogForm = document.getElementById('blog-form');
    const postIsPublished = document.getElementById('post-is-published');
    const postNotifySubs = document.getElementById('post-notify-subs');

    // --- Tag Manager State ---
    let activeTags = [];
    let activeCaseStudyGallery = []; // [{ type: 'url'|'file', content: string|File }]
    
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    function setLoading(isLoading, text = 'Processing...') {
        if (!loadingOverlay) return;
        if (isLoading) {
            loadingText.innerText = text;
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }

    // --- Custom UI Constants ---
    const adminModal = document.getElementById('admin-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm');
    const modalCancelBtn = document.getElementById('modal-cancel');
    const modalOptions = document.getElementById('modal-options');
    const toastContainer = document.getElementById('toast-container');

    // --- 1. Authentication Logic ---
    
    // Check session on load
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const name = session.user.user_metadata?.full_name || session.user.email;
        showDashboard(name);
    }

    // --- 1.5 UI Enhancements Logic ---
    
    // Toggle Password Visibility
    document.querySelectorAll('.toggle-password').forEach(eye => {
        eye.onclick = () => {
            const targetId = eye.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (input.type === 'password') {
                input.type = 'text';
                eye.classList.remove('fa-eye-slash');
                eye.classList.add('fa-eye');
            } else {
                input.type = 'password';
                eye.classList.remove('fa-eye');
                eye.classList.add('fa-eye-slash');
            }
        };
    });

    // Password Strength Meter
    const signupPassword = document.getElementById('signup-password');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');

    if (signupPassword) {
        signupPassword.oninput = () => {
            const val = signupPassword.value;
            let strength = 0;
            let status = 'Weak';
            
            if (val.length >= 6) strength++;
            if (val.match(/[A-Z]/)) strength++;
            if (val.match(/[0-9]/)) strength++;
            if (val.match(/[^A-Za-z0-9]/)) strength++;

            strengthBar.classList.remove('weak', 'medium', 'strong');
            
            if (val.length === 0) {
                strengthBar.style.width = '0%';
                strengthText.innerText = '';
            } else if (strength <= 2) {
                strengthBar.classList.add('weak');
                strengthText.innerText = 'Weak: Add numbers or symbols';
                strengthText.style.color = '#ef4444';
            } else if (strength === 3) {
                strengthBar.classList.add('medium');
                strengthText.innerText = 'Medium: Good password';
                strengthText.style.color = '#f59e0b';
            } else {
                strengthBar.classList.add('strong');
                strengthText.innerText = 'Strong: Secure credentials';
                strengthText.style.color = '#10b981';
            }
        };
    }

    // Toggle between login and signup
    if (showSignup && signupForm) {
        showSignup.onclick = () => {
            loginForm.classList.remove('active');
            signupForm.classList.add('active');
            document.getElementById('auth-title').innerText = 'Create Admin Account';
            document.getElementById('auth-subtitle').innerText = 'Set up your master credentials';
            authError.style.display = 'none';
        };
    }

    if (showLogin && signupForm) {
        showLogin.onclick = () => {
            signupForm.classList.remove('active');
            loginForm.classList.add('active');
            document.getElementById('auth-title').innerText = 'Welcome Back';
            document.getElementById('auth-subtitle').innerText = 'Login to manage your portfolio';
            authError.style.display = 'none';
        };
    }

    // Handle Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login form submitted");
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        authError.style.display = 'none';
        
        // --- Security Check ---
        if (!WHITELISTED_ADMINS.includes(email.toLowerCase().trim())) {
            authError.innerText = "Access Denied: You are not authorized to access this dashboard.";
            authError.style.display = 'block';
            return;
        }

        setLoading(true, 'Authenticating...');
        
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            console.log("Auth Response:", { data, error });

            setLoading(false);
            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    authError.innerText = "Error: Email not confirmed. Please check your inbox or disable 'Confirm Email' in your Supabase Auth settings.";
                } else {
                    authError.innerText = error.message;
                }
                authError.style.display = 'block';
            } else {
                const name = data.user.user_metadata?.full_name || data.user.email;
                showDashboard(name);
            }
        } catch (err) {
            console.error("Login unexpected error:", err);
            setLoading(false);
            authError.innerText = "Unexpected error: " + err.message;
            authError.style.display = 'block';
        }
    });

    // Signup is disabled for security
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            authError.innerText = "Manual registration is disabled for security. Contact the site owner for access.";
            authError.style.display = 'block';
        });
    }

    // Handle Logout with Confirmation
    const handleLogout = () => {
        showConfirm('Are you sure you want to log out?', async () => {
            await supabaseClient.auth.signOut();
            location.reload();
        });
    };

    logoutBtn.addEventListener('click', handleLogout);

    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleLogout);
    }

    function showDashboard(name) {
        authScreen.style.display = 'none';
        dashboardScreen.style.display = 'block';
        userDisplay.innerText = name;
        
        // Show current date in topbar
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        document.getElementById('current-date-range').innerText = `Dec 1 - ${new Date().toLocaleDateString('en-US', options)}`;

        fetchProjects();
        fetchReviews();
        fetchInsights();
    }

    // --- 1.6 Insights & Analytics Logic ---

    async function fetchInsights(days = 0) {
        setLoading(true, 'Updating analytics...');
        try {
            // Clear existing stats briefly to show update
            document.getElementById('stat-traffic').innerText = '...';
            document.getElementById('stat-messages').innerText = '...';
            document.getElementById('stat-subscribers').innerText = '...';

            let trafficQuery = supabaseClient.from('analytics').select('created_at').eq('event_type', 'view');
            let msgQuery = supabaseClient.from('messages').select('created_at');
            let subQuery = supabaseClient.from('subscribers').select('created_at');

            let labelText = "Total Reach";
            let leadsText = "Total Leads";
            let communityText = "Community";

            if (days > 0) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - days);
                const isoDate = dateLimit.toISOString();
                
                trafficQuery = trafficQuery.gte('created_at', isoDate);
                msgQuery = msgQuery.gte('created_at', isoDate);
                subQuery = subQuery.gte('created_at', isoDate);
                
                let rangeLabel = `Last ${days} Days`;
                if (days === 1) {
                    rangeLabel = "Today's Performance";
                    labelText = "Daily Reach";
                    leadsText = "New Leads";
                    communityText = "Daily Growth";
                }
                else if (days === 90) rangeLabel = "Quarterly Review (3M)";
                else if (days === 180) rangeLabel = "Semiannual Review (6M)";
                
                document.getElementById('current-date-range').innerText = rangeLabel;
            } else {
                document.getElementById('current-date-range').innerText = "All Time Performance";
            }

            // Update Labels
            document.getElementById('label-traffic').innerText = labelText;
            document.getElementById('label-messages').innerText = leadsText;
            document.getElementById('label-subscribers').innerText = communityText;

            const [{ data: traffic }, { data: messages }, { data: subs }] = await Promise.all([
                trafficQuery,
                msgQuery,
                subQuery
            ]);

            const trafficCount = traffic?.length || 0;
            const msgCount = messages?.length || 0;
            const subCount = subs?.length || 0;
            const leadCount = msgCount + subCount;

            document.getElementById('stat-traffic').innerText = trafficCount.toLocaleString();
            document.getElementById('stat-messages').innerText = msgCount.toLocaleString();
            document.getElementById('stat-subscribers').innerText = subCount.toLocaleString();

            const conv = trafficCount > 0 ? ((leadCount / trafficCount) * 100).toFixed(1) : "0.0";
            document.getElementById('stat-conversion').innerText = conv + '%';

            const chartData = processChartData(traffic || [], (messages || []).concat(subs || []), days);
            initChart(chartData.labels, chartData.views, chartData.leads);
            
            renderCategoryStats();
            await fetchLeads();
        } catch (err) {
            console.error('Error fetching insights:', err);
        } finally {
            setLoading(false);
        }
    }

    function processChartData(traffic, leads, days) {
        const now = new Date();
        let labels = [];
        let viewData = [];
        let leadData = [];

        if (days === 1) {
            // Hourly view for "Today"
            labels = ['12AM', '4AM', '8AM', '12PM', '4PM', '8PM', 'Now'];
            viewData = new Array(7).fill(0);
            leadData = new Array(7).fill(0);

            traffic.forEach(t => {
                const hour = new Date(t.created_at).getHours();
                const idx = Math.min(6, Math.floor(hour / 4));
                viewData[idx]++;
            });
            leads.forEach(l => {
                const hour = new Date(l.created_at).getHours();
                const idx = Math.min(6, Math.floor(hour / 4));
                leadData[idx]++;
            });
        } else if (days > 0 && days <= 30) {
            // Daily view
            for (let i = days; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                labels.push(dStr);
                
                const dayMatch = d.toDateString();
                viewData.push(traffic.filter(t => new Date(t.created_at).toDateString() === dayMatch).length);
                leadData.push(leads.filter(l => new Date(l.created_at).toDateString() === dayMatch).length);
            }
        } else {
            // Monthly view (for 3M, 6M, or All Time)
            const monthsToShow = days === 90 ? 3 : 6;
            for (let i = monthsToShow - 1; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const mLabel = d.toLocaleString('default', { month: 'short' });
                labels.push(mLabel);
                
                const m = d.getMonth();
                const y = d.getFullYear();
                
                viewData.push(traffic.filter(t => {
                    const dt = new Date(t.created_at);
                    return dt.getMonth() === m && dt.getFullYear() === y;
                }).length);
                
                leadData.push(leads.filter(l => {
                    const dt = new Date(l.created_at);
                    return dt.getMonth() === m && dt.getFullYear() === y;
                }).length);
            }
        }

        return { labels, views: viewData, leads: leadData };
    }

    function initChart(labels, views, leads) {
        if (!chartCtx) return;
        if (analyticsChart) analyticsChart.destroy();

        analyticsChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Views',
                        data: views || [12, 19, 3, 5, 2, 3, 5],
                        borderColor: '#DF00FF',
                        backgroundColor: 'rgba(223, 0, 255, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        label: 'Leads',
                        data: leads || [2, 3, 1, 2, 0, 1, 2],
                        borderColor: '#fff',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                }
            }
        });
    }

    function renderCategoryStats() {
        if (!categoryList) return;
        const categories = [
            { name: 'Mobile Apps', value: 85 },
            { name: 'Web Design', value: 70 },
            { name: 'Product Design', value: 45 },
            { name: 'UI/UX Strategy', value: 38 }
        ];

        categoryList.innerHTML = categories.map(cat => `
            <div class="session-item">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 5px;">
                    <span>${cat.name}</span>
                    <span>${cat.value}%</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${cat.value}%"></div>
                </div>
            </div>
        `).join('');
    }

    window.fetchLeads = async () => {
        const msgFeed = document.getElementById('messages-activity-feed');
        const subFeed = document.getElementById('subscribers-activity-feed');
        
        // Fetch Messages
        const { data: messages, error: mErr } = await supabaseClient
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (mErr) console.error(mErr);
        else {
            msgFeed.innerHTML = messages?.length ? messages.map(msg => `
                <div class="activity-item vertical">
                    <div class="activity-header row">
                        <strong class="activity-name">${msg.name}</strong>
                        <span class="activity-time">${new Date(msg.created_at).toLocaleDateString()} at ${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div class="activity-body">
                        <p class="activity-email">${msg.email}</p>
                        <div class="activity-message-bubble">${msg.message}</div>
                    </div>
                </div>
            `).join('') : '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No messages yet.</p>';
        }

        // Fetch Subscribers
        const { data: subs, error: sErr } = await supabaseClient
            .from('subscribers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (sErr) console.error(sErr);
        else {
            subFeed.innerHTML = subs?.length ? subs.map(sub => `
                <div class="activity-item vertical">
                    <div class="activity-header row">
                        <strong class="activity-name">New Subscriber</strong>
                        <span class="activity-time">${new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="activity-body">
                        <p class="activity-email">${sub.email}</p>
                    </div>
                </div>
            `).join('') : '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No subscribers yet.</p>';
        }
    };

    function setLoading(show, text = 'Processing...') {
        loadingText.innerText = text;
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // --- 2. Navigation & Themes ---
    
    window.switchPanel = function(target) {
        // Sync Sidebar
        tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === target));
        // Sync Mobile Nav
        mobileTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-target') === target));

        // Toggle Panels
        document.querySelectorAll('.admin-panel').forEach(p => {
            p.classList.toggle('active', p.id === target);
        });

        // Trigger fetches & Form Resets
        if (target === 'insights-panel') fetchInsights();
        if (target === 'manage-projects-panel') fetchProjects();
        if (target === 'manage-reviews-panel') fetchReviews();
        if (target === 'manage-blog-panel') fetchBlogPosts();
        
        // Reset forms when coming from a 'New' button to clear any previous edit state
        if (target === 'add-project-panel' && !document.getElementById('edit-proj-original-id').value) {
            projectsForm.reset();
            document.getElementById('project-form-title').innerText = 'Add New Project';
        }
        if (target === 'add-post-panel' && !document.getElementById('edit-post-id').value) {
            blogForm.reset();
            document.getElementById('post-form-title').innerText = 'Add New Article';
            document.getElementById('submit-post-btn').innerText = 'Publish Post';
            document.getElementById('cancel-post-btn').style.display = 'none';
            document.getElementById('post-current-url').style.display = 'none';
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => window.switchPanel(tab.getAttribute('data-target')));
    });

    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => window.switchPanel(tab.getAttribute('data-target')));
    });

    // Theme Switcher Logic
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const isDark = themeToggle.checked;
            adminBody.setAttribute('data-theme', isDark ? 'dark' : 'light');
            localStorage.setItem('admin-theme', isDark ? 'dark' : 'light');
            if (analyticsChart) initChart(); // Redraw chart for theme
        });

        // Date frame selector interactivity with custom modal
        const dateRangeTrigger = document.getElementById('current-date-range');
        if (dateRangeTrigger) {
            dateRangeTrigger.addEventListener('click', () => {
                showDateFramePicker((range) => {
                    fetchInsights(parseInt(range));
                });
            });
        }

        // Search bar aesthetic feedback
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') showToast(`Searching for: ${searchInput.value}...`, 'success');
            });
        }
    }

    hasCaseStudyCheckbox.addEventListener('change', (e) => {
        caseStudyFields.style.display = e.target.checked ? 'block' : 'none';
    });

    // --- 3. CRUD: Projects ---

    async function fetchProjects() {
        const grid = document.getElementById('projects-grid');
        const { data, error } = await supabaseClient.from('projects').select('*').order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching projects:', error);
            return;
        }

        grid.innerHTML = data.map(project => `
            <div class="project-manage-card">
                <div class="pm-image-wrapper">
                    <img src="${project.hero_image}" class="pm-image" alt="${project.title}">
                    <div class="pm-badge">${project.is_case_study ? 'CASE STUDY' : 'CMS ONLY'}</div>
                    ${project.is_featured ? '<div class="pm-featured-badge">FEATURED</div>' : ''}
                </div>
                <div class="pm-info">
                    <div class="pm-title">${project.title}</div>
                    <div class="pm-category">${(project.category_tags || []).join(', ')}</div>
                </div>
                <div class="pm-actions">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editProject('${project.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteProject('${project.id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('') || '<p style="color: var(--text-muted); text-align: center; padding: 40px; width: 100%;">No projects found. Tap "New Project" to start building.</p>';
    }

    const deleteProject = async (id) => {
        showConfirm(`Are you sure you want to delete project '${id}'? This cannot be undone.`, async () => {
            try {
                setLoading(true, 'Deleting project...');
                // 1. Delete associated case study first (if any)
                await supabaseClient.from('case_studies').delete().eq('id', id);
                
                // 2. Delete main project
                const { error } = await supabaseClient.from('projects').delete().eq('id', id);
                if (error) throw error;
                
                showToast('Project deleted successfully', 'success');
                fetchProjects();
            } catch (err) {
                console.error('Delete error:', err);
                showAlert('Error deleting project: ' + err.message);
            } finally {
                setLoading(false);
            }
        });
    };
    window.deleteProject = deleteProject;

    window.editProject = async (id) => {
        setLoading(true, 'Loading project data...');
        try {
            // Load Project
            const { data: project, error: pError } = await supabaseClient.from('projects').select('*').eq('id', id).single();
            if (pError) throw pError;
            
            // Load Case Study (if exists)
            let caseStudy = null;
            if (project.is_case_study) {
                const { data: cs, error: csError } = await supabaseClient.from('case_studies').select('*').eq('id', id).single();
                if (!csError) caseStudy = cs;
            }

            // Populate Form
            document.getElementById('edit-proj-original-id').value = project.id;
            document.getElementById('proj-id').value = project.id;
            document.getElementById('proj-title').value = project.title;
            document.getElementById('proj-subtitle').value = project.subtitle;
            document.getElementById('proj-order').value = project.display_order || 0;
            document.getElementById('proj-layout').value = project.grid_layout || 'standard';
            
            // Handle Tags
            activeTags = project.category_tags || [];
            renderTags();
            
            const heroUrlDisplay = document.getElementById('hero-current-url');
            const heroBox = document.getElementById('hero-preview-box');
            const heroImg = document.getElementById('hero-preview-img');
            const heroVid = document.getElementById('hero-preview-vid');
            
            const isVideo = project.hero_image.match(/\.(mp4|webm|ogg|mov)$/i);
            
            const heroSaved = document.getElementById('hero-saved-status');
            
            if (project.hero_image) {
                heroBox.style.display = 'block';
                const isVid = project.hero_image.match(/\.(mp4|webm|ogg|mov)$/i);
                
                const thumb = heroBox.querySelector('.selection-thumb');
                if (thumb) {
                    thumb.classList.remove('is-new');
                    thumb.classList.add('is-persisted');
                }

                if (isVid) {
                    heroImg.style.display = 'none';
                    heroVid.src = project.hero_image;
                    heroVid.style.display = 'block';
                } else {
                    heroVid.style.display = 'none';
                    heroImg.src = project.hero_image;
                    heroImg.style.display = 'block';
                }
                if (heroSaved) heroSaved.style.display = 'flex';
            }

            // Case Study Status & Gallery State
            if (project.is_case_study && caseStudy) {
                const chunks = caseStudy.full_image_chunks || [];
                activeCaseStudyGallery = chunks.map(url => ({ 
                    type: 'url', 
                    content: url,
                    isSaved: true // Add flag to indicate it's already in DB
                }));
                renderCaseStudyGallery();
                
                if (chunks.length > 0) {
                    const status = document.getElementById('cs-current-status');
                    status.innerHTML = `<i class="fa-solid fa-cloud-check"></i> Found ${chunks.length} Saved Case Study Assets`;
                    status.style.display = 'inline-flex';
                }
            } else {
                activeCaseStudyGallery = [];
                renderCaseStudyGallery();
            }

            hasCaseStudyCheckbox.checked = !!project.is_case_study;
            isFeaturedCheckbox.checked = !!project.is_featured;
            caseStudyFields.style.display = project.is_case_study ? 'block' : 'none';

            if (caseStudy) {
                document.getElementById('cs-role').value = caseStudy.role || '';
                document.getElementById('cs-duration').value = caseStudy.duration || '';
                document.getElementById('cs-tools').value = caseStudy.tools || '';
                document.getElementById('cs-industry').value = caseStudy.industry || '';
            }

            // UI Changes
            document.getElementById('project-form-title').innerText = 'Edit Project: ' + project.title;
            document.getElementById('submit-proj-btn').innerText = 'Update Project';
            document.getElementById('cancel-proj-btn').style.display = 'block';
            
            // Switch to Add/Edit tab
            document.querySelector('[data-target="add-project-panel"]').click();

        } catch (err) {
            showAlert('Error loading project: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    document.getElementById('cancel-proj-btn').onclick = resetProjectForm;

    function resetProjectForm() {
        projectsForm.reset();
        activeTags = [];
        renderTags();
        document.getElementById('edit-proj-original-id').value = '';
        document.getElementById('project-form-title').innerText = 'Add New Project';
        const submitBtn = document.getElementById('submit-proj-btn');
        submitBtn.innerText = 'Publish Project';
        submitBtn.disabled = false;
        document.getElementById('cancel-proj-btn').style.display = 'none';
        
        // Reset Custom Previews
        const heroBox = document.getElementById('hero-preview-box');
        if (heroBox) heroBox.style.display = 'none';
        
        const csBox = document.getElementById('cs-preview-box');
        if (csBox) csBox.style.display = 'none';
        
        const csStatus = document.getElementById('cs-current-status');
        if (csStatus) csStatus.style.display = 'none';
        
        document.getElementById('proj-order').value = 0;
        document.getElementById('proj-layout').value = 'standard';
        caseStudyFields.style.display = 'none';
        hasCaseStudyCheckbox.checked = false;
        isFeaturedCheckbox.checked = false;
        document.getElementById('chopper-preview').innerHTML = '';
        activeCaseStudyGallery = [];
        renderCaseStudyGallery();
        document.querySelector('[data-target="manage-projects-panel"]').click();
    }

    projectsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalId = document.getElementById('edit-proj-original-id').value;
        const isEdit = !!originalId;
        
        const submitBtn = document.getElementById('submit-proj-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = isEdit ? 'Updating...' : 'Publishing...';

        setLoading(true, isEdit ? 'Updating project...' : 'Creating project...');
        
        try {
            const id = document.getElementById('proj-id').value.trim().toLowerCase();
            const title = document.getElementById('proj-title').value.trim();
            const subtitle = document.getElementById('proj-subtitle').value.trim();
            const tags = document.getElementById('proj-tags').value.split(',').map(tag => tag.trim()).filter(t => t);
            const isCaseStudy = hasCaseStudyCheckbox.checked;
            const isFeatured = isFeaturedCheckbox.checked;
            const displayOrder = parseInt(document.getElementById('proj-order').value) || 0;
            const gridLayout = document.getElementById('proj-layout').value;

            // --- Snapshot current data for preservation ---
            let existingProject = null;
            let existingCaseStudy = null;
            if (isEdit) {
                const { data: p } = await supabaseClient.from('projects').select('*').eq('id', originalId).single();
                existingProject = p;
                const { data: cs } = await supabaseClient.from('case_studies').select('*').eq('id', originalId).single();
                existingCaseStudy = cs;
            }

            let heroUrl = null;
            const heroFile = document.getElementById('proj-hero').files[0];
            if (heroFile) {
                heroUrl = await uploadImage(heroFile, 'projects');
            } else if (isEdit && existingProject) {
                heroUrl = existingProject.hero_image;
            } else {
                throw new Error('Hero image is required for new projects.');
            }

            const projectData = {
                id,
                title,
                subtitle,
                hero_image: heroUrl,
                is_case_study: isCaseStudy,
                is_featured: isFeatured,
                category_tags: tags,
                display_order: displayOrder,
                grid_layout: gridLayout
            };

            if (isEdit) {
                // If ID changed, we might need a more complex update (or prevent ID changes)
                // For now, let's allow it but warn developers this might break links if not careful
                const { error } = await supabaseClient.from('projects').update(projectData).eq('id', originalId);
                if (error) throw error;
            } else {
                const { error } = await supabaseClient.from('projects').insert([projectData]);
                if (error) throw error;
            }

            // Handle Case Study
            if (isCaseStudy) {
                console.log("Processing Case Study data...");
                const role = document.getElementById('cs-role').value;
                const duration = document.getElementById('cs-duration').value;
                const tools = document.getElementById('cs-tools').value;
                const industry = document.getElementById('cs-industry').value;
                
                let finalChunks = [];
                const hugeItem = activeCaseStudyGallery.find(i => i.type === 'huge-file');

                if (hugeItem) {
                    // Scenario A: Single giant image (Auto-Chopper used)
                    console.log("Using Auto-Chopper for huge image...");
                    finalChunks = await chopAndUploadImage(hugeItem.content);
                } else if (activeCaseStudyGallery.length > 0) {
                    // Scenario B: Gallery Manager (Multi-files, dragging, deleting)
                    console.log(`Processing gallery: ${activeCaseStudyGallery.length} items to upload...`);
                    setLoading(true, `Processing gallery (${activeCaseStudyGallery.length} items)...`);
                    for (let item of activeCaseStudyGallery) {
                        if (item.type === 'file') {
                            const url = await uploadImage(item.content, 'case_studies');
                            finalChunks.push(url);
                        } else {
                            finalChunks.push(item.content);
                        }
                    }
                } else if (isEdit && existingCaseStudy) {
                    // Fallback: Preserve existing if nothing new added/changed
                    console.log("No new visuals added, preserving existing case study chunks.");
                    finalChunks = existingCaseStudy.full_image_chunks || [];
                }

                if (finalChunks.length === 0) {
                    console.warn("WARNING: Project marked as Case Study but NO visuals/chunks were found or uploaded.");
                }

                const csData = { id, role, duration, tools, industry, full_image_chunks: finalChunks };
                console.log("Saving Case Study record:", csData);
                
                const { error: csSaveErr } = await supabaseClient.from('case_studies').upsert([csData]);
                if (csSaveErr) throw csSaveErr;

                // If ID changed, cleanup old case study record
                if (isEdit && id !== originalId) {
                    console.log(`ID changed from ${originalId} to ${id}. Deleting old case study record.`);
                    await supabaseClient.from('case_studies').delete().eq('id', originalId);
                }
            } else if (isEdit) {
                // If it was a case study and now it's not, delete the record
                console.log("Project was a case study but is no longer. Deleting record.");
                await supabaseClient.from('case_studies').delete().eq('id', originalId);
            }

            showToast(isEdit ? 'Project updated successfully!' : 'Project created successfully!');
            resetProjectForm();
            fetchProjects();

        } catch (err) {
            showAlert('Error saving project: ' + err.message);
            const submitBtn = document.getElementById('submit-proj-btn');
            submitBtn.disabled = false;
            submitBtn.innerText = !!document.getElementById('edit-proj-original-id').value ? 'Update Project' : 'Publish Project';
        } finally {
            setLoading(false);
        }
    });

    // --- 4. CRUD: Reviews ---

    async function fetchReviews() {
        const { data, error } = await supabaseClient.from('reviews').select('*').order('created_at', { ascending: false });
        if (error) return console.error(error);

        reviewsList.innerHTML = data.length ? data.map(rev => `
            <div class="review-manage-card">
                <div class="rmc-header">
                    <div class="rmc-avatar-wrapper">
                        <img src="${rev.avatar_url}" alt="${rev.author_name}" class="rmc-avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="rmc-avatar-fallback" style="display:none;">${rev.author_name.charAt(0).toUpperCase()}</div>
                    </div>
                    <div class="rmc-author-info">
                        <div class="rmc-name">${rev.author_name}</div>
                        <div class="rmc-role">${rev.author_role}</div>
                    </div>
                    <div class="rmc-quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                </div>
                <p class="rmc-text">${rev.review_text.length > 120 ? rev.review_text.substring(0, 120) + '...' : rev.review_text}</p>
                <div class="rmc-actions">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editReview('${rev.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteReview('${rev.id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('') : '<p style="color: var(--text-muted); text-align: center; padding: 60px; grid-column: 1/-1; font-size: 1rem;">No testimonials yet. Add your first one!</p>';

        // Update counts in UI
        const reviewCounts = document.querySelectorAll('.review-count-badge');
        reviewCounts.forEach(badge => {
            badge.innerText = data.length;
            badge.style.display = data.length > 0 ? 'inline-block' : 'none';
        });
    }

    window.deleteReview = async (id) => {
        showConfirm('Delete this review?', async () => {
            setLoading(true, 'Deleting review...');
            const { error } = await supabaseClient.from('reviews').delete().eq('id', id);
            setLoading(false);
            if (error) showAlert(error.message);
            else {
                showToast('Review deleted', 'success');
                fetchReviews();
            }
        });
    };

    window.editReview = async (id) => {
        setLoading(true, 'Loading review...');
        const { data: rev, error } = await supabaseClient.from('reviews').select('*').eq('id', id).single();
        setLoading(false);
        if (error) return showAlert(error.message);

        document.getElementById('edit-rev-id').value = rev.id;
        document.getElementById('rev-name').value = rev.author_name;
        document.getElementById('rev-role').value = rev.author_role;
        document.getElementById('rev-text').value = rev.review_text;
        
        const avatarBox = document.getElementById('avatar-preview-box');
        const avatarImg = document.getElementById('avatar-preview-img');
        const avatarSaved = document.getElementById('avatar-saved-status');

        if (rev.avatar_url) {
            avatarBox.style.display = 'block';
            avatarImg.src = rev.avatar_url;
            if (avatarSaved) avatarSaved.style.display = 'flex';
            
            const thumb = avatarBox.querySelector('.selection-thumb');
            if (thumb) {
                thumb.classList.remove('is-new');
                thumb.classList.add('is-persisted');
            }
        }

        document.getElementById('review-form-title').innerText = 'Edit Testimonial';
        document.getElementById('submit-rev-btn').innerText = 'Update Testimonial';
        document.getElementById('cancel-rev-btn').style.display = 'block';
        
        window.switchPanel('add-review-panel');
    };

    document.getElementById('cancel-rev-btn').onclick = resetReviewForm;

    function resetReviewForm() {
        reviewsForm.reset();
        document.getElementById('edit-rev-id').value = '';
        document.getElementById('review-form-title').innerText = 'Add New Testimonial';
        document.getElementById('submit-rev-btn').innerText = 'Publish Testimonial';
        document.getElementById('cancel-rev-btn').style.display = 'none';
        
        const avatarBox = document.getElementById('avatar-preview-box');
        if (avatarBox) avatarBox.style.display = 'none';
        
        window.switchPanel('manage-reviews-panel');
    }

    reviewsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-rev-id').value;
        const isEdit = !!editId;

        const submitBtn = document.getElementById('submit-rev-btn');
        submitBtn.disabled = true;
        submitBtn.innerText = isEdit ? 'Updating...' : 'Saving...';

        setLoading(true, isEdit ? 'Updating review...' : 'Saving review...');
        try {
            const author_name = document.getElementById('rev-name').value;
            const author_role = document.getElementById('rev-role').value;
            const review_text = document.getElementById('rev-text').value;
            
            let avatar_url = null;
            const avatarFile = document.getElementById('rev-avatar').files[0];
            if (avatarFile) {
                avatar_url = await uploadImage(avatarFile, 'reviews');
            } else if (isEdit) {
                const { data } = await supabaseClient.from('reviews').select('avatar_url').eq('id', editId).single();
                avatar_url = data.avatar_url;
            } else {
                // Default fallback avatar if none provided for new review
                avatar_url = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(author_name) + '&background=DF00FF&color=fff&size=256';
            }

            const reviewData = { author_name, author_role, review_text, avatar_url };

            if (isEdit) {
                await supabaseClient.from('reviews').update(reviewData).eq('id', editId);
            } else {
                await supabaseClient.from('reviews').insert([reviewData]);
            }

            showToast('Review saved!', 'success');
            resetReviewForm();
            fetchReviews();
        } catch (err) {
            showAlert(err.message);
            const submitBtn = document.getElementById('submit-rev-btn');
            submitBtn.disabled = false;
            submitBtn.innerText = !!document.getElementById('edit-rev-id').value ? 'Update Review' : 'Publish Testimonial';
        } finally {
            setLoading(false);
        }
    });

    // --- 5. CRUD: Blog ---

    async function fetchBlogPosts() {
        const { data, error } = await supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
        if (error) return console.error(error);

        postsList.innerHTML = data.length ? data.map(post => `
            <div class="review-manage-card">
                <div class="rmc-header">
                    <div class="rmc-avatar-wrapper">
                        <img src="${post.cover_image}" class="rmc-avatar" style="border-radius: 12px; height: 60px; width: 60px;">
                    </div>
                    <div class="rmc-author-info">
                        <div class="rmc-name">${post.title}</div>
                        <div class="rmc-role">${post.is_published ? '<span style="color: #10b981;">Published</span>' : '<span style="color: var(--text-muted);">Draft</span>'}</div>
                    </div>
                </div>
                <p class="rmc-text">${post.excerpt}</p>
                <div class="rmc-actions">
                    <button class="btn-icon btn-edit" title="Edit" onclick="editBlogPost('${post.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn-icon btn-delete" title="Delete" onclick="deleteBlogPost('${post.id}')">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('') : '<p style="color: var(--text-muted); text-align: center; padding: 60px; grid-column: 1/-1;">No blog posts yet. Start writing!</p>';
    }

    window.deleteBlogPost = async (id) => {
        showConfirm('Delete this blog post?', async () => {
            setLoading(true, 'Deleting post...');
            const { error } = await supabaseClient.from('posts').delete().eq('id', id);
            setLoading(false);
            if (error) showAlert(error.message);
            else {
                showToast('Post deleted', 'success');
                fetchBlogPosts();
            }
        });
    };

    window.editBlogPost = async (id) => {
        setLoading(true, 'Loading post...');
        const { data: post, error } = await supabaseClient.from('posts').select('*').eq('id', id).single();
        setLoading(false);
        if (error) return showAlert(error.message);

        document.getElementById('edit-post-id').value = post.id;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-slug').value = post.slug;
        document.getElementById('post-excerpt').value = post.excerpt;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-is-published').checked = post.is_published;
        document.getElementById('post-notify-subs').checked = false;

        const postBox = document.getElementById('post-preview-box');
        const postImg = document.getElementById('post-preview-img');
        const postSaved = document.getElementById('post-saved-status');

        if (post.cover_image) {
            postBox.style.display = 'block';
            postImg.src = post.cover_image;
            if (postSaved) postSaved.style.display = 'flex';
            
            const thumb = postBox.querySelector('.selection-thumb');
            if (thumb) {
                thumb.classList.remove('is-new');
                thumb.classList.add('is-persisted');
            }
        }

        document.getElementById('post-form-title').innerText = 'Edit Article';
        document.getElementById('submit-post-btn').innerText = 'Update Article';
        document.getElementById('cancel-post-btn').style.display = 'block';
        
        window.switchPanel('add-post-panel');
    };

    document.getElementById('cancel-post-btn').onclick = resetPostForm;

    function resetPostForm() {
        blogForm.reset();
        document.getElementById('edit-post-id').value = '';
        document.getElementById('post-form-title').innerText = 'Add New Article';
        document.getElementById('submit-post-btn').innerText = 'Publish Post';
        document.getElementById('cancel-post-btn').style.display = 'none';
        
        const postBox = document.getElementById('post-preview-box');
        if (postBox) postBox.style.display = 'none';
        
        window.switchPanel('manage-blog-panel');
    }

    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-post-id').value;
        const isEdit = !!editId;

        const title = document.getElementById('post-title').value;
        const slug = document.getElementById('post-slug').value || title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
        const excerpt = document.getElementById('post-excerpt').value;
        const content = document.getElementById('post-content').value;
        const isPublished = document.getElementById('post-is-published').checked;
        const notifySubscribers = document.getElementById('post-notify-subs').checked;

        setLoading(true, isEdit ? 'Updating article...' : 'Publishing article...');
        
        try {
            let cover_image = null;
            const imgFile = document.getElementById('post-image').files[0];
            if (imgFile) {
                cover_image = await uploadImage(imgFile, 'blog');
            } else if (isEdit) {
                const { data } = await supabaseClient.from('posts').select('cover_image').eq('id', editId).single();
                cover_image = data.cover_image;
            } else {
                cover_image = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop'; // fallback
            }

            const postData = { 
                title, 
                slug, 
                excerpt, 
                content, 
                cover_image, 
                is_published: isPublished 
            };
            
            if (isPublished && !isEdit) {
                postData.published_at = new Date().toISOString();
            }

            let response;
            if (isEdit) {
                response = await supabaseClient.from('posts').update(postData).eq('id', editId);
            } else {
                response = await supabaseClient.from('posts').insert([postData]);
            }

            if (response.error) throw response.error;

            // Newsletter Logic via Resend (Simulated Frontend Call)
            if (isPublished && notifySubscribers) {
                setLoading(true, 'Broadcasting to subscribers...');
                await sendNewsletter(postData);
            }

            showToast('Article saved!', 'success');
            resetPostForm();
            fetchBlogPosts();
        } catch (err) {
            showAlert(err.message);
        } finally {
            setLoading(false);
        }
    });

    async function sendNewsletter(post) {
        try {
            // 1. Fetch all subscribers
            const { data: subs } = await supabaseClient.from('subscribers').select('email');
            if (!subs || subs.length === 0) return;

            // 2. Resend API Details
            const RESEND_API_KEY = window.resendApiKey || 're_123456789';
            
            console.log(`Sending newsletter for "${post.title}" to ${subs.length} subscribers...`);
            
            // Bypassing browser CORS by using a Vercel Serverless Function!
            // We use the absolute live URL so this works even if you are testing the dashboard locally on your computer.
            const response = await fetch('https://blissdezigns.vercel.app/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: post.title,
                    excerpt: post.excerpt,
                    cover_image: post.cover_image,
                    slug: post.slug,
                    resendApiKey: RESEND_API_KEY,
                    subscribers: subs.map(s => s.email)
                })
            });

            if (!response.ok) {
                const err = await response.json();
                // We extract err.error because our Vercel API sends { error: "..." }
                throw new Error(err.error || 'Failed to send newsletter');
            }
            
            showToast(`Broadcasted to ${subs.length} subscribers!`, 'success');
        } catch (err) {
            console.error('Newsletter error:', err);
            showToast(`Post saved, but email broadcast failed: ${err.message}`, 'error');
        }
    }

    // --- 6. Utils & Helpers ---

    async function uploadImage(file, pathFolder) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${pathFolder}/${fileName}`;

        const { error } = await supabaseClient.storage.from('portfolio-assets').upload(filePath, file);
        if (error) throw error;
        
        const { data } = supabaseClient.storage.from('portfolio-assets').getPublicUrl(filePath);
        return data.publicUrl;
    }

    async function chopAndUploadImage(file) {
        console.log(`Starting Auto-Chopper for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        setLoading(true, 'Processing giant image... this may take a moment.');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        const chunks = [];
                        const CHUNK_HEIGHT = 8192;
                        const totalChunks = Math.ceil(img.height / CHUNK_HEIGHT);
                        console.log(`Image dimensions: ${img.width}x${img.height}. Total chunks to create: ${totalChunks}`);
                        
                        for (let i = 0; i < totalChunks; i++) {
                            console.log(`Chopping slice ${i + 1} of ${totalChunks}...`);
                            setLoading(true, `Slicing & Uploading section ${i + 1} of ${totalChunks}...`);
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const height = Math.min(CHUNK_HEIGHT, img.height - (i * CHUNK_HEIGHT));
                            
                            canvas.width = img.width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, (i * CHUNK_HEIGHT), img.width, height, 0, 0, img.width, height);
                            
                            console.log(`Converting slice ${i + 1} to WebP...`);
                            const blob = await new Promise(res => canvas.toBlob(res, 'image/webp', 0.9));
                            const chunkFile = new File([blob], `chunk_${i}.webp`, { type: 'image/webp' });
                            
                            console.log(`Uploading slice ${i + 1} to storage...`);
                            const url = await uploadImage(chunkFile, 'case_studies');
                            chunks.push(url);
                        }
                        console.log(`Successfully processed and uploaded all ${totalChunks} chunks.`);
                        resolve(chunks);
                    } catch (err) {
                        console.error("Chopper Error:", err);
                        reject(err);
                    }
                };
                img.onerror = () => {
                    console.error("Chopper Error: Failed to load image source.");
                    reject(new Error('Image source load failed'));
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.error("Chopper Error: FileReader failed.");
                reject(new Error('FileReader failed'));
            };
            reader.readAsDataURL(file);
        });
    }

    // --- 6. Live Previews ---
    function setupImagePreviews() {
        // Universal helper to handle single image preview updates
        const updateSinglePreview = (input, box, img, vid, savedBadge) => {
            const file = input.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                box.style.display = 'block';
                if (savedBadge) savedBadge.style.display = 'none'; // New file -> Hide saved badge
                
                const thumb = box.querySelector('.selection-thumb');
                if (thumb) {
                    thumb.classList.add('is-new');
                    thumb.classList.remove('is-persisted');
                }

                if (file.type.startsWith('video/')) {
                    if (img) img.style.display = 'none';
                    if (vid) {
                        vid.src = url;
                        vid.style.display = 'block';
                    }
                } else {
                    if (vid) vid.style.display = 'none';
                    if (img) {
                        img.src = url;
                        img.style.display = 'block';
                    }
                }
            }
        };

        const heroInput = document.getElementById('proj-hero');
        const heroBox = document.getElementById('hero-preview-box');
        const heroImg = document.getElementById('hero-preview-img');
        const heroVid = document.getElementById('hero-preview-vid');
        const heroSaved = document.getElementById('hero-saved-status');

        if (heroInput) {
            heroInput.addEventListener('change', () => {
                updateSinglePreview(heroInput, heroBox, heroImg, heroVid, heroSaved);
            });
        }

        const revInput = document.getElementById('rev-avatar');
        const revBox = document.getElementById('avatar-preview-box');
        const revImg = document.getElementById('avatar-preview-img');
        const revSaved = document.getElementById('avatar-saved-status');

        if (revInput) {
            revInput.addEventListener('change', () => {
                updateSinglePreview(revInput, revBox, revImg, null, revSaved);
            });
        }

        const postInput = document.getElementById('post-image');
        const postBox = document.getElementById('post-preview-box');
        const postImg = document.getElementById('post-preview-img');
        const postSaved = document.getElementById('post-saved-status');

        if (postInput) {
            postInput.addEventListener('change', () => {
                updateSinglePreview(postInput, postBox, postImg, null, postSaved);
            });
        }

        const csInput = document.getElementById('cs-full-image');
        if (csInput) {
            csInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 1 && files[0].type.startsWith('image/')) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        const img = new Image();
                        img.onload = () => {
                            if (img.height > 8000) {
                                // Scenario A: Huge Image -> Unified Gallery Item
                                activeCaseStudyGallery = [{ 
                                    type: 'huge-file', 
                                    content: file,
                                    previewUrl: re.target.result 
                                }];
                                renderCaseStudyGallery();
                            } else {
                                // Scenario B: Normal Image -> Append to Gallery
                                activeCaseStudyGallery.push({ 
                                    type: 'file', 
                                    content: file,
                                    previewUrl: URL.createObjectURL(file) 
                                });
                                renderCaseStudyGallery();
                            }
                        };
                        img.src = re.target.result;
                    };
                    reader.readAsDataURL(file);
                } else if (files.length > 0) {
                    files.forEach(f => {
                        activeCaseStudyGallery.push({ 
                            type: 'file', 
                            content: f,
                            previewUrl: URL.createObjectURL(f)
                        });
                    });
                    renderCaseStudyGallery();
                }
                // DO NOT clear input value here, it breaks Scenario A submission!
                // We'll clear it after successful upload/submit.
            });
        }
    }

    // --- 7. Custom Dialog System ---

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i>
            <span>${message}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function showModal(title, message, showCancel = true, optionsHandler = null) {
        modalTitle.innerText = title;
        modalMessage.innerText = message;
        modalOptions.innerHTML = '';
        modalOptions.style.display = 'none';
        modalConfirmBtn.style.display = 'block';
        modalCancelBtn.style.display = showCancel ? 'block' : 'none';
        
        adminModal.classList.add('active');
        
        return new Promise((resolve) => {
            const cleanup = () => {
                adminModal.classList.remove('active');
                modalConfirmBtn.onclick = null;
                modalCancelBtn.onclick = null;
            };
            
            modalConfirmBtn.onclick = () => { cleanup(); resolve(true); };
            modalCancelBtn.onclick = () => { cleanup(); resolve(false); };
            
            if (optionsHandler) optionsHandler(resolve, cleanup);
        });
    }

    const showAlert = (msg) => showModal('Alert', msg, false);
    const showConfirm = (msg, onConfirm) => showModal('Confirm Action', msg, true).then(res => { if(res) onConfirm(); });

    function showDateFramePicker(onSelect) {
        modalTitle.innerText = "Select Date Frame";
        modalMessage.innerText = "Choose the period for your analytics display:";
        modalConfirmBtn.style.display = 'none';
        modalCancelBtn.style.display = 'block';
        modalOptions.style.display = 'grid';
        modalOptions.style.gridTemplateColumns = '1fr 1fr';
        modalOptions.style.gap = '10px';
        
        modalOptions.innerHTML = `
            <button class="btn btn-secondary" onclick="window.pickDateFrame(1)">Today</button>
            <button class="btn btn-secondary" onclick="window.pickDateFrame(7)">Last 7 Days</button>
            <button class="btn btn-secondary" onclick="window.pickDateFrame(30)">Last 30 Days</button>
            <button class="btn btn-secondary" onclick="window.pickDateFrame(90)">3 Months</button>
            <button class="btn btn-secondary" onclick="window.pickDateFrame(180)">6 Months</button>
            <button class="btn btn-primary" onclick="window.pickDateFrame(0)">All Time</button>
        `;
        
        adminModal.classList.add('active');
        
        modalCancelBtn.onclick = () => {
            adminModal.classList.remove('active');
        };
        
        window.pickDateFrame = (val) => {
            adminModal.classList.remove('active');
            onSelect(val);
        };
    }
    // --- 8. Dynamic Tag Manager ---
    function renderTags() {
        const tagField = document.getElementById('tag-input-field');
        const tagContainer = document.getElementById('tag-bubbles-container');
        const hiddenTagsInput = document.getElementById('proj-tags');

        if (!tagContainer) return;
        tagContainer.innerHTML = (activeTags || []).map((tag, idx) => `
            <div class="tag-bubble">
                <span>${tag}</span>
                <i class="fa-solid fa-xmark remove-tag" onclick="window.removeTag(${idx})"></i>
            </div>
        `).join('');
        
        if (hiddenTagsInput) hiddenTagsInput.value = (activeTags || []).join(', ');
        
        // Disable input if max tags reached
        if (tagField) {
            if (activeTags.length >= 5) {
                tagField.placeholder = "Max tags reached";
                tagField.disabled = true;
            } else {
                tagField.placeholder = "Add tag (e.g. Mobile App)...";
                tagField.disabled = false;
            }
        }
    }

    window.removeTag = (index) => {
        activeTags.splice(index, 1);
        renderTags();
    };

    const tagInputEl = document.getElementById('tag-input-field');
    if (tagInputEl) {
        tagInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTagFromInput();
            }
        });

        // Custom tag pills handler exposed globally below
    }

    function addTagFromInput() {
        const tagInputEl = document.getElementById('tag-input-field');
        const val = tagInputEl.value.trim();
        if (val && activeTags.length < 5 && !activeTags.includes(val)) {
            activeTags.push(val);
            tagInputEl.value = '';
            renderTags();
        }
    }

    window.addSuggestedTag = (val) => {
        if (val && activeTags.length < 5 && !activeTags.includes(val)) {
            activeTags.push(val);
            renderTags();
        }
    };

    // --- 9. Advanced Gallery Manager (Drag & Drop + Delete) ---
    function renderCaseStudyGallery() {
        const grid = document.getElementById('cs-selection-grid');
        const status = document.getElementById('cs-current-status');
        const previewBox = document.getElementById('cs-preview-box');
        const emptyHint = document.getElementById('cs-empty-hint');

        if (!grid || !status) return;

        // Reset visibility
        if (previewBox) previewBox.style.display = 'none';
        grid.style.display = 'none';
        if (emptyHint) emptyHint.style.display = 'flex';
        status.style.display = 'none';

        if (activeCaseStudyGallery.length === 0) return;

        // If we have at least one item, hide the hint
        if (emptyHint) emptyHint.style.display = 'none';

        // Check for Scenario A (Huge File)
        const hugeItem = activeCaseStudyGallery.find(i => i.type === 'huge-file');
        if (hugeItem && previewBox) {
            document.getElementById('cs-preview-img').src = hugeItem.previewUrl;
            previewBox.style.display = 'block';
            status.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Chopper Ready`;
            status.style.display = 'inline-flex';
            return;
        }

        // Otherwise render standard gallery
        status.innerHTML = `<i class="fa-solid fa-layer-group"></i> ${activeCaseStudyGallery.length} Items Sorted`;
        status.style.display = 'inline-flex';
        grid.style.display = 'grid';

        grid.innerHTML = activeCaseStudyGallery.map((item, idx) => {
            const isVid = item.type === 'url' 
                ? (item.content || "").match(/\.(mp4|webm|ogg|mov)$/i)
                : (item.content?.type || "").startsWith('video/');
            
            const src = item.type === 'url' ? item.content : item.previewUrl;

            return `
                <div class="selection-thumb ${item.isSaved ? 'is-persisted' : 'is-new'}" data-index="${idx}">
                    <div class="thumb-index">${idx + 1}</div>
                    <div class="remove-btn" onclick="window.removeFromGallery(${idx})">
                        <i class="fa-solid fa-xmark"></i>
                    </div>
                    ${isVid ? `<video src="${src}" muted loop playsinline></video>` : `<img src="${src}">`}
                    ${item.isSaved ? '<div class="saved-badge"><i class="fa-solid fa-check"></i></div>' : ''}
                </div>
            `;
        }).join('');

        // Initialize Sortable if library is available
        if (typeof Sortable !== 'undefined' && !window.csSortable) {
            window.csSortable = new Sortable(grid, {
                animation: 250,
                ghostClass: 'sortable-ghost',
                onEnd: () => {
                    // Update the state array based on the new DOM order
                    const newOrder = [];
                    grid.querySelectorAll('.selection-thumb').forEach(el => {
                        const idx = parseInt(el.getAttribute('data-index'));
                        newOrder.push(activeCaseStudyGallery[idx]);
                    });
                    activeCaseStudyGallery = newOrder;
                    renderCaseStudyGallery(); // Refresh indices
                }
            });
        }
    }

    window.removeFromGallery = (index) => {
        activeCaseStudyGallery.splice(index, 1);
        renderCaseStudyGallery();
    };

    // Initialize all media upload previews
    setupImagePreviews();

    // Make functions available globally so they can be called by reset/edit
    window.renderTags = renderTags;
    window.renderCaseStudyGallery = renderCaseStudyGallery;
});
