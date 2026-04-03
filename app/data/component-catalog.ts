// iONE Component Catalog — master database for configurator
// Version 1.0, Created: 2026-03-11

export interface ComponentSpec {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface Component {
  id: string;
  model: string;
  origin: 'eu' | 'world';
  spec: ComponentSpec;
  zones: string[];
  cost: number | null;
  retail: number | null;
  reference_price?: number;
  reference_price_qty100?: number;
  reference_price_qty500?: number;
  reference_note?: string;
  notes?: string;
  qty_per_station?: number;
}

export interface Category {
  label: string;
  supplier?: string;
  items: Component[];
}

export interface SolarConfig {
  panel_id: string;
  qty: number;
  kwp: number;
}

export interface Configuration {
  id: string;
  name: string;
  product_line: string;
  zone: string;
  solar: SolarConfig;
  battery_options: string[];
  mppt: { module_id: string; qty: number };
  inverter: string | null;
  power_output: string;
  protection: string;
  structure: string;
  extras?: string[];
  typical_load_w: number;
  notes?: string;
}

export interface VolumeDiscount {
  qty: number;
  discount: number;
  label?: string;
}

export const COMPONENT_CATALOG = {
  _meta: {
    version: "1.0",
    created: "2026-03-11",
    description: "iONE Component Catalog — master database for configurator, admin panel, and BOM engine",
    currency: "USD",
    pricing_note: "cost = procurement cost (internal), retail = customer-facing price. Set in admin panel.",
    zones: ["continental", "desert", "arctic", "tropical"]
  },

  categories: {
    solar_panels: {
      label: "Solar Panels",
      items: [
        {
          id: "PNL-RISEN-720",
          model: "Risen Hyper-ion Pro RSM132-8-720BHDG",
          origin: "world" as const,
          spec: {
            power_wp: 720,
            technology: "HJT Bifacial N-type",
            bifacial_gain: 0.30,
            efficiency: 0.228,
            temp_coefficient: -0.0026,
            dimensions_mm: [2384, 1096, 35],
            weight_kg: 32.5,
            glass: "glass-glass",
            warranty_years: 25
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "Standard panel all product lines. Cold boost +17% at -40°C."
        },
        {
          id: "PNL-HECKERT-720",
          model: "Heckert Solar NeMo 720W TOPCon",
          origin: "eu" as const,
          spec: {
            power_wp: 720,
            technology: "TOPCon Bifacial",
            bifacial_gain: 0.20,
            efficiency: 0.22,
            temp_coefficient: -0.0029,
            dimensions_mm: [2384, 1096, 35],
            weight_kg: 33.0,
            glass: "glass-glass ALD Al₂O₃",
            warranty_years: 30
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "EU-origin. Defence/NATO compliant. ALD coating for desert/salt."
        },
        {
          id: "PNL-SONNENSTROM-720",
          model: "Sonnenstromfabrik 720W TOPCon",
          origin: "eu" as const,
          spec: {
            power_wp: 720,
            technology: "TOPCon Bifacial",
            bifacial_gain: 0.20,
            efficiency: 0.22,
            dimensions_mm: [2384, 1096, 35],
            weight_kg: 33.0,
            glass: "glass-glass",
            warranty_years: 30
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          notes: "EU-origin alternative. Made in Germany."
        }
      ]
    },

    mppt_chargers: {
      label: "MPPT Solar Chargers",
      items: [
        {
          id: "MPPT-VERTIV-S48-2000E3",
          model: "Vertiv S48-2000E3",
          origin: "eu" as const,
          spec: {
            power_w: 2000,
            type: "DC-DC MPPT",
            pv_input_v: "58–150 VDC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true,
            form_factor: "1U rack module"
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          reference_price: 280,
          reference_note: "Vertiv OEM price list"
        },
        {
          id: "MPPT-VERTIV-S48-3000E3",
          model: "Vertiv S48-3000E3",
          origin: "eu" as const,
          spec: {
            power_w: 3000,
            type: "DC-DC MPPT",
            pv_input_v: "58–150 VDC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true,
            form_factor: "1U rack module"
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          reference_price: 300,
          reference_note: "Vertiv OEM price list"
        },
        {
          id: "MPPT-YSSC4875BG1",
          model: "YSSC4875BG1",
          origin: "world" as const,
          spec: {
            power_w: 4000,
            type: "DC-DC MPPT",
            pv_input_v: "58–150 VDC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true,
            form_factor: "1U rack module",
            temp_range: "-40°C to +75°C"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 180,
          reference_note: "OEM China quotation (4kW module)"
        },
        {
          id: "MPPT-OEM-3KW",
          model: "OEM 3kW Solar Charging Module",
          origin: "world" as const,
          spec: {
            power_w: 3000,
            type: "DC-DC MPPT",
            pv_input_v: "58–150 VDC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 162,
          reference_note: "OEM China quotation"
        }
      ]
    },

    rectifiers: {
      label: "AC-DC Rectifiers (Grid/Generator Backup)",
      items: [
        {
          id: "RECT-VERTIV-R48-2000E3",
          model: "Vertiv R48-2000E3",
          origin: "eu" as const,
          spec: {
            power_w: 2000,
            type: "AC-DC Rectifier",
            ac_input: "85–295 VAC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          reference_price: 130,
          reference_note: "Vertiv OEM price"
        },
        {
          id: "RECT-VERTIV-R48-3000E3",
          model: "Vertiv R48-3000E3",
          origin: "eu" as const,
          spec: {
            power_w: 3000,
            type: "AC-DC Rectifier",
            ac_input: "85–295 VAC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 150,
          reference_note: "Vertiv OEM price"
        },
        {
          id: "RECT-R4875G1",
          model: "YSR4875G1 (SR4875G1)",
          origin: "world" as const,
          spec: {
            power_w: 4000,
            type: "AC-DC Rectifier",
            ac_input: "90–300 VAC",
            output_v: "42–58 VDC",
            output_current: "75A",
            efficiency: 0.96,
            hot_swap: true,
            temp_range: "-40°C to +75°C",
            form_factor: "1U",
            weight_kg: 2.0
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 130,
          reference_note: "OEM 4kW rectifier price"
        },
        {
          id: "RECT-OEM-3KW",
          model: "OEM 3kW Rectifier Module",
          origin: "world" as const,
          spec: {
            power_w: 3000,
            type: "AC-DC Rectifier",
            ac_input: "85–295 VAC",
            output_v: "42–58 VDC",
            efficiency: 0.96,
            hot_swap: true
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 93,
          reference_note: "OEM China quotation"
        }
      ]
    },

    inverters: {
      label: "Inverters (DC-AC)",
      items: [
        {
          id: "INV-OEM-BIDIR-2KW",
          model: "OEM Bidirectional Inverter 2kW",
          origin: "world" as const,
          spec: {
            power_w: 2000,
            type: "DC-AC / AC-DC Bidirectional",
            input_v: "48 VDC",
            output_v: "220/230 VAC",
            efficiency: 0.93,
            waveform: "Pure Sine"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price: 220,
          reference_note: "OEM China quotation"
        },
        {
          id: "INV-EM6200-48L",
          model: "EM6200-48L",
          origin: "world" as const,
          spec: {
            power_w: 6200,
            power_va: 6200,
            type: "Hybrid Inverter (PV + Battery + Grid)",
            input_v: "48 VDC",
            pv_input: "60–500 VDC",
            output_v: "220/230 VAC",
            surge_va: 12400,
            efficiency_pv: 0.96,
            efficiency_bat: 0.93,
            mppt_current: "120A",
            ac_charge_current: "80A",
            waveform: "Pure Sine",
            transfer_time_ms: 10,
            weight_kg: 9,
            dimensions_mm: [438, 295, 105],
            comm: "RS232 + RS485",
            temp_range: "-10°C to +55°C"
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          notes: "Built-in MPPT + AC charger. For standalone / residential."
        },
        {
          id: "INV-HF-5KW",
          model: "AC Standard HF Inverter 5kW",
          origin: "world" as const,
          spec: {
            power_w: 5000,
            type: "DC-AC High-Frequency",
            input_v: "48 VDC",
            output_v: "220/230 VAC",
            efficiency: 0.96,
            surge_factor: 2.0,
            waveform: "Pure Sine",
            weight_kg: 10
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "For electronics, cameras, lighting. NOT for motors."
        },
        {
          id: "INV-LF-10KW",
          model: "AC Heavy LF Inverter 10kW",
          origin: "world" as const,
          spec: {
            power_w: 10000,
            type: "DC-AC Low-Frequency Transformer",
            input_v: "48 VDC",
            output_v: "220/230 VAC",
            efficiency: 0.93,
            surge_factor: 3.5,
            surge_duration_s: 10,
            waveform: "Pure Sine",
            weight_kg: 50
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          notes: "REQUIRED for motor loads >3kW: pumps, compressors. 50Hz transformer."
        }
      ]
    },

    batteries: {
      label: "LiFePO₄ Battery Modules",
      supplier: "Xingdong (XDLE) Lithium Battery Technology",
      items: [
        {
          id: "BAT-8S1P-206",
          model: "8S1P 206Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "8S1P",
            capacity_ah: 206,
            voltage_v: 25.6,
            energy_kwh: 5.27,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 273,
          reference_price_qty500: 263,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        },
        {
          id: "BAT-8S1P-280",
          model: "8S1P 280Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "8S1P",
            capacity_ah: 280,
            voltage_v: 25.6,
            energy_kwh: 7.17,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 371,
          reference_price_qty500: 357,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        },
        {
          id: "BAT-8S1P-314",
          model: "8S1P 314Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "8S1P",
            capacity_ah: 314,
            voltage_v: 25.6,
            energy_kwh: 8.04,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 416,
          reference_price_qty500: 400,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        },
        {
          id: "BAT-16S1P-206",
          model: "16S1P 206Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "16S1P",
            capacity_ah: 206,
            voltage_v: 51.2,
            energy_kwh: 10.55,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 546,
          reference_price_qty500: 526,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        },
        {
          id: "BAT-16S1P-280",
          model: "16S1P 280Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "16S1P",
            capacity_ah: 280,
            voltage_v: 51.2,
            energy_kwh: 14.34,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 742,
          reference_price_qty500: 714,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        },
        {
          id: "BAT-16S1P-314",
          model: "16S1P 314Ah LFP Module",
          origin: "world" as const,
          spec: {
            config: "16S1P",
            capacity_ah: 314,
            voltage_v: 51.2,
            energy_kwh: 16.08,
            chemistry: "LiFePO₄",
            cycle_life: ">10,000 @ 0.5C/0.5C",
            cell_format: "Prismatic"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          reference_price_qty100: 832,
          reference_price_qty500: 800,
          reference_note: "XDLE Quotation 10269, Oct 2025"
        }
      ]
    },

    controllers: {
      label: "System Controllers",
      items: [
        {
          id: "SMU-48B",
          model: "SMU48B",
          origin: "world" as const,
          spec: {
            type: "Power System Monitor & Controller",
            functions: ["Battery charge/discharge control", "Temperature compensation", "LLVD/BLVD load disconnect", "Alarm management"],
            comm: ["RS485", "Dry contacts", "SNMP"],
            display: "LCD + LED status"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "Standard across all product lines."
        }
      ]
    },

    thermal_desert: {
      label: "Thermal Management — Desert",
      items: [
        {
          id: "COOL-HUAYI-HVY75AA",
          model: "HUAYI HVY75AA DC Compressor",
          origin: "world" as const,
          spec: {
            power_w: 280,
            cooling_capacity_w: 750,
            refrigerant: "R32 (A2L)",
            voltage: "48V DC native",
            cop_night: "2.7–3.0",
            temp_range: "-10°C to +55°C"
          },
          zones: ["desert"],
          cost: null,
          retail: null,
          notes: "Night-only operation. Day = PCM passive cooling."
        },
        {
          id: "PCM-RT28HC",
          model: "Rubitherm RT28HC PCM Pack",
          origin: "eu" as const,
          spec: {
            phase_change_temp_c: 28,
            latent_heat_kj_kg: 250,
            mass_kg: 36.5,
            thermal_capacity_kwh: 2.54,
            cycle_life: ">10,000",
            encapsulation: "Extruded aluminum profiles",
            total_volume_l: 40.5
          },
          zones: ["desert"],
          cost: null,
          retail: null,
          notes: "End-cap modules (2× 30L) + side modules (3× 10.5L)."
        },
        {
          id: "AWG-MODULE",
          model: "AWG Cooling Module (GMCC + SANHUA + TOPSFLO)",
          origin: "world" as const,
          spec: {
            water_output_l_night: "5–15",
            compressor: "GMCC (Toshiba) 48V DC, R32",
            eev: "SANHUA DPF Series",
            wash_pump: "TOPSFLO TL-C01/TA50 12V BLDC",
            tank_volume_l: 20,
            footprint_mm: [350, 210],
            evaporator: "Fin & Tube, Cu/Al, Hydrophilic coating"
          },
          zones: ["desert"],
          cost: null,
          retail: null,
          notes: "Pre-assembled vertical stack. Nitrogen-tested. RFQ sent Dec 2025."
        },
        {
          id: "ROLLBOND-CONDENSER",
          model: "Roll Bond Heat Rejection Panels",
          origin: "world" as const,
          spec: {
            type: "Aluminum roll bond under solar array wings",
            coolant: "Propylene glycol secondary loop",
            heat_exchange_area_m2: 1.7
          },
          zones: ["desert"],
          cost: null,
          retail: null
        },
        {
          id: "ALD-COATING",
          model: "ALD Al₂O₃ Aerospace Panel Coating",
          origin: "eu" as const,
          spec: {
            hardness: "9H (corundum-class)",
            transmittance_initial: "95–97%",
            transmittance_1yr_desert: "92–95%",
            hydrophobic: true,
            per_unit: "per panel"
          },
          zones: ["desert", "arctic"],
          cost: null,
          retail: null,
          notes: "vs standard glass: 70-80% transmittance after 1yr desert."
        }
      ]
    },

    thermal_arctic: {
      label: "Thermal Management — Arctic",
      items: [
        {
          id: "PTC-HEATING-100W",
          model: "PTC Heating Film 100W / 48V",
          origin: "world" as const,
          spec: {
            power_w: 100,
            voltage: "48V DC",
            type: "PTC Self-Regulating / Carbon Film",
            coverage_m2: "0.2–0.3",
            mounting: "Direct contact with battery cells",
            turn_on_c: 5,
            turn_off_c: 10
          },
          zones: ["arctic"],
          cost: null,
          retail: null,
          notes: "Qty = per battery module. Thermostat controlled."
        },
        {
          id: "PCM-RT10HC",
          model: "Rubitherm RT10HC PCM Pack",
          origin: "eu" as const,
          spec: {
            phase_change_temp_c: 10,
            latent_heat_kj_kg: 195,
            mass_kg: 25,
            thermal_capacity_kwh: 1.35,
            encapsulation: "Aluminum profiles"
          },
          zones: ["arctic"],
          cost: null,
          retail: null
        }
      ]
    },

    wind: {
      label: "Wind Turbine System",
      items: [
        {
          id: "VAWT-500W",
          model: "H-Darrieus VAWT 500W",
          origin: "world" as const,
          spec: {
            type: "H-Darrieus Vertical Axis",
            rated_power_w: 500,
            rated_speed_ms: 12,
            cutin_speed_ms: 2.5,
            survival_speed_ms: 30,
            rotor_diameter_mm: 1200,
            rotor_height_mm: 2000,
            rpm_nominal: 350,
            generator: "Coreless Axial Flux PMSG",
            stator: "Dual PCB, 6-layer 6oz copper, Ø500mm",
            magnets: "NdFeB N45SH, 20-pole",
            output: "3-phase AC → Rectifier → 48V DC",
            temp_range: "-60°C to +85°C",
            bearings: "Ceramic hybrid Si₃N₄, Krytox lubrication"
          },
          zones: ["arctic", "continental"],
          cost: null,
          retail: null,
          notes: "Mandatory for Arctic. Optional for Continental (winter boost)."
        },
        {
          id: "SCAP-MAXWELL-165F",
          model: "Maxwell Supercapacitor 165F / 48V",
          origin: "world" as const,
          spec: {
            technology: "EDLC",
            voltage_v: 48,
            capacitance_f: 165,
            usable_energy_wh: 26,
            esr_25c_mohm: 15,
            esr_minus40c_mohm: 30,
            peak_current_a: 50,
            peak_duration_s: 10,
            temp_range: "-60°C to +65°C",
            balancing: "Active BMS per-cell"
          },
          zones: ["arctic", "continental"],
          cost: null,
          retail: null,
          notes: "Wind gust buffer + motor inrush + emergency reserve. Also for pump surge >3kW."
        }
      ]
    },

    mechanical: {
      label: "Mechanical & Structure",
      items: [
        {
          id: "MECH-SLEWING-DRIVE",
          model: "Industrial Slewing Drive (Worm Gear)",
          origin: "world" as const,
          spec: {
            type: "Dual-axis solar tracker drive",
            azimuth_range: "0°–360° continuous",
            elevation_range: "-10° to +90°",
            precision: "±0.1°",
            wind_load_tracking_kmh: 150,
            wind_load_folded_kmh: 200,
            locking: "Self-locking worm gear"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null
        },
        {
          id: "MECH-ACTUATOR-6500NM",
          model: "Storm-Fold Actuator 6,500 Nm IP67",
          origin: "world" as const,
          spec: {
            torque_nm: 6500,
            class: "Industrial IP67",
            cycle_time_s: 60,
            locking: "Zero-backlash worm gear (unpowered hold)",
            fold_range: "0°–180°",
            ice_load_mm: 25
          },
          zones: ["desert", "arctic"],
          qty_per_station: 4,
          cost: null,
          retail: null,
          notes: "4 units per PVF180 station. For 180° book fold."
        },
        {
          id: "MECH-STRUCTURE-CONTINENTAL",
          model: "Aluminum Extrusion Core — Continental",
          origin: "eu" as const,
          spec: {
            material: "Aluminum 6063-T6",
            includes: ["Mast", "Panel frame 3×2", "Foundation plate", "Cable routing"],
            array_area_m2: 15.7,
            weight_kg: "750–950 (complete system)"
          },
          zones: ["continental", "tropical"],
          cost: null,
          retail: null,
          notes: "PVF90: 6-panel frame, fold 90°. Helical pile foundation."
        },
        {
          id: "MECH-STRUCTURE-PVF180",
          model: "Aluminum Extrusion Core — PVF180",
          origin: "eu" as const,
          spec: {
            material: "Aluminum 6063-T6",
            includes: ["Mast", "Panel frame 2×2", "Fold hinges", "Foundation plate"],
            array_area_m2: 6.35,
            weight_kg: "750–950 (complete system)"
          },
          zones: ["desert", "arctic"],
          cost: null,
          retail: null,
          notes: "PVF180: 4-panel frame, fold 180° (book fold)."
        },
        {
          id: "MECH-VAWT-MAST",
          model: "VAWT Mounting Mast & Bracket",
          origin: "world" as const,
          spec: {
            mast_diameter_mm: 80,
            mast_height_mm: 2000,
            bracket: "П-shaped steel 10mm",
            fasteners: "12× M12 Grade 10.9",
            thermal_break: "G10 fiberglass 15mm"
          },
          zones: ["arctic", "continental"],
          cost: null,
          retail: null
        }
      ]
    },

    connectivity: {
      label: "Connectivity & Communication",
      items: [
        {
          id: "CONN-4G-MODULE",
          model: "4G LTE Communication Module",
          origin: "world" as const,
          spec: {
            type: "4G LTE Cat.4",
            protocols: ["SNMP v3", "Modbus TCP/RTU", "MQTT"],
            antenna: "External omnidirectional"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null
        },
        {
          id: "CONN-IRIDIUM",
          model: "Iridium Satellite Modem",
          origin: "world" as const,
          spec: {
            type: "Satellite L-band",
            coverage: "Global including polar regions",
            latency_ms: "300–600"
          },
          zones: ["arctic"],
          cost: null,
          retail: null,
          notes: "Mandatory for Arctic (no 4G coverage). Optional supplement elsewhere."
        },
        {
          id: "CONN-STARLINK",
          model: "Starlink Terminal",
          origin: "world" as const,
          spec: {
            type: "LEO Satellite",
            power_w: 100,
            bandwidth: "50–200 Mbps"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "Optional high-bandwidth. 100W constant power draw."
        }
      ]
    },

    sensors: {
      label: "Sensor Array",
      items: [
        {
          id: "SENS-PACKAGE-STD",
          model: "Standard Sensor Package",
          origin: "world" as const,
          spec: {
            includes: ["Anemometer (wind speed + direction)", "Pyranometer (solar irradiance)", "Inclinometer (tilt)", "GPS module", "Temperature sensors (ambient + battery + electronics)", "Humidity sensor"],
            total_sensors: 12
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null,
          notes: "Base package all stations. Part of 112-parameter telemetry."
        },
        {
          id: "SENS-VIBRATION",
          model: "Vibration Sensor",
          origin: "world" as const,
          spec: {
            type: "MEMS accelerometer",
            function: "Structural health monitoring, vandalism detection"
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null
        }
      ]
    },

    dc_converters: {
      label: "DC-DC Voltage Converters",
      items: [
        {
          id: "DCDC-48-TO-24",
          model: "48V → 24V DC-DC Converter",
          origin: "world" as const,
          spec: {
            input_v: "42–58 VDC",
            output_v: "24 VDC",
            power_w: 500,
            efficiency: 0.95
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null
        },
        {
          id: "DCDC-48-TO-12",
          model: "48V → 12V DC-DC Converter",
          origin: "world" as const,
          spec: {
            input_v: "42–58 VDC",
            output_v: "12 VDC",
            power_w: 500,
            efficiency: 0.94
          },
          zones: ["continental", "desert", "arctic", "tropical"],
          cost: null,
          retail: null
        }
      ]
    },

    systems: {
      label: "Complete System Configurations (ETP)",
      items: [
        {
          id: "SYS-ETP48600DE5A1",
          model: "ETP48600D-E5A1",
          origin: "world" as const,
          spec: {
            type: "Embedded PV Hybrid Power System",
            capacity_kw: 32,
            rectifier_slots: "3× 3kW",
            mppt_slots: "8× 4kW",
            monitoring: "MU4802",
            ac_input: "380V 3-phase, 1×63A/4P",
            dc_spd: "20kA (8/20μs)",
            ac_spd: "40kA (8/20μs)",
            load_busbar: "600A",
            battery_busbar: "400A",
            dimensions_mm: [220, 482, 360],
            weight_kg: 30
          },
          zones: ["continental", "desert", "tropical"],
          cost: null,
          retail: null,
          notes: "Large-scale power cabinet. For multi-station or high-power deployments."
        }
      ]
    }
  },

  configurations: [
    {
      id: "CFG-EUROPA-TELECOM",
      name: "EUROPA Telecom Standard",
      product_line: "iONE EUROPA",
      zone: "continental",
      solar: { panel_id: "PNL-RISEN-720", qty: 6, kwp: 4.32 },
      battery_options: ["CORE-32", "CORE-40", "CORE-48"],
      mppt: { module_id: "MPPT-YSSC4875BG1", qty: 2 },
      inverter: null,
      power_output: "DC Native 48V",
      protection: "Level 1 — Active Feathering",
      structure: "MECH-STRUCTURE-CONTINENTAL",
      typical_load_w: 500
    },
    {
      id: "CFG-EUROPA-DEFENCE",
      name: "EUROPA Defence PVF180",
      product_line: "iONE EUROPA",
      zone: "continental",
      solar: { panel_id: "PNL-HECKERT-720", qty: 4, kwp: 2.88 },
      battery_options: ["CORE-48"],
      mppt: { module_id: "MPPT-VERTIV-S48-3000E3", qty: 2 },
      inverter: null,
      power_output: "DC Native 48V",
      protection: "Level 3 — PVF180 Book Fold 180°",
      structure: "MECH-STRUCTURE-PVF180",
      extras: ["VAWT-500W"],
      typical_load_w: 300,
      notes: "EU components only. NATO compliant."
    },
    {
      id: "CFG-EUROPA-AGRO",
      name: "EUROPA Agro & Pumps",
      product_line: "iONE EUROPA",
      zone: "continental",
      solar: { panel_id: "PNL-RISEN-720", qty: 6, kwp: 4.32 },
      battery_options: ["CORE-32"],
      mppt: { module_id: "MPPT-YSSC4875BG1", qty: 2 },
      inverter: "INV-LF-10KW",
      power_output: "AC Heavy 10kW",
      protection: "Level 1 — Active Feathering",
      structure: "MECH-STRUCTURE-CONTINENTAL",
      extras: ["SCAP-MAXWELL-165F", "VAWT-500W"],
      typical_load_w: 3000,
      notes: "Supercap mandatory for pump startup surge. LF inverter for motors."
    },
    {
      id: "CFG-SAHARA-TELECOM",
      name: "DESERT SHIELD Telecom",
      product_line: "iONE DESERT SHIELD",
      zone: "desert",
      solar: { panel_id: "PNL-RISEN-720", qty: 4, kwp: 2.88 },
      battery_options: ["CORE-16", "CORE-21"],
      mppt: { module_id: "MPPT-YSSC4875BG1", qty: 2 },
      inverter: null,
      power_output: "DC Native 48V",
      protection: "Level 3 — PVF180 Book Fold 180°",
      structure: "MECH-STRUCTURE-PVF180",
      extras: ["COOL-HUAYI-HVY75AA", "PCM-RT28HC", "AWG-MODULE", "ROLLBOND-CONDENSER", "ALD-COATING"],
      typical_load_w: 300
    },
    {
      id: "CFG-ARCTIC-MONITORING",
      name: "ARCTIC SHIELD Monitoring",
      product_line: "iONE ARCTIC SHIELD",
      zone: "arctic",
      solar: { panel_id: "PNL-RISEN-720", qty: 4, kwp: 2.88 },
      battery_options: ["CORE-16", "CORE-32"],
      mppt: { module_id: "MPPT-YSSC4875BG1", qty: 2 },
      inverter: null,
      power_output: "DC Native 48V",
      protection: "Level 3 — PVF180 Book Fold 180°",
      structure: "MECH-STRUCTURE-PVF180",
      extras: ["VAWT-500W", "PTC-HEATING-100W", "PCM-RT10HC", "SCAP-MAXWELL-165F", "CONN-IRIDIUM"],
      typical_load_w: 150,
      notes: "VAWT mandatory for polar night. Satellite mandatory (no 4G)."
    }
  ],

  pricing_rules: {
    volume_discounts: [
      { qty: 1, discount: 0 },
      { qty: 2, discount: 0.08, label: "2nd station -8%" },
      { qty: 5, discount: 0.12, label: "5+ stations -12%" },
      { qty: 10, discount: 0.15, label: "10+ stations -15%" },
      { qty: 50, discount: 0.20, label: "Fleet -20%" }
    ],
    origin_markup: {
      eu: 1.0,
      world: 1.0,
      _note: "EU components may have higher base cost but no additional markup. Margin is baked into retail price."
    },
    financing: {
      leasing_months: [24, 36, 48, 60],
      interest_rate_annual: null,
      _note: "Set by financing partner. Placeholder."
    },
    subsidy_programs: [
      { id: "BAFA-DE", country: "Germany", program: "BAFA Renewable Energy", coverage: "up to 30%" },
      { id: "EU-GREEN", country: "EU", program: "EU Green Deal / EIC", coverage: "varies" },
      { id: "ADNOC-UAE", country: "UAE", program: "ADNOC Digitization Program", coverage: "project-based" }
    ]
  }
};

// Helper functions
export function getComponentById(id: string): Component | undefined {
  for (const category of Object.values(COMPONENT_CATALOG.categories)) {
    const item = category.items.find(i => i.id === id);
    if (item) return item as Component;
  }
  return undefined;
}

export function getComponentsForZone(zone: string, origin?: 'eu' | 'world'): Component[] {
  const components: Component[] = [];
  for (const category of Object.values(COMPONENT_CATALOG.categories)) {
    for (const item of category.items) {
      if (item.zones.includes(zone)) {
        if (!origin || item.origin === origin) {
          components.push(item as Component);
        }
      }
    }
  }
  return components;
}

export function getConfigurationsForZone(zone: string): Configuration[] {
  return COMPONENT_CATALOG.configurations.filter(c => c.zone === zone) as Configuration[];
}

export function getBatteryModules(voltage: '48V' | '24V' = '48V'): Component[] {
  const config = voltage === '48V' ? '16S1P' : '8S1P';
  return COMPONENT_CATALOG.categories.batteries.items.filter(
    b => (b.spec.config as string).startsWith(config.split('1P')[0])
  ) as Component[];
}

export function getInvertersForPower(powerKw: number): Component[] {
  return COMPONENT_CATALOG.categories.inverters.items.filter(
    inv => (inv.spec.power_w as number) >= powerKw * 1000
  ) as Component[];
}

export function calculateVolumeDiscount(qty: number): VolumeDiscount {
  const discounts = COMPONENT_CATALOG.pricing_rules.volume_discounts;
  let applicable = discounts[0];
  for (const d of discounts) {
    if (qty >= d.qty) {
      applicable = d;
    }
  }
  return applicable as VolumeDiscount;
}

// Zone-specific extras
export function getZoneExtras(zone: string): string[] {
  switch (zone) {
    case 'arctic':
      return ['VAWT-500W', 'PTC-HEATING-100W', 'PCM-RT10HC', 'SCAP-MAXWELL-165F', 'CONN-IRIDIUM'];
    case 'desert':
      return ['COOL-HUAYI-HVY75AA', 'PCM-RT28HC', 'AWG-MODULE', 'ROLLBOND-CONDENSER', 'ALD-COATING'];
    case 'continental':
      return ['VAWT-500W', 'SCAP-MAXWELL-165F'];
    default:
      return [];
  }
}

// Calculate recommended battery capacity
export function calculateBatteryCapacity(
  dailyConsumptionKwh: number,
  autonomyDays: number = 3,
  dod: number = 0.8
): { capacityKwh: number; modules: Component[]; qty: number } {
  const requiredKwh = (dailyConsumptionKwh * autonomyDays) / dod;

  // Get 48V battery modules sorted by capacity
  const modules = getBatteryModules('48V').sort(
    (a, b) => (b.spec.energy_kwh as number) - (a.spec.energy_kwh as number)
  );

  // Find best fit
  for (const mod of modules) {
    const modKwh = mod.spec.energy_kwh as number;
    const qty = Math.ceil(requiredKwh / modKwh);
    if (qty <= 4) { // Max 4 modules
      return { capacityKwh: modKwh * qty, modules: [mod], qty };
    }
  }

  // Default to largest module
  const largest = modules[0];
  return {
    capacityKwh: (largest.spec.energy_kwh as number) * 4,
    modules: [largest],
    qty: 4
  };
}
