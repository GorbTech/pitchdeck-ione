import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// === LEVEL 1: WHITELIST ===
// Known organizations - instant response, no API call
const WHITELIST: Record<string, { name: string; type: string; focus: string }> = {
  // GRANT + DEEP_TECH
  'eic': { name: 'European Innovation Council', type: 'GRANT', focus: 'DEEP_TECH' },
  'eic accelerator': { name: 'EIC Accelerator', type: 'GRANT', focus: 'DEEP_TECH' },
  'horizon europe': { name: 'Horizon Europe', type: 'GRANT', focus: 'DEEP_TECH' },
  'horizon 2020': { name: 'Horizon 2020', type: 'GRANT', focus: 'DEEP_TECH' },

  // GRANT + CLIMATE
  'eic climate': { name: 'EIC Climate', type: 'GRANT', focus: 'CLIMATE' },
  'innovation fund': { name: 'EU Innovation Fund', type: 'GRANT', focus: 'CLIMATE' },

  // VC + CLIMATE
  'world fund': { name: 'World Fund', type: 'VC', focus: 'CLIMATE' },
  'pale blue dot': { name: 'Pale Blue Dot', type: 'VC', focus: 'CLIMATE' },
  'extantia': { name: 'Extantia', type: 'VC', focus: 'CLIMATE' },

  // VC + DEEP_TECH
  'htgf': { name: 'High-Tech Gründerfonds', type: 'VC', focus: 'DEEP_TECH' },
  'high-tech gründerfonds': { name: 'High-Tech Gründerfonds', type: 'VC', focus: 'DEEP_TECH' },
  'sequoia': { name: 'Sequoia Capital', type: 'VC', focus: 'DEEP_TECH' },
  'sequoia capital': { name: 'Sequoia Capital', type: 'VC', focus: 'DEEP_TECH' },
  'a16z': { name: 'Andreessen Horowitz', type: 'VC', focus: 'DEEP_TECH' },
  'andreessen horowitz': { name: 'Andreessen Horowitz', type: 'VC', focus: 'DEEP_TECH' },
  'lakestar': { name: 'Lakestar', type: 'VC', focus: 'DEEP_TECH' },

  // VC + DEFENCE
  'nato innovation fund': { name: 'NATO Innovation Fund', type: 'VC', focus: 'DEFENCE' },
  'nato if': { name: 'NATO Innovation Fund', type: 'VC', focus: 'DEFENCE' },
  'decisive point': { name: 'Decisive Point', type: 'VC', focus: 'DEFENCE' },

  // VC + ENERGY
  'set ventures': { name: 'SET Ventures', type: 'VC', focus: 'ENERGY' },
  'energy impact partners': { name: 'Energy Impact Partners', type: 'VC', focus: 'ENERGY' },

  // CVC + ENERGY
  'equinor ventures': { name: 'Equinor Ventures', type: 'CVC', focus: 'ENERGY' },
  'shell ventures': { name: 'Shell Ventures', type: 'CVC', focus: 'ENERGY' },
  'bp ventures': { name: 'BP Ventures', type: 'CVC', focus: 'ENERGY' },
  'eon ventures': { name: 'E.ON Ventures', type: 'CVC', focus: 'ENERGY' },
  'e.on ventures': { name: 'E.ON Ventures', type: 'CVC', focus: 'ENERGY' },

  // BANK + INDUSTRIAL
  'kfw': { name: 'KfW', type: 'BANK', focus: 'INDUSTRIAL' },
  'kreditanstalt für wiederaufbau': { name: 'KfW', type: 'BANK', focus: 'INDUSTRIAL' },
  'eib': { name: 'European Investment Bank', type: 'BANK', focus: 'INDUSTRIAL' },
  'european investment bank': { name: 'European Investment Bank', type: 'BANK', focus: 'INDUSTRIAL' },
  'deutsche bank': { name: 'Deutsche Bank', type: 'BANK', focus: 'INDUSTRIAL' },

  // GOVERNMENT + DEFENCE
  'bundeswehr': { name: 'Bundeswehr', type: 'GOVERNMENT', focus: 'DEFENCE' },
  'nato': { name: 'NATO', type: 'GOVERNMENT', focus: 'DEFENCE' },
  'bwi': { name: 'BWI GmbH', type: 'GOVERNMENT', focus: 'DEFENCE' },

  // STRATEGIC + ENERGY
  'aramco': { name: 'Saudi Aramco', type: 'STRATEGIC', focus: 'ENERGY' },
  'saudi aramco': { name: 'Saudi Aramco', type: 'STRATEGIC', focus: 'ENERGY' },
  'vattenfall': { name: 'Vattenfall', type: 'STRATEGIC', focus: 'ENERGY' },

  // STRATEGIC + INFRASTRUCTURE
  'deutsche telekom': { name: 'Deutsche Telekom', type: 'STRATEGIC', focus: 'INFRASTRUCTURE' },
  'vodafone': { name: 'Vodafone', type: 'STRATEGIC', focus: 'INFRASTRUCTURE' },
  'siemens': { name: 'Siemens', type: 'STRATEGIC', focus: 'INFRASTRUCTURE' },
};

