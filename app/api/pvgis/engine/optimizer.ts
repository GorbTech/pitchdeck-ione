// =============================================================================
// iONE Sizing Engine — Optimizer
// =============================================================================
// Enumerates candidate configurations, simulates each, and selects the
// cheapest feasible solution. Replaces the old heuristic sizing logic
// (calculateSystemRequirements) with simulation-backed selection.
//
// Strategy:
// 1. Generate all valid configurations within hardware constraints
// 2. Pre-filter: skip obviously undersized candidates (quick energy check)
// 3. Simulate remaining candidates (hourly 8760h)
// 4. Select cheapest feasible candidate that meets reliability policy
// 5. Fallback to legacy heuristic if no climate data available

import {
  SiteInput,
  SimulationConfig,
  SimulationResult,
  CandidateResult,
  SizingEngineOutput,
  HourlyClimateYear,
  ClimateZone,
  ZoneDetectionResult,
  ReliabilityPolicy,
  ENGINE_CONSTANTS,
} from './types';
import { simulateYear, adjustWindForHeight, calculateWindPowerW } from './simulation';

const EC = ENGINE_CONSTANTS;

// ─── Candidate Generation ────────────────────────────────────────────────────

/**
 * Generate all valid hardware configurations for a given mode/zone.
 */
function generateCandidates(
  mode: 'industrial' | 'civil',
  grid: boolean,
  zone: ClimateZone,
  avgWindMs: number,
  lat: number,
  maxGustKmh: number,
  hideMode: boolean = false,
  hide90: boolean = false
): SimulationConfig[] {
  const candidates: SimulationConfig[] = [];

  // Determine constraints
  const maxStations = mode === 'civil'
    ? (grid ? EC.MAX_STATIONS_CIVIL_GRID : EC.MAX_STATIONS_CIVIL_OFFGRID)
    : EC.MAX_STATIONS_INDUSTRIAL;

  const maxBatPerStation = mode === 'civil'
    ? EC.MAX_BATTERY_CIVIL
    : EC.MAX_BATTERY_PER_STATION;

  const maxH2 = mode === 'civil' ? 0 : EC.MAX_H2_HUBS;

  // Wind decision: try with/without wind if avg ≥ 4.0 m/s
  const windOptions = avgWindMs >= 4.0 ? [0, 1] : [0];

  // Panel options based on zone/latitude
  const isPolar = Math.abs(lat) >= 63;
  const usesPVF180 = maxGustKmh > 120;
  let panelOptions: number[];

  if (mode === 'civil') {
    panelOptions = [6];  // civil always 6 panels
  } else if (hideMode) {
    panelOptions = [4];  // PVF180 forced for camouflage
  } else if (hide90) {
    panelOptions = [6];  // PVF90 forced for 90° camouflage
  } else if (isPolar) {
    panelOptions = [6, 8];  // polar can use 8 panels
  } else if (usesPVF180) {
    panelOptions = [4];  // PVF180 = 4 panels
  } else {
    panelOptions = [6];
  }

  for (let stations = 1; stations <= maxStations; stations++) {
    // Onboard: MAX_BATTERY_PER_STATION (3 × 16 kWh = 48 kWh per station)
    // External: MAX_EXTERNAL_BATTERY_PACKS × 3 modules each (2 × 48 kWh = 96 kWh)
    const maxExternalModules = (EC.MAX_EXTERNAL_BATTERY_PACKS || 0) * 3;
    const maxBat = mode === 'civil' ? EC.MAX_BATTERY_CIVIL : (maxBatPerStation * stations) + maxExternalModules;

    for (let batteryModules = 1; batteryModules <= maxBat; batteryModules++) {
      for (const windFlag of windOptions) {
        const windTurbines = windFlag ? stations : 0;

        for (const panels of panelOptions) {
          // H2 options: only for industrial, and only when it might help
          const h2Options = maxH2 > 0 ? [0, 1, 2] : [0];
          for (const h2Hubs of h2Options) {
            candidates.push({
              stations,
              batteryModules,
              windTurbines,
              h2Hubs,
              panelsPerStation: panels,
            });
          }
        }
      }
    }
  }

  return candidates;
}

// ─── Pre-filter ──────────────────────────────────────────────────────────────

/**
 * Quick energy balance check — skip candidates that are obviously undersized.
 * Uses simple annual averages (not simulation), so it's fast but conservative.
 */
