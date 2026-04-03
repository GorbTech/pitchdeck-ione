'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const TIMELINE = [
  { year: 'Primary', regions: 'EU — Germany, Poland, Balkans' },
  { year: 'Year 3', regions: 'MENA pilots, Nordic expansion' },
  { year: 'Year 5', regions: 'Full scale' },
];

const SEGMENTS = [
  { name: 'Telecom towers', desc: 'replacing diesel generators' },
  { name: 'Oil & Gas', desc: 'pipeline and wellhead monitoring' },
  { name: 'Agriculture', desc: 'autonomous irrigation' },
  { name: 'Defence', desc: 'border security, forward bases' },
  { name: 'Construction', desc: 'temporary site power' },
  { name: 'EV Charging', desc: 'remote locations' },
];

export default function MarketPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/market.mp3');
    audioRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto"
      >
        <button
          onClick={() => router.push('/')}
          className="text-zinc-400 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-5xl font-bold mb-4">WHERE AUTONOMY MATTERS</h1>
        <p className="text-cyan-400 text-2xl mb-12">TAM €500M+ extreme environments</p>

        <div className="flex gap-4 mb-12">
          {TIMELINE.map((t, i) => (
            <motion.div
              key={t.year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex-1 bg-zinc-800 rounded-xl p-4"
            >
              <p className="text-cyan-400 font-bold mb-1">{t.year}</p>
              <p className="text-zinc-300 text-sm">{t.regions}</p>
            </motion.div>
          ))}
        </div>

        <h2 className="text-xl text-zinc-400 mb-6">SEGMENTS</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SEGMENTS.map((seg, i) => (
            <motion.div
              key={seg.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-zinc-800 rounded-xl p-4"
            >
              <p className="text-white font-bold">{seg.name}</p>
              <p className="text-zinc-400 text-sm">{seg.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
