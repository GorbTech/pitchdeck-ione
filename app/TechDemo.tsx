'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import MissionControl from './MissionControl';

interface Message {
  id: number;
  direction: 'in' | 'out';
  tag: string;
  text: string;
  card?: React.ReactNode;
}

interface PhoneProps {
  name: string;
  sub: string;
  avatar: string;
  badge: string;
  messages: Message[];
  side: 'left' | 'right';
  isActive: boolean;
}

function Phone({ name, sub, avatar, badge, messages, side, isActive }: PhoneProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={{
        opacity: isActive ? 1 : 0.4,
        x: 0,
        scale: isActive ? 1.05 : 0.95,
      }}
      transition={{ duration: 0.4 }}
      className="w-[300px] h-[560px] rounded-[20px] flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,34,0.95), rgba(11,15,20,0.98))',
        border: isActive ? '1px solid rgba(90,162,255,0.4)' : '1px solid rgba(255,255,255,0.12)',
        boxShadow: isActive
          ? '0 25px 60px rgba(0,0,0,0.55), 0 0 30px rgba(90,162,255,0.2)'
          : '0 25px 60px rgba(0,0,0,0.55)',
      }}
    >
        {/* Status bar */}
        <div className="h-8 px-3 flex justify-between items-center text-[11px] text-white/80 border-b border-white/5 bg-black/20">
          <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-white/10 bg-white/5">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
            <span>iONE Link</span>
          </div>
          <div className="flex items-center gap-2">
            <span>10:12</span>
          </div>
        </div>

        {/* Header */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-white/5 bg-white/[0.02]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(90,162,255,0.45), rgba(21,195,122,0.25))',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            {avatar}
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-semibold">{name}</div>
            <div className="text-white/60 text-[11px]">{sub}</div>
          </div>
          <div
            className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              background: 'rgba(90,162,255,0.12)',
              border: '1px solid rgba(90,162,255,0.25)',
              color: 'rgba(233,240,255,0.9)',
            }}
          >
            <div className="w-[6px] h-[6px] rounded-full bg-blue-400" />
            {badge}
          </div>
        </div>

        {/* Chat */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed"
                style={{
                  background: msg.direction === 'out'
                    ? 'linear-gradient(135deg, rgba(42,92,255,0.95), rgba(90,162,255,0.70))'
                    : 'rgba(19,34,55,0.65)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(233,240,255,0.95)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                {msg.card && <div className="mt-2">{msg.card}</div>}
                <div className="mt-1 flex justify-between items-center text-[10px] opacity-70">
                  <span className="px-1.5 py-0.5 rounded-full border border-white/20 bg-black/10">
                    {msg.tag}
                  </span>
                  <span>10:12</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Composer */}
        <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex items-center gap-2">
          <div
            className="flex-1 h-9 rounded-full px-3 flex items-center text-white/50 text-[12px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            Message…
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/90 font-bold"
            style={{
              background: 'rgba(90,162,255,0.14)',
              border: '1px solid rgba(90,162,255,0.25)',
            }}
          >
            ➤
          </div>
        </div>
    </motion.div>
  );
}

// Schedule card component
function ScheduleCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 mt-2">
      <div className="px-2 py-1.5 border-b border-white/5 bg-white/5 flex justify-between text-[10px]">
        <span className="font-semibold">Schedule</span>
        <span className="opacity-70">WO-48317</span>
      </div>
      <div className="px-2 py-1.5 text-[10px] space-y-0.5">
        <div><b>Tue, 04 Feb</b> · 10:30–11:10</div>
        <div>Priority: <b>P2</b></div>
      </div>
    </div>
  );
}

// Parts card component
function PartsCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 mt-2">
      <div className="px-2 py-1.5 border-b border-white/5 bg-white/5 text-[10px] font-semibold">
        Parts & Tools
      </div>
      <div className="px-2 py-1.5 text-[10px] space-y-0.5">
        <div>• Tilt Sensor v2.1</div>
        <div>• Seal Strip IP65</div>
        <div>• Torx T20, 10mm wrench</div>
      </div>
    </div>
  );
}