function preFilterCandidate(
  config: SimulationConfig,
  climate: HourlyClimateYear,
  dailyConsumptionKwh: number,
  zone: ClimateZone
): boolean {
  if (!climate.available || climate.data.length === 0) return true;  // can't filter, simulate all

  // Estimate yearly solar production
  const panelScale = config.panelsPerStation / 6;
  let totalSolarWh = 0;
  let totalWindWh = 0;

  // Sample every 6th hour for speed (1460 points instead of 8760)
  for (let i = 0; i < climate.data.length; i += 6) {
    const p = climate.data[i];
    totalSolarWh += p.pv_w * panelScale * config.stations * 6;  // ×6 to compensate sampling

    if (config.windTurbines > 0) {
      const windAtHub = adjustWindForHeight(p.wind_ms, zone);
      totalWindWh += calculateWindPowerW(windAtHub) * config.windTurbines * 6;
    }
  }

  const yearlyProductionKwh = (totalSolarWh + totalWindWh) / 1000;
  const yearlyConsumptionKwh = dailyConsumptionKwh * 365;

  // Include H2 storage capacity in the energy balance
  const h2StorageKwh = config.h2Hubs * EC.H2_HUB_ELECTRICAL_KWH;

  // Reject if yearly production < 50% of consumption (even with perfect storage)
  // This is generous — real systems need > ~80% with battery losses
  if (yearlyProductionKwh + h2StorageKwh < yearlyConsumptionKwh * 0.50) {
    return false;
  }

  return true;
}

// ─── Cost Estimation ─────────────────────────────────────────────────────────

/**
 * Simplified BOM cost for candidate ranking.
 * Full detailed BOM is calculated only for the winning candidate in the API route.
 */
function estimateCostUsd(config: SimulationConfig, zone: ClimateZone): number {
  const { stations, batteryModules, windTurbines, h2Hubs, panelsPerStation } = config;

  // Panel cost (EU default)
  const panelCost = panelsPerStation * stations * 95;

  // MPPT: 2 per station
  const mpptCost = 2 * stations * 180;

  // Structure
  let structureCost: number;
  if (panelsPerStation === 8) structureCost = stations * 3200;
  else if (panelsPerStation === 4) structureCost = stations * 3000;
  else structureCost = stations * 2500;

  // Slewing drive
  const slewingCost = stations * 450;

  // Battery (314Ah LFP as default)
  const batteryCost = batteryModules * 832;

  // Wind
  const windCost = windTurbines * (1200 + 600 + 300);  // VAWT + supercap + mast

  // H2
  const h2Cost = h2Hubs * 34180;  // EU price

  // Thermal (zone dependent, per station)
  let thermalCost = 0;
  if (zone === 'arctic') thermalCost = stations * (40 + 945 + 800);  // PTC + PCM + Iridium
  if (zone === 'desert') thermalCost = stations * (400 + 1380 + 1500 + 300);  // compressor + PCM + AWG + rollbond

  // Controller + sensors + comms (master only)
  const controlCost = 200 + 145 + 150;

  const totalUsd = panelCost + mpptCost + structureCost + slewingCost +
    batteryCost + windCost + h2Cost + thermalCost + controlCost;

  return totalUsd;
}

// ─── Main Optimizer ──────────────────────────────────────────────────────────

/**
 * Find the optimal (cheapest feasible) system configuration.
 *
 * @param input - Site parameters and user preferences
 * @param climate - 8760-hour climate dataset
 * @param zoneResult - Detected climate zone
 * @param avgWindMs - Average wind speed at turbine height (m/s)
 * @param maxGustKmh - 5-year max gust (km/h) for frame selection
 */
