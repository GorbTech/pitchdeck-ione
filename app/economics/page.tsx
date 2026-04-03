'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const COMPARISON = [
  { label: 'iONE', price: '€15,000 – €25,000', highlight: true },
  { label: 'Competitors', price: '€50,000 – €90,000', highlight: false },
];

const METRICS = [
  { label: 'Cost advantage', value: '3–4×' },
  { label: 'Gross margin', value: '50–75%' },
  { label: 'SaaS revenue', value: '€49/unit/month' },
  { label: 'Customer payback', value: '<3 years vs diesel' },
];

export default function EconomicsPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/economics.mp3');
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

        <h1 className="text-5xl font-bold mb-4">ACCESSIBLE AUTONOMY</h1>
        <p className="text-zinc-400 text-xl mb-12">Hardware with software margins.</p>

        <div className="grid grid-cols-2 gap-6 mb-12">
          {COMPARISON.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.2 }}
              className={`rounded-xl p-8 text-center ${
                item.highlight
                  ? 'bg-cyan-900/50 border-2 border-cyan-500'
                  : 'bg-zinc-800'
              }`}
            >
              <p className="text-zinc-400 mb-2">{item.label}</p>
              <p className={`text-3xl font-bold ${item.highlight ? 'text-cyan-400' : 'text-zinc-500'}`}>
                {item.price}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-zinc-800 rounded-xl p-4 text-center"
            >
              <p className="text-cyan-400 text-2xl font-bold">{metric.value}</p>
              <p className="text-zinc-400 text-sm">{metric.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
