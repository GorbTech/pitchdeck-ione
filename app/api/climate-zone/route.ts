import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const MODEL = 'llama3.2:3b';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/elevation';

interface LocationData {
  address: string;
  lat: number;
  lon: number;
  elevation: number;
}

// Geocode address using Nominatim
async function geocodeAddress(address: string): Promise<LocationData | null> {
  try {
    const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'iONE-Configurator/1.0 (contact@gtlab.org)'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    // Get elevation from Open-Meteo
    let elevation = 0;
    try {
      const elevUrl = `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}`;
      const elevResponse = await fetch(elevUrl);
      if (elevResponse.ok) {
        const elevData = await elevResponse.json();
        elevation = elevData.elevation?.[0] || 0;
      }
    } catch {
      // Elevation optional
    }

    return {
      address: result.display_name,
      lat,
      lon,
      elevation: Math.round(elevation)
    };
  } catch {
    return null;
  }
}

// Known locations for instant response
const CLIMATE_MAP: Record<string, string> = {
  // Arctic
  'iceland': 'arctic',
  'norway': 'arctic',
  'sweden': 'arctic',
  'finland': 'arctic',
  'alaska': 'arctic',
  'greenland': 'arctic',
  'siberia': 'arctic',
  'nunavut': 'arctic',
  'svalbard': 'arctic',
  'murmansk': 'arctic',
  'tromsø': 'arctic',
  'reykjavik': 'arctic',

  // Desert
  'dubai': 'desert',
  'abu dhabi': 'desert',
  'saudi arabia': 'desert',
  'qatar': 'desert',
  'egypt': 'desert',
  'morocco': 'desert',
  'algeria': 'desert',
  'libya': 'desert',
  'iraq': 'desert',
  'iran': 'desert',
  'kuwait': 'desert',
  'oman': 'desert',
  'bahrain': 'desert',
  'arizona': 'desert',
  'nevada': 'desert',
  'sahara': 'desert',
  'riyadh': 'desert',
  'doha': 'desert',
  'cairo': 'desert',
  'casablanca': 'desert',
  'israel': 'desert',
  'jordan': 'desert',

  // Continental (Europe, most of US, etc.)
  'germany': 'continental',
  'france': 'continental',
  'poland': 'continental',
  'czech': 'continental',
  'austria': 'continental',
  'switzerland': 'continental',
  'netherlands': 'continental',
  'belgium': 'continental',
  'uk': 'continental',
  'england': 'continental',
  'spain': 'continental',
  'italy': 'continental',
  'portugal': 'continental',
  'ukraine': 'continental',
  'romania': 'continental',
  'hungary': 'continental',
  'serbia': 'continental',
  'croatia': 'continental',
  'greece': 'continental',
  'turkey': 'continental',
  'berlin': 'continental',
  'munich': 'continental',
  'paris': 'continental',
  'london': 'continental',
  'warsaw': 'continental',
  'vienna': 'continental',
  'amsterdam': 'continental',
  'brussels': 'continental',
  'madrid': 'continental',
  'rome': 'continental',
  'new york': 'continental',
  'chicago': 'continental',
  'los angeles': 'continental',
  'tokyo': 'continental',
  'seoul': 'continental',
  'beijing': 'continental',
  'moscow': 'continental',
};

function checkKnownLocation(address: string): string | null {
  const lower = address.toLowerCase();
  for (const [location, zone] of Object.entries(CLIMATE_MAP)) {
    if (lower.includes(location)) {
      return zone;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address || typeof address !== 'string' || address.trim().length < 2) {
    return NextResponse.json({
      status: 'error',
      message: 'Please enter a valid address.',
    });
  }

  // Geocode address first
  const location = await geocodeAddress(address);

  // Determine zone by coordinates
  // This is a quick initial estimate — the v4 engine re-detects using actual
  // climate data (hourly temps). We keep this conservative: only flag obvious
  // desert (core Sahara/Arabian belt). Mediterranean coast stays continental.
  if (location) {
    const absLat = Math.abs(location.lat);
    let zone = 'continental';
    if (absLat >= 64) {
      zone = 'arctic';
    }
    // Everything else defaults to continental.
    // The pvgis API determines final zone from Open-Meteo ERA5 climate data.

    return NextResponse.json({
      status: 'ok',
      zone,
      confidence: 0.9,
      source: 'coordinates',
      location,
    });
  }

  // Use Ollama for unknown locations
  try {
    const prompt = `Based on the location "${address}", determine the climate zone.

Return ONLY one word - the climate zone:
- "arctic" for extremely cold regions (below -30°C in winter): Nordic countries, Alaska, Siberia, Greenland, Northern Canada
- "desert" for hot arid regions (above +40°C in summer): Middle East, North Africa, Arabian Peninsula, Sahara, American Southwest deserts
- "continental" for moderate climates (between -20°C and +40°C): Most of Europe, USA, Asia, temperate regions

Reply with ONLY the zone name, nothing else: arctic, continental, or desert`;

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 10,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama request failed');
    }

    const data = await response.json();
    const result = data.response?.toLowerCase().trim() || '';

    // Extract zone from response
    let zone = 'continental'; // default
    if (result.includes('arctic')) {
      zone = 'arctic';
    } else if (result.includes('desert')) {
      zone = 'desert';
    } else if (result.includes('continental')) {
      zone = 'continental';
    }

    return NextResponse.json({
      status: 'ok',
      zone,
      confidence: 0.8,
      source: 'ai',
      location: location || undefined,
    });

  } catch (error) {
    console.error('Climate zone error:', error);
    // Default to continental on error
    return NextResponse.json({
      status: 'ok',
      zone: 'continental',
      confidence: 0.5,
      source: 'fallback',
      location: location || undefined,
    });
  }
}
