const sharp = require('sharp');

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // 1. Get the image (from URL or Buffer)
    const imageUrl = req.query.url || req.body.url;
    const watermarkText = req.query.text || "WATERMARK";
    
    const response = await fetch(imageUrl);
    const inputBuffer = Buffer.from(await response.arrayBuffer());

    // 2. Get image dimensions
    const metadata = await sharp(inputBuffer).metadata();
    const { width, height } = metadata;

    // 3. Create the SVG Watermark Overlay
    // This creates a grid of slanted text
    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <style>
          .text { 
            fill: rgba(255, 255, 255, 0.3); 
            font-size: 40px; 
            font-family: sans-serif; 
            font-weight: bold; 
          }
        </style>
        <defs>
          <pattern id="watermark-pattern" width="200" height="200" patternUnits="userSpaceOnUse" patternTransform="rotate(-30)">
            <text x="0" y="50" class="text">${watermarkText}</text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
      </svg>
    `;

    // 4. Composite the SVG over the image
    const outputBuffer = await sharp(inputBuffer)
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .png() // or .jpeg()
      .toBuffer();

    // 5. Return the image
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(outputBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing image');
  }
}
