'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

interface PartnershipShowcaseProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

const SLIDES = [
  {
    id: 'overview',
    title: 'GT ENERGY FAMILY',
    subtitle: 'International Partnership Network',
    sections: [
      {
        header: 'STRUCTURE',
        rows: [
          { label: 'Model', value: 'Independent national distributors' },
          { label: 'Entity', value: 'GT Energy [Country] Ltd' },
          { label: 'Ownership', value: '100% local partner equity' },
          { label: 'Jurisdiction', value: 'German law / ICC Paris' },
        ],
      },
      {
        header: 'COVERAGE',
        rows: [
          { label: 'Primary', value: 'ProCredit Group countries' },
          { label: 'Active', value: 'DE, BG, RS, AL, XK, MK, BA, ME, GE, UA' },
          { label: 'Pipeline', value: 'RO, GR, MD, CY, ES, IT, PT, HR, SI, HU' },
        ],
      },
    ],
    footer: 'Full transparency. Clear ownership. Direct partnership.',
  },
  {
    id: 'roles',
    title: 'ROLE MATRIX',
    subtitle: 'Operational Responsibilities',
    table: {
      headers: ['FUNCTION', 'GT GMBH', 'LOCAL PARTNER'],
      rows: [
        ['Manufacturing', '●', '○'],
        ['Quality Standards', '●', '○'],
        ['Technical Training', '●', '○'],
        ['Warranty Parts', '●', '○'],
        ['Partner Admin', '●', '○'],
        ['Local Sales', '○', '●'],
        ['Pricing Strategy', '○', '●'],
        ['Installation', '○', '●'],
        ['Service & Support', '○', '●'],
        ['Customer Relations', '○', '●'],
      ],
    },
    highlight: { label: 'PROFIT SPLIT', value: '50 / 50 on net margin' },
  },
  {
    id: 'finance',
    title: 'FINANCIAL STRUCTURE',
    subtitle: 'Capital & Payment Terms',
    sections: [
      {
        header: 'CAPITAL REQUIREMENTS',
        rows: [
          { label: 'Paid-in Capital', value: '€200,000', note: 'or bank guarantee' },
          { label: 'Bank Account', value: 'ProCredit [Country]', note: 'corporate' },
          { label: 'Insurance', value: 'Allianz Trade', note: '85% coverage' },
        ],
      },
      {
        header: 'PAYMENT TERMS',
        rows: [
          { label: 'Advance', value: '30%', note: 'triggers production' },
          { label: 'Balance', value: '70%', note: '180 days financed' },
          { label: 'ROT', value: 'Active', note: 'until full payment' },
        ],
      },
    ],
    calc: {
      title: 'LEVERAGE CALCULATION',
      lines: [
        { label: 'Capital Base', value: '€200,000' },
        { label: 'Advance Rate', value: '30%' },
        { label: 'Order Capacity', value: '€666,667' },
        { label: 'Leverage', value: '3.33x' },
      ],
    },
  },
  {
    id: 'admin',
    title: 'PARTNER ADMIN',
    subtitle: 'Integrated Management Platform',
    grid: [
      { code: 'ORD', name: 'Orders', desc: 'Place orders, track shipments' },
      { code: 'INV', name: 'Inventory', desc: 'Stock levels, reorder alerts' },
      { code: 'KPI', name: 'Performance', desc: 'Sales, DSO, service metrics' },
      { code: 'RMA', name: 'Returns', desc: 'Warranty claims, replacements' },
      { code: 'FIN', name: 'Finance', desc: 'Customer credit applications' },
      { code: 'SUB', name: 'Subsidies', desc: 'Auto government requests' },
      { code: 'RPT', name: 'Reports', desc: 'Monthly auto-generation' },
      { code: 'AUD', name: 'Audit', desc: 'Bank & GT access controls' },
    ],
    kpis: [
      { metric: 'DSO', target: '≤45 days' },
      { metric: 'Stock Cover', target: '6-8 weeks' },
      { metric: 'First Response', target: '≤24h' },
      { metric: 'Resolution', target: '≤7 days' },
    ],
  },
  {
    id: 'compliance',
    title: 'RISK & COMPLIANCE',
    subtitle: 'Bank-Ready Structure',
    table: {
      headers: ['CATEGORY', 'MEASURE', 'STATUS'],
      rows: [
        ['Legal', 'German law / ICC Paris', 'CLEARED'],
        ['Regulatory', 'Trade finance exempt', 'VERIFIED'],
        ['Corporate', 'Trusteeship / Escrow mechanism', 'ACTIVE'],
        ['AML/CFT', 'EU/US/UK sanctions compliance', 'COMPLIANT'],
        ['Export', 'Dual-use goods control', 'COMPLIANT'],
        ['ESG', 'GEFF / ProCredit standards', 'ALIGNED'],
        ['Data', 'GDPR full compliance', 'CERTIFIED'],
        ['Audit', 'Annual Big 4 or equivalent', 'SCHEDULED'],
      ],
    },
    certifications: ['CE', 'LVD', 'EMC', 'RoHS', 'UN38.3'],
    legal: 'Verified by Hengeler Mueller',
  },
  {
    id: 'onboarding',
    title: 'ONBOARDING PROCESS',
    subtitle: 'Path to Partnership',
    timeline: [
      { step: '01', action: 'APPLICATION', detail: 'Submit 12-question form', time: 'Day 0' },
      { step: '02', action: 'DEMO ACCESS', detail: 'Partner Admin credentials', time: '+24h' },
      { step: '03', action: 'DUE DILIGENCE', detail: 'Background & compliance check', time: '+7d' },
      { step: '04', action: 'ONBOARDING CALL', detail: 'Technical & commercial review', time: '+14d' },
      { step: '05', action: 'ENTITY SETUP', detail: 'GT Energy [Country] Ltd', time: '+30d' },
      { step: '06', action: 'BANK ACCOUNT', detail: 'ProCredit corporate account', time: '+45d' },
      { step: '07', action: 'EDA SIGNING', detail: 'Exclusive Distribution Agreement', time: '+60d' },
      { step: '08', action: 'GO LIVE', detail: 'First order & operations start', time: '+90d' },
    ],
    contact: { label: 'INQUIRIES', value: 'partnership@gtlab.org' },
  },
];

