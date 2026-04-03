'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const TEAM = [
  {
    name: 'Ivan Gorb',
    role: 'CEO',
    image: '/Gorb.png',
    bio: 'Oil refinery operations, €20M+ assets managed',
  },
  {
    name: 'Witalij Tenkow',
    role: 'CTO',
    image: '/Witalij.png',
    bio: '200+ solar installations, Nordic engineering',
  },
  {
    name: 'Marina Guseva',
    role: 'Investment Director',
    image: '/Guseva.png',
    bio: '10+ years gaming industry & automotive',
  },
  {
    name: 'Mariia Khodorkova',
    role: 'COO',
    image: '/Khodorkova.png',
    bio: 'Logistics, UN38.3 & CE certification',
  },
  {
    name: 'Dr. Vladislaw Andrushko',
    role: 'AI Advisor',
    image: '/Andrushko.png',
    bio: 'Machine learning, predictive systems',
  },
];

export default function TeamPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/audio/team.mp3');
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
        className="max-w-6xl mx-auto"
      >
        <button
          onClick={() => router.push('/')}
          className="text-zinc-400 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back
        </button>

        <h1 className="text-5xl font-bold mb-2">BUILDERS OF INTENT</h1>
        <p className="text-zinc-400 text-xl mb-12">We know infrastructure. Now we're giving it a heartbeat.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-800 rounded-xl p-6 flex flex-col items-center text-center"
            >
              <div className="w-32 h-32 rounded-full bg-zinc-700 mb-4 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">{member.name}</h3>
              <p className="text-cyan-400 text-sm mb-2">{member.role}</p>
              <p className="text-zinc-400 text-sm">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
