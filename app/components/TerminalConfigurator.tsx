'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLine {
  type: 'command' | 'response' | 'success' | 'warning' | 'error' | 'separator' | 'result';
  text: string;
  delay?: number;
}

// API v2.0 response format
interface ConfigResult {
  status: string;
  version: string;
  location: {
    address: string;
    lat: number;
    lon: number;
    elevation: number;
    country: string;
  };
  zone: string;
  climate: {
    avg_wind_ms: number;
    max_gust_5yr_kmh: number;
    gust_source: string;
    worst_month: string;
    best_month: string;
    pvgis_source: string;
    min_temp_c: number;
    max_temp_c: number;
  };
  consumption: {
    input_watts: number;
    daily_kWh: number;
    yearly_kWh: number;
  };
  energy: {
    monthly: Array<{
      month: number;
      monthName: string;
      solar_kWh: number;
      wind_kWh: number;
      total_kWh: number;
      consumption_kWh: number;
      balance_kWh: number;
      avgWind: number;
    }>;
    summer_surplus_kWh: number;
    winter_deficit_kWh: number;
    yearly_balance_kWh: number;
  };
  solution: {
    stations: number;
    station_roles: string[];
    model: string;
    panels_per_station: number;
    kwp_per_station: number;
    total_kwp: number;
    frame_type: string;
    frame_reason: string;
    fold_level: string;
    ald_coating: boolean;
    ald_reason: string;
    wind_turbine: boolean;
    wind_count: number;
    wind_reason: string;
    battery: {
      type: string;
      cell: string;
      modules: number;
      capacity_kWh: number;
      autonomy_days: number;
      note: string;
    };
    h2_hub: {
      enabled: boolean;
      h2_needed_kg: number;
      tanks: number;
      electrolysis_kWh: number;
      summer_surplus_available_kWh: number;
      utilization_pct: number;
      base_cost_eur: number;
    } | null;
    thermal: string[];
    connectivity: string[];
    inverter: string | null;
    dc_converter: string | null;
    warnings: string[];
  };
  pricing: {
    bom_cost_eur: number;
    bom_cost_usd: number;
    h2_cost_eur: number;
    non_h2_cost_eur: number;
    retail_eur: number;
    markup_explanation: string;
    quantity: number;
    discount_applied: number;
    bom: Array<{ item: string; qty: number; unitPrice: number; total: number; currency: string }>;
  };
}

interface TerminalConfiguratorProps {
  address: string;
  consumption: number;  // in Watts now
  dailyConsumption?: number;  // kWh/day (pre-calculated with hours/day)
  hoursPerDay?: number;
  zone: string;
  components?: 'EU' | 'World';
  peakPower?: number;
  acPhase?: '1' | '3';
  acVoltage?: string[];
  mode?: 'industrial' | 'civil';
  grid?: boolean;
  heatPump?: boolean;
  hide?: 'none' | '90' | '180';
  onComplete: (result: ConfigResult) => void;
  onClose: () => void;
}

