#!/usr/bin/env node

/**
 * Capture app store screenshots using Playwright
 *
 * Usage: npx playwright test scripts/capture-screenshots.mjs
 * Or: node scripts/capture-screenshots.mjs
 *
 * Generates screenshots for:
 * - iOS App Store (iPhone 6.9", 6.5", iPad 13")
 * - Google Play Store (Phone 1080x1920, Tablet 1600x2560)
 */

import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const OUTPUT_DIR = path.join(projectRoot, "store-assets", "screenshots");

// Device configurations for app store screenshots
const DEVICES = {
  // iOS - iPhone 6.9" (iPhone 16 Pro Max) - Required for App Store
  "iphone-6.9": {
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
    outputSize: { width: 1320, height: 2868 }, // Actual: 1320x2868
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  },

  // iOS - iPhone 6.5" (iPhone 15 Pro Max) - Alternative
  "iphone-6.5": {
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
    outputSize: { width: 1284, height: 2778 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },

  // Google Play - Phone (1080x1920)
  "android-phone": {
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    outputSize: { width: 1080, height: 1920 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  },

  // Google Play - Tablet (1600x2560)
  "android-tablet": {
    viewport: { width: 800, height: 1280 },
    deviceScaleFactor: 2,
    outputSize: { width: 1600, height: 2560 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
};

// Pages to screenshot
const PAGES = [
  { name: "landing", path: "/", waitFor: 2000 },
  { name: "login", path: "/auth/login", waitFor: 1500 },
  { name: "dashboard", path: "/dashboard", waitFor: 3000, requiresAuth: true },
  { name: "fitness", path: "/fitness", waitFor: 2000, requiresAuth: true },
  { name: "nutrition", path: "/nutrition", waitFor: 2000, requiresAuth: true },
  { name: "community", path: "/community", waitFor: 2000, requiresAuth: true },
];

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureScreenshots() {
  console.log("Starting screenshot capture for V-Life Fitness...\n");

  const browser = await chromium.launch({
    headless: true,
  });

  for (const [deviceName, device] of Object.entries(DEVICES)) {
    console.log(`\nCapturing screenshots for ${deviceName}...`);

    const deviceDir = path.join(OUTPUT_DIR, deviceName);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }

    const context = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: device.deviceScaleFactor,
      userAgent: device.userAgent,
      colorScheme: "dark",
    });

    const page = await context.newPage();

    for (const pageConfig of PAGES) {
      // Skip auth-required pages for now (would need login handling)
      if (pageConfig.requiresAuth) {
        console.log(`  Skipping ${pageConfig.name} (requires auth)`);
        continue;
      }

      try {
        const url = `https://v-life.app${pageConfig.path}`;
        console.log(`  Capturing ${pageConfig.name}...`);

        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(pageConfig.waitFor);

        const screenshotPath = path.join(deviceDir, `${pageConfig.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: false,
        });

        console.log(`    ✓ Saved: ${screenshotPath}`);
      } catch (error) {
        console.log(`    ✗ Failed: ${error.message}`);
      }
    }

    await context.close();
  }

  await browser.close();

  console.log("\n✓ Screenshot capture complete!");
  console.log(`\nScreenshots saved to: ${OUTPUT_DIR}`);
  console.log("\nNote: Dashboard and authenticated pages require manual capture");
  console.log("or you can add test credentials to this script.");
}

captureScreenshots().catch(console.error);
