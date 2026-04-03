// =============================================================================
// iONE Sizing Engine — Climate Data Builder
// =============================================================================
// Builds a unified 8760-hour climate dataset from PVGIS TMY
// This replaces the broken getPVGISDailySeries daily aggregation as the
// primary data source for the simulation engine.

import {
  HourlyClimatePoint,
  HourlyClimateYear,
  ClimateZone,
  ZoneDetectionResult,
  ScenarioMode,
  ENGINE_CONSTANTS,
} from './types';

const PVGIS_BASE = 'https://re.jrc.ec.europa.eu/api/v5_2';

/**
 * Fetch 8760-hour climate year from PVGIS seriescalc (single year)
 * or TMY endpoint.
 *
 * Strategy:
 * 1. Try seriescalc with startyear=endyear (single year, clean 8760)
 * 2. If fails, try TMY endpoint
 * 3. If both fail, return unavailable
 */
export async function getHourlyClimateYear(
  lat: number,
  lon: number,
  peakPower: number,
  loss: number,
  scenarioMode: ScenarioMode
): Promise<HourlyClimateYear> {

  // Try PVGIS seriescalc with a single recent year first
  const singleYearResult = await fetchPVGISSingleYear(lat, lon, peakPower, loss);
  if (singleYearResult) {
    return applyScenarioMode(singleYearResult, scenarioMode);
  }

  // Fallback: try TMY endpoint
  const tmyResult = await fetchPVGISTMY(lat, lon, peakPower, loss);
  if (tmyResult) {
    return applyScenarioMode(tmyResult, scenarioMode);
  }

  // Both failed
  return {
    data: [],
    source: 'unavailable',
    scenarioMode,
    deratingApplied: 1.0,
    yearCount: 0,
    available: false,
  };
}

/**
 * Fetch single-year hourly data from PVGIS seriescalc
 */
async function fetchPVGISSingleYear(
  lat: number,
  lon: number,
  peakPower: number,
  loss: number
): Promise<HourlyClimateYear | null> {
  try {
    // Use 2020 as a representative recent year
    const year = 2020;
    const url = `${PVGIS_BASE}/seriescalc?lat=${lat}&lon=${lon}&pvcalculation=1&peakpower=${peakPower}&loss=${loss}&trackingtype=2&startyear=${year}&endyear=${year}&outputformat=json`;
    console.log('Climate: fetching seriescalc single year', url);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.log('Climate: seriescalc single year failed:', response.status);
      return null;
    }

    const data = await response.json();
    const hourly = data.outputs?.hourly;
    if (!hourly || hourly.length < 8000) {
      console.log('Climate: seriescalc returned insufficient data:', hourly?.length);
      return null;
    }

    const points: HourlyClimatePoint[] = [];
    let dayOfYear = 0;
    let prevDayKey = '';

    for (const h of hourly) {
      const timeStr = h['time'] as string; // "20200101:0010"
      const monthStr = timeStr.substring(4, 6);
      const hourStr = timeStr.substring(9, 11);
      const dayKey = timeStr.substring(4, 8);

      if (dayKey !== prevDayKey) {
        if (prevDayKey !== '') dayOfYear++;
        prevDayKey = dayKey;
      }

      points.push({
        month: parseInt(monthStr, 10) - 1,   // 0-11
        hour: parseInt(hourStr, 10),
        dayOfYear: Math.min(dayOfYear, 364),
        pv_w: h.P || 0,                       // PV power output (W)
        wind_ms: h.WS10m ?? 0,                // Wind at 10m (m/s)
        temp_c: h.T2m ?? 15,                  // Temperature (°C)
      });
    }

    // Pad or trim to exactly 8760 if needed
    while (points.length < 8760) {
      const last = points[points.length - 1] || { month: 11, hour: 23, dayOfYear: 364, pv_w: 0, wind_ms: 0, temp_c: 0 };
      points.push({ ...last, hour: (last.hour + 1) % 24 });
    }

    console.log(`Climate: seriescalc single year OK, ${points.length} hours`);

    return {
      data: points.slice(0, 8760),
      source: 'PVGIS-seriescalc-single-year',
      scenarioMode: 'typical',  // will be overridden by applyScenarioMode
      deratingApplied: 1.0,
      yearCount: 1,
      available: true,
    };

  } catch (error) {
    console.error('Climate: seriescalc single year error:', error);
    return null;
  }
}

