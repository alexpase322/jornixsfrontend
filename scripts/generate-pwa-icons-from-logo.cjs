/**
 * Generates PWA icons from the brand logo using sharp.
 * Run: node scripts/generate-pwa-icons-from-logo.cjs
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const INPUT = path.join(__dirname, '..', 'src', 'assets', 'Logo2.jpeg');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Brand background (Tailwind gray-800) for maskable icons + padding
const BG = { r: 31, g: 41, b: 55, alpha: 1 };

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

(async () => {
  for (const size of SIZES) {
    // Standard icon: logo fit inside the canvas with brand background padding
    const innerSize = Math.round(size * 0.85);
    const innerLogo = await sharp(INPUT)
      .resize(innerSize, innerSize, { fit: 'contain', background: BG })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG
      }
    })
      .composite([{ input: innerLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(OUT_DIR, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Maskable variants (safe zone — logo even smaller, more padding)
  for (const size of [192, 512]) {
    const innerSize = Math.round(size * 0.6);
    const innerLogo = await sharp(INPUT)
      .resize(innerSize, innerSize, { fit: 'contain', background: BG })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BG
      }
    })
      .composite([{ input: innerLogo, gravity: 'center' }])
      .png()
      .toFile(path.join(OUT_DIR, `icon-maskable-${size}x${size}.png`));

    console.log(`Generated icon-maskable-${size}x${size}.png`);
  }

  console.log('\nAll icons generated successfully.');
})().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
