'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SlideNav from './components/SlideNav';
import { fadeAudioOut, fadeAudioIn, AUDIO_GAP } from './hooks/useAudioTransition';

interface HardwareDeepDiveProps {
  onComplete: () => void;
  voiceEnabled: boolean;
}

const SCENES = [
  { section: 'BODY', image: 'SceletUP.png', audio: 'products-01.mp3', text: ['PROPRIETARY EXTRUSION PROFILE', '3 INTERLOCKING SECTIONS', '2 ARCH MASTS · Ø115 mm', 'CENTRE SECTION · 365×230 mm', 'PRECISION MACHINED GROOVES', 'DIE OWNED BY GT GmbH'] },
  { section: 'BODY', image: 'Body.png', audio: 'products-02.mp3', text: ['6063-T6 ALUMINUM · 5 mm WALL', '15 μm HARD ANODIZED', '1000+ HOURS SALT SPRAY', '3 m · 175 kg · 25-YEAR LIFE', 'AVIATION-GRADE CONNECTORS', 'ANDERSON SB175 · MC4 · M12 · N-TYPE'] },
  { section: 'BODY', image: 'B1.png', audio: 'products-03.mp3', text: ['16.1 kWh USABLE · 90% DoD', 'LiFePO₄ · CATL PRISMATIC CELLS', '280–314 Ah · 16S · 51.2 V NOMINAL', '10,000+ CYCLES TO 80%', '15-YEAR CALENDAR LIFE', 'PTC HEATING < 0°C · 70 kg'] },
  { section: 'BODY', image: 'B1i.png', audio: 'products-04.mp3', text: ['16 kWh + 6 kW INVERTER', '230 V AC · 50/60 Hz', '0 ms TRANSFER · TRUE UPS', '48 V DC TELECOM STANDARD', 'HOT-SWAPPABLE · N+1 REDUNDANCY', '4 kW MPPT · 96% EFFICIENCY'] },
  { section: 'BODY', image: 'B2i.png', audio: 'products-05.mp3', text: ['32.2 kWh · 29 kWh USABLE', '10 kW INVERTER · 9 kW SURGE', '4+ DAYS AT 300 W LOAD', '2× MPPT · 8 kW SOLAR CAPACITY', '48 V DC + AC SIMULTANEOUS', 'MODULAR INVERTER RACK'] },
  { section: 'ACCESS', image: 'left.png', audio: 'products-06.mp3', text: ['HERMETIC HATCH · SEALED', '1 m HEIGHT · FLUSH WITH BODY', 'CONTINUOUS EPDM GASKET', 'IP65 · DUST-TIGHT · WATER JETS', 'MONOLITHIC FORM · NO SEAMS', 'DEFENCE · LOW VISUAL SIGNATURE'] },
  { section: 'ACCESS', image: 'OP1.png', audio: 'products-07.mp3', text: ['HERMETIC HATCH · OPEN', '2× LINEAR ACTUATORS · 1 kNm EACH', 'REMOTE CONTROL VIA iONEOS', 'BATTERY · INVERTER · BMS · CONTROLLER', 'MODULE SWAP < 10 MIN · HAND TOOLS', 'IP67 ACTUATORS · SELF-LOCKING'] },
  { section: 'THERMAL', image: 'h1.png', audio: 'products-08.mp3', text: ['CONTINENTAL · −20°C TO +45°C', 'FULLY PASSIVE THERMAL MANAGEMENT', 'COPPER FOAM → ALUMINIUM BODY', 'BODY = STRUCTURE + HEAT SINK', '3 m² SURFACE · NATURAL CONVECTION', 'DESIGNED AS THERMAL PATH'] },
  { section: 'THERMAL', image: 'z2.png', audio: 'products-09.mp3', text: ['ARCTIC SHIELD · DESERT SHIELD', 'AEROGEL 20–40 mm · <0.02 W/m·K', 'PARAFFIN RT28HC · 36.5 kg · 2.5 kWh', '48 V COMPRESSOR · COP 2.7–3.0', 'ARCTIC: PTC 100 W · PCM 10°C', '−60°C TO +75°C OPERATING RANGE'] },
  { section: 'WIND', image: 'h1.png', audio: 'products-10.mp3', text: ['DUAL-AXIS SOLAR TRACKER', 'WORM-GEAR SLEWING DRIVES', 'AZIMUTH 360° · ELEVATION −10° TO +90°', '±0.1° PRECISION · PHOTODIODE + ALGORITHM', '+25–35% ENERGY vs FIXED MOUNT', 'ULTRASONIC WIND SENSOR · REAL-TIME'] },
  { section: 'WIND', image: 'D3.png', audio: 'products-11.mp3', text: ['PANELS FULLY DEPLOYED', '4× 720 W BIFACIAL TOPCon', '4.32 kWp FRONT · 5.6 kWp EFFECTIVE', 'GLASS-GLASS · ALD COATING · 9H', 'ACTIVE SUN-FOLLOWING MODE', 'BOTH AXES MOVING'] },
  { section: 'WIND', image: 'D4.png', audio: 'products-12.mp3', text: ['90° VERTICAL DROP', 'WIND > 12 m/s SUSTAINED', 'MINIMUM CROSS-SECTION TO WIND', 'STANDARD STORM RESPONSE', 'WORM GEAR SELF-LOCKING', 'RATING: 180 km/h'] },
  { section: 'WIND', image: 'D1.png', audio: 'products-13.mp3', text: ['STORM PROTOCOL INITIATED', 'WIND > 80 km/h OR FORECAST ALERT', '4 ACTUATORS · 6500 Nm EACH', '3× SAFETY MARGIN', 'FULL FOLD < 60 SECONDS', 'AUTOMATIC SEQUENCE'] },
  { section: 'WIND', image: 'D2.png', audio: 'products-14.mp3', text: ['180° STEALTH FOLD', 'PANELS FACE-TO-FACE · GLASS PROTECTED', 'SAND · ICE · VOLCANIC ASH', '200+ km/h · ZERO BACKLASH · ZERO POWER', 'UNIQUE IN INDUSTRY', 'MINIMAL VISUAL + IR SIGNATURE'] },
  { section: 'INSTALLATION', image: 'Base.png', audio: 'products-15.mp3', text: ['MOUNTING FRAME', '8 MODULAR SECTIONS · 120 kg TOTAL', 'ASSEMBLES IN 10 MIN · 12 BOLTS', 'FITS IN STANDARD PICKUP', 'ONE PALLET SHIPS ENTIRE STATION'] },
  { section: 'INSTALLATION', image: 'Base2.png', audio: 'products-16.mp3', text: ['STAINLESS STEEL 304', '6 ANCHOR POINTS · 3 m² FOOTPRINT', 'SALT AIR · DESERT · ARCTIC FROST', 'FRAME OUTLASTS THE STATION'] },
  { section: 'INSTALLATION', image: 'Pill.png', audio: 'products-17.mp3', text: ['HELICAL SCREW PILE', 'COMPACT ELECTRIC PILE DRIVER', '2× 1.5 m VERTICAL LOAD', '4× 1.0 m LATERAL FORCES', 'ALL 6 PILES · UNDER 2 HOURS'] },
  { section: 'INSTALLATION', image: 'BeseBody.png', audio: 'products-18.mp3', text: ['BODY MOUNTED ON BASE', '2 PRIMARY PILES ANCHORED', 'STRUCTURALLY STABLE', 'READY FOR POWER-ON TEST', 'ELECTRICAL · SINGLE PLUG'] },
  { section: 'INSTALLATION', image: 'Pills2.png', audio: 'products-19.mp3', text: ['4 STABILIZATION PILES', 'FULL LATERAL BRACING ACTIVE', 'WIND · SEISMIC · GROUND HEAVE', 'EXCEEDS 200 km/h WIND ZONE'] },
  { section: 'INSTALLATION', image: 'Pills22.png', audio: 'products-20.mp3', text: ['ALL 6 PILES ANCHORED', '3 m² FOOTPRINT', '2 PEOPLE · < 24 HOURS', 'NO CONCRETE · NO CRANE · NO PERMITS', 'ARRIVES ON ONE PALLET', 'POWER SAME DAY · ZERO TRACE'] },
];

