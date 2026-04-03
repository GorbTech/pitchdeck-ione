// =============================================================================
// iONE Sizing Engine — Load Profiles
// =============================================================================
// Provides hourly load profiles for simulation.
// determineLoadClass() is preserved as a helper for profile selection
// and policy — NOT as a sizing driver.

import { LoadPattern, LoadProfilePoint } from './types';
export type { LoadProfilePoint };

/**
 * Load class — used ONLY for:
 * - default load profile selection
 * - peak demand estimation
 * - policy/text descriptions
 * NOT for battery sizing or autonomy days calculation
 */
export interface LoadClass {
  class: 'micro' | 'light' | 'standard' | 'heavy';
  peakDemandW: number;
  description: string;
  defaultPattern: LoadPattern;
}

/**
 * Classify load — helper only, not a sizing driver
 */
export function classifyLoad(dailyKwh: number, consumptionW: number): LoadClass {
  if (dailyKwh <= 2) {
    return {
      class: 'micro',
      peakDemandW: consumptionW,
      description: 'Micro load (sensors, IoT)',
      defaultPattern: 'telecom_flat',
    };
  } else if (dailyKwh <= 8) {
    return {
      class: 'light',
      peakDemandW: consumptionW,
      description: 'Light load (telecom, lighting)',
      defaultPattern: 'telecom_flat',
    };
  } else if (dailyKwh <= 25) {
    return {
      class: 'standard',
      peakDemandW: consumptionW * 1.5,
      description: 'Standard load (site power, small pumps)',
      defaultPattern: 'industrial_flat',
    };
  } else {
    return {
      class: 'heavy',
      peakDemandW: consumptionW * 3,
      description: 'Heavy load (industrial pumps, motors)',
      defaultPattern: 'industrial_day',
    };
  }
}

/**
 * Get 24-hour load profile (fractions summing to 1.0)
 */
export function getLoadProfile(
  pattern: LoadPattern,
  month: number,
  heatPump: boolean = false
): LoadProfilePoint[] {

  let hourlyFractions: number[];

  switch (pattern) {
    case 'residential':
      hourlyFractions = getResidentialProfile(heatPump, month);
      break;
    case 'industrial_flat':
    case 'telecom_flat':
      hourlyFractions = getFlatProfile();
      break;
    case 'industrial_day':
      hourlyFractions = getDayShiftProfile();
      break;
    default:
      hourlyFractions = getFlatProfile();
  }

  return hourlyFractions.map((fraction, hour) => ({ hour, fraction }));
}

/**
 * Residential evening-peaked profile (German SLP H0 adapted)
 * With optional heat pump overlay
 */
function getResidentialProfile(heatPump: boolean, month: number): number[] {
  const baseProfile = [
    0.020, 0.018, 0.016, 0.016, 0.018, 0.025,  // 0-5: night
    0.045, 0.065, 0.060,                          // 6-8: morning
    0.035, 0.030, 0.028, 0.032, 0.030, 0.028, 0.030, // 9-15: day
    0.040, 0.055, 0.070, 0.075, 0.070, 0.065,   // 16-21: evening
    0.045, 0.030                                   // 22-23: late
  ];

  if (!heatPump) return normalizeProfile(baseProfile);

  // Heat pump overlay
  const winterMonths = [0, 1, 2, 10, 11];
  const shoulderMonths = [3, 4, 9];

  let hpFraction = 0;
  if (winterMonths.includes(month)) hpFraction = 0.35;
  else if (shoulderMonths.includes(month)) hpFraction = 0.15;
  else hpFraction = 0.05;

  const hpHourlyWeight = [
    1.2, 1.2, 1.2, 1.2, 1.1, 1.0,
    0.9, 0.8, 0.7,
    0.6, 0.6, 0.5, 0.5, 0.5, 0.6, 0.7,
    0.8, 0.9, 1.0, 1.0, 1.1, 1.1,
    1.2, 1.2
  ];
  const hpWeightSum = hpHourlyWeight.reduce((a, b) => a + b, 0);

  const combined = baseProfile.map((base, h) =>
    base * (1 - hpFraction) + hpFraction * (hpHourlyWeight[h] / hpWeightSum)
  );

  return normalizeProfile(combined);
}

/**
 * Flat 24/7 profile — constant load every hour
 */
function getFlatProfile(): number[] {
  return new Array(24).fill(1 / 24);
}

/**
 * Day shift profile — 70% of load during 7:00-17:00, 30% rest
 */
function getDayShiftProfile(): number[] {
  const profile = new Array(24).fill(0);
  for (let h = 0; h < 24; h++) {
    if (h >= 7 && h < 17) {
      profile[h] = 0.07;  // 10 hours × 0.07 = 0.70
    } else {
      profile[h] = 0.3 / 14; // 14 hours × ~0.021 = 0.30
    }
  }
  return normalizeProfile(profile);
}

/**
 * Normalize profile to sum exactly 1.0
 */
function normalizeProfile(profile: number[]): number[] {
  const sum = profile.reduce((a, b) => a + b, 0);
  if (sum <= 0) return new Array(24).fill(1 / 24);
  return profile.map(v => v / sum);
}
