'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, Loader2 } from 'lucide-react';
import Image from 'next/image';
import TechDemo from './TechDemo';

const TOPICS = [
  { id: 'climate', title: 'PLANETARY SYMBIOSIS', color: '#0EA5E9' },
  { id: 'defence', title: 'LOGISTICS IMMUNITY', color: '#1F2937' },
  { id: 'economics', title: 'ACCESSIBLE AUTONOMY', color: '#059669' },
  { id: 'tech', title: 'SYMBIOTIC INTELLIGENCE', color: '#4F46E5' },
  { id: 'team', title: 'BUILDERS OF INTENT', color: '#78716C' },
  { id: 'production', title: 'SCALING AUTONOMY', color: '#D97706' },
  { id: 'market', title: 'WHERE AUTONOMY MATTERS', color: '#0891B2' },
  { id: 'financials', title: 'INVESTING IN EVOLUTION', color: '#1E40AF' },
];

// Structured data for special topic layouts
const CLIMATE_DATA = {
  title: 'PLANETARY SYMBIOSIS',
  lines: [
    { value: '8,000 L', text: 'diesel replaced per unit annually' },
    { value: '21 tonnes', text: 'CO₂ avoided per unit annually' },
    { value: '105,000 t', text: 'CO₂ avoided at fleet scale (5,000 units)' },
    { value: 'Zero emissions', text: '· Silent operation' },
  ]
};

const TOPIC_TEXT: Record<string, string> = {
  climate: "PLANETARY SYMBIOSIS\n\n8,000 L diesel replaced per unit annually\n21 tonnes CO₂ avoided per unit annually\n105,000 t CO₂ avoided at fleet scale (5,000 units)\nZero emissions · Silent operation",
  defence: "LOGISTICS IMMUNITY\n\nMIL-STD-810H    certified platform\n180° fold       90% thermal signature reduction\n30 min          full relocation\n12 days         autonomy without sun\n\nEnergy arrives silently. Continuously. Independently.",
  economics: "ACCESSIBLE AUTONOMY\n\niONE             €15,000 – €25,000\nCompetitors      €50,000 – €90,000\n\n3–4×             cost advantage\n50–75%           gross margin\n€49/month        SaaS monitoring\n<3 years         customer payback vs diesel\n\nIndependence — affordable, deployable, yours.",
  tech: "SYMBIOTIC INTELLIGENCE\n\niONEOS           Edge AI platform\n4.32 kWp         dual-axis solar tracking\n16–48 kWh        LiFePO4 storage\n>2σ              anomaly detection\n7+ days          predictive maintenance\n>80 km/h         automatic storm protection\n\nEnergy that thinks with you.",
  team: "BUILDERS OF INTENT\n\nIvan Gorb         CEO\n                  Oil refinery operations, €20M+ assets\n\nVitaly Tenkov     CTO\n                  200+ solar installations, Scandinavia\n\nMarina Guseva     CDO\n                  10+ years SCADA, industrial IoT\n\nMariia Khodorkova COO\n                  Logistics, UN38.3 & CE certification\n\nOleksandr Sharov  Defence Advisor\n                  Ukraine combat engineer, EW specialist\n\nWe know infrastructure. Now we're giving it a heartbeat.",
  production: "SCALING AUTONOMY\n\nPhase 1          M1–M4\n60 units         Certification batch, China\n                 Field validation across climate zones\n\nPhase 2          M24\n3,000 m²         Assembly facility, Germany\n250 units/month  Production capacity\n\nProprietary aluminum extrusion die — owned\nEU component alternatives — qualified\n\n25-year structural design life",
  market: "WHERE AUTONOMY MATTERS\n\nPrimary     EU — Germany, Poland, Balkans\nYear 3      MENA pilots, Nordic expansion\nYear 5      Full scale\n\nSEGMENTS\nTelecom towers         replacing diesel generators\nOil & Gas              pipeline and wellhead monitoring\nAgriculture            autonomous irrigation\nDefence                border security, forward bases\nConstruction           temporary site power\nEV Charging            remote locations\n\nTAM €500M+ extreme environments",
  financials: "INVESTING IN EVOLUTION\n\n€2.5M Seed  ·  EIC €12.35M (€2.35M grant + €10M equity)\n\nY1 200 units €2.2M  ·  Y3 2,500 units €36M  ·  Y5 5,000 units €90M\n\nBreakeven M36  ·  Factory €3.5M  ·  Working capital €3M  ·  Team €2M\n\nStatic → Driven → Autonomous\nThe next stage of how things exist."
};

// Pre-cached audio files
const CACHED_AUDIO: Record<string, string> = {
  greeting: '/audio/greeting.mp3',
  analyzing: '/audio/analyzing.mp3',
  back: '/audio/back.mp3',
  climate: '/audio/climate.mp3',
  defence: '/audio/defence.mp3',
  economics: '/audio/economics.mp3',
  tech: '/audio/tech.mp3',
  team: '/audio/team.mp3',
  production: '/audio/production.mp3',
  market: '/audio/market.mp3',
  financials: '/audio/financials.mp3',
};

// === ADAPTATION SYSTEM ===

type OrgType = 'GRANT' | 'VC' | 'CVC' | 'FAMILY_OFFICE' | 'BANK' | 'STRATEGIC' | 'GOVERNMENT';
type OrgFocus = 'DEEP_TECH' | 'CLIMATE' | 'DEFENCE' | 'ENERGY' | 'INDUSTRIAL' | 'INFRASTRUCTURE' | 'SOCIAL_IMPACT';

// Topic order by investor type
const TOPIC_ORDER: Record<OrgType, string[]> = {
  GRANT: ['climate', 'tech', 'economics', 'defence', 'market', 'team', 'production', 'financials'],
  VC: ['economics', 'market', 'tech', 'production', 'climate', 'team', 'defence', 'financials'],
  CVC: ['market', 'defence', 'economics', 'tech', 'production', 'team', 'climate', 'financials'],
  FAMILY_OFFICE: ['economics', 'climate', 'market', 'production', 'tech', 'team', 'defence', 'financials'],
  BANK: ['production', 'economics', 'market', 'team', 'tech', 'defence', 'climate', 'financials'],
  STRATEGIC: ['defence', 'market', 'economics', 'tech', 'production', 'team', 'climate', 'financials'],
  GOVERNMENT: ['climate', 'defence', 'market', 'production', 'team', 'economics', 'tech', 'financials'],
};

