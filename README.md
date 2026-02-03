# iONE Pitch Deck - Adaptive Presentation System

An AI-powered interactive pitch deck that adapts content based on the investor type and focus area. Built with Next.js, Gemini AI, and real-time voice synthesis.

**Live:** https://pitchdeck.gtlab.org

## Overview

This is not a static presentation. It's an intelligent system that:

1. **Identifies** the organization using Gemini AI
2. **Classifies** them by type (GRANT, VC, CVC, BANK, etc.) and focus (CLIMATE, DEFENCE, ENERGY, etc.)
3. **Adapts** the entire presentation flow to speak their language

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│                    "World Fund"                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GEMINI API                                   │
│  POST /api/gemini                                                │
│  Returns: { type: "VC", focus: "CLIMATE", ceo: "...", ... }     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 5 ADAPTATION POINTS                              │
│                                                                  │
│  1. GREETING      → type × focus × language                     │
│  2. HERO SCREEN   → focus (metric that matters to them)         │
│  3. TOPIC ORDER   → type (what they want to see first)          │
│  4. TOPIC CONTENT → same for all (the facts don't change)       │
│  5. ASK SCREEN    → type (how we're asking for money)           │
└─────────────────────────────────────────────────────────────────┘
```

## Two-Level Classification

### Level 1: Organization Type

| Type | Who | What They Care About |
|------|-----|---------------------|
| `GRANT` | EIC, Horizon, national programs | Impact, TRL, EU strategic value |
| `VC` | Seed/Series A funds | Return, exit, growth rate |
| `CVC` | Corporate VC (Equinor, Shell) | Strategic fit with their business |
| `FAMILY_OFFICE` | Private wealth managers | Stability, ESG, tangible assets |
| `BANK` | KfW, EIB, commercial banks | Collateral, cash flow, guarantees |
| `STRATEGIC` | Aramco, Deutsche Telekom | Solving their specific problem |
| `GOVERNMENT` | Ministries, NATO, Bundeswehr | Sovereignty, jobs, security |

### Level 2: Focus Area

| Focus | Key Metrics | What We Show First |
|-------|-------------|-------------------|
| `DEEP_TECH` | Dataset, AI, IP, TRL | AION, edge AI, proprietary data |
| `CLIMATE` | CO₂, diesel replaced | 21t CO₂/unit, 40M litres Y5 |
| `DEFENCE` | MIL-STD, sovereignty | No convoys, 12 days autonomy |
| `ENERGY` | Grid resilience, storage | Solar integration, backup |
| `INDUSTRIAL` | Margins, scale | Unit economics, factory |
| `INFRASTRUCTURE` | Reliability, MTBF | 30 min deploy, autonomous |
| `SOCIAL_IMPACT` | Access, affordability | Home Edition €10k |

## 5 Adaptation Points

### 1. Personalized Greeting (type × focus)

```javascript
// World Fund (VC + CLIMATE):
"Welcome. iONE eliminates diesel from remote infrastructure.
Twenty-one tonnes of CO₂ per unit, per year."

// Bundeswehr (GOVERNMENT + DEFENCE):
"Welcome. Autonomous power supply, MIL-STD-810H certified.
EU manufactured. No supply chain dependency."
```

### 2. Hero Screen (by focus)

Shows the ONE metric that matters most to them:

| Focus | Headline | Metric |
|-------|----------|--------|
| CLIMATE | Eliminating Diesel from Remote Infrastructure | 21t CO₂ avoided/year |
| DEFENCE | Autonomous Power. No Supply Chain. | 12 days autonomy |
| INDUSTRIAL | Hardware with Software Margins | €5.8B market |
| ENERGY | Grid Independence in a Box | 4.32 kWp + 48 kWh |

### 3. Topic Order (by type)

Topics are sorted by what matters to each investor type:

```javascript
GRANT:    [Climate → Tech → Economics → Defence → Market → Team → Production → Financials]
VC:       [Economics → Market → Tech → Production → Climate → Team → Defence → Financials]
BANK:     [Production → Economics → Market → Team → Tech → Defence → Climate → Financials]
STRATEGIC:[Defence → Market → Economics → Tech → Production → Team → Climate → Financials]
```

### 4. Topic Content

**Same for everyone.** The facts don't change — only the order and framing.

### 5. ASK Screen (by type)

Seven completely different final screens:

| Type | Format | Key Elements |
|------|--------|--------------|
| GRANT | Work Packages | WP1-WP12, Grant €2.35M + Equity €10M |
| VC | Use of Funds | Progress bars, Unit Economics, Series A trigger |
| CVC | Pilot Proposal | 5 stations, €250k, 90-day deployment |
| FAMILY_OFFICE | Seed Terms | €2.5M for 15-20%, anti-dilution |
| BANK | Balance Sheet | Collateral breakdown, cash flow projection |
| STRATEGIC | Deployment | Problem/Solution, Pilot terms, Volume pricing |
| GOVERNMENT | Procurement | Certifications, EU compliance, jobs |

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **AI:** Google Gemini 2.0 Flash
- **Voice:** ElevenLabs (primary) / OpenAI TTS (fallback)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Deployment:** PM2 + Nginx

## Project Structure

```
pitchdeck-ione/
├── app/
│   ├── page.tsx           # Main application (900+ lines)
│   ├── TechDemo.tsx       # Interactive tech demonstration
│   ├── MissionControl.tsx # Fleet monitoring demo
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   └── api/
│       ├── gemini/route.ts # Gemini AI endpoint
│       └── tts/route.ts    # Text-to-speech endpoint
├── public/
│   ├── audio/             # Pre-cached voice files (18 files)
│   ├── RoboPitch.png      # Robot avatar
│   ├── iceland.jpg        # Climate topic background
│   ├── autonomous.jpg     # Intro sequence
│   └── *.mp4              # Video assets
├── .gemini-cache/         # Cached Gemini responses
├── .tts-cache/            # Cached TTS audio
└── .env.local             # API keys
```

## API Endpoints

### POST /api/gemini

Analyzes organization and returns classification.

**Request:**
```json
{ "fundName": "World Fund" }
```

**Response:**
```json
{
  "name": "World Fund",
  "type": "VC",
  "focus": "CLIMATE",
  "thesis": "European climate VC investing in companies with 100Mt+ CO₂ reduction potential",
  "ceo": "Daria Saharova",
  "language": "climate tech, decarbonization, planetary boundaries"
}
```

### POST /api/tts

Converts text to speech using ElevenLabs or OpenAI.

**Request:**
```json
{ "text": "Welcome to iONE" }
```

**Response:** Audio blob (MP3)

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional fallback
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "pitchdeck-ione" -- start

# Save PM2 config
pm2 save
```

## Caching Strategy

### Gemini Cache
- Responses cached by normalized organization name
- Cache location: `.gemini-cache/`
- Cache key: `lowercase_underscore_name.json`
- No expiration (manual clear if needed)

### TTS Cache
- Audio cached by text hash
- Cache location: `.tts-cache/`
- Reduces API calls for repeated phrases

### Pre-cached Audio
- 18 pre-recorded audio files in `/public/audio/`
- Used for: greeting, topics, transitions
- Ensures consistent quality and instant playback

## Testing Classification

```bash
# Test GRANT
curl -X POST https://pitchdeck.gtlab.org/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"fundName": "EIC Accelerator"}'

# Test VC
curl -X POST https://pitchdeck.gtlab.org/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"fundName": "Sequoia Capital"}'

# Test BANK
curl -X POST https://pitchdeck.gtlab.org/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"fundName": "KfW"}'
```

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `app/page.tsx` | Main app with all adaptation logic | ~1100 |
| `app/api/gemini/route.ts` | AI classification endpoint | ~100 |
| `app/TechDemo.tsx` | Interactive tech demonstration | ~400 |

## Data Structures

### TOPIC_ORDER
Maps organization type to topic display order.

### HERO_SCREEN
Maps focus area to hero metrics and headlines.

### ASK_CONTENT
Complete content for 7 different ASK screen formats.

### GREETING_TEMPLATES
21 greeting variations for type×focus combinations.

## Flow Diagram

```
[Voice Prompt] → [Intro Video] → [Organization Input]
                                        │
                                        ▼
                                 [Gemini Analysis]
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │     HERO SCREEN       │
                            │  (adapted by focus)   │
                            └───────────┬───────────┘
                                        │
                                        ▼
                            ┌───────────────────────┐
                            │      TOPICS GRID      │
                            │  (sorted by type)     │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              [Topic 1]           [Topic N]         [FINANCIALS]
                                                          │
                                                          ▼
                                                ┌─────────────────┐
                                                │   ASK SCREEN    │
                                                │ (7 variants by  │
                                                │      type)      │
                                                └─────────────────┘
```

## Credits

- **Product:** GT GmbH, Berlin
- **AI Integration:** Gemini 2.0 Flash
- **Voice:** ElevenLabs (Daniel voice)

## License

Proprietary - GT GmbH

---

*Built for investors who speak different languages. Same product. Different story.*
