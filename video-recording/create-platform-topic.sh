#!/bin/bash
# Create Platform Overview topic video

OUTPUT_DIR="/home/ubuntu/pitchdeck-ione/video-recording/output"
AUDIO_DIR="$OUTPUT_DIR/platform-audio"
IMAGES_DIR="/home/ubuntu/content-factory/urban-corners/assets/images"
PRODUCTS_DIR="/home/ubuntu/pitchdeck-ione/public/products"
ESS_IMAGE="/home/ubuntu/gt-energy-platform/admin/uploads/root/С1_1763736725647.png"
ROBOT_IMAGE="/home/ubuntu/pitchdeck-ione/public/RoboPitch.png"

# ElevenLabs settings
API_KEY="sk_1ee9b86fc00bb4d96558aeb13d6da705c595dead20aa6616"
VOICE_ID="onwK4e9ZLuTAKqWW03F9"

mkdir -p "$AUDIO_DIR"
mkdir -p "$OUTPUT_DIR"

echo "🎬 Creating PLATFORM OVERVIEW topic..."

# Function to generate audio via ElevenLabs
generate_audio() {
    local text="$1"
    local output_file="$2"

    echo "   🔊 Generating: $output_file"
    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
        -H "Content-Type: application/json" \
        -H "xi-api-key: $API_KEY" \
        -d "{
            \"text\": \"$text\",
            \"model_id\": \"eleven_multilingual_v2\",
            \"voice_settings\": {
                \"stability\": 0.5,
                \"similarity_boost\": 0.75
            }
        }" \
        --output "$output_file"

    # Check if file is valid
    if [ -f "$output_file" ] && [ $(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file") -gt 1000 ]; then
        local duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$output_file" 2>/dev/null)
        echo "      ✅ Duration: ${duration}s"
    else
        echo "      ❌ Failed to generate audio"
        return 1
    fi
}

# Scene texts
TEXT1="iONE: Universal Green Energy Platform Driven by Predictive AI"
TEXT2="A vertically integrated ecosystem uniting standardized hardware"
TEXT3="and Home Storage Station"
TEXT4="with predictive analytics to guarantee Uptime via the Energy-as-a-Service model"

echo ""
echo "📢 Generating audio files..."

# Generate audio for each scene
generate_audio "$TEXT1" "$AUDIO_DIR/scene1.mp3"
generate_audio "$TEXT2" "$AUDIO_DIR/scene2.mp3"
generate_audio "$TEXT3" "$AUDIO_DIR/scene3.mp3"
generate_audio "$TEXT4" "$AUDIO_DIR/scene4.mp3"

echo ""
echo "🎨 Creating video scenes..."

# Get audio durations
DUR1=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/scene1.mp3" 2>/dev/null | xargs printf "%.0f")
DUR2=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/scene2.mp3" 2>/dev/null | xargs printf "%.0f")
DUR3=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/scene3.mp3" 2>/dev/null | xargs printf "%.0f")
DUR4=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$AUDIO_DIR/scene4.mp3" 2>/dev/null | xargs printf "%.0f")

# Add 1 second buffer to each
DUR1=$((DUR1 + 1))
DUR2=$((DUR2 + 1))
DUR3=$((DUR3 + 1))
DUR4=$((DUR4 + 1))

echo "   Scene durations: ${DUR1}s, ${DUR2}s, ${DUR3}s, ${DUR4}s"

# SCENE 1: R1 on right, Robot on left, text on right side
echo "   Creating Scene 1 (R1 + Robot + text)..."
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR1" \
    -loop 1 -i "$ROBOT_IMAGE" \
    -loop 1 -i "$IMAGES_DIR/R1.png" \
    -filter_complex "
        [1:v]scale=-1:600[robot];
        [2:v]scale=-1:700[r1];
        [0:v][robot]overlay=100:(H-h)/2[tmp];
        [tmp][r1]overlay=W-w-100:(H-h)/2,
        drawtext=text='iONE\\: Universal Green Energy Platform':fontsize=36:fontcolor=0x333333:x=w-700:y=h-200,
        drawtext=text='Driven by Predictive AI':fontsize=36:fontcolor=0x333333:x=w-550:y=h-150
    " \
    -t $DUR1 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene1.mp4" 2>/dev/null

# SCENE 2: R2 + text
echo "   Creating Scene 2 (R2 + text)..."
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR2" \
    -loop 1 -i "$IMAGES_DIR/R2.png" \
    -filter_complex "
        [1:v]scale=-1:800[r2];
        [0:v][r2]overlay=(W-w)/2:(H-h)/2,
        drawtext=text='A vertically integrated ecosystem':fontsize=40:fontcolor=0x333333:x=(w-tw)/2:y=h-150,
        drawtext=text='uniting standardized hardware':fontsize=40:fontcolor=0x333333:x=(w-tw)/2:y=h-100
    " \
    -t $DUR2 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene2.mp4" 2>/dev/null

# SCENE 3: R3 (Autonomous Stations) -> D3 -> ESS (Home Storage)
# Split into 3 parts
DUR3_PART=$((DUR3 / 3))
DUR3_LAST=$((DUR3 - DUR3_PART * 2))

echo "   Creating Scene 3 (R3 -> D3 -> ESS)..."
# Part 3a: R3 "Autonomous Stations"
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR3_PART" \
    -loop 1 -i "$IMAGES_DIR/R3.png" \
    -filter_complex "
        [1:v]scale=-1:800[r3];
        [0:v][r3]overlay=(W-w)/2:(H-h)/2,
        drawtext=text='Autonomous Stations':fontsize=48:fontcolor=0x333333:x=(w-tw)/2:y=h-100
    " \
    -t $DUR3_PART -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene3a.mp4" 2>/dev/null

# Part 3b: D3
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR3_PART" \
    -loop 1 -i "$PRODUCTS_DIR/D3.png" \
    -filter_complex "
        [1:v]scale=-1:800[d3];
        [0:v][d3]overlay=(W-w)/2:(H-h)/2
    " \
    -t $DUR3_PART -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene3b.mp4" 2>/dev/null

# Part 3c: ESS "and Home Storage Station"
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR3_LAST" \
    -loop 1 -i "$ESS_IMAGE" \
    -filter_complex "
        [1:v]scale=-1:800[ess];
        [0:v][ess]overlay=(W-w)/2:(H-h)/2,
        drawtext=text='and Home Storage Station':fontsize=48:fontcolor=0x333333:x=(w-tw)/2:y=h-100
    " \
    -t $DUR3_LAST -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene3c.mp4" 2>/dev/null

# Concatenate scene 3 parts
cat > "$OUTPUT_DIR/scene3-list.txt" << EOF
file 'platform-scene3a.mp4'
file 'platform-scene3b.mp4'
file 'platform-scene3c.mp4'
EOF
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/scene3-list.txt" -c copy "$OUTPUT_DIR/platform-scene3.mp4" 2>/dev/null

# SCENE 4: R1 + EaaS text
echo "   Creating Scene 4 (R1 + EaaS text)..."
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=$DUR4" \
    -loop 1 -i "$IMAGES_DIR/R1.png" \
    -filter_complex "
        [1:v]scale=-1:700[r1];
        [0:v][r1]overlay=(W-w)/2:(H-h)/2-50,
        drawtext=text='with predictive analytics to guarantee Uptime':fontsize=36:fontcolor=0x333333:x=(w-tw)/2:y=h-150,
        drawtext=text='via the Energy-as-a-Service (EaaS) model':fontsize=36:fontcolor=0x333333:x=(w-tw)/2:y=h-100
    " \
    -t $DUR4 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$OUTPUT_DIR/platform-scene4.mp4" 2>/dev/null

echo ""
echo "🔗 Concatenating all scenes..."

# Create concat list
cat > "$OUTPUT_DIR/platform-list.txt" << EOF
file 'platform-scene1.mp4'
file 'platform-scene2.mp4'
file 'platform-scene3.mp4'
file 'platform-scene4.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/platform-list.txt" -c copy "$OUTPUT_DIR/platform-video.mp4" 2>/dev/null

echo "🔊 Combining audio tracks..."

# Concatenate audio
ffmpeg -y -i "$AUDIO_DIR/scene1.mp3" -i "$AUDIO_DIR/scene2.mp3" -i "$AUDIO_DIR/scene3.mp3" -i "$AUDIO_DIR/scene4.mp3" \
    -filter_complex "[0:a][1:a][2:a][3:a]concat=n=4:v=0:a=1[out]" -map "[out]" "$OUTPUT_DIR/platform-audio.mp3" 2>/dev/null

echo "🎬 Creating final video with audio..."

ffmpeg -y -i "$OUTPUT_DIR/platform-video.mp4" -i "$OUTPUT_DIR/platform-audio.mp3" \
    -c:v copy -c:a aac -b:a 192k -shortest "$OUTPUT_DIR/platform-overview-1080p.mp4" 2>/dev/null

# Cleanup temp files
rm -f "$OUTPUT_DIR/platform-scene"*.mp4 "$OUTPUT_DIR/platform-video.mp4" "$OUTPUT_DIR/platform-audio.mp3"
rm -f "$OUTPUT_DIR/platform-list.txt" "$OUTPUT_DIR/scene3-list.txt"

if [ -f "$OUTPUT_DIR/platform-overview-1080p.mp4" ]; then
    SIZE=$(du -h "$OUTPUT_DIR/platform-overview-1080p.mp4" | cut -f1)
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT_DIR/platform-overview-1080p.mp4" | xargs printf "%.0f")
    echo ""
    echo "✅ Final video: $OUTPUT_DIR/platform-overview-1080p.mp4"
    echo "   Size: $SIZE"
    echo "   Duration: ${DURATION}s"
else
    echo "❌ Failed to create video"
fi
