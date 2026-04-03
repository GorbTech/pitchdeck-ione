'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

interface ImplementationImpactProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

type Scene = 'facility' | 'inside' | 'numbers' | 'economics' | 'timeline';

const SCENES_ORDER: Scene[] = ['facility', 'inside', 'numbers', 'economics', 'timeline'];

const SCENE_DURATIONS = {
  facility: 24000,
  inside: 32000,
  numbers: 21000,
  economics: 28000,
  timeline: 25000,
};

// Timeline milestone timings in the audio (in seconds)
const TIMELINE_AUDIO_TIMINGS = {
  M4: 2.0,
  M6: 5.5,
  M12: 8.5,
  M18: 11.5,
  M24: 14.5,
  M30: 17.5,
  M36: 20.5,
};


// Video backgrounds for each scene
const SCENE_VIDEOS: Record<Scene, string> = {
  facility: '/impl-facility-bg.mp4',
  inside: '/impl-inside-bg.mp4',
  numbers: '/impl-numbers-bg.mp4',
  economics: '/impl-economics-bg.mp4',
  timeline: '/impl-timeline-bg.mp4',
};

export default function ImplementationImpact({ onComplete, voiceEnabled }: ImplementationImpactProps) {
  const [scene, setScene] = useState<Scene>('facility');
  const [facilityStep, setFacilityStep] = useState<2 | 3 | 4>(2);
  const [activeMilestone, setActiveMilestone] = useState<string | null>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualNavRef = useRef(false); // Flag to disable auto-advance after manual navigation

  const currentSceneIndex = SCENES_ORDER.indexOf(scene);
  const totalScenes = SCENES_ORDER.length;

  const goToPrev = useCallback(() => {
    // Mark as manual navigation - disable auto-advance
    isManualNavRef.current = true;
    // Clear any pending auto-advance timer
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
    // Mark as manual navigation - disable auto-advance
    isManualNavRef.current = true;
    // Clear any pending auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    const idx = SCENES_ORDER.indexOf(scene);
    if (idx < SCENES_ORDER.length - 1) {
      setScene(SCENES_ORDER[idx + 1]);
    }
  }, [scene]);

  // Facility scene steps progression
  useEffect(() => {
    if (scene !== 'facility') {
      setFacilityStep(2);
      return;
    }
    const timers: NodeJS.Timeout[] = [];
    // Step 2: "Three and a half million..." (0-5s)
    // Step 3: "Three thousand square meters..." + g1 (5-12s)
    // Step 4: Flag + stats (12-24s)
    timers.push(setTimeout(() => setFacilityStep(3), 5000));
    timers.push(setTimeout(() => setFacilityStep(4), 12000));
    return () => timers.forEach(clearTimeout);
  }, [scene]);


  // Scene progression - only auto-advance if not manually navigated
  useEffect(() => {
    // Clear any existing timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    // Skip auto-advance if user has manually navigated
    if (isManualNavRef.current) {
      return;
    }

    if (scene === 'facility') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('inside'), SCENE_DURATIONS.facility);
    } else if (scene === 'inside') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('numbers'), SCENE_DURATIONS.inside);
    } else if (scene === 'numbers') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('economics'), SCENE_DURATIONS.numbers);
    } else if (scene === 'economics') {
      autoAdvanceTimerRef.current = setTimeout(() => setScene('timeline'), SCENE_DURATIONS.economics);
    } else if (scene === 'timeline') {
      autoAdvanceTimerRef.current = setTimeout(() => onComplete(), SCENE_DURATIONS.timeline);
    }

    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
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

      const audioSrc = `/audio/impl-${scene}.mp3`;
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

  // Sync timeline milestones with audio
  useEffect(() => {
    if (scene !== 'timeline' || !voiceEnabled || !audioRef.current) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;

      // Find which milestone should be active
      let active: string | null = null;
      const milestones = Object.entries(TIMELINE_AUDIO_TIMINGS);

      for (let i = milestones.length - 1; i >= 0; i--) {
        const [month, time] = milestones[i];
        if (currentTime >= time - 0.3) {
          active = month;
          break;
        }
      }

      if (active !== activeMilestone) {
        setActiveMilestone(active);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [scene, voiceEnabled, activeMilestone]);

  // Reset active milestone when leaving timeline
  useEffect(() => {
    if (scene !== 'timeline') {
      setActiveMilestone(null);
    }
  }, [scene]);

  // Play video background for each scene with crossfade
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Fade out
    setVideoOpacity(0);

    const changeVideo = setTimeout(() => {
      video.src = SCENE_VIDEOS[scene];
      video.load();

      video.onloadeddata = () => {
        video.play().catch(() => {});
        // Fade in after video is ready
        setTimeout(() => setVideoOpacity(1), 50);
      };
    }, 400); // Wait for fade out

    return () => clearTimeout(changeVideo);
  }, [scene]);

  const milestones = [
    { month: 'M4', title: '60 sets', desc: 'Component sets produced' },
    { month: 'M6', title: 'Exhibitions', desc: 'Pilots deployed' },
    { month: 'M12', title: 'Equity', desc: 'Facility acquired' },
    { month: 'M18', title: 'Certs', desc: 'Sales begin' },
    { month: 'M24', title: 'Factory', desc: '250 units/mo' },
    { month: 'M30', title: '1,500+', desc: '50+ partners' },
    { month: 'M36', title: 'BREAKEVEN', desc: '' },
  ];

  return (
    <div className="w-full">
      {voiceEnabled && <audio ref={audioRef} />}

      {/* Video background with 75% opacity (25% white overlay) */}
      <div className="fixed inset-0 -z-30">
        <video
          ref={videoRef}
          className="w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: videoOpacity }}
          muted
          playsInline
          autoPlay
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      <AnimatePresence mode="wait">
        {/* SCENE 1: THE FACILITY - with sequential steps */}
        {scene === 'facility' && (
          <motion.div
            key="facility"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            {/* g1 Background image - ONE instance, appears from step 3 */}
            <AnimatePresence>
              {facilityStep >= 3 && (
                <motion.div
                  key="g1-image"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute -inset-4 rounded-2xl overflow-visible -z-10 flex items-center justify-center"
                >
                  <img
                    src="/facility-germany.png"
                    alt=""
                    className="w-[260%] h-[260%] object-contain translate-x-[33%]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content wrapper with black backdrop */}
            <div className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm relative z-10">
              {/* Main text area - changes with steps */}
              <div className="mb-8 min-h-[120px]">
                <AnimatePresence mode="wait">
                  {/* Step 2: Three and a half million builds a production facility */}
                  {facilityStep === 2 && (
                    <motion.div
                      key="text-step2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="text-2xl sm:text-3xl lg:text-4xl text-zinc-200 leading-relaxed">
                        <span className="text-cyan-400 font-bold">Three and a half million</span>
                        <br />builds a production facility.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 3: Three thousand square meters in Germany */}
                  {facilityStep === 3 && (
                    <motion.div
                      key="text-step3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="text-2xl sm:text-3xl lg:text-4xl text-zinc-200 leading-relaxed">
                        <span className="text-cyan-400 font-bold">Five thousand square meters</span>
                        <br />in Germany.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 4: Germany */}
                  {facilityStep === 4 && (
                    <motion.div
                      key="text-step4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      <p className="poster-label text-zinc-400 mb-2">PRODUCTION FACILITY</p>
                      <h1 className="text-5xl sm:text-6xl lg:text-7xl poster-title-xl text-white">
                        Germany
                      </h1>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Stats tables - ALWAYS visible */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-6 max-w-md"
              >
              <div className="bg-zinc-800/80 p-4 rounded-lg">
                <p className="text-cyan-400 text-3xl poster-stat">5,000 m²</p>
                <p className="text-zinc-400 text-sm poster-body">floor space</p>
              </div>
              <div className="bg-zinc-800/80 p-4 rounded-lg">
                <p className="text-cyan-400 text-3xl poster-stat">3+1</p>
                <p className="text-zinc-400 text-sm poster-body">assembly lines</p>
              </div>
              <div className="bg-zinc-800/80 p-4 rounded-lg">
                <p className="text-cyan-400 text-3xl poster-stat">250</p>
                <p className="text-zinc-400 text-sm poster-body">units / month</p>
              </div>
              <div className="bg-zinc-800/80 p-4 rounded-lg">
                <p className="text-cyan-400 text-3xl poster-stat">30</p>
                <p className="text-zinc-400 text-sm poster-body">people</p>
              </div>
            </motion.div>
            </div>

          </motion.div>
        )}

        {/* SCENE 2: INSIDE THE FACTORY */}
        {scene === 'inside' && (
          <motion.div
            key="inside"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-400 mb-2"
            >
              ASSEMBLY PROCESS
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4 mb-8 text-xl sm:text-2xl text-zinc-200 poster-body"
            >
              <span><span className="text-cyan-400 poster-accent">3</span> iONE lines + <span className="text-cyan-400 poster-accent">1</span> ESS</span>
              <span className="text-zinc-500">|</span>
              <span><span className="text-cyan-400 poster-accent">2h</span> per unit</span>
              <span className="text-zinc-500">|</span>
              <span><span className="text-cyan-400 poster-accent">12</span> units/day</span>
            </motion.div>

            {/* Production flow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-zinc-800/80 p-6 rounded-lg max-w-xl"
            >
              <svg viewBox="0 0 500 160" className="w-full">
                <motion.path
                  d="M 50 30 L 120 30 L 120 60 L 200 60"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.8, duration: 1 }}
                />
                <motion.path
                  d="M 200 60 L 280 60 L 280 80 L 380 80"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.2, duration: 0.8 }}
                />
                <motion.path
                  d="M 380 80 L 460 80"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                />

                <motion.text x="40" y="20" fill="#a1a1aa" fontSize="12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>RECEIVING</motion.text>
                <motion.text x="110" y="50" fill="#a1a1aa" fontSize="12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>PCM</motion.text>
                <motion.text x="190" y="45" fill="#fff" fontSize="11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>LINE 1</motion.text>
                <motion.text x="190" y="60" fill="#fff" fontSize="11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>LINE 2</motion.text>
                <motion.text x="190" y="75" fill="#fff" fontSize="11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>LINE 3</motion.text>
                <motion.text x="190" y="90" fill="#fff" fontSize="11" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>ESS</motion.text>
                <motion.text x="370" y="70" fill="#06b6d4" fontSize="12" fontWeight="600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>TEST</motion.text>
                <motion.text x="440" y="70" fill="#22c55e" fontSize="12" fontWeight="600" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>SHIP</motion.text>

                <motion.text x="40" y="130" fill="#71717a" fontSize="10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}>Panels · Frames · Refrigerant</motion.text>
                <motion.text x="40" y="145" fill="#71717a" fontSize="10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>Components pre-manufactured</motion.text>
              </svg>
            </motion.div>

          </motion.div>
        )}

        {/* SCENE 3: THE NUMBERS */}
        {scene === 'numbers' && (
          <motion.div
            key="numbers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-400 mb-2"
            >
              SERIES A
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl sm:text-6xl poster-title-xl text-cyan-400 mb-8"
            >
              €10,000,000
            </motion.h1>

            <div className="space-y-3 max-w-lg">
              {[
                { label: 'Factory', amount: '€3,500,000', percent: 35 },
                { label: 'Working Capital', amount: '€3,000,000', percent: 30 },
                { label: 'Team (30 FTE)', amount: '€2,000,000', percent: 20 },
                { label: 'Market Expansion', amount: '€500,000', percent: 5 },
                { label: 'Contingency', amount: '€1,000,000', percent: 10 },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-300 poster-body">{item.label}</span>
                    <span className="text-cyan-400 font-mono poster-accent">{item.amount}</span>
                  </div>
                  <div className="h-4 bg-zinc-700 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex gap-8 mt-8 text-center"
            >
              <div>
                <p className="poster-label text-zinc-400 text-xs">BREAKEVEN</p>
                <p className="text-white text-xl poster-stat">Month 36</p>
              </div>
              <div>
                <p className="poster-label text-zinc-400 text-xs">CAPACITY</p>
                <p className="text-white text-xl poster-stat">250/mo</p>
              </div>
              <div>
                <p className="poster-label text-zinc-400 text-xs">TEAM</p>
                <p className="text-white text-xl poster-stat">30 FTE</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SCENE 4: PRODUCTION ECONOMICS */}
        {scene === 'economics' && (
          <motion.div
            key="economics"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-400 mb-4"
            >
              UNIT ECONOMICS
            </motion.p>

            <div className="grid grid-cols-2 gap-4 max-w-lg mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-800/80 p-5 rounded-lg"
              >
                <h3 className="text-lg poster-title text-white mb-3">HOME</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Price</span>
                    <span className="text-cyan-400 poster-accent">€10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cost</span>
                    <span className="text-zinc-300">€6,000</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-600 pt-2">
                    <span className="text-zinc-400">Margin</span>
                    <span className="text-green-400 poster-accent">40%</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-cyan-900/50 border-2 border-cyan-500 p-5 rounded-lg"
              >
                <h3 className="text-lg poster-title text-white mb-3">CONTINENTAL</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Price</span>
                    <span className="text-cyan-400 poster-accent">€15-25k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cost</span>
                    <span className="text-zinc-300">€7.5-12.5k</span>
                  </div>
                  <div className="flex justify-between border-t border-cyan-600 pt-2">
                    <span className="text-zinc-400">Margin</span>
                    <span className="text-green-400 poster-accent">50%+</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-end gap-6"
            >
              <div className="text-center">
                <div className="h-12 w-8 bg-cyan-700 mx-auto mb-2 rounded-t" />
                <p className="text-zinc-400 text-xs poster-label">Y1</p>
                <p className="text-white poster-stat text-sm">€2.2M</p>
              </div>
              <div className="text-center">
                <div className="h-24 w-8 bg-cyan-500 mx-auto mb-2 rounded-t" />
                <p className="text-zinc-400 text-xs poster-label">Y3</p>
                <p className="text-white poster-stat text-sm">€36M</p>
              </div>
              <div className="text-center">
                <div className="h-36 w-8 bg-cyan-400 mx-auto mb-2 rounded-t" />
                <p className="text-zinc-400 text-xs poster-label">Y5</p>
                <p className="text-white poster-stat text-sm">€90M</p>
              </div>
            </motion.div>

          </motion.div>
        )}

        {/* SCENE 5: TIMELINE - with voice sync */}
        {scene === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="poster-label text-zinc-400 mb-6"
            >
              EXECUTION TIMELINE
            </motion.p>

            <div className="relative max-w-2xl">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 right-0 h-1 bg-zinc-600 rounded" />

              {/* Milestones */}
              <div className="flex justify-between relative">
                {milestones.map((m, i) => {
                  const isActive = activeMilestone === m.month;
                  const isPast = activeMilestone &&
                    milestones.findIndex(ms => ms.month === activeMilestone) >= i;
                  const isBreakeven = i === 6;

                  return (
                    <motion.div
                      key={m.month}
                      initial={{ opacity: 0.3 }}
                      animate={{
                        opacity: isPast ? 1 : 0.3,
                        scale: isActive ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center"
                    >
                      {/* Dot */}
                      <motion.div
                        animate={{
                          backgroundColor: isActive
                            ? (isBreakeven ? '#22c55e' : '#06b6d4')
                            : isPast
                              ? (isBreakeven ? '#22c55e' : '#06b6d4')
                              : '#d4d4d8',
                          boxShadow: isActive
                            ? `0 0 20px ${isBreakeven ? '#22c55e' : '#06b6d4'}`
                            : 'none',
                        }}
                        className="w-4 h-4 rounded-full mb-3 transition-all"
                      />
                      {/* Month */}
                      <motion.p
                        animate={{
                          color: isActive || isPast
                            ? (isBreakeven ? '#22c55e' : '#06b6d4')
                            : '#a1a1aa',
                          fontWeight: isActive ? 700 : 600,
                        }}
                        className="text-sm mb-1"
                      >
                        {m.month}
                      </motion.p>
                      {/* Title */}
                      <motion.p
                        animate={{
                          color: isActive || isPast
                            ? (isBreakeven ? '#22c55e' : '#ffffff')
                            : '#71717a',
                        }}
                        className="text-xs font-bold"
                      >
                        {m.title}
                      </motion.p>
                      {/* Desc */}
                      <p className="text-[10px] text-zinc-400 text-center max-w-[70px] mt-1">
                        {m.desc}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
