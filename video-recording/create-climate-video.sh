#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
AUDIO_DIR="/home/ubuntu/pitchdeck-ione/public/audio"
FINAL_OUTPUT="$OUTPUT_DIR/climate-impact-1080p.mp4"

echo "🎬 Combining Climate Impact slides with audio..."

# Create concat list for video
echo "   📝 Creating concat lists..."
> "$OUTPUT_DIR/video-concat.txt"
> "$OUTPUT_DIR/audio-concat.txt"

for i in 01 02 03 04 05 06; do
    if [ -f "$OUTPUT_DIR/climate-slide${i}.mp4" ]; then
        echo "file 'climate-slide${i}.mp4'" >> "$OUTPUT_DIR/video-concat.txt"
    else
        echo "❌ Missing: $OUTPUT_DIR/climate-slide${i}.mp4"
        exit 1
    fi

    # Audio files use single digit
    AUDIO_NUM="${i#0}"
    if [ -f "$AUDIO_DIR/climate-slide-${AUDIO_NUM}.mp3" ]; then
        echo "file '$AUDIO_DIR/climate-slide-${AUDIO_NUM}.mp3'" >> "$OUTPUT_DIR/audio-concat.txt"
    else
        echo "❌ Missing: $AUDIO_DIR/climate-slide-${AUDIO_NUM}.mp3"
        exit 1
    fi
done

echo "   📼 Concatenating video segments..."
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/video-concat.txt" \
    -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
    "$OUTPUT_DIR/climate-video-only.mp4" 2>/dev/null

echo "   🔊 Concatenating audio tracks..."
ffmpeg -y -f concat -safe 0 -i "$OUTPUT_DIR/audio-concat.txt" \
    -c:a libmp3lame -q:a 2 \
    "$OUTPUT_DIR/climate-audio-combined.mp3" 2>/dev/null

echo "   🎞️  Combining video and audio..."
ffmpeg -y \
    -i "$OUTPUT_DIR/climate-video-only.mp4" \
    -i "$OUTPUT_DIR/climate-audio-combined.mp3" \
    -c:v copy \
    -c:a aac -b:a 192k \
    -shortest \
    "$FINAL_OUTPUT" 2>/dev/null

# Get file info
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT")
SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
RESOLUTION=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$FINAL_OUTPUT")

echo ""
echo "✅ Final video created:"
echo "   📁 Path: $FINAL_OUTPUT"
echo "   📐 Resolution: $RESOLUTION"
echo "   ⏱️  Duration: ${DURATION}s (~$(echo "$DURATION / 60" | bc) min)"
echo "   💾 Size: $SIZE"

# Cleanup intermediate files
echo ""
echo "🧹 Cleaning up intermediate files..."
rm -f "$OUTPUT_DIR/climate-video-only.mp4" "$OUTPUT_DIR/climate-audio-combined.mp3"
rm -f "$OUTPUT_DIR/video-concat.txt" "$OUTPUT_DIR/audio-concat.txt"

echo ""
echo "🎉 Done! Video ready at: $FINAL_OUTPUT"
