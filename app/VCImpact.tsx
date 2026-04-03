'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

type OrgFocus = 'DEEP_TECH' | 'CLIMATE' | 'DEFENCE' | 'ENERGY' | 'INDUSTRIAL' | 'INFRASTRUCTURE' | 'SOCIAL_IMPACT';

interface VCImpactProps {
  onComplete: () => void;
  voiceEnabled: boolean;
  focus: OrgFocus;
}

type Scene = 'raise' | 'economics' | 'nextround';

const SCENES_ORDER: Scene[] = ['raise', 'economics', 'nextround'];

// Focus-specific headlines and metrics
const FOCUS_HEADERS: Record<OrgFocus, { headline: string; metric: string; metricLabel: string }> = {
  CLIMATE: {
    headline: 'Eliminating diesel from remote infrastructure',
    metric: '21t CO₂',
    metricLabel: 'avoided per unit per year',
  },
  DEFENCE: {
    headline: 'Autonomous power for sovereign operations',
    metric: '12 days',
    metricLabel: 'full autonomy without resupply',
  },
  INDUSTRIAL: {
    headline: 'Unit economics at scale',
    metric: '€10k entry',
    metricLabel: '40-50% gross margin',
  },
  DEEP_TECH: {
    headline: 'Infrastructure intelligence from fleet data',
    metric: '50+ stations',
    metricLabel: 'proprietary dataset',
  },
  ENERGY: {
    headline: 'Grid independence in a box',
    metric: '4.32 kWp',
    metricLabel: 'generation + 48 kWh storage',
  },
  INFRASTRUCTURE: {
    headline: 'Deploy in 30 minutes. Runs for decades.',
    metric: '250 units/mo',
    metricLabel: 'production capacity',
  },
  SOCIAL_IMPACT: {
    headline: 'Affordable autonomous energy for everyone',
    metric: '€10,000',
    metricLabel: 'entry price — less than a used car',
  },
};

