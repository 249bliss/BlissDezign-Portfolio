const sharp = require('sharp');
const fs = require('fs');

async function optimize() {
    try {
        console.log('Optimizing Frame 12.png...');
        await sharp('assets/Maquee Images/Frame 12.png', { limitInputPixels: false })
            .resize({ width: 800, withoutEnlargement: true }) // Downscale massive images
            .webp({ quality: 80 })
            .toFile('assets/Maquee Images/Frame 12.webp');
        console.log('Optimization complete. Saved as Frame 12.webp.');
    } catch (e) {
        console.error('Failed to optimize:', e);
    }
}

optimize();
