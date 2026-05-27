import { existsSync } from 'fs';

const SVG_PATH = 'public/icon.svg';
const OUT_DIR = 'public';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[generate-icons] sharp not installed, skipping. Run: npm install --save-dev sharp');
  process.exit(0);
}

async function generate() {
  const sizes = [192, 512];
  for (const size of sizes) {
    const outPath = `${OUT_DIR}/icon-${size}.png`;
    await sharp(SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`[generate-icons] Generated ${outPath}`);
  }
}

generate().catch((err) => {
  console.error('[generate-icons] Failed:', err.message);
  process.exit(1);
});
