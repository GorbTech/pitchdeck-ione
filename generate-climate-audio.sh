#!/bin/bash

API_KEY="sk_1ee9b86fc00bb4d96558aeb13d6da705c595dead20aa6616"
VOICE_ID="onwK4e9ZLuTAKqWW03F9"
OUTPUT_DIR="/home/ubuntu/pitchdeck-ione/public/audio"

generate() {
    local num=$1
    local text=$2
    echo "Generating climate-slide-${num}.mp3..."
    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
        -H "Content-Type: application/json" \
        -H "xi-api-key: $API_KEY" \
        -d "{
            \"text\": \"$text\",
            \"model_id\": \"eleven_multilingual_v2\",
            \"voice_settings\": {
                \"stability\": 0.5,
                \"similarity_boost\": 0.75,
                \"style\": 0.3
            }
        }" \
        --output "$OUTPUT_DIR/climate-slide-${num}.mp3"
    echo "Done: climate-slide-${num}.mp3"
    sleep 1
}

# SLIDE 1 - REPLACEMENT
generate 1 "iONE is an autonomous solar-powered station with integrated energy storage. It fully replaces a diesel generator. Two people install it in under twenty-four hours. It generates, stores, and distributes energy on its own. For twenty-five years. One station eliminates eight thousand liters of diesel per year. That is twenty-one tonnes of CO2 — measured, documented, verified through onboard telemetry."

# SLIDE 2 - LOGISTICS CHAIN
generate 2 "But the generator is only the endpoint. Behind every generator is a logistics chain. Tanker trucks. Fuel depots. Helicopters in the Arctic. Convoys in conflict zones. Each delivery burns fuel to deliver fuel. In remote regions, the cost of delivering diesel reaches a hundred thousand euros per year — and every kilometre of that route has its own carbon footprint. When iONE replaces the generator, the entire chain behind it disappears. Energy is produced exactly where it is consumed. Sunlight replaces supply lines."

# SLIDE 3 - FOUNDATION
generate 3 "Conventional energy systems require concrete foundations. Cement production alone accounts for eight percent of global CO2 — more than the aviation industry. A single container installation needs tonnes of concrete, heavy machinery, and weeks of curing. iONE stands on six helical screw piles. Two people drive them into the ground in hours. Light. Fast. And fully reversible — unscrew the piles, and the ground returns to its original state. Energy infrastructure that holds firm for twenty-five years, yet leaves the earth untouched."

# SLIDE 4 - GRID-FREE
generate 4 "Extending the power grid to a remote site takes years. Kilometres of trenches, pylons, substations — thousands of tonnes of steel and concrete, plus the emissions of every construction vehicle involved. And once built, the grid is fixed. If the mission relocates, the infrastructure stays behind — as waste. iONE delivers the same result: reliable electricity. Except it arrives on a single pallet and starts generating power the same day. When the site is done, the station moves to the next one. Reusable infrastructure instead of permanent construction."

# SLIDE 5 - CLEAN OPERATION
generate 5 "A diesel generator contaminates its surroundings throughout its entire service life. Fuel leaks into soil. Oil seeps into groundwater. Exhaust deposits heavy metals across the area. When the generator is finally removed, the site requires remediation — soil testing, excavation, hazardous waste disposal. iONE operates on solar energy and sealed lithium iron phosphate batteries. Clean chemistry inside. Clean ground outside. After twenty-five years of operation, the site is exactly as it was before installation. Full environmental integrity — for the entire lifecycle."

# SLIDE 6 - LIFETIME IMPACT
generate 6 "A diesel generator lasts three years. Then it is replaced. Over twenty-five years, a single site consumes eight generators — eight manufacturing cycles, eight shipping routes, eight disposals. iONE is built once. Aluminium body, stainless steel frame, lithium iron phosphate batteries — all fully recyclable. One station over twenty-five years: two hundred thousand liters of diesel replaced. Five hundred twenty-five tonnes of CO2 eliminated. Eight generators never manufactured, shipped, or scrapped. At fleet scale — five thousand stations by twenty-thirty — that is forty million liters of diesel and one hundred five thousand tonnes of CO2 per year. Every unit of impact measured through continuous telemetry and verified through the iONEOS platform."

echo "All done!"
for f in $OUTPUT_DIR/climate-slide-*.mp3; do
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$f")
    echo "$(basename $f): ${duration}s"
done
