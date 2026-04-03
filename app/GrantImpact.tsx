'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

interface GrantImpactProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

type Scene = 'ask' | 'market' | 'catch22';

const SCENES_ORDER: Scene[] = ['ask', 'market', 'catch22'];

const SCENE_DURATIONS = {
  ask: 31000,
  market: 27000,
  catch22: 15000,
};

export default function GrantImpact({ onComplete, voiceEnabled }: GrantImpactProps) {
  const [scene, setScene] = useState<Scene>('ask');
  const [showBreak, setShowBreak] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualNavRef = useRef(false);

  const currentSceneIndex = SCENES_ORDER.indexOf(scene);
  const totalScenes = SCENES_ORDER.length;

  const goToPrev = useCallback(() => {
    isManualNavRef.current = true;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }
    const idx = SCENES_ORDER.indexOf(scene);
    if (idx > 0) {
      setScene(SCENES_ORDER[idx - 1]);
      setShowBreak(false);
    }
  }, [scene]);

  const goToNext = useCallback(() => {
    isManualNavRef.current = true;
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
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
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }

    if (isManualNavRef.current) return;

    if (scene === 'ask') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('market'), SCENE_DURATIONS.ask);
    } else if (scene === 'market') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('catch22'), SCENE_DURATIONS.market);
    } else if (scene === 'catch22') {
      breakTimerRef.current = setTimeout(() => setShowBreak(true), 10000);
      autoAdvanceTimerRef.current = setTimeout(() => onComplete(), SCENE_DURATIONS.catch22);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
      if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    };
  }, [scene, onComplete]);

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

      const audioSrc = `/audio/grant-${scene}.mp3`;
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

  return (
    <div className="w-full">
      {voiceEnabled && <audio ref={audioRef} />}

      <AnimatePresence mode="wait">
        {/* SCENE 1: THE ASK */}
        {scene === 'ask' && (
          <motion.div
            key="ask"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-2"
            >
              GRANT
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl poster-title-xl text-cyan-600 mb-8"
            >
              €2,350,000
            </motion.h1>

            {/* Four blocks grid */}
            <div className="grid grid-cols-2 gap-4 max-w-lg mb-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-100 p-4 rounded-lg"
              >
                <h3 className="text-cyan-600 poster-accent text-base mb-1">60 STATIONS</h3>
                <p className="text-zinc-500 text-sm mb-2">€620,000</p>
                <div className="space-y-0.5 text-xs text-zinc-600">
                  <p>20 Home · 10 Continental 0°</p>
                  <p>10 Continental 90° · 10 Continental 180°</p>
                  <p>10 Desert · 10 Arctic</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-zinc-100 p-4 rounded-lg"
              >
                <h3 className="text-cyan-600 poster-accent text-base mb-1">CERTIFICATION</h3>
                <p className="text-zinc-500 text-sm mb-2">€600,000</p>
                <div className="space-y-0.5 text-xs text-zinc-600">
                  <p>CE — all editions</p>
                  <p>MIL-STD-810H · TÜV</p>
                  <p>10 units destructive test</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-100 p-4 rounded-lg"
              >
                <h3 className="text-cyan-600 poster-accent text-base mb-1">EXHIBITIONS</h3>
                <p className="text-zinc-500 text-sm mb-2">€280,000</p>
                <div className="space-y-0.5 text-xs text-zinc-600">
                  <p>Intersolar Munich</p>
                  <p>DSEI / Eurosatory</p>
                  <p>WFES Abu Dhabi · MSPO</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-zinc-100 p-4 rounded-lg"
              >
                <h3 className="text-cyan-600 poster-accent text-base mb-1">TEAM + OPS</h3>
                <p className="text-zinc-500 text-sm mb-2">€650,000</p>
                <div className="space-y-0.5 text-xs text-zinc-600">
                  <p>7 FTE / 24 months</p>
                  <p>Certification specialist</p>
                  <p>Engineers · Field service</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex gap-6 text-sm"
            >
              <span><span className="text-cyan-600 font-bold">WIND HYBRID:</span> <span className="text-zinc-500">€150k</span></span>
              <span><span className="text-cyan-600 font-bold">SUPPLIERS:</span> <span className="text-zinc-500">€50k</span></span>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 2: THE MARKET */}
        {scene === 'market' && (
          <motion.div
            key="market"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-2"
            >
              ADDRESSABLE MARKET
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl poster-title-xl text-cyan-600 mb-8"
            >
              €5.8B
            </motion.h1>

            <div className="space-y-3 max-w-lg mb-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">Residential</span>
                  <span className="text-zinc-500">380k properties</span>
                  <span className="text-cyan-600 font-bold">€3.8B</span>
                </div>
                <div className="h-4 bg-zinc-200 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">Agriculture</span>
                  <span className="text-zinc-500">95k farms</span>
                  <span className="text-cyan-600 font-bold">€1.4B</span>
                </div>
                <div className="h-4 bg-zinc-200 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '37%' }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-700">Telecom & Industry</span>
                  <span className="text-zinc-500">28k sites</span>
                  <span className="text-cyan-600 font-bold">€0.6B</span>
                </div>
                <div className="h-4 bg-zinc-200 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '15%' }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="border-t border-zinc-200 pt-4"
            >
              <p className="text-zinc-500 text-xs mb-3">TARGET: 1.5% penetration</p>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-zinc-400 text-xs">Y1</p>
                  <p className="text-zinc-900 font-bold">200+</p>
                  <p className="text-cyan-600 text-sm">€2.2M</p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-400 text-xs">Y3</p>
                  <p className="text-zinc-900 font-bold">2,500+</p>
                  <p className="text-cyan-600 text-sm">€36M</p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-400 text-xs">Y5</p>
                  <p className="text-zinc-900 font-bold">5,000+</p>
                  <p className="text-cyan-600 text-sm">€90M+</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 3: THE CATCH-22 */}
        {scene === 'catch22' && (
          <motion.div
            key="catch22"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-500 mb-6"
            >
              THE CATCH-22
            </motion.p>

            {/* Simplified cycle */}
            <div className="max-w-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-zinc-100 px-4 py-3 rounded-lg text-center"
                >
                  <p className="text-cyan-600 font-bold">BANKS</p>
                  <p className="text-zinc-500 text-xs">need orders</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-cyan-400 text-2xl"
                >→</motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-zinc-100 px-4 py-3 rounded-lg text-center"
                >
                  <p className="text-cyan-600 font-bold">ORDERS</p>
                  <p className="text-zinc-500 text-xs">need certs</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-cyan-400 text-2xl"
                >→</motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-zinc-100 px-4 py-3 rounded-lg text-center"
                >
                  <p className="text-cyan-600 font-bold">CERTS</p>
                  <p className="text-zinc-500 text-xs">need capital</p>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-cyan-400 text-xl mb-4"
              >
                ↺
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-zinc-500 text-sm space-y-1 mb-6"
            >
              <p>Without certification — no orders.</p>
              <p>Without orders — no bank financing.</p>
              <p>Without capital — no certification.</p>
            </motion.div>

            <AnimatePresence>
              {showBreak && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0 0 rgba(6, 182, 212, 0)',
                        '0 0 20px 5px rgba(6, 182, 212, 0.3)',
                        '0 0 0 0 rgba(6, 182, 212, 0)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="inline-block bg-cyan-500 text-white font-bold text-lg px-6 py-3 rounded-lg"
                  >
                    EIC breaks this cycle.
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
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
