const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1080p resolution
const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 1;
const FPS = 30;

// Audio durations in seconds (rounded up)
const SLIDES = [
  { audio: 'climate-slide-1.mp3', duration: 33 },
  { audio: 'climate-slide-2.mp3', duration: 42 },
  { audio: 'climate-slide-3.mp3', duration: 42 },
  { audio: 'climate-slide-4.mp3', duration: 42 },
  { audio: 'climate-slide-5.mp3', duration: 44 },
  { audio: 'climate-slide-6.mp3', duration: 60 },
];

const BASE_URL = 'http://localhost:3052';
const FRAMES_DIR = path.join(__dirname, 'frames-climate');
const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureFrames(page, slideIndex, durationSec) {
  const slideNum = String(slideIndex + 1).padStart(2, '0');
  console.log(`\n📹 Recording slide ${slideNum} (${durationSec}s @ ${FPS}fps)`);

  const slideDir = path.join(FRAMES_DIR, `slide${slideNum}`);
  ensureDir(slideDir);

  // Clear existing frames
  const existingFrames = fs.readdirSync(slideDir).filter(f => f.endsWith('.png'));
  existingFrames.forEach(f => fs.unlinkSync(path.join(slideDir, f)));

  const totalFrames = durationSec * FPS;
  const frameInterval = 1000 / FPS;

  let frameCount = 0;
  const startTime = Date.now();

  while (frameCount < totalFrames) {
    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(slideDir, `frame_${frameNum}.png`);

    await page.screenshot({
      path: framePath,
      type: 'png'
    });

    frameCount++;

    // Progress every 10 seconds
    if (frameCount % (FPS * 10) === 0) {
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
  const totalDuration = SLIDES.reduce((a, s) => a + s.duration, 0);
  const totalFrames = totalDuration * FPS;

  console.log('🎬 Recording CLIMATE IMPACT');
  console.log(`   Resolution: ${WIDTH * SCALE}x${HEIGHT * SCALE} (1080p)`);
  console.log(`   Slides: ${SLIDES.length}`);
  console.log(`   Total duration: ~${Math.round(totalDuration / 60)} min (~${totalFrames} frames)\n`);

  ensureDir(FRAMES_DIR);
  ensureDir(OUTPUT_DIR);

  // Use headless: false with xvfb for video support
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

  // Load climate page
  console.log('🌐 Loading Climate Impact page...');
  await page.goto(`${BASE_URL}/climate`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for initial load
  await sleep(2000);

  // Click to enable audio autoplay (required by browsers)
  console.log('   🖱️  Activating audio/video...');
  await page.click('body');
  await sleep(1000);

  // Wait for video background to load and audio to start
  await sleep(3000);

  // Record each slide - the page auto-advances with audio
  // We just capture frames for the duration of each audio track
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];

    // Wait for video background to be visible
    await page.waitForSelector('video', { timeout: 5000 }).catch(() => {});
    await sleep(500);

    // Capture frames for this slide
    await captureFrames(page, i, slide.duration);

    // The page auto-advances when audio ends, but we control timing
    // If we need to manually advance:
    if (i < SLIDES.length - 1) {
      // Wait a bit then check if we need to advance
      await sleep(500);
    }
  }

  await browser.close();

  console.log('\n✅ All frames captured!');
  console.log('📊 Creating video segments with ffmpeg...\n');

  // Create video for each slide
  for (let i = 0; i < SLIDES.length; i++) {
    const slideNum = String(i + 1).padStart(2, '0');
    const slideDir = path.join(FRAMES_DIR, `slide${slideNum}`);
    const videoPath = path.join(OUTPUT_DIR, `climate-slide${slideNum}.mp4`);

    console.log(`   Converting slide ${slideNum}...`);

    const cmd = `ffmpeg -y -framerate ${FPS} -i "${slideDir}/frame_%05d.png" ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
      `"${videoPath}" 2>/dev/null`;

    try {
      execSync(cmd, { stdio: 'pipe' });
      const size = fs.statSync(videoPath).size;
      console.log(`   ✅ slide${slideNum}.mp4 (${Math.round(size / 1024 / 1024)}MB)`);
    } catch (e) {
      console.log(`   ❌ Error creating slide${slideNum}.mp4`);
    }
  }

  console.log('\n🎬 Slide videos created!');
  console.log('   Run ./create-climate-video.sh to combine with audio');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
