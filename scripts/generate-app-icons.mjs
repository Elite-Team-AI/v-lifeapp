#!/usr/bin/env node

/**
 * Generate app icons for iOS and Android app stores
 *
 * Usage: node scripts/generate-app-icons.mjs
 *
 * This script creates:
 * - assets/icon.png (1024x1024) - App icon with black background
 * - assets/icon-foreground.png (1024x1024) - Logo only for Android adaptive
 * - assets/icon-background.png (1024x1024) - Solid black background
 * - assets/splash.png (2732x2732) - Splash screen with centered logo
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ASSETS_DIR = path.join(projectRoot, 'assets');
const ICONS_DIR = path.join(projectRoot, 'public', 'icons');

// V-Life brand colors
const BLACK = '#000000';
const AMBER = '#F59E0B';

// Ensure assets directory exists
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function generateIcons() {
  console.log('Generating app icons for V-Life...\n');

  // Read the source icon (white logo on transparent)
  const sourceIcon = path.join(ICONS_DIR, 'icon-512.png');

  if (!fs.existsSync(sourceIcon)) {
    console.error('Error: Source icon not found at', sourceIcon);
    process.exit(1);
  }

  // 1. Create icon.png (1024x1024) - Black background with white logo
  console.log('Creating icon.png (1024x1024)...');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BLACK,
    },
  })
    .composite([
      {
        input: await sharp(sourceIcon)
          .resize(800, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('  ✓ assets/icon.png created');

  // 2. Create icon-foreground.png (1024x1024) - Logo only with padding for safe zone
  // Android adaptive icons use a 66% safe zone, so we scale the logo to fit
  console.log('Creating icon-foreground.png (1024x1024)...');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(sourceIcon)
          .resize(680, 680, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon-foreground.png'));
  console.log('  ✓ assets/icon-foreground.png created');

  // 3. Create icon-background.png (1024x1024) - Solid black
  console.log('Creating icon-background.png (1024x1024)...');
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: BLACK,
    },
  })
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon-background.png'));
  console.log('  ✓ assets/icon-background.png created');

  // 4. Create splash.png (2732x2732) - Black background with centered logo
  console.log('Creating splash.png (2732x2732)...');
  await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: BLACK,
    },
  })
    .composite([
      {
        input: await sharp(sourceIcon)
          .resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash.png'));
  console.log('  ✓ assets/splash.png created');

  // 5. Create splash-dark.png (same as splash for dark mode)
  console.log('Creating splash-dark.png (2732x2732)...');
  await fs.promises.copyFile(
    path.join(ASSETS_DIR, 'splash.png'),
    path.join(ASSETS_DIR, 'splash-dark.png')
  );
  console.log('  ✓ assets/splash-dark.png created');

  console.log('\n✓ All icons generated successfully!');
  console.log('\nNext step: Run "npx capacitor-assets generate" to generate all platform sizes.');
}

generateIcons().catch(console.error);
