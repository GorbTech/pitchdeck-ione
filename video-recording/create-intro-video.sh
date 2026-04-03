#!/bin/bash
# Combine intro video with audio

OUTPUT_DIR="/home/ubuntu/pitchdeck-ione/video-recording/output"
AUDIO_DIR="/home/ubuntu/pitchdeck-ione/public/audio"
FINAL_OUTPUT="$OUTPUT_DIR/intro-1080p.mp4"

echo "🎬 Creating final intro video with audio..."

# Check if video exists
if [ ! -f "$OUTPUT_DIR/intro-video.mp4" ]; then
    echo "❌ intro-video.mp4 not found!"
    exit 1
fi

# Combine video with audio
echo "   Adding audio (driven.mp3)..."
ffmpeg -y \
    -i "$OUTPUT_DIR/intro-video.mp4" \
    -i "$AUDIO_DIR/driven.mp3" \
    -c:v copy \
    -c:a aac -b:a 192k \
    -shortest \
    "$FINAL_OUTPUT" 2>/dev/null

if [ -f "$FINAL_OUTPUT" ]; then
    SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
    DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT" | xargs printf "%.0f")
    echo ""
    echo "✅ Final video: $FINAL_OUTPUT"
    echo "   Size: $SIZE"
    echo "   Duration: ${DURATION}s"
else
    echo "❌ Failed to create final video"
    exit 1
fi
