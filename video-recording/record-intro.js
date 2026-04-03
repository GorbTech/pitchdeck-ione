const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1080p resolution
const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 1;
const FPS = 30;

// Intro has 2 phases:
// Phase 1: Static (museum-reverse.mp4) - 4 seconds
// Phase 2: Driven (driven.mp4 + autonomous.jpg) - 12 seconds
// Total: ~16 seconds + buffer
const INTRO_DURATION = 18; // seconds, with buffer

// Use production URL where landing is skipped and intro starts directly
const BASE_URL = 'https://pitchdeck.gtlab.org';
const FRAMES_DIR = path.join(__dirname, 'frames-intro');
const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureFrames(page, durationSec) {
  console.log(`\n📹 Recording intro (${durationSec}s @ ${FPS}fps)`);

  ensureDir(FRAMES_DIR);

  // Clear existing frames
  const existingFrames = fs.readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png'));
  existingFrames.forEach(f => fs.unlinkSync(path.join(FRAMES_DIR, f)));

  const totalFrames = durationSec * FPS;
  const frameInterval = 1000 / FPS;

  let frameCount = 0;
  const startTime = Date.now();

  while (frameCount < totalFrames) {
    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(FRAMES_DIR, `frame_${frameNum}.png`);

    await page.screenshot({
      path: framePath,
      type: 'png'
    });

    frameCount++;

    // Progress every 5 seconds
    if (frameCount % (FPS * 5) === 0) {
      const pct = Math.round((frameCount / totalFrames) * 100);
      console.log(`  ${pct}% (${frameCount}/${totalFrames} frames)`);
    }

    // Timing control
    const elapsed = Date.now() - startTime;
    const expectedTime = frameCount * frameInterval;
    const waitTime = expectedTime - elapsed;
    if (waitTime > 0) await sleep(waitTime);
  }

  console.log(`  ✅ ${frameCount} frames captured`);
  return frameCount;
}

async function main() {
  const totalFrames = INTRO_DURATION * FPS;

  console.log('🎬 Recording INTRO');
  console.log(`   Resolution: ${WIDTH * SCALE}x${HEIGHT * SCALE} (1080p)`);
  console.log(`   Duration: ${INTRO_DURATION}s (~${totalFrames} frames)\n`);

  ensureDir(FRAMES_DIR);
  ensureDir(OUTPUT_DIR);

  // Use xvfb for video support
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
    bypassCSP: true,
  });

  const page = await context.newPage();

  // Load main page
  console.log('🌐 Loading pitchdeck...');
  await page.goto(BASE_URL, {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for page to be ready
  await sleep(2000);

  // Click to enable voice autoplay (required by browsers)
  console.log('   🖱️  Activating audio/video...');
  await page.click('body');
  await sleep(500);

  // On pitchdeck.gtlab.org, landing is skipped and voice prompt shows
  // Need to click the volume icon or "Tap to start" text to enable voice
  console.log('   🔊 Looking for voice prompt...');
  try {
    // Wait for voice prompt to appear
    await page.waitForSelector('text=Tap to start', { timeout: 5000 });
    console.log('   ✅ Voice prompt found');

    // Click on the volume icon (the circular div with Volume2 icon)
    const tapToStart = await page.locator('text=Tap to start').first();
    await tapToStart.click();
    console.log('   ✅ Voice enabled, starting intro...');
  } catch (e) {
    console.log('   ⚠️  Voice prompt not found, trying to click center of screen...');
    await page.click('body', { position: { x: 960, y: 540 } });
  }

  // Wait a moment for the intro to start
  await sleep(1000);

  // Capture frames
  await captureFrames(page, INTRO_DURATION);

  await browser.close();

  console.log('\n✅ All frames captured!');
  console.log('📊 Creating video with ffmpeg...\n');

  // Create video from frames
  const videoPath = path.join(OUTPUT_DIR, 'intro-video.mp4');

  console.log('   Converting frames to video...');
  const cmd = `ffmpeg -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%05d.png" ` +
    `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
    `"${videoPath}" 2>/dev/null`;

  try {
    execSync(cmd, { stdio: 'pipe' });
    const size = fs.statSync(videoPath).size;
    console.log(`   ✅ intro-video.mp4 (${Math.round(size / 1024 / 1024)}MB)`);
  } catch (e) {
    console.log('   ❌ Error creating video');
  }

  console.log('\n🎬 Video created!');
  console.log('   Run ./create-intro-video.sh to combine with audio');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
