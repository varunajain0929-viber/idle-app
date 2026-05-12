#!/usr/bin/env node
// One-shot script. Renders all the PNG icon variants Expo needs from the
// brand strike+dot mark. Run with `node scripts/generate-icons.js`.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

const INK = '#1A1A1A';
const CREAM = '#F5F0E8';
const PINK = '#FF3D6E';

// Full app icon — ink background, pink strike, cream dot.
const fullIcon = (size = 1024) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <rect width="1024" height="1024" rx="224" fill="${INK}"/>
  <rect x="180" y="492" width="560" height="80" fill="${PINK}"/>
  <circle cx="800" cy="532" r="42" fill="${CREAM}"/>
</svg>`;

// Adaptive icon foreground — the strike+dot mark only, transparent bg,
// with safe-zone padding (Android crops to a shape).
const adaptiveForeground = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect x="280" y="488" width="380" height="56" fill="${PINK}"/>
  <circle cx="700" cy="516" r="30" fill="${CREAM}"/>
</svg>`;

// Adaptive icon background — solid ink.
const adaptiveBackground = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="${INK}"/>
</svg>`;

// Monochrome version for themed icons on Android 13+. Single color (white),
// transparent bg.
const monochrome = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect x="280" y="488" width="380" height="56" fill="#FFFFFF"/>
  <circle cx="700" cy="516" r="30" fill="#FFFFFF"/>
</svg>`;

// Splash icon — same mark as the app icon (no rounded rect, transparent bg).
// Expo will center it on the cream background.
const splashIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect x="180" y="492" width="560" height="80" fill="${PINK}"/>
  <circle cx="800" cy="532" r="42" fill="${INK}"/>
</svg>`;

async function render(svg, outFile, size = 1024) {
  const out = path.join(ASSETS, outFile);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('  wrote', outFile);
}

async function main() {
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

  console.log('Generating Idle brand icons…');
  await render(fullIcon(), 'icon.png', 1024);
  await render(adaptiveForeground, 'android-icon-foreground.png', 1024);
  await render(adaptiveBackground, 'android-icon-background.png', 1024);
  await render(monochrome, 'android-icon-monochrome.png', 1024);
  await render(splashIcon, 'splash-icon.png', 1024);
  await render(fullIcon(), 'favicon.png', 196);
  console.log('Done.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
