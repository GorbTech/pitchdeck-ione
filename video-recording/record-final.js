const puppeteer = require('puppeteer');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const URL = 'https://file.gtlab.org/media/platform-timed.html';
const OUTPUT = '/home/ubuntu/gtfiles/storage/admin/video/platform-overview.mp4';
const DURATION = 163000; // exact: 162524ms

async function record() {
    console.log('🎬 Recording platform presentation...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const ffmpeg = spawn('ffmpeg', [
        '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
        '/home/ubuntu/gtfiles/storage/admin/video/platform-video.mp4'
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    console.log('   Loading page...');
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1000));

    console.log('   Recording ' + (DURATION/1000) + 's...');
    const start = Date.now();
    let frames = 0;

    while (Date.now() - start < DURATION) {
        const shot = await page.screenshot({ type: 'jpeg', quality: 90 });
        ffmpeg.stdin.write(shot);
        frames++;
        await new Promise(r => setTimeout(r, 33));
    }

    console.log(`   Captured ${frames} frames`);
    ffmpeg.stdin.end();
    await new Promise(r => ffmpeg.on('close', r));
    await browser.close();

    console.log('   Merging video + audio...');
    execSync(`ffmpeg -y -i /home/ubuntu/gtfiles/storage/admin/video/platform-video.mp4 -i /tmp/platform-audio/full-audio.m4a -c:v copy -c:a aac -map 0:v -map 1:a "${OUTPUT}" 2>/dev/null`);

    fs.unlinkSync('/home/ubuntu/gtfiles/storage/admin/video/platform-video.mp4');

    const size = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT}"`).toString().trim());

    console.log(`✅ Done: ${OUTPUT}`);
    console.log(`   Size: ${size} MB, Duration: ${Math.round(dur)}s`);
}

record().catch(console.error);
