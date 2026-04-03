const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1080p resolution
const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 1;
const FPS = 30;

// Audio durations in seconds (from ffprobe)
const SLIDES = [
  { audio: 'products-01.mp3', duration: 40 },
  { audio: 'products-02.mp3', duration: 43 },
  { audio: 'products-03.mp3', duration: 50 },
  { audio: 'products-04.mp3', duration: 38 },
  { audio: 'products-05.mp3', duration: 40 },
  { audio: 'products-06.mp3', duration: 41 },
  { audio: 'products-07.mp3', duration: 41 },
  { audio: 'products-08.mp3', duration: 44 },
  { audio: 'products-09.mp3', duration: 73 },
  { audio: 'products-10.mp3', duration: 49 },
  { audio: 'products-11.mp3', duration: 27 },
  { audio: 'products-12.mp3', duration: 28 },
  { audio: 'products-13.mp3', duration: 29 },
  { audio: 'products-14.mp3', duration: 43 },
  { audio: 'products-15.mp3', duration: 25 },
  { audio: 'products-16.mp3', duration: 18 },
  { audio: 'products-17.mp3', duration: 25 },
  { audio: 'products-18.mp3', duration: 15 },
  { audio: 'products-19.mp3', duration: 17 },
  { audio: 'products-20.mp3', duration: 21 },
];

const BASE_URL = 'http://localhost:3052';
const FRAMES_DIR = path.join(__dirname, 'frames-hardware');
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

  console.log('🎬 Recording HARDWARE DEEP DIVE');
  console.log(`   Resolution: ${WIDTH * SCALE}x${HEIGHT * SCALE} (1080p)`);
  console.log(`   Slides: ${SLIDES.length}`);
  console.log(`   Total duration: ~${Math.round(totalDuration / 60)} min (~${totalFrames} frames)\n`);

  ensureDir(FRAMES_DIR);
  ensureDir(OUTPUT_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: SCALE,
  });

  const page = await context.newPage();

  // Load hardware page (without voice to prevent auto-advance)
  console.log('🌐 Loading Hardware page...');
  await page.goto(`${BASE_URL}/hardware`, {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for initial animations
  await sleep(2000);

  // Record each slide
  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];

    // Capture frames for this slide
    await captureFrames(page, i, slide.duration);

    // Move to next slide (if not last)
    if (i < SLIDES.length - 1) {
      // Click NEXT button or press ArrowRight
      await page.keyboard.press('ArrowRight');
      await sleep(500); // Wait for transition
    }
  }

  await browser.close();

  console.log('\n✅ All frames captured!');
  console.log('📊 Creating video segments with ffmpeg...\n');

  // Create video for each slide
  for (let i = 0; i < SLIDES.length; i++) {
    const slideNum = String(i + 1).padStart(2, '0');
    const slideDir = path.join(FRAMES_DIR, `slide${slideNum}`);
    const videoPath = path.join(OUTPUT_DIR, `hardware-slide${slideNum}.mp4`);

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
  console.log('   Run ./create-hardware-video.sh to combine with audio');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
