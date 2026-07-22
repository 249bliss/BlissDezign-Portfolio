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
    const slug = req.query.slug || req.query.id;
    let title = "Article | Bliss – Product Designer Insights";
    let description = "Thoughts and insights on product design, mobile apps, and building digital products with intention.";
    let imageUrl = "https://blissdezigns.vercel.app/assets/my-website-cover.png";

    if (slug) {
        try {
            // Fetch post data from Supabase REST API
            let endpoint = `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&select=*`;
            let response = await fetch(endpoint, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            let data = null;
            if (response.ok) {
                data = await response.json();
            }

            if (!data || data.length === 0) {
                // Fallback to query by ID if slug did not return results
                const idEndpoint = `${SUPABASE_URL}/rest/v1/posts?id=eq.${encodeURIComponent(slug)}&select=*`;
                const idResp = await fetch(idEndpoint, {
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                if (idResp.ok) {
                    data = await idResp.json();
                }
            }

            if (data && data.length > 0) {
                const post = data[0];
                title = post.title || title;
                description = post.excerpt || post.description || description;
                const cover = post.cover_image || post.image_url || post.hero_image || post.thumbnail;
                if (cover) {
                    imageUrl = cover;
                }
            }
        } catch (err) {
            console.error("Error fetching post metadata from Supabase:", err);
        }
    }

    // Ensure imageUrl is an absolute URL
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        imageUrl = `https://blissdezigns.vercel.app/${imageUrl.replace(/^\//, '')}`;
    }

    try {
        const htmlPath = path.join(process.cwd(), 'post-template.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Replace Title tag
        html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)} | Bliss Blog</title>`);
        
        // Replace Meta Description tags
        html = html.replace(/<meta name="description"[\s\S]*?content=".*?"/, `<meta name="description" content="${escapeHtml(description)}"`);
        html = html.replace(/<meta property="og:description" content=".*?"/, `<meta property="og:description" content="${escapeHtml(description)}"`);
        html = html.replace(/<meta name="twitter:description" content=".*?"/, `<meta name="twitter:description" content="${escapeHtml(description)}"`);
        
        // Replace Social Sharing Image tags
        html = html.replace(/<meta property="og:image" content=".*?"/, `<meta property="og:image" content="${escapeHtml(imageUrl)}"`);
        html = html.replace(/<meta name="twitter:image" content=".*?"/, `<meta name="twitter:image" content="${escapeHtml(imageUrl)}"`);
        
        // Replace Twitter Title tag
        html = html.replace(/<meta name="twitter:title" content=".*?"/, `<meta name="twitter:title" content="${escapeHtml(title)}"`);

        // Replace Open Graph Title tag
        if (html.includes('property="og:title"')) {
            html = html.replace(/<meta property="og:title" content=".*?"/, `<meta property="og:title" content="${escapeHtml(title)}"`);
        } else {
            html = html.replace('<!-- ─── Open Graph ─── -->', `<!-- ─── Open Graph ─── -->\n    <meta property="og:title" content="${escapeHtml(title)}">`);
        }

        // Canonical URL & OG URL
        if (slug) {
            const currentUrl = `https://blissdezigns.vercel.app/post.html?slug=${encodeURIComponent(slug)}`;
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
        console.error("Error reading post-template.html:", err);
        res.status(500).send("Internal Server Error");
    }
};