// Diagram card component
function DiagramCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20 mt-2">
      <div className="px-2 py-1.5 border-b border-white/5 bg-white/5 text-[10px] font-semibold">
        Replacement Diagram
      </div>
      <div className="p-2">
        <svg viewBox="0 0 200 60" className="w-full h-12 opacity-90">
          <rect x="10" y="10" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(90,162,255,0.5)" strokeWidth="1"/>
          <circle cx="35" cy="30" r="10" fill="rgba(90,162,255,0.6)"/>
          <text x="35" y="55" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.7)">OLD</text>

          <path d="M70 30 L120 30" stroke="rgba(255,255,255,0.3)" strokeWidth="2" markerEnd="url(#arrow)"/>

          <rect x="140" y="10" width="50" height="40" rx="6" fill="rgba(255,255,255,0.05)" stroke="rgba(21,195,122,0.5)" strokeWidth="1"/>
          <circle cx="165" cy="30" r="10" fill="rgba(21,195,122,0.6)"/>
          <text x="165" y="55" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.7)">NEW</text>

          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.3)"/>
            </marker>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// Scenario definition
interface ScenarioStep {
  target: 'martha' | 'frank';
  direction: 'in' | 'out';
  tag: string;
  text: string;
  card?: 'schedule' | 'parts' | 'diagram';
  delay: number;
}

const SCENARIO: ScenarioStep[] = [
  { target: 'martha', direction: 'in', tag: 'iONE', text: 'Hello Frau Martha,<br/>We detected <b>tilt-sensor drift</b>. Scheduling technician visit.', delay: 2500 },
  { target: 'martha', direction: 'out', tag: 'Martha', text: 'Is my presence required?', delay: 2500 },
  { target: 'martha', direction: 'in', tag: 'iONE', text: 'No. The technician can complete the replacement externally.', delay: 3000 },
  { target: 'frank', direction: 'in', tag: 'iONE', text: 'Hi Frank,<br/>New task: <b>replace tilt sensor</b>.<br/>Reason: angle mismatch, bracket micro-shift.', delay: 3500 },
  { target: 'frank', direction: 'in', tag: 'iONE', text: 'Schedule and ticket:', card: 'schedule', delay: 2500 },
  { target: 'frank', direction: 'in', tag: 'iONE', text: 'Parts & tools checklist:', card: 'parts', delay: 2500 },
  { target: 'frank', direction: 'in', tag: 'iONE', text: 'Replacement procedure:', card: 'diagram', delay: 3000 },
  { target: 'frank', direction: 'out', tag: 'Frank', text: '👍 On my way', delay: 2000 },
  { target: 'martha', direction: 'in', tag: 'iONE', text: 'Confirmed: <b>Tue, 04 Feb</b>, 10:30–11:10.<br/>Technician Frank is en route.', delay: 3000 },
];

