const puppeteer = require('puppeteer');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const URL = 'https://file.gtlab.org/media/platform-auto.html';
const OUTPUT = '/home/ubuntu/gtfiles/storage/admin/video/platform-overview.mp4';
const DURATION = 200000; // 200 seconds total (with buffer)

async function record() {
    console.log('🎬 Recording platform-auto presentation...');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const ffmpeg = spawn('ffmpeg', [
        '-y', '-f', 'image2pipe', '-framerate', '30', '-i', '-',
        '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast',
        '/tmp/platform-video-raw.mp4'
    ], { stdio: ['pipe', 'inherit', 'inherit'] });

    console.log('   Loading page...');
    await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 1000));

    // Presentation auto-starts on load
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

    // Extract audio from videos and combine with audio files
    console.log('   Creating audio track...');
    const audioDir = '/home/ubuntu/gtfiles/storage/admin/video/platform-audio';
    const videoDir = '/home/ubuntu/gtfiles/storage/admin/video/platform';

    // Extract audio from person videos
    execSync(`ffmpeg -y -i ${videoDir}/ivan-video.mp4 -vn -c:a aac /tmp/ivan-video-audio.m4a 2>/dev/null || true`);
    execSync(`ffmpeg -y -i ${videoDir}/marina-video.mp4 -vn -c:a aac /tmp/marina-video-audio.m4a 2>/dev/null || true`);
    execSync(`ffmpeg -y -i ${videoDir}/mariia-video.mp4 -vn -c:a aac /tmp/mariia-video-audio.m4a 2>/dev/null || true`);
    execSync(`ffmpeg -y -i ${videoDir}/witalij-video.mp4 -vn -c:a aac /tmp/witalij-video-audio.m4a 2>/dev/null || true`);

    // Convert mp3 files to m4a for consistent concat
    const mp3Files = ['scene1', 'scene2', 'scene3', 'scene4', 'team-intro', 'ivan', 'marina', 'mariia', 'witalij'];
    for (const f of mp3Files) {
        execSync(`ffmpeg -y -i ${audioDir}/${f}.mp3 -c:a aac /tmp/${f}.m4a 2>/dev/null || true`);
    }

    const audioList = `file '/tmp/scene1.m4a'
file '/tmp/scene2.m4a'
file '/tmp/scene3.m4a'
file '/tmp/scene4.m4a'
file '/tmp/team-intro.m4a'
file '/tmp/ivan.m4a'
file '/tmp/ivan-video-audio.m4a'
file '/tmp/marina.m4a'
file '/tmp/marina-video-audio.m4a'
file '/tmp/mariia.m4a'
file '/tmp/mariia-video-audio.m4a'
file '/tmp/witalij.m4a'
file '/tmp/witalij-video-audio.m4a'`;

    fs.writeFileSync('/tmp/audio-list.txt', audioList);
    execSync(`ffmpeg -y -f concat -safe 0 -i /tmp/audio-list.txt -c:a aac /tmp/platform-audio.m4a 2>/dev/null`);

    console.log('   Merging video + audio...');
    execSync(`ffmpeg -y -i /tmp/platform-video-raw.mp4 -i /tmp/platform-audio.m4a -c:v copy -c:a aac -shortest "${OUTPUT}" 2>/dev/null`);

    // Cleanup
    fs.unlinkSync('/tmp/platform-video-raw.mp4');
    fs.unlinkSync('/tmp/audio-list.txt');
    fs.unlinkSync('/tmp/platform-audio.m4a');

    const size = (fs.statSync(OUTPUT).size / 1024 / 1024).toFixed(1);
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT}"`).toString().trim());

    console.log(`✅ Done: ${OUTPUT}`);
    console.log(`   Size: ${size} MB, Duration: ${Math.round(dur)}s`);
}

record().catch(console.error);
