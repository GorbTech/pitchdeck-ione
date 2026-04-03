'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

interface ClimateImpactProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

interface SlideLine {
  text: string;
  time: number;
  stat?: boolean;
  highlight?: boolean;
  small?: boolean;
}

interface Slide {
  title: string;
  lines: SlideLine[];
}

const SLIDES: Slide[] = [
  // SLIDE 1 - REPLACEMENT (32 sec)
  {
    title: 'REPLACEMENT',
    lines: [
      { text: 'Autonomous solar station · Integrated storage', time: 0 },
      { text: 'Fully replaces a diesel generator', time: 4 },
      { text: '2 people · Under 24 hours · Operational immediately', time: 7 },
      { text: '8,000 L diesel eliminated per year', time: 18, stat: true },
      { text: '21 t CO₂ per year — verified through iONEOS', time: 24, stat: true },
    ]
  },
  // SLIDE 2 - LOGISTICS CHAIN (41 sec)
  {
    title: 'LOGISTICS CHAIN',
    lines: [
      { text: 'Behind every generator — a logistics chain', time: 0 },
      { text: 'Tankers · Depots · Helicopters · Convoys', time: 5, small: true },
      { text: 'Arctic delivery: up to €100,000 / year per site', time: 15, stat: true },
      { text: 'Every kilometre — its own carbon footprint', time: 20 },
      { text: 'iONE: energy produced where it is consumed', time: 27, highlight: true },
      { text: 'Sunlight replaces supply lines', time: 35, highlight: true },
    ]
  },
  // SLIDE 3 - FOUNDATION (42 sec)
  {
    title: 'FOUNDATION',
    lines: [
      { text: 'Cement: 8% of global CO₂ — more than aviation', time: 0 },
      { text: 'Container systems: tonnes of concrete, heavy machinery, weeks', time: 8, small: true },
      { text: 'iONE: 6 helical screw piles · 2 people · hours', time: 17, highlight: true },
      { text: 'Light · Fast · Fully reversible', time: 24, highlight: true },
      { text: '25 years of service — ground unchanged', time: 30, stat: true },
      { text: 'Energy infrastructure that leaves the earth untouched', time: 36 },
    ]
  },
  // SLIDE 4 - GRID-FREE (42 sec)
  {
    title: 'GRID-FREE',
    lines: [
      { text: 'Grid extension: trenches · pylons · substations', time: 0 },
      { text: 'Years of construction · Thousands of tonnes of materials', time: 5, small: true },
      { text: 'Fixed in place — becomes waste if mission moves', time: 15 },
      { text: 'iONE: one pallet · power on day one', time: 23, highlight: true },
      { text: 'Relocatable — follows the mission', time: 30, highlight: true },
      { text: 'Reusable infrastructure instead of permanent construction', time: 35 },
    ]
  },
  // SLIDE 5 - CLEAN OPERATION (43 sec)
  {
    title: 'CLEAN OPERATION',
    lines: [
      { text: 'Diesel: fuel leaks · oil in groundwater · heavy metal deposits', time: 0 },
      { text: 'After removal: soil testing · excavation · hazardous waste', time: 12, small: true },
      { text: 'iONE: solar + sealed LFP batteries', time: 22, highlight: true },
      { text: 'Clean chemistry inside · Clean ground outside', time: 27, highlight: true },
      { text: '25 years — site unchanged', time: 34, stat: true },
      { text: 'Full environmental integrity for the entire lifecycle', time: 39 },
    ]
  },
  // SLIDE 6 - LIFETIME IMPACT (60 sec)
  {
    title: 'LIFETIME IMPACT',
    lines: [
      { text: 'Diesel generator: 3-year lifespan · 8 replacements per site', time: 0 },
      { text: '8 manufacturing cycles · 8 shipping routes · 8 disposals', time: 8, small: true },
      { text: 'iONE: built once · 25 years', time: 16, highlight: true },
      { text: 'Aluminium · Stainless steel · LFP — fully recyclable', time: 20 },
      { text: '200,000 L diesel replaced · 525 t CO₂ eliminated per station', time: 28, stat: true },
      { text: 'Fleet: 5,000 units → 40M litres · 105,000 t CO₂ / year', time: 42, stat: true },
      { text: 'Verified through iONEOS telemetry', time: 54, highlight: true },
    ]
  },
];

// Video sources for each slide
const VIDEO_SOURCES = [
  '/climate-bg.mp4',
  '/slide2-bg.mp4',
  '/slide3-bg.mp4',
  '/slide4-bg.mp4',
  '/slide5-bg.mp4',
  '/slide6-bg.mp4',
];