// === ADJACENCY MATRIX: Valid type×focus combinations ===
const VALID_COMBINATIONS: Record<string, string[]> = {
  'GRANT': ['DEEP_TECH', 'CLIMATE', 'DEFENCE', 'ENERGY', 'INFRASTRUCTURE', 'SOCIAL_IMPACT'],
  'VC': ['DEEP_TECH', 'CLIMATE', 'DEFENCE', 'ENERGY', 'INDUSTRIAL', 'INFRASTRUCTURE', 'SOCIAL_IMPACT'],
  'CVC': ['CLIMATE', 'ENERGY', 'INDUSTRIAL', 'INFRASTRUCTURE'],
  'FAMILY_OFFICE': ['CLIMATE', 'ENERGY', 'INDUSTRIAL', 'SOCIAL_IMPACT'],
  'BANK': ['INDUSTRIAL'],
  'STRATEGIC': ['DEFENCE', 'ENERGY', 'INDUSTRIAL', 'INFRASTRUCTURE'],
  'GOVERNMENT': ['CLIMATE', 'DEFENCE', 'ENERGY', 'INFRASTRUCTURE', 'SOCIAL_IMPACT'],
};

// Default focus by type (for autocorrection)
const DEFAULT_FOCUS: Record<string, string> = {
  'GRANT': 'DEEP_TECH',
  'VC': 'DEEP_TECH',
  'CVC': 'ENERGY',
  'FAMILY_OFFICE': 'INDUSTRIAL',
  'BANK': 'INDUSTRIAL',
  'STRATEGIC': 'INFRASTRUCTURE',
  'GOVERNMENT': 'DEFENCE',
};

// Cache
const CACHE_DIR = path.join(process.cwd(), '.gemini-cache');

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function normalizeForWhitelist(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function ensureCacheDir() {
  try { await fs.mkdir(CACHE_DIR, { recursive: true }); } catch {}
}

async function getFromCache(key: string): Promise<object | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch { return null; }
}

async function saveToCache(key: string, data: object) {
  try {
    await ensureCacheDir();
    await fs.writeFile(path.join(CACHE_DIR, `${key}.json`), JSON.stringify(data, null, 2));
  } catch {}
}

function validateAndCorrect(type: string, focus: string): { type: string; focus: string; corrected: boolean } {
  const validTypes = Object.keys(VALID_COMBINATIONS);

  // Validate type
  if (!validTypes.includes(type)) {
    type = 'VC';
  }

  // Validate focus for this type
  const validFocuses = VALID_COMBINATIONS[type];
  if (!validFocuses.includes(focus)) {
    focus = DEFAULT_FOCUS[type];
    return { type, focus, corrected: true };
  }

  return { type, focus, corrected: false };
}

