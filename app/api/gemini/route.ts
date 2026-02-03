import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Cache directory for Gemini responses
const CACHE_DIR = path.join(process.cwd(), '.gemini-cache');

// Normalize fund name for cache key (lowercase, remove extra spaces)
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

async function getFromCache(key: string): Promise<object | null> {
  try {
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    console.log('Gemini cache hit:', key);
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveToCache(key: string, data: object) {
  try {
    await ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('Gemini cached:', key);
  } catch (e) {
    console.error('Gemini cache save error:', e);
  }
}

export async function POST(req: NextRequest) {
  const { fundName } = await req.json();

  // Check cache first
  const cacheKey = normalizeName(fundName);
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `Research the investment firm/organization "${fundName}".

IMPORTANT CLARIFICATIONS:
- "EIC" = European Innovation Council (EU funding body for breakthrough innovation)
- "EIF" = European Investment Fund
- "EIP" = European Innovation Partnership (different from EIC!)
- "HTGF" = High-Tech Gründerfonds (German seed VC)
- "KfW" = Kreditanstalt für Wiederaufbau (German development bank)

IMPORTANT: Find the CEO, Managing Partner, or Managing Director name. This is required.

Return ONLY valid JSON in this exact format:
{"name":"Official full name","type":"GRANT|VC|CVC|FAMILY_OFFICE|BANK|STRATEGIC|GOVERNMENT","focus":"DEEP_TECH|CLIMATE|DEFENCE|ENERGY|INDUSTRIAL|INFRASTRUCTURE|SOCIAL_IMPACT","thesis":"one sentence about their investment focus","ceo":"Name of CEO or Managing Partner or Managing Director","language":"key terms this org uses"}

=== TWO-LEVEL CLASSIFICATION (CRITICAL!) ===

LEVEL 1 - TYPE (pick exactly one):
- GRANT — public funding body, EU program, national innovation agency, foundation (EIC, Horizon, national programs)
- VC — venture capital fund, seed/series investor (HTGF, Sequoia, a]6z)
- CVC — corporate venture arm of large company (Equinor Ventures, Shell Ventures, E.ON Ventures)
- FAMILY_OFFICE — private wealth, family investment vehicle
- BANK — development bank, commercial lender, debt provider (KfW, EIB, commercial banks)
- STRATEGIC — potential customer or partner evaluating technology (Aramco, Deutsche Telekom, MANITOU)
- GOVERNMENT — ministry, military, procurement agency (Bundeswehr, NATO, ministries)

LEVEL 2 - FOCUS (pick exactly one based on their investment thesis):
- DEEP_TECH — interested in AI, IP, dataset, technology moat, TRL
- CLIMATE — interested in CO₂ reduction, emissions, Green Deal, ESG
- DEFENCE — interested in military, dual-use, sovereignty, NATO, security
- ENERGY — interested in renewables, grid, storage, energy transition
- INDUSTRIAL — interested in margins, production scale, unit economics, returns
- INFRASTRUCTURE — interested in reliability, deployment, uptime, operations
- SOCIAL_IMPACT — interested in access, affordability, humanitarian applications

=== EXAMPLES ===
EIC Accelerator → type: "GRANT", focus: "DEEP_TECH"
World Fund → type: "VC", focus: "CLIMATE"
NATO Innovation Fund → type: "VC", focus: "DEFENCE"
HTGF → type: "VC", focus: "DEEP_TECH"
SET Ventures → type: "VC", focus: "ENERGY"
Equinor Ventures → type: "CVC", focus: "ENERGY"
Shell Ventures → type: "CVC", focus: "INFRASTRUCTURE"
KfW → type: "BANK", focus: "INDUSTRIAL"
Bundeswehr → type: "GOVERNMENT", focus: "DEFENCE"
Aramco → type: "STRATEGIC", focus: "ENERGY"
Deutsche Telekom → type: "STRATEGIC", focus: "INFRASTRUCTURE"

If you cannot find the leader's name, use the most senior partner name you can find.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('No JSON');

    const parsed = JSON.parse(match[0]);

    // Save to cache
    await saveToCache(cacheKey, parsed);

    return NextResponse.json(parsed);
  } catch (e) {
    console.error('Gemini error:', e);
    const fallback = {
      name: fundName,
      type: 'VC',
      focus: 'DEEP_TECH',
      thesis: 'innovative technology',
      ceo: null,
      language: 'technology, innovation'
    };
    // Don't cache errors
    return NextResponse.json(fallback);
  }
}