// Hero screen by focus
const HERO_SCREEN: Record<OrgFocus, { headline: string; subline: string; metric: string; metricLabel: string }> = {
  DEEP_TECH: {
    headline: "Infrastructure Intelligence",
    subline: "Predictive model trained on fleet telemetry",
    metric: "2M data points/hour",
    metricLabel: "from 50 autonomous stations",
  },
  CLIMATE: {
    headline: "Eliminating Diesel from Remote Infrastructure",
    subline: "Measurable, verifiable, permanent",
    metric: "21t CO₂",
    metricLabel: "avoided per unit annually",
  },
  DEFENCE: {
    headline: "Autonomous Power. No Supply Chain.",
    subline: "MIL-STD-810H certified, EU manufactured",
    metric: "12 days",
    metricLabel: "full autonomy without resupply",
  },
  ENERGY: {
    headline: "Grid Independence in a Box",
    subline: "Connects to existing rooftop solar",
    metric: "4.32 kWp",
    metricLabel: "generation + 48 kWh storage",
  },
  INDUSTRIAL: {
    headline: "Hardware with Software Margins",
    subline: "€10k entry point, 50% gross margin",
    metric: "€5.8B",
    metricLabel: "addressable market in EU",
  },
  INFRASTRUCTURE: {
    headline: "Deploy in 30 Minutes. Runs for Decades.",
    subline: "No crane, no permits, no maintenance crew",
    metric: "250 units/month",
    metricLabel: "production capacity at scale",
  },
  SOCIAL_IMPACT: {
    headline: "Affordable Autonomous Energy for Everyone",
    subline: "From €10,000 — less than a used car",
    metric: "380,000",
    metricLabel: "EU homes without reliable power",
  },
};

// The Ask screen by type
const ASK_SCREEN: Record<OrgType, { title: string; primary: string; secondary: string; format: string; cta: string }> = {
  GRANT: {
    title: "EIC Accelerator Application",
    primary: "Grant: €2,350,000",
    secondary: "Equity: €10,000,000",
    format: "work_packages",
    cta: "Application submitted March 2026",
  },
  VC: {
    title: "Raising: €2.5M Seed",
    primary: "Seed: €2,500,000",
    secondary: "Next: €10M Series A (post-certification)",
    format: "use_of_funds",
    cta: "Term sheet stage",
  },
  CVC: {
    title: "Pilot Partnership",
    primary: "5-unit pilot: €250,000",
    secondary: "Framework agreement after validation",
    format: "pilot_proposal",
    cta: "Ready to deploy Q3 2026",
  },
  FAMILY_OFFICE: {
    title: "Seed Investment",
    primary: "€2,500,000 for 15-20% equity",
    secondary: "Pre-money: €10-12M",
    format: "use_of_funds",
    cta: "Direct equity, board observer seat",
  },
  BANK: {
    title: "Growth Financing",
    primary: "€3,500,000 facility construction",
    secondary: "Asset-backed: land + building + equipment",
    format: "balance_sheet",
    cta: "Post-certification, M18+",
  },
  STRATEGIC: {
    title: "Partnership Proposal",
    primary: "Pilot deployment at your sites",
    secondary: "Volume pricing from 100+ units",
    format: "pilot_proposal",
    cta: "LOI stage — deploy within 90 days",
  },
  GOVERNMENT: {
    title: "EU-Manufactured Autonomous Energy",
    primary: "MIL-STD-810H certified",
    secondary: "30 jobs in Germany, EU supply chain",
    format: "procurement",
    cta: "Procurement-ready post-certification",
  },
};

// === DETAILED ASK CONTENT BY TYPE ===

