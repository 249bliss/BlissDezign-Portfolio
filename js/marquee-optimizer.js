/**
 * Marquee Optimizer
 * Automatically pauses heavy videos inside the marquee when they scroll out of view,
 * and plays them when they come into view. This prevents massive CPU/GPU hangs on mobile.
 */
document.addEventListener('DOMContentLoaded', () => {
    const marqueeVideos = document.querySelectorAll('.marquee-card video');

    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    // Play video when it enters the viewport
                    video.play().catch(e => console.log('Autoplay prevented:', e));
                } else {
                    // Pause video when it leaves the viewport to save CPU
                    video.pause();
                }
            });
        }, {
            // Margin around viewport to start playing slightly before it comes into view
            rootMargin: '100px 0px 100px 0px',
            threshold: 0
        });

        marqueeVideos.forEach(video => {
            // Apply playsinline just in case it wasn't set, crucial for mobile
            video.setAttribute('playsinline', '');
            video.setAttribute('disableRemotePlayback', '');
            videoObserver.observe(video);
        });
    }
});