export function optimize(
  input: SiteInput,
  climate: HourlyClimateYear,
  zoneResult: ZoneDetectionResult,
  avgWindMs: number,
  maxGustKmh: number
): SizingEngineOutput {
  const startMs = Date.now();
  const warnings: string[] = [];
  const zone = zoneResult.zone;

  // Conservative mode: increase consumption by load margin (startup currents, parasitic losses)
  const effectiveDailyKwh = input.scenarioMode === 'conservative'
    ? input.dailyConsumptionKwh * EC.CONSERVATIVE_LOAD_MARGIN
    : input.dailyConsumptionKwh;

  if (input.scenarioMode === 'conservative') {
    console.log(`Optimizer: conservative mode — load ${input.dailyConsumptionKwh.toFixed(1)} → ${effectiveDailyKwh.toFixed(1)} kWh/day (+${((EC.CONSERVATIVE_LOAD_MARGIN - 1) * 100).toFixed(0)}%)`);
  }

  // ─── Generate candidates ───
  const allCandidates = generateCandidates(
    input.mode,
    input.grid,
    zone,
    avgWindMs,
    input.lat,
    maxGustKmh,
    input.hideMode || false,
    input.hide90 || false
  );

  const candidatesEvaluated = allCandidates.length;

  // ─── Check if simulation is possible ───
  if (!climate.available || climate.data.length < 8000) {
    warnings.push('No hourly climate data available — using legacy heuristic sizing');
    return buildLegacyFallback(input, zone, zoneResult, avgWindMs, maxGustKmh, warnings, startMs);
  }

  // ─── Pre-filter ───
  const filtered = allCandidates.filter(c =>
    preFilterCandidate(c, climate, effectiveDailyKwh, zone)
  );

  // Sort by estimated cost (cheapest first) to find feasible solution faster
  const sorted = filtered
    .map(config => ({ config, cost: estimateCostUsd(config, zone) }))
    .sort((a, b) => a.cost - b.cost);

  const candidatesSimulated = sorted.length;

  // ─── Simulate candidates ───
  const feasible: CandidateResult[] = [];
  let cheapestFeasible: CandidateResult | null = null;

  for (const { config, cost } of sorted) {
    // Timeout guard
    if (Date.now() - startMs > EC.HARD_TIMEOUT_MS) {
      warnings.push(`Optimizer timeout after ${Date.now() - startMs}ms, evaluated ${feasible.length + (cheapestFeasible ? 0 : 0)} of ${sorted.length} candidates`);
      break;
    }

    // If we already found a feasible solution and this candidate costs more, skip
    if (cheapestFeasible && cost > cheapestFeasible.costUsd * 1.5) break;

    const batTempOffset = input.scenarioMode === 'conservative' ? EC.CONSERVATIVE_BATTERY_TEMP_OFFSET : 0;
    const result = simulateYear(
      config,
      climate,
      effectiveDailyKwh,
      zone,
      input.loadPattern,
      input.heatPump,
      input.reliabilityPolicy,
      input.grid,
      batTempOffset
    );

    // Debug: log cheapest infeasible per station count
    if (!result.feasible && config.stations <= 2) {
      console.log(`Optimizer: infeasible s=${config.stations} bat=${config.batteryModules} w=${config.windTurbines} h2=${config.h2Hubs} p=${config.panelsPerStation} → unmet=${result.unmetHours}h/${result.unmetKwh.toFixed(1)}kWh minSOC=${result.minSocKwh.toFixed(1)} maxDeficit=${result.maxDeficitRunHours}h`);
    }

    if (result.feasible) {
      const costEur = Math.round(cost * 0.92);
      const candidate: CandidateResult = {
        config,
        result,
        costUsd: cost,
        costEur,
        selectionRank: 0,  // will be set below
      };

      feasible.push(candidate);
      if (!cheapestFeasible || cost < cheapestFeasible.costUsd) {
        cheapestFeasible = candidate;
      }
    }
  }

  // ─── Select winner ───
  if (!cheapestFeasible) {
    // No feasible solution — use the largest configuration as fallback
    warnings.push('No configuration meets reliability policy. Using maximum configuration.');
    const maxConfig = sorted[sorted.length - 1]?.config || allCandidates[allCandidates.length - 1];
    const maxResult = simulateYear(
      maxConfig, climate, effectiveDailyKwh,
      zone, input.loadPattern, input.heatPump, input.reliabilityPolicy, input.grid,
      input.scenarioMode === 'conservative' ? EC.CONSERVATIVE_BATTERY_TEMP_OFFSET : 0
    );
    cheapestFeasible = {
      config: maxConfig,
      result: maxResult,
      costUsd: estimateCostUsd(maxConfig, zone),
      costEur: Math.round(estimateCostUsd(maxConfig, zone) * 0.92),
      selectionRank: 1,
    };
    feasible.push(cheapestFeasible);
  }

  // Rank feasible candidates
  feasible.sort((a, b) => a.costUsd - b.costUsd);
  feasible.forEach((c, i) => { c.selectionRank = i + 1; });

  // ─── Warnings ───
  const rec = cheapestFeasible;
  const yearlyProd = rec.result.totalSolarKwh + rec.result.totalWindKwh;
  const yearlyConsumption = effectiveDailyKwh * 365;

  if (yearlyProd < yearlyConsumption * 0.9) {
    warnings.push(`Annual production (${Math.round(yearlyProd)} kWh) < 90% of consumption (${Math.round(yearlyConsumption)} kWh).`);
  }
  if (rec.result.lolp > 0.01) {
    warnings.push(`Loss of load probability ${(rec.result.lolp * 100).toFixed(1)}% — consider adding capacity.`);
  }
  if (rec.result.equivalentBatteryCycles > 400) {
    warnings.push(`High battery cycling: ${Math.round(rec.result.equivalentBatteryCycles)} eq. cycles/year.`);
  }
  if (rec.result.curtailedKwh > yearlyProd * 0.3) {
    warnings.push(`${Math.round(rec.result.curtailedKwh / yearlyProd * 100)}% of generation curtailed — system may be oversized.`);
  }

  return {
    recommendation: cheapestFeasible,
    allFeasible: feasible.slice(0, 10),  // top 10 for debugging
    candidatesEvaluated,
    candidatesSimulated,
    candidatesFeasible: feasible.length,
    selectionMethod: 'optimizer',
    simulationMode: input.scenarioMode,
    reliabilityPolicy: input.reliabilityPolicy,
    warnings,
    runtimeMs: Date.now() - startMs,
    zone: zoneResult,
  };
}

