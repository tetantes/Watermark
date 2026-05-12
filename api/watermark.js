const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// Font registration - using your project's structure
const fontPath = path.join(process.cwd(), 'fonts', 'Roboto-Bold.ttf');
try {
    GlobalFonts.registerFromPath(fontPath, 'WatermarkFont');
} catch (err) {
    console.error("Font loading failed:", err);
}

module.exports = async function handler(req, res) {
    // CORS Headers from your example
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const imageUrl = req.query.url || (req.body && req.body.url);
        const text = req.query.text || "WATERMARK";

        if (!imageUrl) {
            return res.status(400).json({ error: "Missing image URL" });
        }

        // Fetch the image
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        // We use an image object to get dimensions for the canvas
        const img = new (require('@napi-rs/canvas').Image)();
        img.src = inputBuffer;

        const width = img.width;
        const height = img.height;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw the original image first
        ctx.drawImage(img, 0, 0, width, height);

        // Watermark Style
        ctx.font = 'bold 30px WatermarkFont';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white
        ctx.textAlign = 'center';

        // Tiling Logic: Draw slanted text in a grid
        const angle = -30 * Math.PI / 180;
        ctx.rotate(angle);

        const spacingX = 200;
        const spacingY = 150;

        // Loop to cover the entire canvas area even when rotated
        for (let x = -width; x < width * 2; x += spacingX) {
            for (let y = -height; y < height * 2; y += spacingY) {
                ctx.fillText(text, x, y);
            }
        }

        const outputBuffer = canvas.toBuffer('image/png');

        res.setHeader('Content-Type', 'image/png');
        res.status(200).send(outputBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Image processing failed' });
    }
};