export default function VCImpact({ onComplete, voiceEnabled, focus }: VCImpactProps) {
  const [scene, setScene] = useState<Scene>('raise');
  const [sceneDurations] = useState({ raise: 19000, economics: 32000, nextround: 18000 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualNavRef = useRef(false);

  const currentSceneIndex = SCENES_ORDER.indexOf(scene);
  const totalScenes = SCENES_ORDER.length;

  const goToPrev = useCallback(() => {
    isManualNavRef.current = true;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const idx = SCENES_ORDER.indexOf(scene);
    if (idx > 0) {
      setScene(SCENES_ORDER[idx - 1]);
    }
  }, [scene]);

  const goToNext = useCallback(() => {
    isManualNavRef.current = true;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const idx = SCENES_ORDER.indexOf(scene);
    if (idx < SCENES_ORDER.length - 1) {
      setScene(SCENES_ORDER[idx + 1]);
    }
  }, [scene]);

  // Scene progression - only auto-advance if not manually navigated
  useEffect(() => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (isManualNavRef.current) return;

    if (scene === 'raise') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('economics'), sceneDurations.raise);
    } else if (scene === 'economics') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('nextround'), sceneDurations.economics);
    } else if (scene === 'nextround') {
      autoAdvanceTimerRef.current = setTimeout(() => onComplete(), sceneDurations.nextround);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [scene, sceneDurations, onComplete]);

  // Play audio for each scene with smooth transitions
  useEffect(() => {
    if (!voiceEnabled) return;

    let cancelled = false;

    const playSceneAudio = async () => {
      // Fade out previous audio
      if (audioRef.current && !audioRef.current.paused) {
        await fadeAudioOut(audioRef.current);
      }

      // Wait for consistent gap
      await new Promise(resolve => setTimeout(resolve, AUDIO_GAP));

      if (cancelled || !audioRef.current) return;

      const audioSrc = `/audio/vc-${scene}.mp3`;
      audioRef.current.src = audioSrc;
      audioRef.current.volume = 0; // Start silent

      try {
        await audioRef.current.play();
        if (!cancelled && audioRef.current) {
          await fadeAudioIn(audioRef.current);
        }
      } catch (e) {
        console.error('Audio play error:', e);
      }
    };

    playSceneAudio();

    return () => {
      cancelled = true;
    };
  }, [scene, voiceEnabled]);

  const focusHeader = FOCUS_HEADERS[focus] || FOCUS_HEADERS.DEEP_TECH;

  return (
    <div className="w-full">
      {voiceEnabled && <audio ref={audioRef} />}

      <AnimatePresence mode="wait">
        {/* SCENE 1: THE RAISE */}
        {scene === 'raise' && (
          <motion.div
            key="raise"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Focus-specific header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4"
            >
              <p className="text-zinc-500 text-sm mb-1">{focusHeader.headline}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-cyan-600 text-2xl sm:text-3xl font-bold">{focusHeader.metric}</span>
                <span className="text-zinc-400 text-sm">{focusHeader.metricLabel}</span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-2"
            >
              SEED ROUND
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl poster-title-xl text-cyan-600 mb-6"
            >
              €2,500,000
            </motion.h1>

            {/* Stations breakdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-100 p-4 rounded-lg mb-6 max-w-sm"
            >
              <h3 className="text-cyan-600 font-bold mb-2">60 stations deployed</h3>
              <div className="space-y-0.5 text-sm text-zinc-600 font-mono">
                <p>├─ 20 Home Edition</p>
                <p>├─ 40 Continental (3 variants)</p>
                <p>├─ 10 Desert Shield</p>
                <p>└─ 10 Arctic Shield</p>
              </div>
            </motion.div>

            {/* Outcomes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3 text-sm"
            >
              <div className="bg-zinc-100 px-3 py-2 rounded">
                <span className="text-cyan-600 font-bold">CE cert</span>
                <span className="text-zinc-500"> → EU market</span>
              </div>
              <div className="bg-zinc-100 px-3 py-2 rounded">
                <span className="text-cyan-600 font-bold">MIL-STD</span>
                <span className="text-zinc-500"> → Defence</span>
              </div>
              <div className="bg-zinc-100 px-3 py-2 rounded">
                <span className="text-cyan-600 font-bold">12mo data</span>
                <span className="text-zinc-500"> → AION</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 2: UNIT ECONOMICS + MARKET */}
        {scene === 'economics' && (
          <motion.div
            key="economics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-4"
            >
              UNIT ECONOMICS
            </motion.p>

            <div className="grid grid-cols-2 gap-4 max-w-lg mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-100 p-4 rounded-lg"
              >
                <h3 className="text-zinc-900 font-bold mb-2">Home</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Price:</span>
                  <span className="text-cyan-600 font-bold">€10,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Margin:</span>
                  <span className="text-green-600 font-bold">40%</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-cyan-50 border-2 border-cyan-200 p-4 rounded-lg"
              >
                <h3 className="text-zinc-900 font-bold mb-2">Continental</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Price:</span>
                  <span className="text-cyan-600 font-bold">€15-25k</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Margin:</span>
                  <span className="text-green-600 font-bold">50%</span>
                </div>
              </motion.div>
            </div>

            {/* Market */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-zinc-500 text-sm">MARKET:</span>
                <span className="text-cyan-600 text-2xl font-bold">€5.8B</span>
              </div>

              <div className="space-y-2 max-w-lg">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">Residential</span>
                    <span className="text-cyan-600 font-bold">€3.8B</span>
                  </div>
                  <div className="h-3 bg-zinc-200 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">Agriculture</span>
                    <span className="text-cyan-600 font-bold">€1.4B</span>
                  </div>
                  <div className="h-3 bg-zinc-200 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '37%' }}
                      transition={{ delay: 0.7, duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-700">Telecom & Industry</span>
                    <span className="text-cyan-600 font-bold">€0.6B</span>
                  </div>
                  <div className="h-3 bg-zinc-200 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '15%' }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trajectory */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex gap-6 border-t border-zinc-200 pt-4"
            >
              <div className="text-center">
                <p className="text-zinc-400 text-xs">Y1</p>
                <p className="text-zinc-900 font-bold">200</p>
                <p className="text-cyan-600 text-sm">€2.2M</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-xs">Y3</p>
                <p className="text-zinc-900 font-bold">2,500</p>
                <p className="text-cyan-600 text-sm">€36M</p>
              </div>
              <div className="text-center">
                <p className="text-zinc-400 text-xs">Y5</p>
                <p className="text-zinc-900 font-bold">5,000</p>
                <p className="text-cyan-600 text-sm">€90M+</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 3: NEXT ROUND */}
        {scene === 'nextround' && (
          <motion.div
            key="nextround"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-4"
            >
              GROWTH PATH
            </motion.p>

            {/* Seed → Series A */}
            <div className="flex items-center gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-100 p-4 rounded-lg flex-1"
              >
                <p className="poster-label text-zinc-500 mb-1">SEED</p>
                <p className="text-cyan-600 text-2xl font-bold mb-2">€2.5M</p>
                <div className="space-y-0.5 text-xs text-zinc-600">
                  <p>60 stations</p>
                  <p>Certification</p>
                  <p>Field validation</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-cyan-400 text-2xl"
              >
                →
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-cyan-50 border-2 border-cyan-200 p-4 rounded-lg flex-1"
              >
                <p className="poster-label text-zinc-500 mb-1">SERIES A</p>
                <p className="text-cyan-600 text-2xl font-bold mb-2">€10M</p>
                <div className="space-y-0.5 text-xs text-zinc-700">
                  <p>5,000 m² factory</p>
                  <p>250 units/month</p>
                  <p className="text-green-600 font-bold">Breakeven M36</p>
                </div>
              </motion.div>
            </div>

            {/* After certification */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-zinc-500 text-sm space-y-1"
            >
              <p>After certification:</p>
              <motion.p
                animate={{ color: ['#71717a', '#0891b2', '#71717a'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0 }}
              >
                • Market opens
              </motion.p>
              <motion.p
                animate={{ color: ['#71717a', '#0891b2', '#71717a'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                • Orders become bankable
              </motion.p>
              <motion.p
                animate={{ color: ['#71717a', '#0891b2', '#71717a'] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                • Revenue starts
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <SlideNav
        onPrev={currentSceneIndex > 0 ? goToPrev : undefined}
        onNext={currentSceneIndex < totalScenes - 1 ? goToNext : undefined}
        onBack={onComplete}
        showPrev={currentSceneIndex > 0}
        showNext={currentSceneIndex < totalScenes - 1}
        currentSlide={currentSceneIndex}
        totalSlides={totalScenes}
        isDark={false}
      />
    </div>
  );
}