const ASK_CONTENT = {
  GRANT: {
    title: 'EIC ACCELERATOR 2026',
    columns: [
      {
        header: 'Grant: €2,350,000',
        items: [
          { code: 'WP1', name: 'Components', amount: '€620k' },
          { code: 'WP2', name: 'Certification', amount: '€600k' },
          { code: 'WP3', name: 'Wind Hybrid', amount: '€150k' },
          { code: 'WP4', name: 'Exhibitions', amount: '€280k' },
          { code: 'WP5', name: 'Suppliers', amount: '€50k' },
          { code: 'WP6', name: 'Personnel', amount: '€550k' },
          { code: 'WP7', name: 'Management', amount: '€100k' },
        ]
      },
      {
        header: 'Equity: €10,000,000',
        items: [
          { code: 'WP8', name: 'Factory', amount: '€3,500k' },
          { code: 'WP9', name: 'Working Cap', amount: '€3,000k' },
          { code: 'WP10', name: 'Team 30 FTE', amount: '€2,000k' },
          { code: 'WP11', name: 'Market', amount: '€500k' },
          { code: 'WP12', name: 'Contingency', amount: '€1,000k' },
        ]
      }
    ],
    footer: { total: 'Total: €12,350,000', cta: 'Submission: March 2026' }
  },

  VC: {
    title: 'RAISING: €2.5M SEED',
    useOfFunds: [
      { label: '60 stations + certification', amount: '€1,220k', percent: 49 },
      { label: 'Market entry + exhibitions', amount: '€280k', percent: 11 },
      { label: 'Team (24 months)', amount: '€550k', percent: 22 },
      { label: 'Wind hybrid R&D', amount: '€150k', percent: 6 },
      { label: 'Operations', amount: '€300k', percent: 12 },
    ],
    unitEconomics: [
      { edition: 'Home', price: '€10,000', cost: '€6,000', margin: '40%' },
      { edition: 'Continental', price: '€17,500', cost: '€8,750', margin: '50%' },
    ],
    nextRound: {
      amount: '€10M Series A',
      trigger: 'CE + MIL-STD certified, first commercial sales',
      timeline: '18 months post-seed'
    }
  },

  CVC: {
    title: 'PILOT PARTNERSHIP',
    headline: '5 stations deployed at your sites',
    total: 'Total: €250,000',
    includes: [
      'Equipment (5 units, edition of your choice)',
      'Delivery and installation supervision',
      '12 months iONEOS Mission Control',
      'Telemetry reporting and performance data',
    ],
    timeline: '90 days from agreement to deployment',
    afterPilot: [
      'Framework agreement for volume',
      'Volume pricing from 100+ units',
      'Co-branded deployment option',
    ]
  },

  FAMILY_OFFICE: {
    title: 'SEED INVESTMENT',
    terms: [
      { label: 'Raising', value: '€2,500,000' },
      { label: 'Pre-money', value: '€10–12M' },
      { label: 'Equity', value: '15–20%' },
    ],
    benefits: [
      'Board observer seat',
      'Direct equity in German GmbH',
      'Real assets: IP, inventory, future factory',
    ],
    revenue: [
      { year: 'Y1', amount: '€2.2M', units: '200 units' },
      { year: 'Y3', amount: '€36M', units: '2,500 units' },
      { year: 'Y5', amount: '€90M+', units: '5,000 units' },
    ],
    footer: {
      margin: 'Gross margin: 40-50%',
      breakeven: 'Breakeven: Month 36',
      next: 'Next round: €10M Series A (factory)',
      protection: 'Your stake protected by anti-dilution'
    }
  },

  BANK: {
    title: 'GROWTH FINANCING',
    subtitle: '(post-certification)',
    loan: 'Facility Construction Loan: €3,500,000',
    collateral: [
      { asset: 'Land', value: '€250,000' },
      { asset: 'Building', value: '€2,750,000', note: '3,000 m²' },
      { asset: 'Equipment', value: '€500,000' },
    ],
    note: 'Asset on balance sheet. Not rental expense.',
    cashFlow: [
      { milestone: 'M24', event: 'Production starts', detail: '250 units/month' },
      { milestone: 'M30', event: 'Revenue run rate', detail: '€4M/month' },
      { milestone: 'M36', event: 'Breakeven', detail: '' },
      { milestone: 'M42', event: 'Loan serviceable', detail: 'from operations' },
    ],
    existing: [
      'Existing equity: €1.2M invested',
      'Grant secured: €2.35M (EIC, non-dilutive)',
    ]
  },

  STRATEGIC: {
    title: 'DEPLOYMENT PROPOSAL',
    problem: {
      header: 'Your problem:',
      items: [
        'Remote sites running on diesel',
        '€15-30k/year per generator',
        'Fuel logistics, maintenance, emissions reporting',
      ]
    },
    solution: {
      header: 'Our solution:',
      items: [
        'iONE Continental: €15,000-25,000',
        'Deploy in 30 minutes, two people',
        'Zero fuel, zero emissions, autonomous operation',
      ]
    },
    pilot: {
      header: 'Pilot: 5 units, €250,000',
      items: [
        'Your sites, your conditions',
        '12 months monitored operation',
        'Full performance data and TCO comparison',
      ]
    },
    volume: 'Volume: pricing on request (100+ units)',
    contact: 'Contact: info@gt.gmbh'
  },

  GOVERNMENT: {
    title: 'EU-MANUFACTURED AUTONOMOUS ENERGY',
    certifications: [
      'MIL-STD-810H certified',
      'CE certified (all editions)',
      'EU supply chain option for procurement compliance',
    ],
    capabilities: [
      '-60°C to +55°C operating range',
      '12 days autonomy without sun',
      '30-minute deployment, 2 personnel',
      'No fuel logistics dependency',
    ],
    manufacturing: [
      'Assembly facility: Germany',
      '30 EU-based jobs',
      '250 units/month capacity',
      'Dual-source supply chain',
    ],
    compliance: [
      'Regulation (EU) 2025/2653 compliant',
      'Dual-use — not weapons classification',
    ],
    contact: 'Procurement contact: info@gt.gmbh'
  }
};

// Greeting templates by type×focus
const GREETING_TEMPLATES: Record<string, string> = {
  'VC_CLIMATE': "iONE eliminates diesel from remote infrastructure.\nTwenty-one tonnes of CO₂ per unit, per year.",
  'VC_DEEP_TECH': "iONE is an autonomous cyberphysical system\nwith fleet-scale predictive intelligence.",
  'VC_DEFENCE': "Autonomous power supply, dual-use certified.\nNo supply chain dependency.",
  'VC_ENERGY': "Autonomous energy for remote infrastructure.\nNo fuel logistics. Twelve days full autonomy.",
  'VC_INDUSTRIAL': "Hardware with software margins.\n€10k entry point, 50% gross margin.",
  'VC_INFRASTRUCTURE': "Deploy in 30 minutes. Runs for decades.\nNo crane, no permits, no maintenance crew.",
  'VC_SOCIAL_IMPACT': "Affordable autonomous energy.\nFrom €10,000 — less than a used car.",
  'GRANT_DEEP_TECH': "Autonomous cyberphysical system for critical infrastructure.\nTRL 7 validation across climate zones.",
  'GRANT_CLIMATE': "Eliminating 105,000 tonnes CO₂ annually at fleet scale.\nMeasurable, verifiable, permanent.",
  'GRANT_DEFENCE': "Dual-use autonomous power for EU sovereignty.\nMIL-STD-810H certified, EU manufactured.",
  'CVC_ENERGY': "Autonomous energy for your remote monitoring stations.\nNo fuel logistics. Twelve days full autonomy.",
  'CVC_INFRASTRUCTURE': "Autonomous power for your field operations.\nDeploy in 30 minutes, runs unattended.",
  'FAMILY_OFFICE_CLIMATE': "Tangible climate impact you can see.\n21 tonnes CO₂ avoided per unit, per year.",
  'FAMILY_OFFICE_INDUSTRIAL': "Real hardware, real margins.\nEU manufacturing facility, 250 units/month.",
  'BANK_INDUSTRIAL': "Asset-backed growth.\n€3.5M facility, 25-year structural design life.",
  'STRATEGIC_ENERGY': "Autonomous power for your remote sites.\nNo fuel convoys, no maintenance visits.",
  'STRATEGIC_INFRASTRUCTURE': "Reliable power where you need it.\nDeploy within 90 days.",
  'STRATEGIC_DEFENCE': "Autonomous power. No supply chain.\n12 days full autonomy without resupply.",
  'GOVERNMENT_DEFENCE': "Autonomous power supply, MIL-STD-810H certified.\nEU manufactured. No supply chain dependency.",
  'GOVERNMENT_CLIMATE': "EU Green Deal alignment.\n105,000 tonnes CO₂ avoided at fleet scale.",
};

