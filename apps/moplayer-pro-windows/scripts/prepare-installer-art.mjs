/**
 * MoPlayer PC — High-Fidelity Cinematic Installer Splash Generator
 * Uses 'sharp' and an AI-generated premium dark background to create
 * a stunning, borderless GIF for Squirrel.Windows.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = path.join(appRoot, "build");
const assetsDir = path.join(appRoot, "src", "renderer", "assets");

const iconPath = path.join(assetsDir, "moplayer-splash-logo.png");
const bgPath = "C:\\Users\\Moalf\\.gemini\\antigravity-ide\\brain\\16861b1d-2960-445a-88bf-561a12362f60\\premium_dark_bg_1781260866665.png";

async function generateArtwork() {
  await mkdir(buildDir, { recursive: true });

  // 1. Process the logo to fit beautifully (larger for splash screen)
  const logoBuffer = await sharp(iconPath)
    .resize({ width: 240, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 2. SVG overlay for sleek typography and a minimal loading bar aesthetic
  const typographySvg = Buffer.from(`
    <svg width="400" height="500">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#FF9248;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#FF6B2C;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Logo Typography -->
      <text x="200" y="320" font-family="Segoe UI, sans-serif" font-weight="bold" font-size="28" fill="url(#grad)" text-anchor="middle">MoPlayer PC</text>
      <text x="200" y="350" font-family="Segoe UI, sans-serif" font-weight="300" font-size="14" fill="#E0E0E0" text-anchor="middle" letter-spacing="2">PREMIUM MEDIA</text>
      
      <!-- Fake "Loading" Indicator for aesthetic -->
      <text x="200" y="440" font-family="Segoe UI, sans-serif" font-weight="400" font-size="12" fill="#8A8A8E" text-anchor="middle">Installing...</text>
      
      <!-- Minimalist loading bar base -->
      <rect x="100" y="460" width="200" height="3" fill="rgba(255, 255, 255, 0.1)" rx="1.5" />
      
      <!-- Minimalist loading bar "progress" (frozen in the GIF) -->
      <rect x="100" y="460" width="80" height="3" fill="url(#grad)" rx="1.5" />
    </svg>
  `);

  // 3. Generate Splash GIF via Sharp (400x500)
  const splashBuffer = await sharp(bgPath)
    .resize(400, 500, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.9, saturation: 1.2 }) // Make it moody and rich
    .composite([
      // Add a subtle vignette over the abstract bg
      {
        input: Buffer.from(`
          <svg width="400" height="500">
            <rect x="0" y="0" width="400" height="500" fill="rgba(6, 6, 8, 0.5)" />
            <radialGradient id="vignette" cx="50%" cy="40%" r="60%">
              <stop offset="30%" stop-color="black" stop-opacity="0"/>
              <stop offset="100%" stop-color="black" stop-opacity="0.8"/>
            </radialGradient>
            <rect x="0" y="0" width="400" height="500" fill="url(#vignette)" />
          </svg>
        `),
        blend: 'over'
      },
      // Drop shadow for logo
      {
        input: await sharp(iconPath)
          .resize({ width: 240, fit: "contain" })
          .blur(15)
          .modulate({ brightness: 0 })
          .toBuffer(),
        top: 85,
        left: 80,
        blend: 'multiply'
      },
      // The crisp logo
      {
        input: logoBuffer,
        top: 80,
        left: 80,
      },
      // Typography
      {
        input: typographySvg,
        top: 0,
        left: 0,
      }
    ])
    .gif()
    .toBuffer();

  // Save the GIF
  await writeFile(path.join(buildDir, "install-splash.gif"), splashBuffer);
  
  // Also save a PNG for the walkthrough preview
  await writeFile(path.join(buildDir, "install-splash-preview.png"), await sharp(splashBuffer).png().toBuffer());

  console.log("High-fidelity cinematic installer splash GIF written to build directory.");
}

generateArtwork().catch(console.error);
