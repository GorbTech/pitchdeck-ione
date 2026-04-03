const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 1080p resolution (Full HD)
const WIDTH = 1920;
const HEIGHT = 1080;
const SCALE = 1; // Results in 1920x1080 output
const FPS = 30;

// Scene durations based on audio files
const SCENES = [
  { name: 'scene0', duration: 40, url: '/record?scene=0', description: 'Fleet Intelligence' },
  { name: 'scene1', duration: 26, url: '/record?scene=1', description: 'Predictive Service' },
  { name: 'scene2', duration: 30, url: '/record?scene=2', description: 'Mission Control', interactive: true }
];

const BASE_URL = 'http://localhost:3052';
const FRAMES_DIR = path.join(__dirname, 'frames');
const OUTPUT_DIR = path.join(__dirname, 'output');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureFrames(page, sceneName, durationSec) {
  console.log(`\n📹 Recording ${sceneName} (${durationSec}s @ ${FPS}fps)`);

  const sceneDir = path.join(FRAMES_DIR, sceneName);
  ensureDir(sceneDir);

  // Clear existing frames
  const existingFrames = fs.readdirSync(sceneDir).filter(f => f.endsWith('.png'));
  existingFrames.forEach(f => fs.unlinkSync(path.join(sceneDir, f)));

  const totalFrames = durationSec * FPS;
  const frameInterval = 1000 / FPS;

  let frameCount = 0;
  const startTime = Date.now();

  while (frameCount < totalFrames) {
    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(sceneDir, `frame_${frameNum}.png`);

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

// Interactive Mission Control recording with clicks
async function captureMissionControl(page, sceneName, durationSec) {
  console.log(`\n📹 Recording ${sceneName} with interactions (${durationSec}s @ ${FPS}fps)`);

  const sceneDir = path.join(FRAMES_DIR, sceneName);
  ensureDir(sceneDir);

  // Clear existing frames
  const existingFrames = fs.readdirSync(sceneDir).filter(f => f.endsWith('.png'));
  existingFrames.forEach(f => fs.unlinkSync(path.join(sceneDir, f)));

  const totalFrames = durationSec * FPS;
  const frameInterval = 1000 / FPS;

  // Click schedule: [frameNumber, color] - click on station of this color
  // Colors: ok=#2bff88 (green), degraded=#ffd84a (yellow), fault=#ff3b3b (red), scheduled=#5aa2ff (blue)
  // Order: green → yellow → red to show different telemetry
  const clickSchedule = [
    { frame: FPS * 3, color: '#2bff88', label: 'green (OK)' },        // 3s - click green
    { frame: FPS * 10, color: '#ffd84a', label: 'yellow (degraded)' }, // 10s - click yellow
    { frame: FPS * 17, color: '#ff3b3b', label: 'red (fault)' },      // 17s - click red
    { frame: FPS * 24, color: '#2bff88', label: 'green (OK)' },       // 24s - click another green
  ];

  let frameCount = 0;
  let nextClickIndex = 0;
  const startTime = Date.now();

  while (frameCount < totalFrames) {
    // Check if we need to click
    if (nextClickIndex < clickSchedule.length && frameCount === clickSchedule[nextClickIndex].frame) {
      const click = clickSchedule[nextClickIndex];
      console.log(`  🖱️  Clicking ${click.label} station at frame ${frameCount}`);

      // Find and click a station with the specified color
      try {
        // Find all station groups (g.cursor-pointer) and click the one with matching color
        const clicked = await page.evaluate((targetColor) => {
          // Get all station g elements
          const stationGroups = document.querySelectorAll('g.cursor-pointer');
          const matchingStations = [];

          for (const g of stationGroups) {
            // Find the inner circle (the one with r=5 that shows status color)
            const circles = g.querySelectorAll('circle');
            for (const circle of circles) {
              const fill = circle.getAttribute('fill');
              const r = circle.getAttribute('r');
              // Match by color and radius (status circles have r=5)
              if (fill && r === '5' && fill.toLowerCase() === targetColor.toLowerCase()) {
                matchingStations.push(g);
                break;
              }
            }
          }

          if (matchingStations.length > 0) {
            // Click a random station with this color (not the first one every time)
            const idx = Math.floor(Math.random() * matchingStations.length);
            const station = matchingStations[idx];
            station.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return true;
          }
          return false;
        }, click.color);

        if (clicked) {
          console.log(`     ✓ Successfully clicked station`);
        } else {
          console.log(`     ⚠️  No station found with color ${click.color}`);
        }
      } catch (e) {
        console.log(`  ⚠️  Click failed: ${e.message}`);
      }

      nextClickIndex++;
    }

    const frameNum = String(frameCount).padStart(5, '0');
    const framePath = path.join(sceneDir, `frame_${frameNum}.png`);

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

  console.log(`  ✅ ${frameCount} frames captured with ${nextClickIndex} interactions`);
  return frameCount;
}

async function main() {
  const totalDuration = SCENES.reduce((a, s) => a + s.duration, 0);
  console.log('🎬 Recording SYMBIOTIC INTELLIGENCE topic');
  console.log(`   Resolution: ${WIDTH * SCALE}x${HEIGHT * SCALE} (1080p Full HD)`);
  console.log(`   Total duration: ~${totalDuration}s (~${Math.round(totalDuration * FPS)} frames)\n`);

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

  // Record each scene
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    console.log(`\n🌐 Loading ${scene.description}...`);

    await page.goto(`${BASE_URL}${scene.url}`, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Wait for animations to start
    await sleep(2000);

    if (scene.interactive) {
      await captureMissionControl(page, scene.name, scene.duration);
    } else {
      await captureFrames(page, scene.name, scene.duration);
    }
  }

  await browser.close();

  console.log('\n✅ All frames captured!');
  console.log('📊 Creating video with ffmpeg...\n');

  // Create video for each scene
  for (const scene of SCENES) {
    const sceneDir = path.join(FRAMES_DIR, scene.name);
    const videoPath = path.join(OUTPUT_DIR, `${scene.name}.mp4`);

    console.log(`   Converting ${scene.name}...`);

    const cmd = `ffmpeg -y -framerate ${FPS} -i "${sceneDir}/frame_%05d.png" ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
      `"${videoPath}" 2>/dev/null`;

    try {
      execSync(cmd, { stdio: 'pipe' });
      const size = fs.statSync(videoPath).size;
      console.log(`   ✅ ${scene.name}.mp4 (${Math.round(size / 1024 / 1024)}MB)`);
    } catch (e) {
      console.log(`   ❌ Error creating ${scene.name}.mp4`);
      console.log(e.message);
    }
  }

  console.log('\n🎬 Scene videos created!');
  console.log('   Run ./create-video.sh to combine with audio');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
