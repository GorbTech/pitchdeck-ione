#!/bin/bash
# Create intro video from raw assets using ffmpeg

OUTPUT_DIR="/home/ubuntu/pitchdeck-ione/video-recording/output"
PUBLIC_DIR="/home/ubuntu/pitchdeck-ione/public"
AUDIO_DIR="$PUBLIC_DIR/audio"

# Temp files
STATIC_VIDEO="$OUTPUT_DIR/temp-static.mp4"
DRIVEN_VIDEO="$OUTPUT_DIR/temp-driven.mp4"
AUTONOMOUS_VIDEO="$OUTPUT_DIR/temp-autonomous.mp4"
CONCAT_LIST="$OUTPUT_DIR/concat-list.txt"
FINAL_OUTPUT="$OUTPUT_DIR/intro-1080p.mp4"

echo "🎬 Creating INTRO video from assets..."

# Font settings (using default sans-serif)
FONT="fontsize=96:fontcolor=white@0.7:x=80:y=(h-th)/2"
FONT_TITLE="fontsize=48:fontcolor=0x555555:x=(w-tw)/2:y=120"
FONT_CAPTION="fontsize=36:fontcolor=0x888888:x=(w-tw)/2:y=h-150"

# 1. STATIC SEGMENT (4 seconds)
# museum-reverse.mp4 with "Static" label, fade in/out, white background
echo "   Creating Static segment (4s)..."
ffmpeg -y -loop 1 -i <(convert -size 1920x1080 xc:white png:-) -i "$PUBLIC_DIR/museum-reverse.mp4" \
  -filter_complex "
    [1:v]scale=1152:864,setpts=PTS-STARTPTS,fade=t=in:st=0:d=1:alpha=1,fade=t=out:st=3:d=1:alpha=1[vid];
    [0:v]scale=1920:1080[bg];
    [bg][vid]overlay=(W-w)/2:(H-h)/2:format=auto,
    drawtext=text='Static':fontsize=96:fontcolor=0x333333@0.7:x=80:y=(h-th)/2:
      enable='between(t,0,4)':alpha='if(lt(t,1),t,if(gt(t,3),4-t,1))'
  " \
  -t 4 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$STATIC_VIDEO" 2>/dev/null

if [ ! -f "$STATIC_VIDEO" ]; then
  echo "   Trying alternative method for Static..."
  # Portrait videos (1080x1620) - scale to fit 70% height (756px) keeping aspect ratio
  # Width = 756 * (1080/1620) = 504
  ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=4" -i "$PUBLIC_DIR/museum-reverse.mp4" \
    -filter_complex "
      [1:v]scale=504:756,fade=t=in:st=0:d=1:alpha=1,fade=t=out:st=3:d=1:alpha=1[vid];
      [0:v][vid]overlay=(W-w)/2:(H-h)/2,
      drawtext=text='Static':fontsize=96:fontcolor=0x333333:x=80:y=(h-th)/2:alpha='if(lt(t,1),t,if(gt(t,3),4-t,0.7))'
    " \
    -t 4 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$STATIC_VIDEO" 2>/dev/null
fi

# 2. DRIVEN SEGMENT (6 seconds)
# driven.mp4 (portrait 1080x1620) at 2x speed with "Driven" label
echo "   Creating Driven segment (6s)..."
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=6" -i "$PUBLIC_DIR/driven.mp4" \
  -filter_complex "
    [1:v]setpts=0.5*PTS,scale=504:756,loop=loop=-1:size=1000,trim=duration=6,
      fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=5:d=1:alpha=1[vid];
    [0:v][vid]overlay=(W-w)/2:(H-h)/2,
    drawtext=text='Driven':fontsize=96:fontcolor=0x333333:x=80:y=(h-th)/2:alpha='if(lt(t,0.5),t*2,if(gt(t,5),6-t,0.7))'
  " \
  -t 6 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$DRIVEN_VIDEO" 2>/dev/null

# 3. AUTONOMOUS SEGMENT (6 seconds)
# autonomous.jpg (landscape 3698x2620) - scale to fit while keeping aspect ratio
# Max 60% width = 1152, at that width height = 1152 * (2620/3698) = 816 (fits in 70% = 756? no)
# Max 70% height = 756, at that height width = 756 * (3698/2620) = 1067 (fits in 60% = 1152? yes)
echo "   Creating Autonomous segment (6s)..."
ffmpeg -y -f lavfi -i "color=c=white:s=1920x1080:d=6" -loop 1 -i "$PUBLIC_DIR/autonomous.jpg" \
  -filter_complex "
    [1:v]scale=1067:756,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=5:d=1:alpha=1[img];
    [0:v][img]overlay=(W-w)/2:(H-h)/2,
    drawtext=text='Autonomous':fontsize=96:fontcolor=0x333333:x=80:y=(h-th)/2:alpha='if(lt(t,0.5),t*2,if(gt(t,5),6-t,0.7))',
    drawtext=text='The Age of Intent':fontsize=48:fontcolor=0x555555:x=(w-tw)/2:y=100:alpha='if(lt(t,0.5),t*2,if(gt(t,5),6-t,0.7))',
    drawtext=text='From tools that follow orders to systems that share goals.':fontsize=32:fontcolor=0x777777:x=(w-tw)/2:y=h-120:alpha='if(lt(t,1),t,if(gt(t,5),6-t,0.7))'
  " \
  -t 6 -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p "$AUTONOMOUS_VIDEO" 2>/dev/null

# 4. CONCATENATE all segments
echo "   Concatenating segments..."
cat > "$CONCAT_LIST" << EOF
file '$STATIC_VIDEO'
file '$DRIVEN_VIDEO'
file '$AUTONOMOUS_VIDEO'
EOF

ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$OUTPUT_DIR/intro-noaudio.mp4" 2>/dev/null

# 5. ADD AUDIO
echo "   Adding audio..."
ffmpeg -y -i "$OUTPUT_DIR/intro-noaudio.mp4" -i "$AUDIO_DIR/driven.mp3" \
  -c:v copy -c:a aac -b:a 192k -shortest "$FINAL_OUTPUT" 2>/dev/null

# Cleanup
rm -f "$STATIC_VIDEO" "$DRIVEN_VIDEO" "$AUTONOMOUS_VIDEO" "$CONCAT_LIST" "$OUTPUT_DIR/intro-noaudio.mp4"

if [ -f "$FINAL_OUTPUT" ]; then
  SIZE=$(du -h "$FINAL_OUTPUT" | cut -f1)
  DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$FINAL_OUTPUT" | xargs printf "%.0f")
  echo ""
  echo "✅ Final video: $FINAL_OUTPUT"
  echo "   Size: $SIZE"
  echo "   Duration: ${DURATION}s"
else
  echo "❌ Failed to create video"
fi
