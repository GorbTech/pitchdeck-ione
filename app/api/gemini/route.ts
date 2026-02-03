import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// === LEVEL 1: WHITELIST ===
// Known organizations - instant response, no API call
const WHITELIST: Record<string, { name: string; type: string; focus: string; ceo: string; thesis: string }> = {
  // GRANT + DEEP_TECH
  'eic': { name: 'European Innovation Council', type: 'GRANT', focus: 'DEEP_TECH', ceo: 'Jean-David Malo', thesis: 'Breakthrough innovation funding for deep tech startups' },
  'eic accelerator': { name: 'EIC Accelerator', type: 'GRANT', focus: 'DEEP_TECH', ceo: 'Jean-David Malo', thesis: 'Grant + equity funding for breakthrough innovations' },
  'horizon europe': { name: 'Horizon Europe', type: 'GRANT', focus: 'DEEP_TECH', ceo: 'Marc Lemaître', thesis: 'EU research and innovation framework programme' },
  'horizon 2020': { name: 'Horizon 2020', type: 'GRANT', focus: 'DEEP_TECH', ceo: 'Marc Lemaître', thesis: 'EU research and innovation programme 2014-2020' },

  // GRANT + CLIMATE
  'eic climate': { name: 'EIC Climate', type: 'GRANT', focus: 'CLIMATE', ceo: 'Jean-David Malo', thesis: 'Climate tech breakthrough funding' },
  'innovation fund': { name: 'EU Innovation Fund', type: 'GRANT', focus: 'CLIMATE', ceo: 'Kurt Vandenberghe', thesis: 'Large-scale climate innovation funding' },

  // VC + CLIMATE
  'world fund': { name: 'World Fund', type: 'VC', focus: 'CLIMATE', ceo: 'Daria Saharova', thesis: 'Climate tech VC targeting 100Mt CO₂ reduction potential' },
  'pale blue dot': { name: 'Pale Blue Dot', type: 'VC', focus: 'CLIMATE', ceo: 'Heidi Lindvall', thesis: 'European climate tech venture capital' },
  'extantia': { name: 'Extantia', type: 'VC', focus: 'CLIMATE', ceo: 'Michael Stephan', thesis: 'Climate tech VC for carbon removal and reduction' },

  // VC + DEEP_TECH
  'htgf': { name: 'High-Tech Gründerfonds', type: 'VC', focus: 'DEEP_TECH', ceo: 'Alex von Frankenberg', thesis: 'German seed VC for technology startups' },
  'high-tech gründerfonds': { name: 'High-Tech Gründerfonds', type: 'VC', focus: 'DEEP_TECH', ceo: 'Alex von Frankenberg', thesis: 'German seed VC for technology startups' },
  'sequoia': { name: 'Sequoia Capital', type: 'VC', focus: 'DEEP_TECH', ceo: 'Roelof Botha', thesis: 'Global venture capital for transformative companies' },
  'sequoia capital': { name: 'Sequoia Capital', type: 'VC', focus: 'DEEP_TECH', ceo: 'Roelof Botha', thesis: 'Global venture capital for transformative companies' },
  'a16z': { name: 'Andreessen Horowitz', type: 'VC', focus: 'DEEP_TECH', ceo: 'Marc Andreessen', thesis: 'Software eating the world' },
  'andreessen horowitz': { name: 'Andreessen Horowitz', type: 'VC', focus: 'DEEP_TECH', ceo: 'Marc Andreessen', thesis: 'Software eating the world' },
  'lakestar': { name: 'Lakestar', type: 'VC', focus: 'DEEP_TECH', ceo: 'Klaus Hommels', thesis: 'European tech venture capital' },

  // VC + DEFENCE
  'nato innovation fund': { name: 'NATO Innovation Fund', type: 'VC', focus: 'DEFENCE', ceo: 'Andrea Traversone', thesis: 'Deep tech for defence and security' },
  'nato if': { name: 'NATO Innovation Fund', type: 'VC', focus: 'DEFENCE', ceo: 'Andrea Traversone', thesis: 'Deep tech for defence and security' },
  'decisive point': { name: 'Decisive Point', type: 'VC', focus: 'DEFENCE', ceo: 'John Walters', thesis: 'Critical technologies for defence, energy and infrastructure' },

  // VC + ENERGY
  'set ventures': { name: 'SET Ventures', type: 'VC', focus: 'ENERGY', ceo: 'Rene Savelsberg', thesis: 'Energy transition venture capital' },
  'energy impact partners': { name: 'Energy Impact Partners', type: 'VC', focus: 'ENERGY', ceo: 'Hans Kobler', thesis: 'Energy transition and sustainability' },

  // CVC + ENERGY
  'equinor ventures': { name: 'Equinor Ventures', type: 'CVC', focus: 'ENERGY', ceo: 'Gareth Burns', thesis: 'Energy transition corporate venture capital' },
  'shell ventures': { name: 'Shell Ventures', type: 'CVC', focus: 'ENERGY', ceo: 'Geert van de Wouw', thesis: 'Energy and mobility innovation' },
  'bp ventures': { name: 'BP Ventures', type: 'CVC', focus: 'ENERGY', ceo: 'Meghan Sharp', thesis: 'Energy transition and decarbonization' },
  'eon ventures': { name: 'E.ON Ventures', type: 'CVC', focus: 'ENERGY', ceo: 'Jan Lozek', thesis: 'Energy innovation and grid solutions' },
  'e.on ventures': { name: 'E.ON Ventures', type: 'CVC', focus: 'ENERGY', ceo: 'Jan Lozek', thesis: 'Energy innovation and grid solutions' },

  // BANK + INDUSTRIAL
  'kfw': { name: 'KfW', type: 'BANK', focus: 'INDUSTRIAL', ceo: 'Stefan Wintels', thesis: 'German development bank for sustainable growth' },
  'kreditanstalt für wiederaufbau': { name: 'KfW', type: 'BANK', focus: 'INDUSTRIAL', ceo: 'Stefan Wintels', thesis: 'German development bank for sustainable growth' },
  'eib': { name: 'European Investment Bank', type: 'BANK', focus: 'INDUSTRIAL', ceo: 'Werner Hoyer', thesis: 'EU long-term lending institution' },
  'european investment bank': { name: 'European Investment Bank', type: 'BANK', focus: 'INDUSTRIAL', ceo: 'Werner Hoyer', thesis: 'EU long-term lending institution' },
  'deutsche bank': { name: 'Deutsche Bank', type: 'BANK', focus: 'INDUSTRIAL', ceo: 'Christian Sewing', thesis: 'Global financial services' },

  // GOVERNMENT + DEFENCE
  'bundeswehr': { name: 'Bundeswehr', type: 'GOVERNMENT', focus: 'DEFENCE', ceo: 'Boris Pistorius', thesis: 'German armed forces procurement' },
  'nato': { name: 'NATO', type: 'GOVERNMENT', focus: 'DEFENCE', ceo: 'Mark Rutte', thesis: 'Alliance defence and security' },
  'bwi': { name: 'BWI GmbH', type: 'GOVERNMENT', focus: 'DEFENCE', ceo: 'Martin Kaloudis', thesis: 'Bundeswehr IT services' },

  // STRATEGIC + ENERGY
  'aramco': { name: 'Saudi Aramco', type: 'STRATEGIC', focus: 'ENERGY', ceo: 'Amin H. Nasser', thesis: 'Global energy leader diversifying portfolio' },
  'saudi aramco': { name: 'Saudi Aramco', type: 'STRATEGIC', focus: 'ENERGY', ceo: 'Amin H. Nasser', thesis: 'Global energy leader diversifying portfolio' },
  'vattenfall': { name: 'Vattenfall', type: 'STRATEGIC', focus: 'ENERGY', ceo: 'Anna Borg', thesis: 'Fossil-free energy within one generation' },

  // STRATEGIC + INFRASTRUCTURE
  'deutsche telekom': { name: 'Deutsche Telekom', type: 'STRATEGIC', focus: 'INFRASTRUCTURE', ceo: 'Tim Höttges', thesis: 'Telecommunications infrastructure' },
  'vodafone': { name: 'Vodafone', type: 'STRATEGIC', focus: 'INFRASTRUCTURE', ceo: 'Margherita Della Valle', thesis: 'Connectivity and digital services' },
  'siemens': { name: 'Siemens', type: 'STRATEGIC', focus: 'INFRASTRUCTURE', ceo: 'Roland Busch', thesis: 'Industrial automation and digitalization' },
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
{"name":"Official name","type":"TYPE","focus":"FOCUS","thesis":"one sentence","ceo":"CEO name or null","confidence":0.0-1.0}`;

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
      ceo: parsed.ceo || null,
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
      ceo: null,
      confidence: 0.4,
      message: 'Could not fully verify this organization. Proceed?',
    }, { headers: { 'Cache-Control': 'no-store, no-cache' } });
  }
}