export default function TechDemo({ onBack, voiceEnabled = false }: { onBack: () => void; voiceEnabled?: boolean }) {
  const [marthaMessages, setMarthaMessages] = useState<Message[]>([]);
  const [frankMessages, setFrankMessages] = useState<Message[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activePhone, setActivePhone] = useState<'martha' | 'frank' | null>(null);
  const [scene, setScene] = useState<'sec0' | 'messaging' | 'mission'>('sec0');
  const messageIdRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play scene voiceover
  useEffect(() => {
    if (!voiceEnabled) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioFiles: Record<string, string> = {
      sec0: '/audio/tech_scene0.mp3',
      messaging: '/audio/tech_scene1.mp3',
      mission: '/audio/tech_scene2.mp3',
    };
    const audio = new Audio(audioFiles[scene]);
    audioRef.current = audio;
    audio.play().catch(e => console.error('Audio play error:', e));

    return () => {
      audio.pause();
    };
  }, [scene, voiceEnabled]);

  useEffect(() => {
    if (!isPlaying || stepIndex >= SCENARIO.length) {
      return;
    }

    const step = SCENARIO[stepIndex];

    // Set active phone before message appears
    setActivePhone(step.target);

    const timer = setTimeout(() => {
      const newMessage: Message = {
        id: messageIdRef.current++,
        direction: step.direction,
        tag: step.tag,
        text: step.text,
        card: step.card === 'schedule' ? <ScheduleCard /> :
              step.card === 'parts' ? <PartsCard /> :
              step.card === 'diagram' ? <DiagramCard /> : undefined,
      };

      if (step.target === 'martha') {
        setMarthaMessages(prev => [...prev, newMessage]);
      } else {
        setFrankMessages(prev => [...prev, newMessage]);
      }

      setStepIndex(prev => prev + 1);
    }, step.delay);

    return () => clearTimeout(timer);
  }, [stepIndex, isPlaying, scene]);

  const handleReplay = () => {
    setMarthaMessages([]);
    setFrankMessages([]);
    setStepIndex(0);
    setActivePhone(null);
    setIsPlaying(true);
  };

  return (
    <div className="fixed inset-0 z-30">
      <AnimatePresence mode="wait">
        {scene === 'sec0' ? (
          <motion.div
            key="sec0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 bg-[#1a1a2e]"
          >
            <iframe
              src="/Sec0.html"
              className="w-full h-full border-0"
              title="AION Fleet Intelligence"
            />
            {/* Navigation */}
            <button
              onClick={onBack}
              className="absolute bottom-20 left-6 z-50 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              ← Back to Topics
            </button>
            <button
              onClick={() => setScene('messaging')}
              className="absolute bottom-20 right-6 z-50 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-white text-sm rounded-full border border-cyan-400/30 transition-colors"
            >
              Predictive Service →
            </button>
          </motion.div>
        ) : scene === 'messaging' ? (
          <motion.div
            key="messaging"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0">
              <Image
                src="/a3.jpg"
                alt="Background"
                fill
                className="object-cover opacity-20"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
            </div>

            {/* Title and Info Overlay */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute top-6 left-6 lg:left-10"
            >
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight"
                style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
              >
                SYMBIOTIC INTELLIGENCE
              </h1>
              <div className="mt-4 p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 max-w-md">
                <h2 className="text-lg sm:text-xl font-semibold text-cyan-400 tracking-wide mb-3">
                  PREDICTIVE SERVICE COORDINATION
                </h2>
                <div className="space-y-2 text-sm sm:text-base text-white/90">
                  <p className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">→</span>
                    <span>iONE detects anomaly → contacts owner → schedules technician</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">→</span>
                    <span>Complete task package: time slot, tools, procedure, route</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">→</span>
                    <span className="font-semibold">Zero dispatcher involvement</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main content */}
            <div className="relative z-10 flex items-center justify-center gap-8 lg:gap-16 px-4">
              {/* Frank Phone (left) */}
              <Phone
                name="Frank"
                sub="Field Technician"
                avatar="F"
                badge="Technician"
                messages={frankMessages}
                side="left"
                isActive={activePhone === 'frank'}
              />

              {/* RoboPitch (center) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="hidden lg:block relative w-[280px] h-[400px]"
              >
                <Image
                  src="/RoboPitch.png"
                  alt="iONE"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl -z-10" />
              </motion.div>

              {/* Martha Phone (right) */}
              <Phone
                name="Frau Martha"
                sub="Station Owner"
                avatar="M"
                badge="Owner"
                messages={marthaMessages}
                side="right"
                isActive={activePhone === 'martha'}
              />
            </div>

            {/* Navigation */}
            <button
              onClick={() => setScene('sec0')}
              className="absolute bottom-20 left-6 z-50 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              ← Fleet Intelligence
            </button>
            <button
              onClick={() => setScene('mission')}
              className="absolute bottom-20 right-6 z-50 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-white text-sm rounded-full border border-cyan-400/30 transition-colors"
            >
              Mission Control →
            </button>

            {/* Progress indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
              {SCENARIO.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < stepIndex ? 'bg-cyan-400' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <MissionControl />
            {/* Navigation */}
            <button
              onClick={() => setScene('messaging')}
              className="absolute bottom-20 left-6 z-50 px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
            >
              ← Predictive Service
            </button>
            <button
              onClick={onBack}
              className="absolute bottom-20 right-6 z-50 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-white text-sm rounded-full border border-cyan-400/30 transition-colors"
            >
              Back to Topics →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
