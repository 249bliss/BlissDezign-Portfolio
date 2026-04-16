export default async function handler(req, res) {
    // Enable CORS for local testing
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { title, excerpt, cover_image, slug, subscribers, resendApiKey } = req.body;

        if (!subscribers || subscribers.length === 0) {
            return res.status(400).json({ error: 'No subscribers provided' });
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: 'BlissDezign <onboarding@resend.dev>', 
                // Since there is no custom domain, Resend ONLY allows sending to the email that registered the account.
                // We use Test Mode where it only sends a copy to your own email to prove the system works.
                to: 'kelechik177@gmail.com',
                subject: `New Insight: ${title}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        ${cover_image ? `<img src="${cover_image}" style="width: 100%; border-radius: 12px; margin-bottom: 20px;">` : ''}
                        <h1 style="color: #DF00FF;">${title}</h1>
                        <p style="font-size: 16px; line-height: 1.6;">${excerpt}</p>
                        <a href="https://blissdezigns.vercel.app/post.html?slug=${slug}" 
                           style="display: inline-block; padding: 12px 24px; background: #DF00FF; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 20px;">
                           Read Full Article
                        </a>
                        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999;">You're receiving this because you subscribed to BlissDezign updates.</p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.message || 'Failed to send via Resend' });
        }

        const data = await response.json();
        return res.status(200).json({ success: true, data });

    } catch (err) {
        console.error('Vercel API Newsletter Error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
