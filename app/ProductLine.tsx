'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SlideNav from './components/SlideNav';

interface ProductLineProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

const EDITIONS = [
  {
    id: 'home',
    name: 'HOME',
    tagline: 'Residential Energy Independence',
    price: '€10,000 – €15,000',
    temp: '-20°C to +45°C',
    color: '#10B981',
    link: 'https://ione.store/configurator/home',
    features: [
      '16 kWh LiFePO₄ storage',
      '4.32 kWp solar array',
      '6 kW inverter',
      'Passive thermal management',
      'iONEOS monitoring',
      'Plug & play installation',
    ],
    specs: {
      storage: '16 kWh',
      solar: '4.32 kWp',
      inverter: '6 kW',
      weight: '750 kg',
      footprint: '3 m²',
      installation: '< 4 hours',
    },
    useCase: 'Houses, cabins, off-grid homes',
    description: 'Perfect for residential use. Simple installation, zero maintenance. Connect to existing home systems or run completely off-grid.',
  },
  {
    id: 'continental',
    name: 'CONTINENTAL',
    tagline: 'Standard Industrial Edition',
    price: '€15,000 – €25,000',
    temp: '-20°C to +45°C',
    color: '#3B82F6',
    link: 'https://ione.store/configurator/continental',
    features: [
      '16–32 kWh storage options',
      '4.32 kWp dual-axis tracking',
      '6–10 kW inverter',
      'Copper foam heat dissipation',
      'Storm protection 180 km/h',
      'Remote deployment ready',
    ],
    specs: {
      storage: '16–32 kWh',
      solar: '4.32 kWp',
      inverter: '6–10 kW',
      weight: '750 kg',
      footprint: '3 m²',
      installation: '< 24 hours',
    },
    useCase: 'Telecom, agriculture, construction',
    description: 'Our standard industrial workhorse. Dual-axis solar tracking, passive cooling, handles European climate conditions year-round.',
  },
  {
    id: 'arctic',
    name: 'ARCTIC EDITION',
    tagline: 'Extreme Cold Operations',
    price: '€25,000 – €35,000',
    temp: '-50°C to +35°C',
    color: '#06B6D4',
    link: 'https://ione.store/configurator/arctic',
    features: [
      '32–48 kWh heated storage',
      'PTC battery heating system',
      'Aerogel 40mm insulation',
      'PCM thermal buffer 10°C',
      'Arctic-rated components',
      'Satellite connectivity option',
    ],
    specs: {
      storage: '32–48 kWh',
      solar: '2.88 kWp',
      inverter: 'optional',
      weight: '850 kg',
      footprint: '3 m²',
      installation: '< 24 hours',
    },
    useCase: 'Arctic bases, Nordic infrastructure',
    description: 'Engineered for extreme cold. Battery heating maintains optimal temperature down to -50°C. Aerogel insulation and phase-change thermal buffer.',
  },
  {
    id: 'desert',
    name: 'DESERT SHIELD',
    tagline: 'Extreme Heat & Dust Protection',
    price: '€22,000 – €32,000',
    temp: '-10°C to +60°C',
    color: '#F59E0B',
    link: 'https://ione.store/configurator/desert',
    features: [
      '32–48 kWh cooled storage',
      '48V compressor cooling',
      'Sand/dust filtration IP67',
      'UV-resistant coatings',
      'Phase change material cooling',
      'Solar panel active cooling',
    ],
    specs: {
      storage: '32–48 kWh',
      solar: '2.88 kWp',
      inverter: 'optional',
      weight: '950 kg',
      footprint: '3 m²',
      installation: '< 24 hours',
    },
    useCase: 'MENA, desert pipelines, mining',
    description: 'Built for extreme heat and sandstorms. Active compressor cooling, IP67 dust sealing, UV-resistant coatings protect all surfaces.',
  },
];

