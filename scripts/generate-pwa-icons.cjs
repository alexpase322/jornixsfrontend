/**
 * Generates placeholder PWA icons as solid-color PNGs with a "J" letter.
 * Replace these with your real branded icons in public/icons/.
 *
 * Run: node scripts/generate-pwa-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Brand colors (matches Tailwind gray-800 / violet-500)
const BG = [31, 41, 55];     // #1F2937
const FG = [139, 92, 246];   // #8B5CF6 (violet for letter)

// CRC32 lookup table
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Simple 5x7 bitmap for letter "J"
const LETTER_J = [
  [0, 0, 1, 1, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0]
];

function generatePng(size) {
  const width = size;
  const height = size;
  const letterSize = Math.floor(size * 0.5);
  const pxPerCell = Math.floor(letterSize / 7);
  const letterWidthPx = pxPerCell * 5;
  const letterHeightPx = pxPerCell * 7;
  const letterX = Math.floor((width - letterWidthPx) / 2);
  const letterY = Math.floor((height - letterHeightPx) / 2);

  const raw = Buffer.alloc(width * height * 4 + height);
  let idx = 0;
  for (let y = 0; y < height; y++) {
    raw[idx++] = 0;
    for (let x = 0; x < width; x++) {
      let inLetter = false;
      if (x >= letterX && x < letterX + letterWidthPx &&
          y >= letterY && y < letterY + letterHeightPx) {
        const cellX = Math.floor((x - letterX) / pxPerCell);
        const cellY = Math.floor((y - letterY) / pxPerCell);
        if (LETTER_J[cellY] && LETTER_J[cellY][cellX]) {
          inLetter = true;
        }
      }
      const c = inLetter ? FG : BG;
      raw[idx++] = c[0];
      raw[idx++] = c[1];
      raw[idx++] = c[2];
      raw[idx++] = 255;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

for (const size of SIZES) {
  const filePath = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, generatePng(size));
  console.log(`Generated ${filePath}`);
}

console.log('\nDone. Replace these placeholders with your own branded icons when ready.');
