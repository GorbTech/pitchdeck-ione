#!/bin/bash

API_KEY="sk_1ee9b86fc00bb4d96558aeb13d6da705c595dead20aa6616"
VOICE_ID="onwK4e9ZLuTAKqWW03F9"
OUTPUT_DIR="/home/ubuntu/pitchdeck-ione/public/audio"

mkdir -p "$OUTPUT_DIR"

generate_audio() {
    local num=$1
    local text=$2
    local filename="products-$(printf '%02d' $num).mp3"

    echo "Generating $filename..."

    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
        -H "Content-Type: application/json" \
        -H "xi-api-key: $API_KEY" \
        -d "{
            \"text\": \"$text\",
            \"model_id\": \"eleven_multilingual_v2\",
            \"voice_settings\": {
                \"stability\": 0.6,
                \"similarity_boost\": 0.8,
                \"style\": 0.3
            }
        }" \
        --output "$OUTPUT_DIR/$filename"

    echo "Done: $filename"
    sleep 1
}

# SLIDE 1
generate_audio 1 "Proprietary aluminium extrusion profile. Three interlocking sections — two arch masts, a hundred fifteen millimeters in diameter, and a rectangular centre section, three sixty-five by two thirty millimeters. The profiles connect through precision machined grooves, creating a single rigid structure. The internal volume is open and adapts to each model — battery placement, inverter position, controller mounting all change depending on configuration. The extrusion die is owned by GT GmbH."

# SLIDE 2
generate_audio 2 "Six-zero-six-three T6 aluminium. Five-millimeter wall thickness throughout. Fifteen-micron hard anodized surface, salt spray tested beyond a thousand hours. Three meters tall, a hundred seventy-five kilograms assembled. Twenty-five year design life. All external connections use aviation-grade connectors — Anderson SB175 for DC power, MC4 with locking ring for solar input, M12 circular connectors rated IP67 for data, N-type weatherproof for antenna. Every connection is sealed, vibration-resistant, and field-replaceable."

# SLIDE 3
generate_audio 3 "Single battery module. Sixteen point one kilowatt-hours usable at ninety percent depth of discharge. Lithium iron phosphate chemistry — CATL-grade prismatic cells, two hundred eighty amp-hours each, sixteen cells in series, fifty-one point two volts nominal. Over ten thousand charge cycles to eighty percent remaining capacity. Fifteen-year calendar life at twenty-five degrees average. The BMS handles cell balancing, overvoltage, undervoltage, overcurrent, and temperature protection. PTC heating activates automatically below zero for safe charging. The module weighs seventy kilograms."

# SLIDE 4
generate_audio 4 "Same battery, sixteen kilowatt-hours, paired with a six-kilowatt pure sine inverter. Two-thirty volts AC output, fifty or sixty hertz, zero-millisecond transfer time — true UPS behaviour. The forty-eight volt DC bus is the telecom industry standard, powering cellular base stations directly. Every module in the power chain is hot-swappable with N-plus-one redundancy. The MPPT solar charger delivers four kilowatts per unit at ninety-six percent conversion efficiency."

# SLIDE 5
generate_audio 5 "Dual battery configuration. Thirty-two point two kilowatt-hours, twenty-nine usable. Ten-kilowatt inverter with nine-kilowatt surge capacity for ten seconds. At three hundred watts continuous load — a standard cellular repeater — the station runs for over four days on stored energy alone. Two MPPT modules provide eight kilowatts of solar charging capacity at ninety-six percent efficiency. The forty-eight volt bus supports direct DC output for telecom equipment and AC output simultaneously through the modular inverter rack."

# SLIDE 6
generate_audio 6 "Hermetic access hatch in sealed position. One meter in height, fully flush with the body exterior. The seal is a continuous EPDM rubber gasket running the full perimeter of the opening. Enclosure rating IP65 — dust-tight and protected against water jets from all directions. The hatch surface is part of the same anodized aluminium body, so when closed the station reads as a single monolithic form. This matters in defence applications where visual signature and surface uniformity affect detection probability."

# SLIDE 7
generate_audio 7 "Two linear actuators, one kilonewton-meter each, open and close the hatch. The actuators are controlled remotely through the iONEOS platform — the operator sends a command, the hatch opens, the technician services the unit. Inside: battery modules, inverter rack, BMS, system controller, DC distribution, all accessible from ground level. A single technician can swap any module in under ten minutes using standard hand tools. The actuators are rated IP67 and hold position when powered off through a self-locking mechanism."

# SLIDE 8
generate_audio 8 "Continental climate edition, rated from minus twenty to plus forty-five degrees. Thermal management here is fully passive. Copper foam inserts sit between the battery modules and the aluminium body wall. The foam conducts heat from the cells into the extrusion profile, which acts as a full-length heat sink. The body surface area is over three square meters — enough to dissipate battery heat through natural convection alone. The aluminium profile was designed with this function in mind from the beginning, it is simultaneously the structure and the thermal path."