/**
 * Fetch hourly data from PVGIS TMY endpoint
 * TMY = Typical Meteorological Year (ISO 15927-4), represents P50
 */
async function fetchPVGISTMY(
  lat: number,
  lon: number,
  peakPower: number,
  loss: number
): Promise<HourlyClimateYear | null> {
  try {
    const url = `${PVGIS_BASE}/tmy?lat=${lat}&lon=${lon}&outputformat=json`;
    console.log('Climate: fetching TMY', url);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.log('Climate: TMY failed:', response.status);
      return null;
    }

    const data = await response.json();
    const tmyHourly = data.outputs?.tmy_hourly;
    if (!tmyHourly || tmyHourly.length < 8000) {
      console.log('Climate: TMY returned insufficient data:', tmyHourly?.length);
      return null;
    }

    // TMY doesn't include PV calculation directly, only irradiance + wind + temp
    // We need to estimate PV from irradiance
    // G(h) = global horizontal irradiance (W/m²)
    // Gb(n) = beam normal irradiance (W/m²)
    // For 2-axis tracking, PV ≈ Gb(n) × peakPower / 1000 × (1 - loss/100)
    const efficiency = 1 - loss / 100;

    const points: HourlyClimatePoint[] = [];
    let dayOfYear = 0;
    let prevDayKey = '';

    for (const h of tmyHourly) {
      const timeStr = h['time(UTC)'] as string; // "20050101:0010"
      const monthStr = timeStr.substring(4, 6);
      const hourStr = timeStr.substring(9, 11);
      const dayKey = timeStr.substring(4, 8);

      if (dayKey !== prevDayKey) {
        if (prevDayKey !== '') dayOfYear++;
        prevDayKey = dayKey;
      }

      // For 2-axis tracking, use Gb(n) (beam normal) + diffuse component
      // Simplified: use G(i) if available, else estimate from Gb(n) + Gd(h)
      const gbn = h['Gb(n)'] || 0;       // beam normal irradiance
      const gdh = h['Gd(h)'] || 0;       // diffuse horizontal
      const irradiance = gbn + gdh * 0.9; // 2-axis captures most diffuse too

      const pv_w = irradiance * peakPower / 1000 * efficiency;

      points.push({
        month: parseInt(monthStr, 10) - 1,
        hour: parseInt(hourStr, 10),
        dayOfYear: Math.min(dayOfYear, 364),
        pv_w: Math.max(0, pv_w),
        wind_ms: h.WS10m ?? 0,
        temp_c: h.T2m ?? 15,
      });
    }

    // Pad to 8760
    while (points.length < 8760) {
      const last = points[points.length - 1] || { month: 11, hour: 23, dayOfYear: 364, pv_w: 0, wind_ms: 0, temp_c: 0 };
      points.push({ ...last, hour: (last.hour + 1) % 24 });
    }

    console.log(`Climate: TMY OK, ${points.length} hours`);

    return {
      data: points.slice(0, 8760),
      source: 'PVGIS-TMY',
      scenarioMode: 'typical',
      deratingApplied: 1.0,
      yearCount: 1,
      available: true,
    };

  } catch (error) {
    console.error('Climate: TMY fetch error:', error);
    return null;
  }
}

/**
 * Apply scenario mode derating to climate data
 * typical = raw data (P50)
 * conservative = derated solar by configurable factor (temporary P90 approximation)
 */
function applyScenarioMode(
  climate: HourlyClimateYear,
  mode: ScenarioMode
): HourlyClimateYear {
  if (mode === 'typical') {
    return { ...climate, scenarioMode: mode };
  }

  // Conservative: apply solar derating
  const derate = ENGINE_CONSTANTS.CONSERVATIVE_SOLAR_DERATE;
  const deratedData = climate.data.map(p => ({
    ...p,
    pv_w: p.pv_w * derate,
  }));

  return {
    ...climate,
    data: deratedData,
    scenarioMode: mode,
    deratingApplied: derate,
  };
}