export default function PartnershipShowcase({ onComplete, voiceEnabled }: PartnershipShowcaseProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const slide = SLIDES[currentSlide];
  const totalSlides = SLIDES.length;

  // Cleanup audio
  const cleanup = useCallback(async (withFade = false) => {
    if (audioRef.current) {
      if (withFade && !audioRef.current.paused) {
        await fadeAudioOut(audioRef.current);
      } else {
        audioRef.current.pause();
      }
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Play audio for slide
  const playSlideAudio = useCallback(async (slideIndex: number) => {
    if (!voiceEnabled) return;

    await cleanup(true);
    await new Promise(resolve => setTimeout(resolve, AUDIO_GAP));

    const audio = new Audio(`/audio/partnership-slide-${slideIndex + 1}.mp3`);
    audioRef.current = audio;
    audio.volume = 0;

    audio.addEventListener('loadedmetadata', async () => {
      setIsPlaying(true);
      try {
        await audio.play();
        await fadeAudioIn(audio);
      } catch (e) {
        console.error('Audio play error:', e);
        setIsPlaying(false);
      }
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('error', () => {
      setIsPlaying(false);
    });
  }, [voiceEnabled, cleanup]);

  // Play audio when slide changes
  useEffect(() => {
    playSlideAudio(currentSlide);
    return () => { cleanup(); };
  }, [currentSlide]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const nextSlide = async () => {
    if (currentSlide < SLIDES.length - 1) {
      await cleanup(true);
      setCurrentSlide(prev => prev + 1);
    } else {
      await cleanup(true);
      onComplete();
    }
  };

  const prevSlide = async () => {
    if (currentSlide > 0) {
      await cleanup(true);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = async (index: number) => {
    await cleanup(true);
    setCurrentSlide(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-40 flex flex-col"
    >
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 bg-zinc-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-4xl mx-auto"
          >
            {/* Title */}
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl text-zinc-900 font-bold tracking-tight">{slide.title}</h1>
              <p className="text-zinc-500 text-lg mt-4">{slide.subtitle}</p>
            </div>

            {/* Sections (overview, finance) */}
            {slide.sections && (
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {slide.sections.map((section, si) => (
                  <div key={si} className="bg-white border border-zinc-200 rounded-sm shadow-sm">
                    <div className="px-6 py-5 border-b border-zinc-100">
                      <span className="text-base font-bold text-zinc-900 tracking-wider">{section.header}</span>
                    </div>
                    <div className="p-6">
                      {section.rows.map((row, ri) => (
                        <div key={ri} className="flex justify-between py-4 border-b border-zinc-50 last:border-0">
                          <span className="text-zinc-500 text-lg">{row.label}</span>
                          <div className="text-right">
                            <span className="text-zinc-900 text-lg font-medium">{row.value}</span>
                            {'note' in row && row.note && <span className="text-zinc-400 text-base ml-2">({row.note})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Table (roles, compliance) */}
            {slide.table && (
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm mb-12 overflow-x-auto">
                <table className="w-full text-lg">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      {slide.table.headers.map((h, i) => (
                        <th key={i} className="px-6 py-5 text-left text-base font-bold text-zinc-900 tracking-wider bg-zinc-50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slide.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className={`px-6 py-5 ${ci === 0 ? 'text-zinc-600' : 'text-zinc-900'} ${cell === '●' ? 'text-blue-800 font-bold text-xl' : ''} ${cell === '○' ? 'text-zinc-300 text-xl' : ''} ${cell === 'CLEARED' || cell === 'VERIFIED' || cell === 'ACTIVE' || cell === 'COMPLIANT' || cell === 'ALIGNED' || cell === 'CERTIFIED' || cell === 'SCHEDULED' ? 'text-blue-800 font-semibold' : ''}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Highlight (roles) */}
            {slide.highlight && (
              <div className="border-l-4 border-blue-800 bg-blue-50 p-8 mb-12">
                <div className="flex justify-between items-center">
                  <span className="text-blue-800 font-bold text-xl">{slide.highlight.label}</span>
                  <span className="text-4xl text-zinc-900 font-bold">{slide.highlight.value}</span>
                </div>
              </div>
            )}

            {/* Calculation block (finance) */}
            {slide.calc && (
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm mb-12">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <span className="text-base font-bold text-zinc-900 tracking-wider">{slide.calc.title}</span>
                </div>
                <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-10">
                  {slide.calc.lines.map((line, i) => (
                    <div key={i} className="text-center">
                      <div className="text-zinc-500 text-base mb-3 uppercase tracking-wider">{line.label}</div>
                      <div className={`text-3xl font-bold ${i === slide.calc.lines.length - 1 ? 'text-blue-800' : 'text-zinc-900'}`}>{line.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Grid (admin) */}
            {slide.grid && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
                {slide.grid.map((item, i) => (
                  <div key={i} className="bg-white border border-zinc-200 rounded-sm p-6 shadow-sm hover:border-zinc-300 transition-colors">
                    <div className="text-blue-800 font-bold text-base mb-2">{item.code}</div>
                    <div className="text-zinc-900 text-lg font-bold">{item.name}</div>
                    <div className="text-zinc-500 text-base mt-3 leading-relaxed">{item.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {/* KPIs (admin) */}
            {slide.kpis && (
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm mb-12">
                <div className="px-6 py-5 border-b border-zinc-100">
                  <span className="text-base font-bold text-zinc-900 tracking-wider">SLA TARGETS</span>
                </div>
                <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-10">
                  {slide.kpis.map((kpi, i) => (
                    <div key={i} className="text-center">
                      <div className="text-zinc-500 text-base mb-3 uppercase tracking-wider">{kpi.metric}</div>
                      <div className="text-blue-800 font-bold text-2xl">{kpi.target}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications (compliance) */}
            {slide.certifications && (
              <div className="flex flex-wrap gap-4 mb-8">
                {slide.certifications.map((cert, i) => (
                  <span key={i} className="px-5 py-3 bg-zinc-100 border border-zinc-200 text-base text-zinc-600 font-semibold rounded-sm">{cert}</span>
                ))}
              </div>
            )}

            {/* Legal note (compliance) */}
            {slide.legal && (
              <div className="text-zinc-400 text-base">{slide.legal}</div>
            )}

            {/* Timeline (onboarding) */}
            {slide.timeline && (
              <div className="bg-white border border-zinc-200 rounded-sm shadow-sm mb-12">
                {slide.timeline.map((item, i) => (
                  <div key={i} className="flex items-center border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
                    <div className="w-20 sm:w-24 text-center py-6 border-r border-zinc-100 text-blue-800 font-bold text-lg">{item.step}</div>
                    <div className="flex-1 px-8 py-6">
                      <div className="text-zinc-900 font-bold text-lg">{item.action}</div>
                      <div className="text-zinc-500 text-base mt-2">{item.detail}</div>
                    </div>
                    <div className="w-28 sm:w-32 text-right pr-8 text-zinc-400 text-base font-medium">{item.time}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact (onboarding) */}
            {slide.contact && (
              <div className="border-l-4 border-zinc-800 bg-zinc-100 p-8">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-800 font-bold text-xl">{slide.contact.label}</span>
                  <button
                    onClick={() => {
                      // Try mailto first
                      window.location.href = 'mailto:partnership@gtlab.org?subject=Partnership%20Inquiry';
                      // Copy to clipboard as fallback
                      navigator.clipboard.writeText('partnership@gtlab.org');
                    }}
                    title="Click to email or copy address"
                    className="text-cyan-600 font-semibold text-2xl hover:text-cyan-800 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    {slide.contact.value}
                  </button>
                </div>
              </div>
            )}

            {/* Footer (overview) */}
            {slide.footer && (
              <div className="mt-12 text-zinc-500 text-lg font-medium">{slide.footer}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <SlideNav
        onPrev={currentSlide > 0 ? prevSlide : undefined}
        onNext={nextSlide}
        onBack={onComplete}
        showPrev={currentSlide > 0}
        showNext={true}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        nextLabel={currentSlide === totalSlides - 1 ? 'DONE' : undefined}
        isDark={false}
      />
    </motion.div>
  );
}