function buildGreeting(orgName: string, ceo: string | null, type: OrgType, focus: OrgFocus): string {
  const key = `${type}_${focus}`;
  const template = GREETING_TEMPLATES[key] || GREETING_TEMPLATES[`VC_${focus}`] || GREETING_TEMPLATES['VC_DEEP_TECH'];

  let greeting = `Welcome.\n\n${template}`;
  if (ceo) {
    greeting = `Welcome.\nRegards to ${ceo}.\n\n${template}`;
  }
  return greeting;
}

type Stage = 'init' | 'present' | 'asking' | 'researching' | 'hero' | 'topics' | 'presenting';

export default function Home() {
  const [stage, setStage] = useState<Stage>('init');
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [robotText, setRobotText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [viewedTopics, setViewedTopics] = useState<Set<string>>(new Set());
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showVoicePrompt, setShowVoicePrompt] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [presentPhase, setPresentPhase] = useState<'static' | 'driven'>('static');

  // Organization classification from Gemini
  const [orgType, setOrgType] = useState<OrgType>('VC');
  const [orgFocus, setOrgFocus] = useState<OrgFocus>('DEEP_TECH');
  const [orgInfo, setOrgInfo] = useState<{ name: string; ceo: string | null; thesis: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const textRafRef = useRef<number>(0);
  const currentTextRef = useRef<string>('');

  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    analyserRef.current = audioCtxRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = 0.3;

    sourceRef.current = audioCtxRef.current.createMediaElementSource(audioRef.current);
    sourceRef.current.connect(analyserRef.current);
    analyserRef.current.connect(audioCtxRef.current.destination);
  }, []);

  const startVisualizer = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const tick = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      // Focus on voice frequencies (100-3000 Hz range)
      const voiceRange = dataArray.slice(2, 40);
      const avg = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
      setGlowIntensity(Math.min(avg / 180, 1)); // Normalize
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    setGlowIntensity(0);
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const updateText = () => {
      if (!audio.duration || !currentTextRef.current) {
        textRafRef.current = requestAnimationFrame(updateText);
        return;
      }
      const progress = Math.min((audio.currentTime / audio.duration) * 1.2, 1);
      const text = currentTextRef.current;
      const charsToShow = Math.floor(text.length * progress);
      setDisplayedText(text.slice(0, charsToShow));
      if (!audio.paused && !audio.ended) {
        textRafRef.current = requestAnimationFrame(updateText);
      }
    };

    audio.onplay = () => {
      setIsSpeaking(true);
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      startVisualizer();
      textRafRef.current = requestAnimationFrame(updateText);
    };

    audio.onended = () => {
      setIsSpeaking(false);
      stopVisualizer();
      if (textRafRef.current) {
        cancelAnimationFrame(textRafRef.current);
      }
      // Show full text when audio ends
      if (currentTextRef.current) {
        setDisplayedText(currentTextRef.current);
      }
    };

    audio.onerror = () => {
      setIsSpeaking(false);
      stopVisualizer();
      if (textRafRef.current) cancelAnimationFrame(textRafRef.current);
    };

    audio.onpause = () => {
      stopVisualizer();
      if (textRafRef.current) cancelAnimationFrame(textRafRef.current);
    };

    return () => {
      stopVisualizer();
      if (textRafRef.current) cancelAnimationFrame(textRafRef.current);
    };
  }, [startVisualizer, stopVisualizer]);

  const playAudio = useCallback((src: string) => {
    if (!audioRef.current) return;
    initAudioContext();
    audioRef.current.src = src;
    audioRef.current.play().catch(e => console.error('Audio play error:', e));
  }, [initAudioContext]);

  const speakCached = useCallback((key: string) => {
    if (!voiceEnabled) return;
    const cached = CACHED_AUDIO[key];
    if (cached) {
      playAudio(cached);
    }
  }, [voiceEnabled, playAudio]);

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled || !text) return;
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
      if (!res.ok) return;
      if (audioRef.current) {
        initAudioContext();
        audioRef.current.src = URL.createObjectURL(await res.blob());
        audioRef.current.play();
      }
    } catch (e) { console.error('TTS:', e); }
  }, [voiceEnabled, initAudioContext]);

  // Sync text ref when robotText changes (for audio sync)
  useEffect(() => {
    if (!robotText) return;
    currentTextRef.current = robotText;
  }, [robotText]);

  const enableVoice = () => {
    setVoiceEnabled(true);
    setShowVoicePrompt(false);
    setPresentPhase('static');
    setStage('present');
  };

  const skipVoice = () => {
    setVoiceEnabled(false);
    setShowVoicePrompt(false);
    setPresentPhase('static');
    setStage('present');
  };

  const goToHello1 = () => {
    setStage('asking');
    const greeting = "Hello.\n\nI'm iONE\nautonomous energy intelligence.\n\nWhich organization are you representing?";
    setRobotText(greeting);
    if (voiceEnabled) {
      setDisplayedText('');
      setTimeout(() => playAudio('/audio/greeting.mp3'), 300);
    } else {
      setDisplayedText(greeting);
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(prev => !prev);
  };

  const researchFund = async (name: string) => {
    try {
      const r = await fetch('/api/gemini', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fundName: name }) });
      if (r.ok) return await r.json();
    } catch {}
    return { name, thesis: 'innovative technology solutions' };
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setStage('researching');
    setIsLoading(true);
    const analyzingText = "Analyzing your organization...";
    setRobotText(analyzingText);
    if (voiceEnabled) {
      setDisplayedText('');
      speakCached('analyzing');
    } else {
      setDisplayedText(analyzingText);
    }

    try {
      const info = await researchFund(input);

      // Store classification
      const type = (info.type as OrgType) || 'VC';
      const focus = (info.focus as OrgFocus) || 'DEEP_TECH';
      setOrgType(type);
      setOrgFocus(focus);
      setOrgInfo({ name: info.name, ceo: info.ceo, thesis: info.thesis });

      // Build personalized greeting
      const greeting = buildGreeting(info.name, info.ceo, type, focus);

      // Show hero screen
      setStage('hero');
      setRobotText(greeting);
      if (voiceEnabled) {
        setDisplayedText('');
        speak(greeting);
      } else {
        setDisplayedText(greeting);
      }
    } catch {
      setOrgType('VC');
      setOrgFocus('DEEP_TECH');
      const fallback = "Welcome.\n\niONE is autonomous energy intelligence.\nSelect a topic to explore.";
      setRobotText(fallback);
      setDisplayedText(fallback);
      setStage('hero');
    } finally {
      setIsLoading(false);
    }
  };

  const goToTopics = () => {
    setStage('topics');
    const text = "Select a topic to explore.";
    setRobotText(text);
    setDisplayedText(text);
  };

  const handleTopicClick = (id: string) => {
    setSelectedTopic(id);
    setViewedTopics(p => new Set([...p, id]));
    setStage('presenting');
    const text = TOPIC_TEXT[id];
    setRobotText(text);
    if (voiceEnabled) {
      setDisplayedText('');
      speakCached(id);
    } else {
      setDisplayedText(text);
    }
  };

  const backToTopics = () => {
    setStage('topics');
    const text = "What else would you like to explore?";
    setRobotText(text);
    if (voiceEnabled) {
      setDisplayedText('');
      speakCached('back');
    } else {
      setDisplayedText(text);
    }
  };

  return (
    <div className="min-h-screen bg-white flex relative overflow-hidden" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* Background image for climate topic */}
      <AnimatePresence>
        {stage === 'presenting' && selectedTopic === 'climate' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-0"
          >
            <Image
              src="/iceland.jpg"
              alt="Iceland landscape"
              fill
              className="object-cover"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tech topic - full screen demo */}
      <AnimatePresence>
        {stage === 'presenting' && selectedTopic === 'tech' && (
          <TechDemo onBack={backToTopics} voiceEnabled={voiceEnabled} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVoicePrompt && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, y: -200 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-40 h-40 sm:w-48 sm:h-48 border-4 border-zinc-900 rounded-full flex items-center justify-center mb-6 sm:mb-8 cursor-pointer hover:bg-zinc-100 transition-colors"
              onClick={enableVoice}
            >
              <Volume2 size={72} className="text-zinc-900 sm:w-24 sm:h-24" />
            </motion.div>
            <p
              className="text-zinc-700 text-lg sm:text-xl tracking-wide cursor-pointer hover:text-zinc-900 transition-colors"
              onClick={enableVoice}
            >
              Tap to start
            </p>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1 mb-8">recommended</p>
            <button
              onClick={skipVoice}
              className="text-zinc-400 text-sm sm:text-base hover:text-zinc-600 transition-colors"
            >
              No, thanks
            </button>
            <button
              onClick={() => {
                setShowVoicePrompt(false);
                setVoiceEnabled(false);
                setStage('topics');
                setRobotText('Select a topic to explore.');
                setDisplayedText('Select a topic to explore.');
              }}
              className="text-zinc-300 text-xs hover:text-zinc-500 transition-colors mt-4"
            >
              [DEV] Skip to topics
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Present scene - video */}
      <AnimatePresence>
        {stage === 'present' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-white z-40 flex items-center justify-center"
          >
            {/* Label - Static */}
            {presentPhase === 'static' && (
              <motion.div
                key="static-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ duration: 4, times: [0, 0.25, 1], ease: 'easeOut' }}
                className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2"
              >
                <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light text-zinc-800 tracking-wide">
                  Static
                </h1>
              </motion.div>
            )}

            {/* Labels - Driven + Autonomous (crossfade) */}
            {presentPhase === 'driven' && (
              <>
                <motion.div
                  key="driven-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.08, 0.42, 0.5], ease: 'easeOut' }}
                  className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2"
                >
                  <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light text-zinc-800 tracking-wide">
                    Driven
                  </h1>
                </motion.div>
                <motion.div
                  key="autonomous-label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.5, 0.58, 0.92, 1], ease: 'easeOut' }}
                  className="absolute left-8 sm:left-16 top-1/2 -translate-y-1/2"
                >
                  <h1 className="text-4xl sm:text-6xl lg:text-8xl font-light text-zinc-800 tracking-wide">
                    Autonomous
                  </h1>
                </motion.div>
              </>
            )}

            {/* Static phase */}
            {presentPhase === 'static' && (
              <motion.video
                key="static-video"
                autoPlay
                muted
                playsInline
                                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0] }}
                transition={{ duration: 4, times: [0, 0.25, 1], ease: 'easeOut' }}
                onAnimationComplete={() => setPresentPhase('driven')}
                className="max-w-[60%] max-h-[70%] object-contain"
                style={{ background: 'transparent' }}
              >
                <source src="/museum-reverse.mp4" type="video/mp4" />
              </motion.video>
            )}

            {/* Voiceover audio - starts with Static */}
            {voiceEnabled && (
              <audio
                autoPlay
                src="/audio/driven.mp3"
              />
            )}

            {/* Driven + Autonomous phase (crossfade) */}
            {presentPhase === 'driven' && (
              <>

                {/* Driven video - fade out */}
                <motion.video
                  key="driven-video"
                  autoPlay
                  muted
                  playsInline
                  ref={(el) => { if (el) el.playbackRate = 2; }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.08, 0.42, 0.5], ease: 'easeOut' }}
                  className="absolute max-w-[60%] max-h-[70%] object-contain"
                  style={{ background: 'transparent' }}
                >
                  <source src="/driven.mp4" type="video/mp4" />
                </motion.video>

                {/* Autonomous title - above image */}
                <motion.h2
                  key="autonomous-title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.5, 0.54, 0.92, 1], ease: 'easeOut' }}
                  className="absolute top-20 sm:top-28 left-1/2 -translate-x-1/2 text-2xl sm:text-3xl lg:text-4xl font-light text-zinc-700 tracking-wide"
                >
                  The Age of Intent
                </motion.h2>

                {/* Autonomous image - fade in with delay, then fade out */}
                <motion.img
                  key="autonomous-image"
                  src="/autonomous.jpg"
                  alt="Autonomous"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.5, 0.58, 0.92, 1], ease: 'easeOut' }}
                  onAnimationComplete={goToHello1}
                  className="absolute max-w-[60%] max-h-[70%] object-contain"
                />

                {/* Autonomous caption - below image, appears after title */}
                <motion.p
                  key="autonomous-caption"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0, 0.7, 0.7, 0] }}
                  transition={{ duration: 12, times: [0, 0.62, 0.67, 0.92, 1], ease: 'easeOut' }}
                  className="absolute bottom-20 sm:bottom-28 left-1/2 -translate-x-1/2 text-xl sm:text-2xl lg:text-3xl text-zinc-500 font-light tracking-wide"
                >
                  From tools that follow orders to systems that share goals.
                </motion.p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left side - Content (hidden when tech demo is active) */}
      <div className={`flex-1 flex flex-col justify-center p-6 sm:p-12 lg:p-16 pr-4 sm:pr-8 relative z-10 ${stage === 'presenting' && selectedTopic === 'tech' ? 'hidden' : ''}`}>
        <div className="max-w-2xl">
          <div className="mb-8">
            {/* Special layout for climate topic */}
            {stage === 'presenting' && selectedTopic === 'climate' ? (
              <div className="bg-black/50 backdrop-blur-sm p-8 sm:p-10 lg:p-12 space-y-6 w-fit">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-8 whitespace-nowrap"
                >
                  {CLIMATE_DATA.title}
                </motion.h1>
                <div className="space-y-4">
                  {CLIMATE_DATA.lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.4 }}
                      className="flex items-baseline gap-3 text-xl sm:text-2xl lg:text-3xl"
                    >
                      <span className="font-bold text-white whitespace-nowrap">{line.value}</span>
                      <span className="text-white/80 font-light whitespace-nowrap">{line.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : stage === 'presenting' && selectedTopic === 'financials' ? (
              /* === FINANCIALS ASK SCREEN - ADAPTED BY ORG TYPE === */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-zinc-900 p-6 sm:p-8 lg:p-10 rounded-sm max-w-3xl"
              >
                {/* GRANT Layout */}
                {orgType === 'GRANT' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">{ASK_CONTENT.GRANT.title}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      {ASK_CONTENT.GRANT.columns.map((col, ci) => (
                        <div key={ci}>
                          <h3 className="text-cyan-400 font-semibold mb-3 text-lg">{col.header}</h3>
                          <div className="space-y-1">
                            {col.items.map((item, ii) => (
                              <div key={ii} className="flex justify-between text-sm">
                                <span className="text-zinc-400">{item.code} {item.name}</span>
                                <span className="text-white font-mono">{item.amount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-700 pt-4 flex justify-between text-lg">
                      <span className="text-white font-bold">{ASK_CONTENT.GRANT.footer.total}</span>
                      <span className="text-zinc-400">{ASK_CONTENT.GRANT.footer.cta}</span>
                    </div>
                  </>
                )}

                {/* VC Layout */}
                {orgType === 'VC' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">{ASK_CONTENT.VC.title}</h2>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-3">Use of Funds:</h3>
                      {ASK_CONTENT.VC.useOfFunds.map((item, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white">{item.label}</span>
                            <span className="text-zinc-400">{item.amount}</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded">
                            <div className="h-2 bg-cyan-500 rounded" style={{ width: `${item.percent}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-3">Unit Economics:</h3>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <span className="text-zinc-500">Edition</span>
                        <span className="text-zinc-500">Price</span>
                        <span className="text-zinc-500">Cost</span>
                        <span className="text-zinc-500">Margin</span>
                        {ASK_CONTENT.VC.unitEconomics.map((row, i) => (
                          <React.Fragment key={i}>
                            <span className="text-white">{row.edition}</span>
                            <span className="text-cyan-400">{row.price}</span>
                            <span className="text-zinc-400">{row.cost}</span>
                            <span className="text-green-400">{row.margin}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-zinc-700 pt-4">
                      <p className="text-cyan-400 font-bold">Next Round: {ASK_CONTENT.VC.nextRound.amount}</p>
                      <p className="text-zinc-400 text-sm">Trigger: {ASK_CONTENT.VC.nextRound.trigger}</p>
                      <p className="text-zinc-500 text-sm">Timeline: {ASK_CONTENT.VC.nextRound.timeline}</p>
                    </div>
                  </>
                )}

                {/* CVC Layout */}
                {orgType === 'CVC' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{ASK_CONTENT.CVC.title}</h2>
                    <p className="text-xl text-cyan-400 mb-2">{ASK_CONTENT.CVC.headline}</p>
                    <p className="text-2xl text-white font-bold mb-6">{ASK_CONTENT.CVC.total}</p>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-2">Includes:</h3>
                      {ASK_CONTENT.CVC.includes.map((item, i) => (
                        <p key={i} className="text-white text-sm">─ {item}</p>
                      ))}
                    </div>
                    <p className="text-zinc-400 mb-6">Timeline: {ASK_CONTENT.CVC.timeline}</p>
                    <div className="border-t border-zinc-700 pt-4">
                      <h3 className="text-zinc-400 text-sm mb-2">After pilot:</h3>
                      {ASK_CONTENT.CVC.afterPilot.map((item, i) => (
                        <p key={i} className="text-cyan-400 text-sm">─ {item}</p>
                      ))}
                    </div>
                  </>
                )}

                {/* FAMILY_OFFICE Layout */}
                {orgType === 'FAMILY_OFFICE' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">{ASK_CONTENT.FAMILY_OFFICE.title}</h2>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {ASK_CONTENT.FAMILY_OFFICE.terms.map((term, i) => (
                        <div key={i} className="text-center">
                          <p className="text-zinc-400 text-sm">{term.label}</p>
                          <p className="text-cyan-400 text-xl font-bold">{term.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-2">You get:</h3>
                      {ASK_CONTENT.FAMILY_OFFICE.benefits.map((item, i) => (
                        <p key={i} className="text-white text-sm">─ {item}</p>
                      ))}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-2">Revenue path:</h3>
                      <div className="flex gap-4">
                        {ASK_CONTENT.FAMILY_OFFICE.revenue.map((rev, i) => (
                          <div key={i} className="text-center">
                            <p className="text-zinc-500 text-xs">{rev.year}</p>
                            <p className="text-white font-bold">{rev.amount}</p>
                            <p className="text-zinc-400 text-xs">{rev.units}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-zinc-700 pt-4 text-sm">
                      <p className="text-zinc-400">{ASK_CONTENT.FAMILY_OFFICE.footer.margin}</p>
                      <p className="text-zinc-400">{ASK_CONTENT.FAMILY_OFFICE.footer.breakeven}</p>
                      <p className="text-cyan-400">{ASK_CONTENT.FAMILY_OFFICE.footer.next}</p>
                      <p className="text-green-400">{ASK_CONTENT.FAMILY_OFFICE.footer.protection}</p>
                    </div>
                  </>
                )}

                {/* BANK Layout */}
                {orgType === 'BANK' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">{ASK_CONTENT.BANK.title}</h2>
                    <p className="text-zinc-400 mb-4">{ASK_CONTENT.BANK.subtitle}</p>
                    <p className="text-xl text-cyan-400 font-bold mb-6">{ASK_CONTENT.BANK.loan}</p>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-2">Collateral:</h3>
                      {ASK_CONTENT.BANK.collateral.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-white">─ {item.asset}{item.note ? ` (${item.note})` : ''}</span>
                          <span className="text-cyan-400 font-mono">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-zinc-500 italic mb-6">{ASK_CONTENT.BANK.note}</p>
                    <div className="mb-6">
                      <h3 className="text-zinc-400 text-sm mb-2">Cash flow projection:</h3>
                      {ASK_CONTENT.BANK.cashFlow.map((item, i) => (
                        <div key={i} className="flex gap-4 text-sm">
                          <span className="text-cyan-400 font-mono w-12">{item.milestone}</span>
                          <span className="text-white">{item.event}</span>
                          <span className="text-zinc-400">{item.detail}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-700 pt-4 text-sm">
                      {ASK_CONTENT.BANK.existing.map((item, i) => (
                        <p key={i} className="text-zinc-400">{item}</p>
                      ))}
                    </div>
                  </>
                )}

                {/* STRATEGIC Layout */}
                {orgType === 'STRATEGIC' && (
                  <>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6">{ASK_CONTENT.STRATEGIC.title}</h2>
                    <div className="mb-6">
                      <h3 className="text-red-400 text-sm mb-2">{ASK_CONTENT.STRATEGIC.problem.header}</h3>
                      {ASK_CONTENT.STRATEGIC.problem.items.map((item, i) => (
                        <p key={i} className="text-zinc-400 text-sm">─ {item}</p>
                      ))}
                    </div>
                    <div className="mb-6">
                      <h3 className="text-green-400 text-sm mb-2">{ASK_CONTENT.STRATEGIC.solution.header}</h3>
                      {ASK_CONTENT.STRATEGIC.solution.items.map((item, i) => (
                        <p key={i} className="text-white text-sm">─ {item}</p>
                      ))}
                    </div>
                    <div className="mb-6 bg-zinc-800 p-4 rounded">
                      <h3 className="text-cyan-400 font-bold mb-2">{ASK_CONTENT.STRATEGIC.pilot.header}</h3>
                      {ASK_CONTENT.STRATEGIC.pilot.items.map((item, i) => (
                        <p key={i} className="text-zinc-300 text-sm">─ {item}</p>
                      ))}
                    </div>
                    <p className="text-zinc-400 mb-2">{ASK_CONTENT.STRATEGIC.volume}</p>
                    <p className="text-cyan-400">{ASK_CONTENT.STRATEGIC.contact}</p>
                  </>
                )}

                {/* GOVERNMENT Layout */}
                {orgType === 'GOVERNMENT' && (
                  <>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6">{ASK_CONTENT.GOVERNMENT.title}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-cyan-400 text-sm mb-2">Certifications:</h3>
                        {ASK_CONTENT.GOVERNMENT.certifications.map((item, i) => (
                          <p key={i} className="text-white text-sm">✓ {item}</p>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-cyan-400 text-sm mb-2">Capabilities:</h3>
                        {ASK_CONTENT.GOVERNMENT.capabilities.map((item, i) => (
                          <p key={i} className="text-zinc-300 text-sm">─ {item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="text-cyan-400 text-sm mb-2">Manufacturing:</h3>
                        {ASK_CONTENT.GOVERNMENT.manufacturing.map((item, i) => (
                          <p key={i} className="text-zinc-300 text-sm">─ {item}</p>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-cyan-400 text-sm mb-2">Compliance:</h3>
                        {ASK_CONTENT.GOVERNMENT.compliance.map((item, i) => (
                          <p key={i} className="text-green-400 text-sm">✓ {item}</p>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-zinc-700 pt-4">
                      <p className="text-cyan-400">{ASK_CONTENT.GOVERNMENT.contact}</p>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <p className="text-2xl sm:text-4xl text-zinc-800 whitespace-pre-line leading-relaxed font-light">
                {robotText.split('').map((char, i) => (
                  <span
                    key={i}
                    className="transition-opacity duration-300"
                    style={{ opacity: i < displayedText.length ? 1 : 0 }}
                  >
                    {char}
                  </span>
                ))}
              </p>
            )}
          </div>

          {(stage === 'asking' || stage === 'researching') && (
            <div
              className={`w-full max-w-md mb-8 transition-opacity duration-500 ${displayedText === robotText ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <div className="flex items-center relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="Organization name..."
                  className="flex-1 pl-6 pr-16 py-4 border border-zinc-300 text-lg bg-white focus:outline-none focus:border-zinc-500 rounded-full"
                  disabled={stage === 'researching' || displayedText !== robotText}
                  autoFocus={displayedText === robotText}
                />
                <button onClick={handleSubmit} disabled={stage === 'researching' || !input.trim()} className="absolute right-1 w-12 h-12 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-30 rounded-full flex items-center justify-center">
                  <Send size={20} />
                </button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {/* Hero screen - shown after Gemini analysis */}
            {stage === 'hero' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-2xl"
              >
                {/* Hero metric card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-zinc-900 p-6 sm:p-8 mb-6 rounded-sm"
                >
                  <p className="text-zinc-400 text-sm mb-2">{HERO_SCREEN[orgFocus].subline}</p>
                  <h2 className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                    {HERO_SCREEN[orgFocus].headline}
                  </h2>
                  <div className="flex items-baseline gap-3 mt-4">
                    <span className="text-cyan-400 text-4xl sm:text-5xl lg:text-6xl font-bold">
                      {HERO_SCREEN[orgFocus].metric}
                    </span>
                    <span className="text-zinc-400 text-lg sm:text-xl">
                      {HERO_SCREEN[orgFocus].metricLabel}
                    </span>
                  </div>
                </motion.div>

                {/* Continue button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={goToTopics}
                  className="px-8 py-4 bg-zinc-800 text-white text-sm tracking-wide hover:bg-zinc-700 transition-colors rounded-sm"
                >
                  Explore topics →
                </motion.button>
              </motion.div>
            )}

            {stage === 'topics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-2xl">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Sort topics based on orgType */}
                  {TOPIC_ORDER[orgType].map((topicId, i) => {
                    const t = TOPICS.find(topic => topic.id === topicId);
                    if (!t) return null;
                    const viewed = viewedTopics.has(t.id);
                    return (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleTopicClick(t.id)}
                        className={`h-[72px] sm:h-[84px] flex items-center justify-center transition-all duration-300 rounded-sm border-2 border-transparent ${viewed ? 'opacity-50' : ''} hover:shadow-[0_0_15px_rgba(10,191,188,0.6)]`}
                        style={{ backgroundColor: '#2D3436' }}
                      >
                        <span className="text-white font-bold text-xs sm:text-sm tracking-wider">{t.title}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {viewedTopics.size >= 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                    <a href="mailto:ivan@gtlab.org?subject=iONE%20Pitch%20Deck%20Inquiry" className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-zinc-900 text-white text-xs sm:text-sm tracking-wide hover:bg-zinc-800 transition-colors rounded-sm">
                      Schedule a call with Ivan
                    </a>
                  </motion.div>
                )}
              </motion.div>
            )}

            {stage === 'presenting' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 sm:mt-8">
                <button
                  onClick={backToTopics}
                  className={`text-sm ${selectedTopic === 'climate' ? 'text-white/70 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Robot image (hidden when tech demo is active) */}
      <div
        className={`hidden sm:flex w-[45%] lg:w-[50%] items-end justify-end pb-10 pt-[calc(100vh/4*0.66)] pr-4 ${isSpeaking && glowIntensity === 0 ? 'animate-glow' : ''} ${stage === 'presenting' && selectedTopic === 'tech' ? '!hidden' : ''}`}
        style={{
          filter: glowIntensity > 0
            ? `drop-shadow(0 0 ${20 + glowIntensity * 80}px rgba(6, 182, 212, ${0.3 + glowIntensity * 0.7}))`
            : undefined,
          transition: glowIntensity > 0 ? 'filter 0.05s ease-out' : undefined
        }}
      >
        <div className="relative w-[125%] h-[calc(100vh-80px-100vh/4*0.66)]">
          <Image
            src="/RoboPitch.png"
            alt="iONE"
            fill
            className="object-contain object-bottom-right"
            style={{ objectPosition: 'right bottom' }}
            priority
            sizes="55vw"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile robot - show smaller version */}
      <div
        className={`sm:hidden fixed bottom-16 right-4 w-24 h-24 ${isSpeaking && glowIntensity === 0 ? 'animate-glow-mobile' : ''}`}
        style={{
          filter: glowIntensity > 0
            ? `drop-shadow(0 0 ${10 + glowIntensity * 40}px rgba(6, 182, 212, ${0.3 + glowIntensity * 0.7}))`
            : undefined,
          transition: glowIntensity > 0 ? 'filter 0.05s ease-out' : undefined
        }}
      >
        <Image src="/RoboPitch.png" alt="iONE" fill className="object-contain" priority sizes="96px" />
      </div>

      {/* Sound toggle button - top right */}
      {!showVoicePrompt && (
        <button
          onClick={toggleVoice}
          className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-zinc-300 flex items-center justify-center hover:border-zinc-500 hover:bg-zinc-100 transition-colors"
          title={voiceEnabled ? 'Mute' : 'Unmute'}
        >
          {voiceEnabled ? (
            <Volume2 size={20} className="text-zinc-600 sm:w-6 sm:h-6" />
          ) : (
            <VolumeX size={20} className="text-zinc-400 sm:w-6 sm:h-6" />
          )}
        </button>
      )}

      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs text-zinc-400 tracking-wider">GT GmbH · Berlin</div>
    </div>
  );
}