/**
 * Detect climate zone from actual temperature data
 * Uses hourly climate data instead of latitude-only heuristic
 */
export function detectZoneFromClimate(
  climate: HourlyClimateYear,
  lat: number,
  zoneOverride?: string
): ZoneDetectionResult {

  // Manual override takes priority
  if (zoneOverride && zoneOverride !== 'continental') {
    // Only respect non-default overrides (continental is the frontend default)
    const zone = zoneOverride as ClimateZone;
    return {
      zone,
      method: 'manual_override',
      minMonthlyTempC: 0,
      maxMonthlyTempC: 0,
      avgTempC: 0,
    };
  }

  if (!climate.available || climate.data.length === 0) {
    // Fallback to latitude-only
    return detectZoneFromLatitude(lat);
  }

  // Calculate monthly average temperatures
  const monthlyTemps: number[][] = Array.from({ length: 12 }, () => []);
  for (const p of climate.data) {
    monthlyTemps[p.month].push(p.temp_c);
  }
  const monthlyAvg = monthlyTemps.map(temps =>
    temps.length > 0 ? temps.reduce((a, b) => a + b, 0) / temps.length : 15
  );

  const minMonthlyTemp = Math.min(...monthlyAvg);
  const maxMonthlyTemp = Math.max(...monthlyAvg);
  const avgTemp = monthlyAvg.reduce((a, b) => a + b, 0) / 12;

  let zone: ClimateZone;

  if (minMonthlyTemp < -10 || Math.abs(lat) > 63) {
    zone = 'arctic';
  } else if (maxMonthlyTemp > 35 && avgTemp > 22) {
    zone = 'desert';
  } else {
    zone = 'continental';
  }

  return {
    zone,
    method: 'auto_climate',
    minMonthlyTempC: Math.round(minMonthlyTemp * 10) / 10,
    maxMonthlyTempC: Math.round(maxMonthlyTemp * 10) / 10,
    avgTempC: Math.round(avgTemp * 10) / 10,
  };
}

/**
 * Detect climate zone from Open-Meteo ERA5 reanalysis data.
 * Uses real temperature extremes and precipitation instead of PVGIS TMY averages.
 */
export function detectZoneFromOpenMeteo(
  monthlyMaxTemp: number[],   // max of daily Tmax per month (°C)
  monthlyMinTemp: number[],   // min of daily Tmin per month (°C)
  annualPrecipMm: number,
  lat: number,
  zoneOverride?: string,
): ZoneDetectionResult {
  if (zoneOverride && zoneOverride !== 'continental') {
    return {
      zone: zoneOverride as ClimateZone,
      method: 'manual_override',
      minMonthlyTempC: 0,
      maxMonthlyTempC: 0,
      avgTempC: 0,
    };
  }

  const maxTemp = Math.max(...monthlyMaxTemp);
  const minTemp = Math.min(...monthlyMinTemp);
  const avgTemp = (monthlyMaxTemp.reduce((a, b) => a + b, 0) +
                   monthlyMinTemp.reduce((a, b) => a + b, 0)) / 24;

  let zone: ClimateZone;

  if (minTemp < -15 || Math.abs(lat) > 63) {
    zone = 'arctic';
  } else if (maxTemp >= 38 || annualPrecipMm < 250) {
    zone = 'desert';
  } else {
    zone = 'continental';
  }

  return {
    zone,
    method: 'auto_openmeteo',
    minMonthlyTempC: Math.round(minTemp * 10) / 10,
    maxMonthlyTempC: Math.round(maxTemp * 10) / 10,
    avgTempC: Math.round(avgTemp * 10) / 10,
  };
}

/**
 * Fallback: detect zone from latitude only
 */
export function detectZoneFromLatitude(lat: number): ZoneDetectionResult {
  let zone: ClimateZone;
  if (Math.abs(lat) > 63) {
    zone = 'arctic';
  } else if (Math.abs(lat) >= 15 && Math.abs(lat) < 28) {
    zone = 'desert';
  } else {
    zone = 'continental';
  }

  return {
    zone,
    method: 'auto_latitude',
    minMonthlyTempC: 0,
    maxMonthlyTempC: 0,
    avgTempC: 0,
  };
}