export default function TerminalConfigurator({
  address,
  consumption,
  dailyConsumption,
  hoursPerDay = 24,
  zone,
  components = 'EU',
  peakPower = 0,
  acPhase,
  acVoltage,
  mode = 'industrial',
  grid = false,
  heatPump = false,
  hide = 'none',
  onComplete,
  onClose
}: TerminalConfiguratorProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<ConfigResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Generate terminal lines from API v2.0 response
  const generateLines = (data: ConfigResult): TerminalLine[] => {
    const lines: TerminalLine[] = [
      { type: 'command', text: `$ ione-config --address "${address}"` },
      { type: 'command', text: `$ ione-config --consumption ${consumption}W --hours ${hoursPerDay}h/day` },
      ...(acPhase ? [{ type: 'command' as const, text: `$ ione-config --output AC ${acPhase}P ${(acVoltage || []).join(' ')}` }] : []),
      { type: 'command', text: `$ ione-config --zone ${data.zone}` },
      { type: 'separator', text: '' },

      { type: 'command', text: '> Geocoding address...' },
      { type: 'response', text: `  Location: ${data.location.address}` },
      { type: 'response', text: `  Coordinates: ${data.location.lat.toFixed(4)}°N, ${data.location.lon.toFixed(4)}°E` },
      { type: 'response', text: `  Elevation: ${data.location.elevation}m` },
      { type: 'response', text: `  Country: ${data.location.country}` },
      { type: 'success', text: '  ✓ Geocoding complete' },
      { type: 'separator', text: '' },

      { type: 'command', text: '> Connecting to PVGIS API (European Commission JRC)...' },
      { type: 'response', text: `  Database: ${data.climate.pvgis_source}` },
      { type: 'response', text: '  Tracking: 2-axis dual-axis tracker' },
      { type: 'success', text: '  ✓ Connected' },
      { type: 'separator', text: '' },

      { type: 'command', text: '> Fetching solar irradiance data...' },
      { type: 'response', text: '  Requesting DRcalc 2-axis tracking...' },
      { type: 'response', text: '  12 months × 24 hours = 288 datapoints...' },
      { type: 'success', text: '  ✓ Data received' },
      { type: 'separator', text: '' },

      { type: 'command', text: `> Analyzing climate zone...` },
      { type: 'response', text: `  Zone: ${data.zone.toUpperCase()}` },
      { type: 'response', text: `  Avg wind: ${data.climate.avg_wind_ms.toFixed(1)} m/s` },
      { type: 'response', text: `  Min temp: ${data.climate.min_temp_c}°C` },
      { type: 'response', text: `  Max temp: ${data.climate.max_temp_c}°C` },
      { type: 'separator', text: '' },

      { type: 'command', text: `> Calculating solar production (${data.solution.total_kwp} kWp array)...` },
      { type: 'response', text: `  Panels: ${data.solution.panels_per_station}× per station` },
      { type: 'response', text: `  Max sustained wind (5yr): ${data.climate.max_gust_5yr_kmh ? (data.climate.max_gust_5yr_kmh / 3.6).toFixed(0) : 'N/A'} m/s (${data.climate.max_gust_5yr_kmh?.toFixed(0) || 'N/A'} km/h)` },
      { type: 'response', text: `  Frame: ${data.solution.frame_type}` },
      { type: 'response', text: `  ${data.solution.frame_reason || data.solution.fold_level}` },
      { type: 'separator', text: '' },

      { type: 'command', text: '> Analyzing energy balance...' },
      { type: 'response', text: `  Consumption: ${data.consumption.daily_kWh.toFixed(1)} kWh/day (${Math.round(data.consumption.yearly_kWh)} kWh/year)` },
      { type: 'response', text: `  Worst month: ${data.climate.worst_month}` },
      { type: 'response', text: `  Best month: ${data.climate.best_month}` },
    ];

    // Summer surplus / winter deficit
    if (data.energy.winter_deficit_kWh > 0) {
      lines.push({
        type: 'warning',
        text: `  ⚠ Winter deficit: ${data.energy.winter_deficit_kWh} kWh`
      });
    }
    if (data.energy.summer_surplus_kWh > 0) {
      lines.push({
        type: 'response',
        text: `  Summer surplus: ${data.energy.summer_surplus_kWh} kWh`
      });
    }

    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'command', text: '> Calculating optimal configuration...' });
    lines.push({ type: 'response', text: `  Stations: ${data.solution.stations} (${data.solution.station_roles.join(' + ')})` });
    lines.push({ type: 'response', text: `  Model: ${data.solution.model}` });

    // ALD coating
    if (data.solution.ald_coating) {
      lines.push({ type: 'response', text: `  ALD Al₂O₃ Coating: YES` });
      lines.push({ type: 'response', text: `    ${data.solution.ald_reason}` });
    }

    // Wind turbine
    if (data.solution.wind_turbine) {
      lines.push({ type: 'response', text: `  Wind turbine: ${data.solution.wind_count}× VAWT 500W` });
      lines.push({ type: 'response', text: `    ${data.solution.wind_reason}` });
    } else {
      lines.push({ type: 'response', text: `  Wind turbine: NO` });
      lines.push({ type: 'response', text: `    ${data.solution.wind_reason}` });
    }

    // H2-Hub
    if (data.solution.h2_hub) {
      lines.push({ type: 'separator', text: '' });
      lines.push({ type: 'command', text: '> Evaluating H2-Hub seasonal storage...' });
      lines.push({ type: 'response', text: `  H2 needed: ${data.solution.h2_hub.h2_needed_kg} kg` });
      lines.push({ type: 'response', text: `  Tanks: ${data.solution.h2_hub.tanks}× Hexagon Purus D200` });
      lines.push({ type: 'response', text: `  Electrolysis: ${data.solution.h2_hub.electrolysis_kWh} kWh (${data.solution.h2_hub.utilization_pct}% of surplus)` });
      lines.push({ type: 'success', text: '  ✓ H2-Hub selected' });
    }

    // Battery
    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'command', text: '> Selecting battery...' });
    lines.push({ type: 'response', text: `  Type: ${data.solution.battery.type}` });
    lines.push({ type: 'response', text: `  Modules: ${data.solution.battery.modules}× ${data.solution.battery.cell}` });
    lines.push({ type: 'response', text: `  Capacity: ${data.solution.battery.capacity_kWh.toFixed(1)} kWh` });
    lines.push({ type: 'response', text: `  Autonomy: ${data.solution.battery.autonomy_days} days` });
    lines.push({ type: 'response', text: `  ${data.solution.battery.note}` });

    // Thermal
    if (data.solution.thermal.length > 0) {
      lines.push({ type: 'separator', text: '' });
      lines.push({ type: 'command', text: '> Thermal management...' });
      for (const item of data.solution.thermal) {
        lines.push({ type: 'response', text: `  + ${item}` });
      }
    }

    // Warnings
    if (data.solution.warnings && data.solution.warnings.length > 0) {
      lines.push({ type: 'separator', text: '' });
      for (const warning of data.solution.warnings) {
        lines.push({ type: 'warning', text: `  ⚠ ${warning}` });
      }
    }

    // BOM
    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'command', text: '> Selecting components from catalog...' });
    lines.push({ type: 'response', text: '' });

    for (const item of data.pricing.bom) {
      if (item.total < 0) continue; // Skip discount line
      const priceStr = `${item.currency === 'EUR' ? '€' : '$'}${item.total.toLocaleString()}`.padStart(10);
      lines.push({
        type: 'response',
        text: `  ${item.qty.toString().padStart(2)}× ${item.item.substring(0, 40).padEnd(40)} ${priceStr}`
      });
    }

    // Discount if applied
    if (data.pricing.discount_applied > 0) {
      lines.push({ type: 'success', text: `  Quantity discount: -${(data.pricing.discount_applied * 100).toFixed(0)}%` });
    }

    // Final summary
    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'separator', text: '═'.repeat(60) });
    lines.push({ type: 'result', text: 'CONFIGURATION COMPLETE' });
    lines.push({ type: 'separator', text: '═'.repeat(60) });
    lines.push({ type: 'separator', text: '' });

    const modelDesc = data.solution.h2_hub
      ? `${data.solution.stations}× ${data.solution.model} + H2-Hub`
      : data.solution.wind_turbine
        ? `${data.solution.stations}× ${data.solution.model} + VAWT`
        : `${data.solution.stations}× ${data.solution.model}`;

    lines.push({ type: 'result', text: `Solution: ${modelDesc}` });
    lines.push({ type: 'result', text: `Panels: ${data.solution.panels_per_station}×${data.solution.stations} = ${data.solution.total_kwp} kWp` });
    lines.push({ type: 'result', text: `Battery: ${data.solution.battery.modules}× ${data.solution.battery.cell}` });
    lines.push({ type: 'result', text: `         = ${data.solution.battery.capacity_kWh.toFixed(1)} kWh total` });
    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'result', text: `BOM Cost:  €${data.pricing.bom_cost_eur.toLocaleString()} EUR` });
    lines.push({ type: 'result', text: `           $${data.pricing.bom_cost_usd.toLocaleString()} USD` });
    lines.push({ type: 'separator', text: '' });
    lines.push({ type: 'success', text: `RETAIL:    €${data.pricing.retail_eur.toLocaleString()}` });
    lines.push({ type: 'response', text: `           ${data.pricing.markup_explanation}` });
    lines.push({ type: 'response', text: `           €${Math.round(data.pricing.retail_eur / data.solution.battery.capacity_kWh).toLocaleString()}/kWh` });
    lines.push({ type: 'separator', text: '═'.repeat(60) });

    return lines;
  };

  // Fetch data and start animation
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLines([
          { type: 'command', text: '$ ione-config --init' },
          { type: 'response', text: '  iONE Configurator v2.0' },
          { type: 'response', text: '  Powered by PVGIS (European Commission JRC)' },
          { type: 'separator', text: '' },
        ]);
        setCurrentLineIndex(4);

        const response = await fetch('/api/pvgis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            consumption,  // Watts (power rating)
            dailyConsumption: dailyConsumption || (consumption * hoursPerDay / 1000),  // kWh/day
            zone,
            components,
            peakPower,
            acPhase: acPhase || null,
            acVoltage: acVoltage || null,
            outputType: 'DC',
            mode: mode,
            grid: grid,
            heatPump: heatPump,
            hide: hide !== 'none' ? hide : false,
            quantity: 1
          })
        });

        const data = await response.json();

        if (data.status !== 'ok') {
          throw new Error(data.message || 'API error');
        }

        setResult(data);
        onComplete(data);
        const allLines = generateLines(data);
        setLines(allLines);
        setCurrentLineIndex(0);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLines(prev => [
          ...prev,
          { type: 'error', text: `ERROR: ${err instanceof Error ? err.message : 'Unknown error'}` }
        ]);
      }
    };

    fetchData();
  }, [address, consumption, dailyConsumption, hoursPerDay, zone, components, peakPower, acPhase, acVoltage]);

  // Animate lines appearing
  useEffect(() => {
    if (lines.length === 0 || error) return;

    if (currentLineIndex < lines.length) {
      const line = lines[currentLineIndex];
      const delay = line.type === 'separator' ? 50 :
                    line.type === 'command' ? 150 :
                    line.type === 'result' ? 100 : 80;

      const timer = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timer);
    } else if (currentLineIndex >= lines.length && result) {
      setIsComplete(true);
    }
  }, [currentLineIndex, lines, result, error]);

  // Auto-close after configuration complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onClose]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [currentLineIndex]);

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command': return 'text-cyan-400';
      case 'response': return 'text-zinc-300';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-amber-400';
      case 'error': return 'text-red-400';
      case 'result': return 'text-white font-bold';
      case 'separator': return 'text-zinc-600';
      default: return 'text-zinc-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-zinc-700"
      >
        {/* Terminal Header */}
        <div className="bg-zinc-800 px-4 py-2 flex items-center justify-between border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400" onClick={onClose} />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="text-zinc-400 text-sm font-mono">iONE Configurator v2.0</div>
          <div className="w-16" />
        </div>

        {/* Terminal Body */}
        <div
          ref={terminalRef}
          className="h-[500px] overflow-y-auto p-4 font-mono text-sm leading-relaxed scrollbar-hide"
          style={{ backgroundColor: '#0d0d0d', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {lines.slice(0, currentLineIndex).map((line, i) => (
            <div key={i} className={`${getLineColor(line.type)} ${line.type === 'separator' ? 'h-2' : ''}`}>
              {line.text}
            </div>
          ))}

          {/* Cursor */}
          {!isComplete && !error && (
            <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Footer - auto close */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-800 px-4 py-3 flex items-center justify-center border-t border-zinc-700"
            >
              <div className="text-emerald-400 text-sm font-semibold">
                Configuration ready
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="bg-red-900/50 px-4 py-3 flex items-center justify-between border-t border-red-700">
            <div className="text-red-300 text-sm">{error}</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