export default function ProductLine({ onComplete, voiceEnabled }: ProductLineProps) {
  const [currentIdx, setCurrentIdx] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    if (parts[0] === 'configurator' && parts[1]) {
      const idx = EDITIONS.findIndex(e => e.id === parts[1]);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectEdition = (idx: number) => {
    setCurrentIdx(idx);
    window.history.replaceState(null, '', `/home#configurator/${EDITIONS[idx].id}`);
  };

  useEffect(() => {
    if (voiceEnabled) {
      const audio = new Audio('/audio/lineup.mp3');
      audioRef.current = audio;
      audio.play().catch(() => {});

      return () => {
        audio.pause();
        audioRef.current = null;
      };
    }
  }, [voiceEnabled]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col"
    >
      <div className="flex-1 overflow-auto px-6 sm:px-10 py-6 pb-24">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl sm:text-5xl poster-title-xl text-zinc-900 mb-2"
      >
        PRODUCTS
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-zinc-500 text-lg mb-8 poster-body"
      >
        Four editions for every environment
      </motion.p>

      {/* Edition Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {EDITIONS.map((edition, i) => (
          <motion.div
            key={edition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className={`relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
              currentIdx === i ? 'ring-2 ring-offset-2 ring-offset-white' : 'hover:scale-[1.02]'
            }`}
            style={{
              borderTop: `4px solid ${edition.color}`,
              ['--tw-ring-color' as string]: edition.color
            } as React.CSSProperties}
            onClick={() => selectEdition(i)}
          >
            {/* Header */}
            <div className="p-4 pb-2">
              <h3 className="text-white poster-title text-lg">{edition.name}</h3>
              <p className="text-zinc-400 text-xs mt-1 poster-body">{edition.tagline}</p>
            </div>

            {/* Price */}
            <div className="px-4 py-2">
              <span
                className="text-2xl poster-stat"
                style={{ color: edition.color }}
              >
                {edition.price}
              </span>
            </div>

            {/* Temperature Range */}
            <div className="px-4 py-2 bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-zinc-300 text-sm font-mono">{edition.temp}</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-4 pt-3">
              <ul className="space-y-1">
                {edition.features.slice(0, 4).map((feature, fi) => (
                  <li key={fi} className="text-zinc-400 text-xs flex items-start gap-2">
                    <span style={{ color: edition.color }}>•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Use Case */}
            <div className="px-4 pb-4">
              <p className="text-zinc-500 text-xs italic">{edition.useCase}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded Details for Selected Edition */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-6 bg-zinc-100 rounded-lg"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h4
              className="text-2xl poster-title"
              style={{ color: EDITIONS[currentIdx].color }}
            >
              {EDITIONS[currentIdx].name}
            </h4>
            <p className="text-zinc-600 mt-1 poster-body">{EDITIONS[currentIdx].tagline}</p>
            <p className="text-zinc-500 text-sm mt-2 max-w-md poster-body">{EDITIONS[currentIdx].description}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl poster-stat text-zinc-900">{EDITIONS[currentIdx].price}</p>
            <p className="text-zinc-500 text-sm">{EDITIONS[currentIdx].temp}</p>
            <a
              href={EDITIONS[currentIdx].link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-6 py-2 rounded-full text-white font-semibold text-sm transition-all hover:scale-105 hover:shadow-lg"
              style={{ backgroundColor: EDITIONS[currentIdx].color }}
            >
              Configure →
            </a>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-4">
          {Object.entries(EDITIONS[currentIdx].specs).map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="text-lg poster-stat text-zinc-900">{value}</p>
              <p className="text-xs text-zinc-500 capitalize poster-label">{key}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-6 pt-4 border-t border-zinc-200">
          <h5 className="text-sm poster-accent text-zinc-700 mb-3">Features</h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EDITIONS[currentIdx].features.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm text-zinc-700"
              >
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: EDITIONS[currentIdx].color }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-zinc-500 text-sm">
            <strong>Ideal for:</strong> {EDITIONS[currentIdx].useCase}
          </p>
          <a
            href={EDITIONS[currentIdx].link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium hover:underline"
            style={{ color: EDITIONS[currentIdx].color }}
          >
            ione.store/configurator/{EDITIONS[currentIdx].id} ↗
          </a>
        </div>
      </motion.div>

      {/* Common Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 bg-zinc-900 rounded-lg"
      >
        <h4 className="text-white poster-accent mb-3">All Editions Include</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-zinc-300">
            <span className="text-cyan-400 poster-stat">16–48 kWh</span>
            <p className="text-zinc-500 text-xs poster-body">LiFePO₄ Storage</p>
          </div>
          <div className="text-zinc-300">
            <span className="text-cyan-400 poster-stat">4.32 kWp</span>
            <p className="text-zinc-500 text-xs poster-body">Solar Capacity</p>
          </div>
          <div className="text-zinc-300">
            <span className="text-cyan-400 poster-stat">iONEOS</span>
            <p className="text-zinc-500 text-xs poster-body">AI Monitoring</p>
          </div>
          <div className="text-zinc-300">
            <span className="text-cyan-400 poster-stat">25 years</span>
            <p className="text-zinc-500 text-xs poster-body">Design Life</p>
          </div>
        </div>
      </motion.div>

      </div>

      {/* Navigation */}
      <SlideNav
        onBack={onComplete}
        showPrev={false}
        showNext={false}
        isDark={false}
      />
    </motion.div>
  );
}
