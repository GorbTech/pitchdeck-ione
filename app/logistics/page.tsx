'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const FEATURES = [
  { label: 'MIL-STD-810H', value: 'certified platform' },
  { label: '180° fold', value: '90% thermal signature reduction' },
  { label: '30 min', value: 'full relocation' },
  { label: '12 days', value: 'autonomy without sun' },
];

export default function LogisticsPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/defence.mp3');
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
        className="max-w-4xl mx-auto"
      >
        <button
          onClick={() => router.push('/')}
          className="text-zinc-400 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-5xl font-bold mb-4">LOGISTICS IMMUNITY</h1>
        <p className="text-zinc-400 text-xl mb-12">Energy arrives silently. Continuously. Independently.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="bg-zinc-800 rounded-xl p-6"
            >
              <p className="text-cyan-400 text-3xl font-bold mb-2">{feat.label}</p>
              <p className="text-zinc-300">{feat.value}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-800/50 rounded-xl p-8 text-center"
        >
          <p className="text-2xl text-zinc-300">
            Eliminates fuel convoy vulnerability.<br />
            <span className="text-cyan-400">Moves with the mission.</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
