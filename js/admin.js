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
    
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

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
        try {
            let trafficQuery = supabaseClient.from('analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'view');
            let msgQuery = supabaseClient.from('messages').select('*', { count: 'exact', head: true });
            let subQuery = supabaseClient.from('subscribers').select('*', { count: 'exact', head: true });

            if (days > 0) {
                const dateLimit = new Date();
                dateLimit.setDate(dateLimit.getDate() - days);
                const isoDate = dateLimit.toISOString();
                
                trafficQuery = trafficQuery.gte('created_at', isoDate);
                msgQuery = msgQuery.gte('created_at', isoDate);
                subQuery = subQuery.gte('created_at', isoDate);
                
                document.getElementById('current-date-range').innerText = `Last ${days} Days`;
            } else {
                document.getElementById('current-date-range').innerText = "All Time";
            }

            const { count: trafficCount } = await trafficQuery;
            const { count: msgCount } = await msgQuery;
            const { count: subCount } = await subQuery;

            const actualTraffic = trafficCount || 0;
            const actualMessages = msgCount || 0;
            const actualSubscribers = subCount || 0;

            document.getElementById('stat-traffic').innerText = actualTraffic.toLocaleString();
            document.getElementById('stat-messages').innerText = actualMessages.toLocaleString();
            document.getElementById('stat-subscribers').innerText = actualSubscribers.toLocaleString();

            const conv = actualTraffic > 0 ? ((actualMessages / actualTraffic) * 100).toFixed(1) : "0.0";
            document.getElementById('stat-conversion').innerText = conv + '%';

            initChart(days);
            renderCategoryStats();
            fetchLeads();
        } catch (err) {
            console.error('Error fetching insights:', err);
        }
    }

    function initChart(days = 0) {
        if (!chartCtx) return;
        if (analyticsChart) analyticsChart.destroy();

        // Standard labels if all time
        let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        let dataViews = [12, 19, 3, 5, 2, 3, 5]; // Demo defaults if no data
        let dataLeads = [2, 3, 1, 2, 0, 1, 2];

        // Logic to properly aggregate data per day would go here if we had date-series data
        // For now, we maintain the premium visual with dynamic labeling
        if (days === 7) labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'];
        if (days === 30) labels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];

        analyticsChart = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Views',
                        data: [120, 190, 300, 500, 200, 300, 450],
                        borderColor: '#DF00FF',
                        backgroundColor: 'rgba(223, 0, 255, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0
                    },
                    {
                        label: 'Leads',
                        data: [20, 35, 40, 60, 30, 45, 55],
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
                    x: { display: false },
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
                    <div class="activity-header">
                        <div class="activity-icon-small">✉️</div>
                        <div class="activity-user-info">
                            <strong>${msg.name}</strong>
                            <span class="activity-time">${new Date(msg.created_at).toLocaleDateString()} at ${new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
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
                    <div class="activity-header">
                        <div class="activity-icon-small">🤝</div>
                        <div class="activity-user-info">
                            <strong>New Subscriber</strong>
                            <span class="activity-time">${new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
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
    
    function switchPanel(target) {
        // Sync Sidebar
        tabs.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-target') === target);
        });
        
        // Sync Mobile Nav
        mobileTabs.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-target') === target);
        });

        // Toggle Panels
        document.querySelectorAll('.admin-panel').forEach(p => {
            p.classList.toggle('active', p.id === target);
        });

        // Trigger fetches if needed
        if (target === 'insights-panel') fetchInsights();
        if (target === 'manage-projects-panel') fetchProjects();
        if (target === 'manage-reviews-panel') fetchReviews();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchPanel(tab.getAttribute('data-target')));
    });

    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => switchPanel(tab.getAttribute('data-target')));
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
            document.getElementById('proj-tags').value = (project.category_tags || []).join(', ');
            
            const heroUrlDisplay = document.getElementById('hero-current-url');
            heroUrlDisplay.innerText = "Current Image: " + project.hero_image.split('/').pop();
            heroUrlDisplay.style.display = 'block';

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
        document.getElementById('edit-proj-original-id').value = '';
        document.getElementById('project-form-title').innerText = 'Add New Project';
        document.getElementById('submit-proj-btn').innerText = 'Publish Project';
        document.getElementById('cancel-proj-btn').style.display = 'none';
        document.getElementById('hero-current-url').style.display = 'none';
        caseStudyFields.style.display = 'none';
        hasCaseStudyCheckbox.checked = false;
        isFeaturedCheckbox.checked = false;
        document.getElementById('chopper-preview').innerHTML = '';
        document.querySelector('[data-target="manage-projects-panel"]').click();
    }

    projectsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalId = document.getElementById('edit-proj-original-id').value;
        const isEdit = !!originalId;
        
        setLoading(true, isEdit ? 'Updating project...' : 'Creating project...');
        
        try {
            const id = document.getElementById('proj-id').value.trim().toLowerCase();
            const title = document.getElementById('proj-title').value.trim();
            const subtitle = document.getElementById('proj-subtitle').value.trim();
            const tags = document.getElementById('proj-tags').value.split(',').map(tag => tag.trim()).filter(t => t);
            const isCaseStudy = hasCaseStudyCheckbox.checked;
            const isFeatured = isFeaturedCheckbox.checked;

            let heroUrl = null;
            const heroFile = document.getElementById('proj-hero').files[0];
            if (heroFile) {
                heroUrl = await uploadImage(heroFile, 'projects');
            } else if (isEdit) {
                // Keep the old image if editing and no new file selected
                const { data } = await supabaseClient.from('projects').select('hero_image').eq('id', originalId).single();
                heroUrl = data.hero_image;
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
                category_tags: tags
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
                const role = document.getElementById('cs-role').value;
                const duration = document.getElementById('cs-duration').value;
                const tools = document.getElementById('cs-tools').value;
                const industry = document.getElementById('cs-industry').value;
                
                const csFile = document.getElementById('cs-full-image').files[0];
                let chunks = [];
                
                if (csFile) {
                    chunks = await chopAndUploadImage(csFile);
                } else if (isEdit) {
                    // Keep existing chunks if no new file
                    const { data } = await supabaseClient.from('case_studies').select('full_image_chunks').eq('id', originalId).single();
                    if (data) chunks = data.full_image_chunks;
                }

                const csData = { id, role, duration, tools, industry, full_image_chunks: chunks };
                
                if (isEdit) {
                    await supabaseClient.from('case_studies').upsert([csData]);
                } else {
                    await supabaseClient.from('case_studies').insert([csData]);
                }
            } else if (isEdit) {
                // If it was a case study and now it's not, delete the record
                await supabaseClient.from('case_studies').delete().eq('id', originalId);
            }

            showToast(isEdit ? 'Project updated successfully!' : 'Project created successfully!');
            resetProjectForm();
            fetchProjects();

        } catch (err) {
            showAlert('Error saving project: ' + err.message);
        } finally {
            setLoading(false);
        }
    });

    // --- 4. CRUD: Reviews ---

    async function fetchReviews() {
        const { data, error } = await supabaseClient.from('reviews').select('*').order('created_at', { ascending: false });
        if (error) return console.error(error);

        reviewsList.innerHTML = data.map(rev => `
            <tr>
                <td><img src="${rev.avatar_url}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 50%;"></td>
                <td><div style="font-weight: 600;">${rev.author_name}</div></td>
                <td>${rev.author_role}</td>
                <td style="font-size: 0.85rem; color: var(--text-muted);">${rev.review_text.substring(0, 50)}...</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon btn-edit" title="Edit" onclick="editReview('${rev.id}')">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="btn-icon btn-delete" title="Delete" onclick="deleteReview('${rev.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center; padding: 40px;">No reviews found.</td></tr>';
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
        
        const avatarDisplay = document.getElementById('avatar-current-url');
        avatarDisplay.innerText = "Current Avatar: " + rev.avatar_url.split('/').pop();
        avatarDisplay.style.display = 'block';

        document.getElementById('review-form-title').innerText = 'Edit Review';
        document.getElementById('submit-rev-btn').innerText = 'Update Review';
        document.getElementById('cancel-rev-btn').style.display = 'block';
        
        document.querySelector('[data-target="add-review-panel"]').click();
    };

    document.getElementById('cancel-rev-btn').onclick = resetReviewForm;

    function resetReviewForm() {
        reviewsForm.reset();
        document.getElementById('edit-rev-id').value = '';
        document.getElementById('review-form-title').innerText = 'Add New Testimonial';
        document.getElementById('submit-rev-btn').innerText = 'Publish Testimonial';
        document.getElementById('cancel-rev-btn').style.display = 'none';
        document.getElementById('avatar-current-url').style.display = 'none';
        document.querySelector('[data-target="manage-reviews-panel"]').click();
    }

    reviewsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-rev-id').value;
        const isEdit = !!editId;

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
                throw new Error('Avatar is required for new reviews.');
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
        } finally {
            setLoading(false);
        }
    });

    // --- 5. Utils & Helpers ---

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
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = async function() {
                    const chunks = [];
                    const maxChunkHeight = 8192; 
                    const numChunks = Math.ceil(img.height / maxChunkHeight);
                    
                    try {
                        setLoading(true, `Slicing into ${numChunks} chunks...`);
                        for (let i = 0; i < numChunks; i++) {
                            const canvas = document.createElement('canvas');
                            const chunkHeight = (i === numChunks - 1 && img.height % maxChunkHeight !== 0) 
                                                ? img.height % maxChunkHeight 
                                                : maxChunkHeight;
                            canvas.width = img.width;
                            canvas.height = chunkHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, i * maxChunkHeight, img.width, chunkHeight, 0, 0, img.width, chunkHeight);
                            
                            const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
                            const chunkFile = new File([blob], `slice_${i}.jpg`, { type: 'image/jpeg' });
                            
                            setLoading(true, `Uploading chunk ${i+1}/${numChunks}...`);
                            const publicUrl = await uploadImage(chunkFile, 'case_studies');
                            chunks.push(publicUrl);
                        }
                        resolve(chunks);
                    } catch (err) { reject(err); }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // --- 6. Live Previews ---
    function setupImagePreviews() {
        const heroInput = document.getElementById('proj-hero');
        const heroBox = document.getElementById('hero-preview-box');
        const heroImg = document.getElementById('hero-preview-img');

        const csInput = document.getElementById('cs-full-image');
        const csBox = document.getElementById('cs-preview-box');
        const csImg = document.getElementById('cs-preview-img');

        if (heroInput) {
            heroInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    heroImg.src = URL.createObjectURL(file);
                    heroBox.style.display = 'block';
                }
            });
        }

        if (csInput) {
            csInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    csImg.src = URL.createObjectURL(file);
                    csBox.style.display = 'block';
                }
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
        modalOptions.style.display = 'flex';
        modalOptions.innerHTML = `
            <button class="btn btn-secondary" onclick="window.pickDateFrame(7)">Last 7 Days</button>
            <button class="btn btn-secondary" onclick="window.pickDateFrame(30)">Last 30 Days</button>
            <button class="btn btn-primary" onclick="window.pickDateFrame(0)">All Time</button>
        `;
        
        adminModal.classList.add('active');
        
        window.pickDateFrame = (val) => {
            adminModal.classList.remove('active');
            onSelect(val);
        };
    }
});
