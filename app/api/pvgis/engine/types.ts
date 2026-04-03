// =============================================================================
// iONE Sizing Engine — Type Definitions
// =============================================================================

// --- Climate & Input ---

export interface SiteInput {
  lat: number;
  lon: number;
  address?: string;
  country?: string;
  dailyConsumptionKwh: number;
  peakLoadKw?: number;
  mode: 'industrial' | 'civil';
  grid: boolean;
  heatPump: boolean;
  zoneOverride?: string;          // manual zone from frontend
  componentOrigin: 'EU' | 'World';
  loadPattern: LoadPattern;
  scenarioMode: ScenarioMode;
  reliabilityPolicy: ReliabilityPolicy;
  hideMode?: boolean;              // force PVF180 (4 panels) for camouflage
  hide90?: boolean;                // force PVF90 (6 panels) for 90° camouflage
}

export type LoadPattern =
  | 'residential'         // evening-peaked (German SLP H0)
  | 'industrial_flat'     // 24/7 constant
  | 'industrial_day'      // 8-10h daytime shift
  | 'telecom_flat'        // 24/7 constant (same as industrial_flat)
  | 'custom_hourly';      // user-provided 24h profile

export type ScenarioMode = 'typical' | 'conservative';

export interface ReliabilityPolicy {
  maxUnmetHours: number;           // 0 for critical off-grid
  maxUnmetKwh: number;             // 0 for critical off-grid
  label: string;                   // 'industrial_critical' | 'civil_offgrid' | 'grid_assisted'
}

// Predefined policies
export const RELIABILITY_POLICIES: Record<string, ReliabilityPolicy> = {
  industrial_critical: { maxUnmetHours: 0, maxUnmetKwh: 0, label: 'industrial_critical' },
  industrial_standard: { maxUnmetHours: 48, maxUnmetKwh: 20, label: 'industrial_standard' },
  civil_offgrid:       { maxUnmetHours: 24, maxUnmetKwh: 5, label: 'civil_offgrid' },
  grid_assisted:       { maxUnmetHours: 8760, maxUnmetKwh: Infinity, label: 'grid_assisted' },
};

// --- Hourly Climate Data ---

export interface HourlyClimatePoint {
  month: number;          // 0-11
  hour: number;           // 0-23
  dayOfYear: number;      // 0-364
  pv_w: number;           // PV output (W) for 1 station with 6 panels (4.32 kWp)
  wind_ms: number;        // Wind speed at 10m (m/s)
  temp_c: number;         // Air temperature (°C)
}

export interface HourlyClimateYear {
  data: HourlyClimatePoint[];     // 8760 points
  source: string;                  // 'PVGIS-TMY' | 'PVGIS-seriescalc-single-year'
  scenarioMode: ScenarioMode;
  deratingApplied: number;         // e.g. 0.88 for conservative, 1.0 for typical
  yearCount: number;               // how many years in source data
  available: boolean;
}

// --- Load Profile ---

export interface LoadProfilePoint {
  hour: number;           // 0-23
  fraction: number;       // fraction of daily kWh consumed this hour (sums to 1.0)
}

// --- Simulation Config (one candidate) ---

export interface SimulationConfig {
  stations: number;                // 1-6
  batteryModules: number;          // total across all stations
  windTurbines: number;            // 0 or = stations
  h2Hubs: number;                  // 0-2
  panelsPerStation: number;        // 4, 6, or 8
}

// --- Simulation Result ---

export interface SimulationResult {
  feasible: boolean;               // meets reliability policy?
  lolp: number;                    // loss of load probability (0-1)
  unmetHours: number;              // hours with unmet load
  unmetKwh: number;                // total unmet energy
  minSocKwh: number;               // lowest battery SOC reached
  maxSocKwh: number;               // highest battery SOC reached
  curtailedKwh: number;            // yearly excess energy
  totalSolarKwh: number;           // yearly solar generation
  totalWindKwh: number;            // yearly wind generation
  totalConsumedKwh: number;        // yearly consumption
  totalParasiticKwh: number;       // yearly parasitic loads
  h2ProducedKg: number;            // H2 produced (if hub present)
  h2ConsumedKg: number;            // H2 consumed (if hub present)
  equivalentBatteryCycles: number; // full cycle equivalents
  maxDeficitRunHours: number;      // longest continuous deficit
  convergencePassesUsed: number;   // warmup passes until SOC converged
  monthlySummary: MonthlySummary[];
}

