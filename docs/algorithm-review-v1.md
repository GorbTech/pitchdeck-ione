# Algorithm Review: Risks, Gaps, Questions
## iONE Configurator Sizing Algorithm v1

**Date:** 2026-03-16
**Status:** Pre-sizing tool — not bankable without site verification
**Reviewer:** Ivan Gorb, CEO

---

## Critical Issues (must fix before sales use)

### 1. Station count starts from annual yield, not seasonal adequacy

Current: `stations = ceil(yearlyConsumption / yearlyProduction)`
Then corrects upward when winter fails.

**Risk:** Algorithm makes an "economical" choice first, then contradicts itself. For autonomous systems the question is not "how much per year" but "does it survive the worst season?"

**Fix:** Start from worst-season survival, then verify annual balance as a secondary check.

### 2. Winter deficit calculated at monthly resolution — too coarse

Monthly sums hide intra-month variability. A bad 10-15 day period can kill the system even if the month averages out.

**Fix:** Use daily PVGIS data (seriescalc endpoint returns hourly) for battery sizing simulation. Monthly OK for station count, daily required for battery.

### 3. Wind averaging across sources is naive

Current: arithmetic mean of PVGIS TMY + NASA POWER + ERA5.

**Problems:**
- Different spatial resolution, measurement height, model physics
- ERA5 often "too beautiful" on open terrain
- NASA POWER not designed for site-level sizing
- Mean of bad and good ≠ truth

**Fix:** Use conservative approach (P75 lower bound), not arithmetic mean. All sources normalized to same height before comparison. Flag confidence level.

### 4. VAWT decision on single threshold (4.5 m/s) — too primitive

Missing: wind distribution, turbulence intensity, icing risk, terrain roughness, seasonal bias, wind rose.

**Fix:** At minimum add winter wind availability check. Add confidence flags. Long-term: Weibull distribution analysis.

### 5. Frame selection by absolute 5-year max gust

One extreme event drives structural choice. System has storm-fold capability which changes the requirement.

**Questions:**
- Frame by survival gust or operational gust?
- How does fold-to-safe-mode change frame requirements?
- Should use percentile design, not absolute max?

---

## Important Gaps (should fix for v2)

### 6. Battery sized by energy only, not power or degradation

Missing:
- Discharge/charge power verification (can battery deliver peak load?)
- Usable capacity vs nameplate (DoD reserve)
- Cold weather derating
- Aging margin (capacity after 5-10 years)

### 7. No load type differentiation

333W DC telecom node and 5.5kW 3-phase pump are completely different:
- Surge/inrush current
- Motor start class
- Power factor
- Inverter derating for reactive loads
- AC vs DC path

**Fix:** Add load class: telecom / pump / radar / lighting / mixed. Each class has its own sizing rules.

### 8. H2-Hub triggers too late

Current: only when 6 stations can't cover annual demand.

**Should trigger:** when annual balance is positive but seasonal storage gap exceeds battery capacity. H2 is for seasonal mismatch, not annual insufficiency.

### 9. No confidence score

Every result looks equally confident. Need flags:
- **High** — good solar location, no wind dependency, simple load
- **Medium** — wind-dependent, moderate latitude, standard load
- **Low / Site verification required** — extreme latitude, high wind dependency, complex load, sparse data

### 10. H2 efficiency 35% is a placeholder

One number for entire chain (electrolyzer → compression → storage → fuel cell → auxiliaries → temperature effects). Need at minimum AC-to-AC round-trip with seasonal standby losses.

### 11. Retail = BOM × 2 is flat

Different cases have very different:
- Assembly complexity
- Commissioning effort
- Logistics cost
- Service risk
- Software/monitoring

**Fix:** Break into: hardware + assembly + software + logistics + commissioning + risk margin.

---

## Recommended Algorithm Structure (v2)

```
1. Determine LOAD CLASS (telecom / pump / radar / mixed)
   → sets power requirements, surge, inverter sizing

2. Collect CONSERVATIVE CLIMATE CASE
   → solar: PVGIS (reliable)
   → wind: P75 lower bound from available sources
   → flag confidence level

3. Check WORST-SEASON SURVIVAL
   → daily simulation for battery sizing
   → monthly OK for station count

4. Select STATIONS by seasonal adequacy
   → not by annual yield

5. Size BATTERY
   → by worst consecutive deficit (daily resolution)
   → with DoD, aging, cold weather margins
   → verify power delivery capability

6. Check if H2 needed for SEASONAL TRANSFER
   → trigger: positive annual but seasonal gap > battery
   → not just "6 stations failed"

7. Verify ANNUAL SURPLUS / ECONOMICS
   → payback, ROI, cost breakdown
   → this is output, not input to sizing
```

---

## Engineering vs Business Constants

| Parameter | Type | Current Value | Notes |
|-----------|------|---------------|-------|
| Max stations | Business | 6 | Could be higher for large installations |
| Modules per station | Physical | 3 | Platform volume constraint |
| VAWT threshold | Engineering | 4.5 m/s | Needs turbulence/icing overlay |
| Battery module | Physical | 16.08 kWh (314Ah) | LiFePO4 16S1P |
| H2 efficiency | Engineering | 35% | Placeholder — needs detailed model |
| Retail markup | Business | 2.0× | Should be category-based |
| Min autonomy | Business | 3 days | Could vary by load class |

---

## Current Status

Algorithm is a **good v1 pre-sizing tool**. Suitable for:
- Initial customer conversations
- Rough cost estimation
- Lead qualification

**Not suitable for:**
- Bankable feasibility studies
- Contractual guarantees
- Heavy/northern/wind-dependent cases without site verification

All wind-dependent results must carry: **"subject to site wind verification"**