export async function POST(req: NextRequest) {
  const { fundName } = await req.json();

  if (!fundName || typeof fundName !== 'string' || fundName.trim().length < 2) {
    return NextResponse.json({
      status: 'REJECTED',
      message: 'Please enter a valid organization name.',
    }, { headers: { 'Cache-Control': 'no-store, no-cache' } });
  }

  const normalized = normalizeForWhitelist(fundName);
  const cacheKey = normalizeName(fundName);

  // === LEVEL 1: WHITELIST ===
  const whitelisted = WHITELIST[normalized];
  if (whitelisted) {
    const result = {
      ...whitelisted,
      status: 'OK',
      confidence: 1.0,
      source: 'whitelist',
      language: `${whitelisted.focus.toLowerCase()}, ${whitelisted.type.toLowerCase()}`,
    };
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store, no-cache' } });
  }

  // Check cache
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'no-store, no-cache' } });
  }

  // === LEVEL 2: GEMINI + VALIDATION ===
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Analyze the organization "${fundName}".

Is this a legitimate investment organization, corporate partner, or government body that might invest in or partner with a deep-tech hardware startup?

If YES, classify it:
TYPE (exactly one): GRANT | VC | CVC | FAMILY_OFFICE | BANK | STRATEGIC | GOVERNMENT
FOCUS (exactly one): DEEP_TECH | CLIMATE | DEFENCE | ENERGY | INDUSTRIAL | INFRASTRUCTURE | SOCIAL_IMPACT

FOCUS PRIORITY (CRITICAL!):
If the organization invests in MULTIPLE areas, use this priority order:
1. DEFENCE — if they mention: defence, military, security, dual-use, NATO, sovereignty → choose DEFENCE
2. CLIMATE — if they mention: CO2, emissions, climate, decarbonization → choose CLIMATE
3. ENERGY — if they mention: energy, grid, renewables, storage → choose ENERGY
4. DEEP_TECH — if they mention: AI, deep tech, frontier tech → choose DEEP_TECH
5. Others as fallback

Example: "invests in defence, energy and infrastructure" → DEFENCE (highest priority)

VALID COMBINATIONS:
- GRANT: DEEP_TECH, CLIMATE, DEFENCE, ENERGY, INFRASTRUCTURE, SOCIAL_IMPACT
- VC: any focus
- CVC: CLIMATE, ENERGY, INDUSTRIAL, INFRASTRUCTURE
- FAMILY_OFFICE: CLIMATE, ENERGY, INDUSTRIAL, SOCIAL_IMPACT
- BANK: INDUSTRIAL only
- STRATEGIC: DEFENCE, ENERGY, INDUSTRIAL, INFRASTRUCTURE
- GOVERNMENT: CLIMATE, DEFENCE, ENERGY, INFRASTRUCTURE, SOCIAL_IMPACT

If NO (random text, spam, competitor, irrelevant), return confidence: 0.

Return ONLY JSON:
{"name":"Official name","type":"TYPE","focus":"FOCUS","thesis":"one sentence","confidence":0.0-1.0}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    const confidence = parsed.confidence ?? 0.5;

    // === LEVEL 3: RESPONSE STATUS ===
    if (confidence < 0.3) {
      return NextResponse.json({
        status: 'REJECTED',
        message: `"${fundName}" is not identified as a potential investment partner.`,
        confidence,
      }, { headers: { 'Cache-Control': 'no-store, no-cache' } });
    }

    // Validate and correct type×focus combination
    const { type, focus, corrected } = validateAndCorrect(parsed.type, parsed.focus);

    const response = {
      name: parsed.name || fundName,
      type,
      focus,
      thesis: parsed.thesis || 'Investment organization',
      language: `${focus.toLowerCase().replace('_', ' ')}, ${type.toLowerCase().replace('_', ' ')}`,
      status: confidence >= 0.7 ? 'OK' : 'UNCERTAIN',
      confidence,
      corrected,
      source: 'gemini',
    };

    // Only cache high-confidence results
    if (confidence >= 0.7) {
      await saveToCache(cacheKey, response);
    }

    return NextResponse.json(response, { headers: { 'Cache-Control': 'no-store, no-cache' } });

  } catch (e) {
    console.error('Gemini error:', e);
    return NextResponse.json({
      status: 'UNCERTAIN',
      name: fundName,
      type: 'VC',
      focus: 'DEEP_TECH',
      thesis: 'Organization',
      confidence: 0.4,
      message: 'Could not fully verify this organization. Proceed?',
    }, { headers: { 'Cache-Control': 'no-store, no-cache' } });
  }
}
