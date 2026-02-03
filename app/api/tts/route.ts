import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Cache directory
const CACHE_DIR = path.join(process.cwd(), '.tts-cache');

// Simple hash function for cache key
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

async function getFromCache(key: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.mp3`);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function saveToCache(key: string, data: ArrayBuffer) {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.mp3`);
    await fs.writeFile(filePath, Buffer.from(data));
  } catch (e) {
    console.error('Cache save error:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Check file cache first
    const cacheKey = hashText(text);
    const cached = await getFromCache(cacheKey);
    if (cached) {
      console.log('TTS file cache hit:', cacheKey);
      return new NextResponse(new Uint8Array(cached), {
        headers: { 'Content-Type': 'audio/mpeg' },
      });
    }

    // Try ElevenLabs first - using Daniel voice (professional British)
    if (process.env.ELEVENLABS_API_KEY) {
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/onwK4e9ZLuTAKqWW03F9', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
          },
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        await saveToCache(cacheKey, audioBuffer);
        console.log('TTS cached to file (ElevenLabs):', cacheKey);
        return new NextResponse(audioBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' },
        });
      }
    }

    // Fallback to OpenAI TTS
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'nova',
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        await saveToCache(cacheKey, audioBuffer);
        console.log('TTS cached to file (OpenAI):', cacheKey);
        return new NextResponse(audioBuffer, {
          headers: { 'Content-Type': 'audio/mpeg' },
        });
      }
    }

    return NextResponse.json({ error: 'No TTS service configured' }, { status: 500 });
  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
