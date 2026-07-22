const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://tqryfaoihqblcgfnoqgc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcnlmYW9paHFibGNnZm5vcWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODgzODAsImV4cCI6MjA5MTY2NDM4MH0.jJwCKbcKNuXoSDkLXPhhLcaa91M-5Eynjpdiom8HKMM';

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = async (req, res) => {
    const project = req.query.project || req.query.id;
    let title = "Case Study | BlissDezign";
    let description = "Dive deep into the design journey behind my projects. Exploring the problem, solution, and results.";
    let imageUrl = "https://blissdezigns.vercel.app/assets/my-website-cover.png";

    if (project) {
        try {
            // Fetch project data from Supabase REST API
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(project)}&select=*`,
                {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const proj = data[0];
                    title = proj.title ? `${proj.title} - Case Study` : title;
                    description = proj.subtitle || proj.description || description;
                    
                    const hero = proj.hero_image || proj.cover_image || proj.image_url || proj.thumbnail || proj.banner_image;
                    if (hero) {
                        imageUrl = hero;
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching project metadata from Supabase:", err);
        }
    }

    // Ensure imageUrl is an absolute URL
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `https://blissdezigns.vercel.app/${imageUrl.replace(/^\//, '')}`;
    }

    try {
        const htmlPath = path.join(process.cwd(), 'case-study.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace Title tag
        html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} | BlissDezign</title>`);
        
        // Replace Meta Description tags
        html = html.replace(/<meta name="description"[\s\S]*?content=".*?"/, `<meta name="description" content="${escapeHtml(description)}"`);
        html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${escapeHtml(description)}"`);
        
        // Replace Social Sharing Image tags
        html = html.replace(/<meta property="og:image" content=".*?"/, `<meta property="og:image" content="${escapeHtml(imageUrl)}"`);
        html = html.replace(/<meta name="twitter:image" content=".*?"/, `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"`);
        
        // Replace Twitter Title tag
        html = html.replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${escapeHtml(title)}"`);

        // Add or Replace Open Graph Title tag
        if (html.includes('property="og:title"')) {
            html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${escapeHtml(title)}"`);
        } else {
            html = html.replace('<!-- ─── Open Graph ─── -->', `<!-- ─── Open Graph ─── -->\n    <meta property="og:title" content="${escapeHtml(title)}">`);
        }

        // Canonical URL & OG URL
        if (project) {
            const currentUrl = `https://blissdezigns.vercel.app/case-study.html?project=${encodeURIComponent(project)}`;
            html = html.replace(/<link rel="canonical" href=".*?"/, `<link rel="canonical" href="${currentUrl}"`);
            if (html.includes('property="og:url"')) {
                html = html.replace(/<meta property="og:url" content=".*?"/, `<meta property="og:url" content="${currentUrl}"`);
            } else {
                html = html.replace('<!-- ─── Open Graph ─── -->', `<!-- ─── Open Graph ─── -->\n    <meta property="og:url" content="${currentUrl}">`);
            }
        }

        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (err) {
        console.error("Error reading case-study.html:", err);
        res.status(500).send("Internal Server Error");
    }
};