export default function ClimateImpact({ onComplete, voiceEnabled }: ClimateImpactProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [yearCounter, setYearCounter] = useState(1);
  const [videosReady, setVideosReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const yearIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isManualNavRef = useRef(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const slide = SLIDES[currentSlide];
  const totalSlides = SLIDES.length;
  const isLastSlide = currentSlide === 5;

  // Year counter animation for the last slide (1 to 25 over ~55 seconds to match audio)
  useEffect(() => {
    if (isLastSlide) {
      setYearCounter(1);
      const duration = 55000; // 55 seconds to count from 1 to 25 (audio is 59s)
      const steps = 24; // 24 steps (from 1 to 25)
      const stepInterval = duration / steps; // ~2.29 seconds per year

      const interval = setInterval(() => {
        setYearCounter(prev => {
          if (prev >= 25) {
            clearInterval(interval);
            return 25;
          }
          return prev + 1;
        });
      }, stepInterval);

      yearIntervalRef.current = interval;

      return () => {
        clearInterval(interval);
        yearIntervalRef.current = null;
      };
    } else {
      setYearCounter(1);
    }
  }, [isLastSlide]);

  // Control video playback based on current slide
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === currentSlide) {
        // Current slide - play video
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        // Other slides - pause video
        video.pause();
      }
    });
  }, [currentSlide]);

  // Preload all videos on mount
  useEffect(() => {
    let loadedCount = 0;
    const totalVideos = VIDEO_SOURCES.length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalVideos) {
        setVideosReady(true);
      }
    };

    videoRefs.current.forEach((video) => {
      if (video) {
        if (video.readyState >= 3) {
          checkAllLoaded();
        } else {
          video.addEventListener('canplaythrough', checkAllLoaded, { once: true });
        }
      }
    });

    return () => {
      videoRefs.current.forEach((video) => {
        if (video) {
          video.removeEventListener('canplaythrough', checkAllLoaded);
        }
      });
    };
  }, []);

  const cleanup = async (withFade = false) => {
    // Clear auto-advance timer
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      // Remove event listeners to prevent auto-advance
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      if (withFade && !audioRef.current.paused) {
        await fadeAudioOut(audioRef.current);
      } else {
        audioRef.current.pause();
      }
      audioRef.current = null;
    }
  };

  const goToSlide = useCallback(async (slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= totalSlides) return;

    // Mark as manual navigation - disable auto-advance
    isManualNavRef.current = true;

    // Fade out current audio and clear all timers
    await cleanup(true);

    // Wait for consistent gap
    await new Promise(resolve => setTimeout(resolve, AUDIO_GAP));

    setVisibleLines([]);
    setCurrentSlide(slideIndex);

    if (!voiceEnabled) {
      SLIDES[slideIndex].lines.forEach((_, i) => {
        setTimeout(() => {
          setVisibleLines(prev => [...prev, i]);
        }, i * 800);
      });
      return;
    }

    const audio = new Audio(`/audio/climate-slide-${slideIndex + 1}.mp3`);
    audioRef.current = audio;
    audio.volume = 0; // Start silent for fade in

    audio.onloadedmetadata = async () => {
      setIsPlaying(true);
      try {
        await audio.play();
        await fadeAudioIn(audio);
      } catch (e) {
        console.error('Audio play error:', e);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setVisibleLines(SLIDES[slideIndex].lines.map((_, i) => i));
      // No auto-advance in manual navigation mode
    };

    audio.onerror = () => {
      SLIDES[slideIndex].lines.forEach((_, i) => {
        setTimeout(() => {
          setVisibleLines(prev => [...prev, i]);
        }, i * 800);
      });
    };

    intervalRef.current = setInterval(() => {
      if (audio && !audio.paused) {
        const currentTime = audio.currentTime;
        const newVisible: number[] = [];
        SLIDES[slideIndex].lines.forEach((line, i) => {
          if (currentTime >= line.time) {
            newVisible.push(i);
          }
        });
        setVisibleLines(newVisible);
      }
    }, 50);
  }, [voiceEnabled, totalSlides]);

  const playSlide = async (slideIndex: number) => {
    // Fade out current audio if playing
    await cleanup(true);

    // Wait for consistent gap between tracks
    await new Promise(resolve => setTimeout(resolve, AUDIO_GAP));

    setVisibleLines([]);
    setCurrentSlide(slideIndex);

    if (!voiceEnabled) {
      // Without voice - show lines with animation
      SLIDES[slideIndex].lines.forEach((_, i) => {
        setTimeout(() => {
          setVisibleLines(prev => [...prev, i]);
        }, i * 800);
      });
      // Only auto-advance if not manually navigated
      if (!isManualNavRef.current) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          if (slideIndex < totalSlides - 1) {
            playSlide(slideIndex + 1);
          } else {
            autoAdvanceTimerRef.current = setTimeout(() => onComplete(), 2000);
          }
        }, SLIDES[slideIndex].lines.length * 800 + 3000);
      }
      return;
    }

    // With voice - sync to audio
    const audio = new Audio(`/audio/climate-slide-${slideIndex + 1}.mp3`);
    audioRef.current = audio;
    audio.volume = 0; // Start silent for fade in

    audio.onloadedmetadata = async () => {
      setIsPlaying(true);
      try {
        await audio.play();
        await fadeAudioIn(audio);
      } catch (e) {
        console.error('Audio play error:', e);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setVisibleLines(SLIDES[slideIndex].lines.map((_, i) => i));

      // Only auto-advance if not manually navigated
      if (!isManualNavRef.current) {
        if (slideIndex < totalSlides - 1) {
          playSlide(slideIndex + 1);
        } else {
          // Last slide - wait for year counter to complete (55s) plus buffer
          autoAdvanceTimerRef.current = setTimeout(() => onComplete(), 5000);
        }
      }
    };

    audio.onerror = () => {
      // Fallback - show lines with animation
      SLIDES[slideIndex].lines.forEach((_, i) => {
        setTimeout(() => {
          setVisibleLines(prev => [...prev, i]);
        }, i * 800);
      });
      // Only auto-advance if not manually navigated
      if (!isManualNavRef.current) {
        autoAdvanceTimerRef.current = setTimeout(() => {
          if (slideIndex < totalSlides - 1) {
            playSlide(slideIndex + 1);
          } else {
            onComplete();
          }
        }, SLIDES[slideIndex].lines.length * 800 + 3000);
      }
    };

    // Sync text to audio
    intervalRef.current = setInterval(() => {
      if (audio && !audio.paused) {
        const currentTime = audio.currentTime;
        const newVisible: number[] = [];
        SLIDES[slideIndex].lines.forEach((line, i) => {
          if (currentTime >= line.time) {
            newVisible.push(i);
          }
        });
        setVisibleLines(newVisible);
      }
    }, 50);
  };

  // Start on mount
  useEffect(() => {
    const timer = setTimeout(() => playSlide(0), 500);
    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, []);

  return (
    <div className="w-full max-w-3xl relative">
      {/* All background videos preloaded - visibility controlled by opacity */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {VIDEO_SOURCES.map((src, index) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: currentSlide === index ? 1 : 0 }}
          >
            <video
              ref={(el) => { videoRefs.current[index] = el; }}
              muted
              loop
              playsInline
              preload="auto"
              className="absolute w-full h-full object-cover"
            >
              <source src={src} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-white/40" />
          </div>
        ))}
      </div>

      {/* Text content with black backdrop */}
      <div className="bg-black/75 rounded-2xl p-6 backdrop-blur-sm">
        {/* Progress bars */}
        <div className="flex gap-2 mb-6">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded ${
                i < currentSlide ? 'bg-cyan-600' : i === currentSlide ? 'bg-cyan-400' : 'bg-zinc-600'
              }`}
            />
          ))}
        </div>

        {/* Slide Header */}
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <span className="poster-label text-zinc-400">
            {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl poster-title text-white mt-2">
            {slide.title}
          </h1>
        </motion.div>

        {/* Content Lines */}
        <div className="space-y-3 min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {slide.lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: visibleLines.includes(i) ? 1 : 0,
                    y: visibleLines.includes(i) ? 0 : 20
                  }}
                  transition={{ duration: 0.4 }}
                  className={`mb-4 ${
                    line.stat
                      ? 'text-cyan-400 text-3xl sm:text-4xl poster-stat my-6'
                      : line.highlight
                        ? 'text-white text-xl sm:text-2xl poster-accent'
                        : line.small
                          ? 'text-zinc-400 text-base sm:text-lg poster-body'
                          : 'text-zinc-200 text-lg sm:text-xl poster-body'
                  }`}
                >
                  {line.text}
                </motion.p>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Year Counter - only on last slide */}
      <AnimatePresence>
        {isLastSlide && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-32 right-8 sm:right-16 lg:right-24 z-40"
          >
            <div className="bg-zinc-900 rounded-2xl px-8 py-6 shadow-2xl border border-zinc-700">
              <p className="text-zinc-400 text-xs tracking-widest mb-2 text-center">
                STATION LIFESPAN
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <motion.span
                  key={yearCounter}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold text-cyan-400 tabular-nums"
                >
                  {yearCounter}
                </motion.span>
                <span className="text-xl sm:text-2xl text-zinc-400 font-medium">
                  {yearCounter === 1 ? 'year' : 'years'}
                </span>
              </div>
              <div className="mt-3 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                  initial={{ width: '4%' }}
                  animate={{ width: `${(yearCounter / 25) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-zinc-500 text-xs mt-2 text-center">
                vs diesel: 3-year lifespan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio indicator */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-1"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ scaleY: [1, 1.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 h-4 bg-cyan-500 rounded"
            />
          ))}
        </motion.div>
      )}

      {/* Navigation */}
      <SlideNav
        onPrev={currentSlide > 0 ? () => goToSlide(currentSlide - 1) : undefined}
        onNext={currentSlide < totalSlides - 1 ? () => goToSlide(currentSlide + 1) : undefined}
        onBack={onComplete}
        showPrev={currentSlide > 0}
        showNext={currentSlide < totalSlides - 1}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        isDark={false}
      />
    </div>
  );
}
