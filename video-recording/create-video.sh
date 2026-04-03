#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
AUDIO_DIR="/home/ubuntu/pitchdeck-ione/public/audio"
FINAL_OUTPUT="$OUTPUT_DIR/symbiotic-intelligence-4k.mp4"

echo "🎬 Combining videos with audio..."

# Check if all scene videos exist
for i in 0 1 2; do
    if [ ! -f "$OUTPUT_DIR/scene$i.mp4" ]; then
        echo "❌ Missing: $OUTPUT_DIR/scene$i.mp4"
        exit 1
    fi
done

# Create concat list
cat > "$OUTPUT_DIR/concat.txt" << EOF
file 'scene0.mp4'
file 'scene1.mp4'
file 'scene2.mp4'
EOF

echo "   📼 Concatenating video scenes..."
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/concat.txt" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    "$OUTPUT_DIR/video-only.mp4"

echo "   🔊 Concatenating audio tracks..."
# Concatenate audio files
ffmpeg -y \
    -i "$AUDIO_DIR/tech_scene0.mp3" \
    -i "$AUDIO_DIR/tech_scene1.mp3" \
    -i "$AUDIO_DIR/tech_scene2.mp3" \
    -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1[aout]" \
    -map "[aout]" \
    "$OUTPUT_DIR/audio-combined.mp3"

echo "   🎞️  Combining video and audio..."
ffmpeg -y \
    -i "$OUTPUT_DIR/video-only.mp4" \
    -i "$OUTPUT_DIR/audio-combined.mp3" \
    -c:v copy \
    -c:a aac -b:a 192k \
    -shortest \
    "$FINAL_OUTPUT"

# Get file info
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT")
SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
RESOLUTION=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$FINAL_OUTPUT")

echo ""
echo "✅ Final video created:"
echo "   📁 Path: $FINAL_OUTPUT"
echo "   📐 Resolution: $RESOLUTION"
echo "   ⏱️  Duration: ${DURATION}s"
echo "   💾 Size: $SIZE"

# Cleanup intermediate files
echo ""
echo "🧹 Cleaning up intermediate files..."
rm -f "$OUTPUT_DIR/video-only.mp4" "$OUTPUT_DIR/audio-combined.mp3" "$OUTPUT_DIR/concat.txt"

echo ""
echo "🎉 Done! Video ready at: $FINAL_OUTPUT"
