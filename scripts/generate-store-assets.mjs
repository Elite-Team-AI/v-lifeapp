import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function generateStoreAssets() {
  const storeAssetsDir = path.join(rootDir, 'store-assets');

  // 1. Create 512x512 app icon from the launcher icon
  console.log('Creating 512x512 app icon...');
  const iconSource = path.join(rootDir, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
  await sharp(iconSource)
    .resize(512, 512, {
      kernel: sharp.kernel.lanczos3,
      fit: 'cover'
    })
    .png()
    .toFile(path.join(storeAssetsDir, 'app-icon-512.png'));
  console.log('Created app-icon-512.png');

  // 2. Create 1024x500 feature graphic
  console.log('Creating 1024x500 feature graphic...');

  // Create a dark background with the V-Life branding
  const width = 1024;
  const height = 500;

  // Load the icon and resize it for the feature graphic
  const iconBuffer = await sharp(iconSource)
    .resize(200, 200)
    .toBuffer();

  // Create the feature graphic with dark background
  await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 15, g: 15, b: 15, alpha: 1 } // Dark background
    }
  })
  .composite([
    {
      input: iconBuffer,
      left: Math.round((width - 200) / 2),
      top: 80
    },
    {
      // Add text as SVG overlay
      input: Buffer.from(`
        <svg width="${width}" height="${height}">
          <text x="${width/2}" y="340" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">V-Life</text>
          <text x="${width/2}" y="400" font-family="Arial, sans-serif" font-size="24" fill="#EAB308" text-anchor="middle">Your Lifestyle. Your Plan. Powered by AI.</text>
        </svg>
      `),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toFile(path.join(storeAssetsDir, 'feature-graphic-1024x500.png'));
  console.log('Created feature-graphic-1024x500.png');

  console.log('\nAll store assets created in:', storeAssetsDir);
}

generateStoreAssets().catch(console.error);