function getScale(image: string): number {
  if (image === 'D3.png') return 2;
  if (image === 'D1.png') return 2;
  if (image === 'D2.png') return 2.6;
  if (image === 'D4.png') return 2.75;
  if (image === 'Base2.png') return 2;
  if (image === 'z2.png') return 0.85;
  if (image === 'Base.png') return 1.1;
  if (image === 'h1.png') return 1.15;
  return 1;
}

function getTranslateX(image: string): number {
  if (image === 'B1.png' || image === 'B1i.png' || image === 'B2i.png') return 100;
  return 0;
}

function getTranslateY(image: string): string {
  if (image === 'D2.png') return '-15%';
  if (image === 'D4.png') return '-10%';
  return '0%';
}

export default function HardwareDeepDive({ onComplete, voiceEnabled }: HardwareDeepDiveProps) {
  const [idx, setIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [allFinished, setAllFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scene = SCENES[idx];

  // Play audio for current slide with smooth transitions
  useEffect(() => {
    let cancelled = false;

    const playCurrentSlide = async () => {
      if (!voiceEnabled) {
        // Without voice, auto-advance after 5 seconds
        const timer = setTimeout(() => {
          if (idx < SCENES.length - 1) {
            setIdx(idx + 1);
          } else {
            setAllFinished(true);
          }
        }, 5000);
        return () => clearTimeout(timer);
      }

      // Fade out previous audio if playing
      if (audioRef.current && !audioRef.current.paused) {
        await fadeAudioOut(audioRef.current);
        audioRef.current = null;
      }

      // Wait for consistent gap
      await new Promise(resolve => setTimeout(resolve, AUDIO_GAP));

      if (cancelled) return;

      // Play new audio with fade in
      const audio = new Audio(`/audio/${scene.audio}`);
      audioRef.current = audio;
      audio.volume = 0; // Start silent
      setIsPlaying(true);

      audio.onended = () => {
        setIsPlaying(false);
        // Auto-advance to next slide
        if (idx < SCENES.length - 1) {
          setIdx(idx + 1);
        } else {
          setAllFinished(true);
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        // On error, still advance
        if (idx < SCENES.length - 1) {
          setTimeout(() => setIdx(idx + 1), 2000);
        } else {
          setAllFinished(true);
        }
      };

      try {
        await audio.play();
        if (!cancelled) {
          await fadeAudioIn(audio);
        }
      } catch (e) {
        setIsPlaying(false);
      }
    };

    playCurrentSlide();

    return () => {
      cancelled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [idx, voiceEnabled, scene.audio]);

  const goTo = useCallback(async (n: number) => {
    if (n < 0 || n >= SCENES.length || n === idx || isTransitioning) return;

    setIsTransitioning(true);

    // Fade out current audio when manually navigating
    if (audioRef.current && !audioRef.current.paused) {
      await fadeAudioOut(audioRef.current);
      audioRef.current = null;
    }

    setIdx(n);
    setIsTransitioning(false);
  }, [idx, isTransitioning]);

  const next = () => goTo(idx + 1);
  const prev = () => goTo(idx - 1);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#111113] overflow-hidden"
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Section title */}
      <div className="absolute top-5 left-10 z-20">
        <h1
          className="poster-title-xl text-white/10"
          style={{ fontSize: 'clamp(2rem, 8vw, 6rem)', letterSpacing: '0.25em' }}
        >
          {scene.section}
        </h1>
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
          <span className="text-white/40 text-xs poster-label">PLAYING</span>
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: isTransitioning ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 flex w-full h-full"
        >
          {/* Text panel */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-10 z-30 flex flex-col gap-1">
            {scene.text.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-white/80 text-base poster-body leading-[2.25]"
                style={{ letterSpacing: '0.1em' }}
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* Image panel */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: getScale(scene.image) * 0.95 }}
              animate={{ opacity: 1, scale: getScale(scene.image), x: getTranslateX(scene.image), y: getTranslateY(scene.image) }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={`/products/${scene.image}`}
                alt={scene.section}
                className="max-w-full max-h-[85vh] object-contain"
              />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Unified Navigation */}
      <SlideNav
        onPrev={idx > 0 ? prev : undefined}
        onNext={idx < SCENES.length - 1 ? next : undefined}
        onBack={onComplete}
        showPrev={idx > 0}
        showNext={idx < SCENES.length - 1}
        currentSlide={idx}
        totalSlides={SCENES.length}
        isDark={true}
      />
    </motion.div>
  );
}
