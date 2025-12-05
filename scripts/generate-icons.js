const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// SVG template for the icon
const generateSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a73e8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d47a1;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#grad)"/>
  <g fill="white">
    <path d="M128 128 L256 160 L384 128 L384 352 L256 384 L128 352 Z" fill="none" stroke="white" stroke-width="16" stroke-linejoin="round"/>
    <line x1="256" y1="160" x2="256" y2="384" stroke="white" stroke-width="12"/>
    <path d="M180 256 L220 296 L300 216" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  const svg = generateSvg();
  const svgBuffer = Buffer.from(svg);
  
  // Save the base SVG
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg);
  console.log('Generated icon.svg');
  
  // Generate PNG for each size
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
  
  // Generate Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');
  
  // Generate favicon (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-32x32.png'));
  console.log('Generated favicon-32x32.png');
  
  // Generate favicon (16x16)
  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(__dirname, '../public/favicon-16x16.png'));
  console.log('Generated favicon-16x16.png');
  
  console.log('\n✓ All icons generated successfully!');
}

generateIcons().catch(console.error);