// ─── Legacy Fallback ─────────────────────────────────────────────────────────

/**
 * When no hourly climate data is available, use simplified heuristic sizing
 * (similar to the old calculateSystemRequirements logic).
 */
function buildLegacyFallback(
  input: SiteInput,
  zone: ClimateZone,
  zoneResult: ZoneDetectionResult,
  avgWindMs: number,
  maxGustKmh: number,
  warnings: string[],
  startMs: number
): SizingEngineOutput {
  const daily = input.scenarioMode === 'conservative'
    ? input.dailyConsumptionKwh * EC.CONSERVATIVE_LOAD_MARGIN
    : input.dailyConsumptionKwh;
  const isCivil = input.mode === 'civil';

  // Simple heuristic: stations based on consumption
  const useWind = avgWindMs >= 4.0;
  const isPolar = Math.abs(input.lat) >= 63;
  const usesPVF180 = maxGustKmh > 120;
  const panelsPerStation = isCivil ? 6 : (isPolar && !useWind ? 8 : (usesPVF180 ? 4 : 6));

  // Rough estimate: 1 station with 6 panels produces ~15 kWh/day in continental
  const estDailyProdPerStation = panelsPerStation * 0.72 * 3.5;  // ~3.5 peak sun hours avg
  let stations = Math.max(1, Math.ceil(daily / estDailyProdPerStation));
  const maxStations = isCivil
    ? (input.grid ? EC.MAX_STATIONS_CIVIL_GRID : EC.MAX_STATIONS_CIVIL_OFFGRID)
    : EC.MAX_STATIONS_INDUSTRIAL;
  stations = Math.min(stations, maxStations);

  // Battery: cover 2-3 days autonomy
  const autonomyDays = isCivil ? 2 : 3;
  const batteryKwhNeeded = daily * autonomyDays;
  let batteryModules = Math.max(1, Math.ceil(batteryKwhNeeded / EC.BATTERY_MODULE_KWH));
  const maxBat = isCivil ? EC.MAX_BATTERY_CIVIL : EC.MAX_BATTERY_PER_STATION * stations;
  batteryModules = Math.min(batteryModules, maxBat);

  // H2 for arctic industrial
  const h2Hubs = (!isCivil && zone === 'arctic' && daily > 15) ? 1 : 0;

  const config: SimulationConfig = {
    stations,
    batteryModules,
    windTurbines: useWind ? stations : 0,
    h2Hubs,
    panelsPerStation,
  };

  // Build a synthetic result (no real simulation data)
  const result: SimulationResult = {
    feasible: true,
    lolp: 0,
    unmetHours: 0,
    unmetKwh: 0,
    minSocKwh: 0,
    maxSocKwh: batteryModules * EC.BATTERY_MODULE_KWH,
    curtailedKwh: 0,
    totalSolarKwh: estDailyProdPerStation * stations * 365,
    totalWindKwh: 0,
    totalConsumedKwh: daily * 365,
    totalParasiticKwh: 0,
    h2ProducedKg: 0,
    h2ConsumedKg: 0,
    equivalentBatteryCycles: 0,
    maxDeficitRunHours: 0,
    convergencePassesUsed: 0,
    monthlySummary: [],
  };

  const costUsd = estimateCostUsd(config, zone);
  const candidate: CandidateResult = {
    config,
    result,
    costUsd,
    costEur: Math.round(costUsd * 0.92),
    selectionRank: 1,
  };

  warnings.push('Legacy fallback: results are approximate. Provide location within PVGIS coverage for simulation-based sizing.');

  return {
    recommendation: candidate,
    allFeasible: [candidate],
    candidatesEvaluated: 1,
    candidatesSimulated: 0,
    candidatesFeasible: 1,
    selectionMethod: 'legacy_fallback',
    simulationMode: input.scenarioMode,
    reliabilityPolicy: input.reliabilityPolicy,
    warnings,
    runtimeMs: Date.now() - startMs,
    zone: zoneResult,
  };
}