export interface MonthlySummary {
  month: number;                   // 1-12
  monthName: string;
  solarKwh: number;
  windKwh: number;
  consumedKwh: number;
  parasiticKwh: number;
  fromBatteryKwh: number;
  curtailedKwh: number;
  unmetKwh: number;
  minSocKwh: number;
  maxSocKwh: number;
  avgTempC: number;
  selfSufficiencyPct: number;
  avgDailyProductionKwh: number;   // average day in month (per-station kWh)
  minDailyProductionKwh: number;   // worst day in month (per-station kWh)
  maxDailyProductionKwh: number;   // best day in month (per-station kWh)
}

// --- Candidate (config + result + cost) ---

export interface CandidateResult {
  config: SimulationConfig;
  result: SimulationResult;
  costUsd: number;                 // from calculatePrice()
  costEur: number;
  selectionRank: number;           // 1 = cheapest feasible
}

// --- Battery Model ---

export interface BatteryDerating {
  dod: number;
  tempFactor: number;              // temperature-dependent (not zone-based)
  aging: number;
  total: number;
  usableKwh: number;
  maxChargeW: number;              // power limit
  maxDischargeW: number;           // power limit
}

// --- Zone Detection ---

export type ClimateZone = 'arctic' | 'continental' | 'desert';

export interface ZoneDetectionResult {
  zone: ClimateZone;
  method: 'auto_climate' | 'auto_openmeteo' | 'auto_latitude' | 'manual_override';
  minMonthlyTempC: number;
  maxMonthlyTempC: number;
  avgTempC: number;
}

// --- Engine Output ---

export interface SizingEngineOutput {
  recommendation: CandidateResult;
  allFeasible: CandidateResult[];   // for debugging / comparison
  candidatesEvaluated: number;
  candidatesSimulated: number;      // after pre-filter
  candidatesFeasible: number;
  selectionMethod: 'optimizer' | 'legacy_fallback';
  simulationMode: ScenarioMode;
  reliabilityPolicy: ReliabilityPolicy;
  warnings: string[];
  runtimeMs: number;
  zone: ZoneDetectionResult;
}

// --- Constants ---

export const ENGINE_CONSTANTS = {
  BATTERY_MODULE_KWH: 16.08,
  BATTERY_RTE: 0.93,                // round-trip efficiency LFP
  H2_ELECTROLYSIS_EFF: 0.70,
  H2_FUELCELL_EFF: 0.50,
  H2_KWH_PER_KG: 33.3,              // LHV
  H2_STORAGE_KG_PER_HUB: 12,
  H2_HUB_ELECTRICAL_KWH: 200,       // 12kg × 33.3 × 0.50
  VAWT_RATED_POWER_W: 500,
  VAWT_CUT_IN_MS: 2.5,
  VAWT_RATED_MS: 12,
  VAWT_CUT_OUT_MS: 25,
  TURBINE_HEIGHT_M: 7,
  MAX_STATIONS_INDUSTRIAL: 6,
  MAX_STATIONS_CIVIL_GRID: 1,
  MAX_STATIONS_CIVIL_OFFGRID: 2,
  MAX_BATTERY_PER_STATION: 3,
  MAX_BATTERY_CIVIL: 2,
  MAX_EXTERNAL_BATTERY_PACKS: 2,  // max 2 external 48 kWh packs (96 kWh) + 48 onboard = 144 kWh total
  MAX_H2_HUBS: 2,
  PANEL_WATT: 720,
  // P90 approximation — temporary conservative preset, NOT location-specific
  CONSERVATIVE_SOLAR_DERATE: 0.88,
  // Conservative load margin — real load exceeds declared (startup currents, parasitic, container own consumption)
  CONSERVATIVE_LOAD_MARGIN: 1.10,
  // Conservative battery temp offset — assume heater underperforms by 5°C
  CONSERVATIVE_BATTERY_TEMP_OFFSET: -5,
  // Convergence
  MAX_WARMUP_PASSES: 5,
  SOC_CONVERGENCE_THRESHOLD_WH: 500, // endSOC ≈ startSOC within 500 Wh
  // Runtime
  HARD_TIMEOUT_MS: 4000,
} as const;
