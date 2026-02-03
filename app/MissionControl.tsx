'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Station {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'ok' | 'degraded' | 'fault' | 'scheduled' | 'offline';
  env: { temp: number; wind: number; gust: number; icingRisk: string };
  power: { soc: number };
  comms: { link: string; lastMin: number };
  ops: { stormMode: string; heater: string };
}

const COLORS = {
  ok: '#2bff88',
  degraded: '#ffd84a',
  fault: '#ff3b3b',
  scheduled: '#5aa2ff',
  offline: '#6a748a',
};

function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function rnd(min: number, max: number) { return min + Math.random() * (max - min); }
function irnd(min: number, max: number) { return Math.floor(rnd(min, max + 1)); }

function pickStatus(): Station['status'] {
  const r = Math.random();
  if (r < 0.72) return 'ok';
  if (r < 0.86) return 'degraded';
  if (r < 0.92) return 'scheduled';
  if (r < 0.97) return 'offline';
  return 'fault';
}

function generateStations(count: number): Station[] {
  const stations: Station[] = [];
  for (let i = 0; i < count; i++) {
    const coastal = Math.random() < 0.78;
    let x: number, y: number;

    if (coastal) {
      const t = Math.random();
      y = 70 + t * 520 + rnd(-12, 12);
      const coastX =
        y < 140 ? 620 + (y - 70) * 0.25 :
        y < 250 ? 630 + (y - 140) * 0.10 :
        y < 360 ? 620 + (y - 250) * 0.12 :
        y < 470 ? 625 + (y - 360) * 0.05 :
        650 + (y - 470) * 0.15;
      x = coastX + rnd(-40, 25);
    } else {
      x = rnd(360, 590);
      y = rnd(110, 560);
    }

    const temp = clamp(Math.round(rnd(-32, 6)), -35, 10);
    const wind = clamp(Math.round(rnd(2, 24)), 0, 30);
    const gust = clamp(wind + irnd(2, 10), 0, 35);
    const status = pickStatus();
    const soc = clamp(Math.round(rnd(18, 96)), 0, 100);

    stations.push({
      id: `ST-${String(i + 1).padStart(3, '0')}`,
      name: `Barents Node ${i + 1}`,
      x, y, status,
      env: { temp, wind, gust, icingRisk: temp < -12 ? 'HIGH' : wind > 15 ? 'MED' : 'LOW' },
      power: { soc },
      comms: { link: status === 'offline' ? '—' : (Math.random() < 0.55 ? 'SAT' : 'LTE'), lastMin: irnd(1, 30) },
      ops: { stormMode: gust >= 18 ? 'ACTIVE' : 'OFF', heater: temp <= -12 ? 'ON' : 'OFF' },
    });
  }
  return stations;
}