# SLIDE 9
generate_audio 9 "Extreme environment editions — Arctic Shield and Desert Shield. Aerospace-grade aerogel insulation, twenty to forty millimeters thick, wraps the battery compartment. Thermal conductivity below zero-point-zero-two watts per meter-kelvin — ten times more effective than standard foam. Phase change materials are integrated in custom extruded aluminium profiles with internal refrigerant channels. The Desert edition uses paraffin RT28HC, thirty-six and a half kilograms, storing two and a half kilowatt-hours of thermal energy at twenty-eight degrees. This thermal battery absorbs heat during peak solar hours and regenerates at night through a forty-eight volt DC compressor running at COP two-point-seven to three. The Arctic edition uses PTC heating film at a hundred watts, direct battery contact, and PCM rated for ten degrees phase change. Operating envelope: minus sixty to plus seventy-five degrees."

# SLIDE 10
generate_audio 10 "Dual-axis solar tracker. Industrial worm-gear slewing drives on both axes. Azimuth range three-sixty continuous, elevation from minus ten to plus ninety degrees. Tracking precision plus-minus zero-point-one degrees using a four-quadrant photodiode array with astronomical algorithm fallback. The tracker follows the sun throughout the day, increasing energy harvest by twenty-five to thirty-five percent compared to a fixed mount. Wind load rating in tracking mode — a hundred fifty kilometers per hour. The system continuously adjusts panel angle of attack to minimise wind resistance based on real-time ultrasonic wind sensor data."

# SLIDE 11
generate_audio 11 "Panels fully deployed. Four seven-twenty watt bifacial TOPCon panels, total array power two-point-eight-eight kilowatt-peak front side, up to three-point-seven effective with bifacial gain. Glass-glass construction, ALD aluminium oxide aerospace coating rated nine-H hardness. The tracker is in active sun-following mode, both axes moving."

# SLIDE 12
generate_audio 12 "Ninety-degree vertical drop. Wind exceeds twelve meters per second sustained. The panels rotate to vertical position, presenting minimum cross-section to the wind. This is the standard storm response for industrial six-panel arrays. Wind rating in this position — a hundred eighty kilometers per hour. The worm gear is self-locking and holds position with the actuators powered off."

# SLIDE 13
generate_audio 13 "Storm protocol initiated. Wind sensor reads above eighty kilometers per hour sustained, or the weather API sends a forecast alert. The system enters protective sequence automatically. Four actuators engage simultaneously — six thousand five hundred newton-meters of torque each, with a three-times safety margin. Full fold cycle completes in under sixty seconds."

# SLIDE 14
generate_audio 14 "One-eighty stealth fold. Panels locked face-to-face in pairs, glass surfaces protected from abrasive particle flow — sand, ice, volcanic ash. Wind rating above two hundred kilometers per hour. The worm gear holds the folded position with zero backlash and zero power consumption. This is unique in the industry — there is currently nothing on the commercial market that offers full panel concealment for large-format arrays. In defence applications, the folded station presents minimal visual and infrared signature. Arctic, desert, forward operating base."

# SLIDE 15
generate_audio 15 "Mounting frame. Eight modular sections, a hundred twenty kilograms total. Assembles in ten minutes with twelve bolts. Each section is sized for a standard pickup truck. The body locks onto the frame from above — all connection points accessible from ground level. One pallet ships the entire station: body, base, and piles."

# SLIDE 16
generate_audio 16 "Stainless steel three-oh-four. The frame distributes load across six anchor points. Three square meters of footprint. Corrosion-resistant in salt air, desert thermal cycling, and Arctic frost. The frame is designed to outlast the station."

# SLIDE 17
generate_audio 17 "Helical screw pile. A compact electric pile driver screws each pile directly into the ground — one person, one machine. Two long piles at one-point-five meters carry the vertical load. Four short piles at one meter handle lateral forces. Total installation time for all six piles — under two hours."

# SLIDE 18
generate_audio 18 "Body mounted on the base frame. Two primary piles already anchored. The station is structurally stable and ready for power-on testing at this stage. Electrical connection is a single plug."

# SLIDE 19
generate_audio 19 "Four stabilization piles screwed in. Full lateral bracing active — wind, seismic load, ground heave, all accounted for. The foundation exceeds requirements for two-hundred-kilometer-per-hour wind zones."

# SLIDE 20
generate_audio 20 "All six piles anchored. Three square meters of footprint. Two people, under twenty-four hours. Arrives on one pallet, produces power the same day. And when the mission ends — unscrew, unbolt, load up. The site goes back to how it was."

echo "All audio files generated!"
