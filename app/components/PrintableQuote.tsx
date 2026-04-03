'use client';
import React from 'react';

interface QuoteData {
  location: {
    address: string;
    lat: number;
    lon: number;
    elevation: number;
    zone: string;
  };
  consumption: { daily: number; yearly: number };
  solarData: {
    yearlyPerStation: number;
    dailyAverage: number;
    database: string;
  };
  windAnalysis?: {
    avgWind: number;
    hasGoodWind: boolean;
  };
  insights?: {
    coordinatesDMS: { lat: string; lon: string };
    climate: string;
    solarResource: string;
    irradiance: string;
    seasonalRatio: string;
    worstMonthCoverage: number;
    autonomyMonths: number;
    co2SavingsKg: number;
    equivalentTrees: number;
    energySavingsEur: number;
    paybackYears: string;
  };
  analysis: {
    worstMonth: { monthName: string; dailyProduction: number; coverage: number };
    bestMonth: { monthName: string; dailyProduction: number };
    deficitMonths: number;
    yearlyBalance: number;
  };
  solution: {
    stations: number;
    stationModel: string;
    windTurbine: boolean;
    windReason?: string;
    battery: { capacity: number; modules: number; technology: string };
    warnings: string[];
  };
  pricing: {
    bomCostUsd: number;
    bomCostEur: number;
    retailEstimateEur: { low: number; high: number };
    bom: Array<{ item: string; qty: number; unitPrice: number; total: number }>;
  };
}

interface PrintableQuoteProps {
  data: QuoteData;
  quoteNumber?: string;
}

export default function PrintableQuote({ data, quoteNumber }: PrintableQuoteProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const qn = quoteNumber || `Q-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="print-quote bg-white text-black p-4 max-w-3xl mx-auto font-sans text-[13px]">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-black pb-2 mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight">iONE</span>
          <span className="text-[10px] text-zinc-500">Autonomous Energy</span>
        </div>
        <div className="flex items-baseline gap-3 text-right">
          <span className="text-lg font-bold">QUOTE</span>
          <span className="text-[10px] text-zinc-500">#{qn} · {today}</span>
        </div>
      </div>

      {/* Two columns: Location+Solution | Resource+Impact */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* Left column */}
        <div className="space-y-2">
          {/* Location */}
          <div>
            <div className="text-[9px] font-bold text-zinc-400 uppercase">Location</div>
            <div className="font-medium text-sm truncate">{data.location.address}</div>
            <div className="text-[11px] text-zinc-500">
              {data.location.lat.toFixed(4)}°N, {data.location.lon.toFixed(4)}°E · {data.location.elevation}m
              <span className="ml-2 px-1.5 py-0.5 bg-zinc-200 rounded text-[9px] font-semibold uppercase">
                {data.location.zone}
              </span>
            </div>
          </div>

          {/* Solution */}
          <div className="border border-black rounded p-2">
            <div className="text-[9px] font-bold text-zinc-400 uppercase">Configuration</div>
            <div className="text-lg font-bold">
              {data.solution.stations}× {data.solution.stationModel}
              {data.solution.windTurbine && ' + Wind'}
            </div>
            <div className="text-[11px] text-zinc-600">
              {data.solution.battery.modules}× {data.solution.battery.technology} = {data.solution.battery.capacity.toFixed(1)} kWh
            </div>
          </div>

          {/* Warnings */}
          {data.solution.warnings && data.solution.warnings.length > 0 && (
            <div className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
              {data.solution.warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {/* Resource Analysis */}
          <div className="bg-zinc-100 rounded p-2">
            <div className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Resource</div>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div>
                <div className="font-bold">{data.consumption.daily}</div>
                <div className="text-[9px] text-zinc-500">kWh/day</div>
              </div>
              <div>
                <div className="font-bold">{data.solarData.dailyAverage.toFixed(1)}</div>
                <div className="text-[9px] text-zinc-500">☀️ gen</div>
              </div>
              <div>
                <div className="font-bold text-red-600">{data.analysis.worstMonth.monthName}</div>
                <div className="text-[9px] text-zinc-500">{data.analysis.worstMonth.dailyProduction.toFixed(1)}</div>
              </div>
              <div>
                <div className="font-bold text-cyan-600">{data.windAnalysis?.avgWind?.toFixed(1) || '—'}</div>
                <div className="text-[9px] text-zinc-500">💨 m/s</div>
              </div>
            </div>
          </div>

          {/* Impact */}
          {data.insights && (
            <div className="bg-emerald-50 rounded p-2">
              <div className="text-[9px] font-bold text-emerald-700 uppercase mb-1">Impact</div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div>
                  <div className="font-bold text-emerald-700">{data.insights.co2SavingsKg.toLocaleString()}</div>
                  <div className="text-[9px] text-emerald-600">kg CO₂/yr</div>
                </div>
                <div>
                  <div className="font-bold text-emerald-700">€{data.insights.energySavingsEur.toLocaleString()}</div>
                  <div className="text-[9px] text-emerald-600">saved/yr</div>
                </div>
                <div>
                  <div className="font-bold text-emerald-700">{data.insights.autonomyMonths}/12</div>
                  <div className="text-[9px] text-emerald-600">autonomy</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOM Table - compact */}
      <div className="mb-3">
        <div className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Bill of Materials</div>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1 w-10">Qty</th>
              <th className="text-right py-1 w-16">Unit</th>
              <th className="text-right py-1 w-16">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.pricing.bom.map((item, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="py-0.5 truncate max-w-[200px]">{item.item}</td>
                <td className="text-center py-0.5">{item.qty}</td>
                <td className="text-right py-0.5">${item.unitPrice.toLocaleString()}</td>
                <td className="text-right py-0.5 font-mono">${item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pricing - compact */}
      <div className="bg-black text-white rounded p-3 mb-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[9px] text-zinc-400 uppercase">Retail Price</div>
            <div className="text-xl font-bold">
              €{data.pricing.retailEstimateEur.low.toLocaleString()} – €{data.pricing.retailEstimateEur.high.toLocaleString()}
            </div>
          </div>
          <div className="text-right text-[10px]">
            <div className="text-zinc-400">BOM: ${data.pricing.bomCostUsd.toLocaleString()}</div>
            <div className="text-zinc-500">incl. installation</div>
          </div>
        </div>
      </div>

      {/* Footer - single line */}
      <div className="flex justify-between text-[9px] text-zinc-400 border-t border-zinc-200 pt-2">
        <span>Valid 30 days · 50% advance</span>
        <span>iONE · gtlab.org</span>
        <span>Delivery: 8-12 weeks</span>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-quote, .print-quote * { visibility: visible; }
          .print-quote {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 15mm;
            font-size: 10pt;
          }
        }
      `}</style>
    </div>
  );
}