export default function MissionControl() {
  const [stations] = useState(() => generateStations(45));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedLines, setFeedLines] = useState<string[]>([
    '[--:--:--] INFO  Mission Control initialized — Barents Coast monitoring active',
    '[--:--:--] OK    All systems nominal',
  ]);
  const feedRef = useRef<HTMLDivElement>(null);

  const selected = stations.find(s => s.id === selectedId);

  // Update clock and simulate feed
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const s = stations[irnd(0, stations.length - 1)];
        const time = new Date().toLocaleTimeString('en-GB');
        const msgs = [
          `${s.id} telemetry received — ${s.env.temp}°C, ${s.env.wind} m/s`,
          `${s.id} SOC ${s.power.soc}% — autonomy nominal`,
          `${s.id} link quality stable (${s.comms.link})`,
        ];
        setFeedLines(prev => [`[${time}] INFO  ${msgs[irnd(0, msgs.length - 1)]}`, ...prev.slice(0, 50)]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [stations]);

  const stats = {
    total: stations.length,
    ok: stations.filter(s => s.status === 'ok').length,
    degraded: stations.filter(s => s.status === 'degraded').length,
    fault: stations.filter(s => s.status === 'fault').length,
    offline: stations.filter(s => s.status === 'offline').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 bg-black text-white overflow-hidden"
      style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {/* Info Overlay */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute top-20 left-4 z-20 p-4 rounded-xl bg-black/70 backdrop-blur-sm border border-cyan-400/30 max-w-sm"
      >
        <h2 className="text-lg sm:text-xl font-bold text-cyan-400 tracking-wide mb-3">
          MISSION CONTROL — ARCTIC OPERATIONS
        </h2>
        <div className="space-y-2 text-sm text-white/90">
          <p className="flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>45 stations · Real-time fleet status</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>Temperature · Wind · Icing risk · Connectivity</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-cyan-400">●</span>
            <span>Automatic storm protection · Service task generation</span>
          </p>
        </div>
      </motion.div>

      {/* Top Bar */}
      <div className="h-14 border-b border-white/10 bg-black flex items-center px-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          <div>
            <div className="font-bold text-sm tracking-wide">MISSION CONTROL</div>
            <div className="text-xs text-white/60">Barents Coast · Remote Monitoring</div>
          </div>
        </div>

        <div className="flex-1 flex gap-2 overflow-x-auto px-4">
          {[
            ['Stations', stats.total],
            ['OK', stats.ok],
            ['Degraded', stats.degraded],
            ['Fault', stats.fault],
            ['Offline', stats.offline],
          ].map(([label, value]) => (
            <div key={String(label)} className="px-3 py-1.5 rounded-lg border border-white/10 bg-black text-xs whitespace-nowrap">
              <span className="text-white/60">{label}:</span>{' '}
              <span className="font-mono">{value}</span>
            </div>
          ))}
        </div>

        <div className="px-3 py-1.5 rounded-full border border-white/10 bg-black font-mono text-xs text-white/60">
          {new Date().toLocaleTimeString('en-GB')}Z
        </div>
      </div>

      {/* Main Grid */}
      <div className="h-[calc(100%-3.5rem)] grid grid-cols-[1fr_380px]">
        {/* Map Area */}
        <div className="relative border-r border-white/10">
          <svg viewBox="0 0 1000 640" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            {/* Grid lines */}
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 100} y1={0} x2={i * 100} y2={640} stroke="rgba(255,255,255,0.06)" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={i * 80} x2={1000} y2={i * 80} stroke="rgba(255,255,255,0.06)" />
            ))}

            {/* Coastline */}
            <path
              d="M 610 20 L 1000 20 L 1000 620 L 680 620 C 650 600, 650 570, 670 545 C 690 520, 650 490, 625 470 C 600 450, 610 420, 640 398 C 670 375, 660 345, 625 320 C 590 295, 605 270, 640 250 C 675 228, 660 200, 620 180 C 580 160, 585 130, 625 115 C 665 100, 660 72, 620 55 C 595 43, 595 32, 610 20 Z"
              fill="rgba(255,255,255,0.03)"
              stroke="rgba(255,255,255,0.15)"
            />

            {/* Zones */}
            <rect x={560} y={180} width={310} height={200} rx={14} fill="rgba(90,162,255,0.06)" stroke="rgba(90,162,255,0.2)" strokeDasharray="5 6" />
            <text x={574} y={200} fill="rgba(255,255,255,0.5)" fontSize={11} fontFamily="monospace">FIELD BLOCK A</text>

            <rect x={640} y={400} width={260} height={160} rx={14} fill="rgba(90,162,255,0.06)" stroke="rgba(90,162,255,0.2)" strokeDasharray="5 6" />
            <text x={654} y={420} fill="rgba(255,255,255,0.5)" fontSize={11} fontFamily="monospace">FIELD BLOCK B</text>

            {/* Stations */}
            {stations.map(s => (
              <g
                key={s.id}
                transform={`translate(${s.x},${s.y})`}
                onClick={() => setSelectedId(s.id)}
                className="cursor-pointer"
              >
                {(s.status === 'fault' || s.ops.stormMode === 'ACTIVE') && (
                  <circle r={12} fill="none" stroke={COLORS[s.status]} strokeWidth={2} opacity={0.4}>
                    <animate attributeName="r" values="8;14;8" dur="1.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={5} fill={COLORS[s.status]} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                <text x={9} y={-2} fill="rgba(255,255,255,0.9)" fontSize={10} fontFamily="monospace">{s.env.temp}°C</text>
                <text x={9} y={10} fill="rgba(255,255,255,0.6)" fontSize={9} fontFamily="monospace">{s.env.wind} m/s</text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div className="absolute top-4 right-4 p-3 rounded-xl border border-white/10 bg-black/90 text-xs">
            <div className="font-bold mb-2">Legend</div>
            {Object.entries(COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2 my-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <span className="text-white/70 capitalize">{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col bg-[#05070a]">
          {/* Selected station header */}
          <div className="p-3 border-b border-white/10 bg-black">
            <div className="font-bold text-sm">{selected ? `${selected.id} · ${selected.name}` : 'Select a station'}</div>
            <div className="text-xs text-white/50 font-mono mt-1">{selected ? `Zone: ${selected.x > 640 ? 'Block A/B' : 'Coast/Sea'}` : '—'}</div>
          </div>

          {/* Detail */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {selected ? (
              <>
                {/* Status tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded-full border border-white/10 text-[10px] font-mono flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: COLORS[selected.status] }} />
                    {selected.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-white/10 text-[10px] font-mono">
                    STORM {selected.ops.stormMode}
                  </span>
                  <span className="px-2 py-1 rounded-full border border-white/10 text-[10px] font-mono">
                    HEATER {selected.ops.heater}
                  </span>
                </div>

                {/* Big metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ['SOC', `${selected.power.soc}%`],
                    ['Wind', `${selected.env.wind} m/s`],
                    ['Temp', `${selected.env.temp}°C`],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="p-2 rounded-xl border border-white/10 bg-black">
                      <div className="text-[10px] text-white/50">{label}</div>
                      <div className="font-mono text-lg mt-1">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Environment */}
                <div className="p-3 rounded-xl border border-white/10 bg-black/50">
                  <div className="font-semibold text-xs mb-2">Environment</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-white/50">Ambient</span><span className="font-mono">{selected.env.temp}°C</span>
                    <span className="text-white/50">Wind</span><span className="font-mono">{selected.env.wind} m/s (G {selected.env.gust})</span>
                    <span className="text-white/50">Icing risk</span><span className="font-mono">{selected.env.icingRisk}</span>
                  </div>
                </div>

                {/* Connectivity */}
                <div className="p-3 rounded-xl border border-white/10 bg-black/50">
                  <div className="font-semibold text-xs mb-2">Connectivity</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-white/50">Link</span><span className="font-mono">{selected.comms.link}</span>
                    <span className="text-white/50">Last sample</span><span className="font-mono">{selected.comms.lastMin}m ago</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-3 rounded-xl border border-white/10 bg-black/50 text-xs text-white/50">
                Click a station on the map to view details.
              </div>
            )}
          </div>

          {/* Feed */}
          <div className="h-40 border-t border-white/10">
            <div className="px-3 py-2 border-b border-white/10 bg-black flex justify-between">
              <span className="font-bold text-xs">OPERATIONS FEED</span>
              <span className="text-xs text-white/50 font-mono">{stations.length} stations</span>
            </div>
            <div ref={feedRef} className="h-[calc(100%-36px)] overflow-y-auto p-2 font-mono text-[10px] text-white/60 whitespace-pre-wrap">
              {feedLines.join('\n')}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
