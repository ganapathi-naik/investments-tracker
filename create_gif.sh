#!/bin/bash

# Investment Tracker - Video to GIF Conversion Script
# This script pulls the recorded video from Android device and converts it to an optimized GIF

set -e  # Exit on error

echo "📱 Investment Tracker - Creating Demo GIF"
echo "=========================================="

# Step 1: Pull video from device
echo ""
echo "Step 1: Pulling video from Android device..."
adb pull /sdcard/app_demo.mp4 screenshots/app_demo.mp4
echo "✓ Video pulled successfully"

# Step 2: Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo "❌ FFmpeg is not installed!"
    echo "Please install FFmpeg first:"
    echo "  brew install ffmpeg"
    echo ""
    echo "Alternatively, use an online converter:"
    echo "  1. Visit: https://ezgif.com/video-to-gif"
    echo "  2. Upload: screenshots/app_demo.mp4"
    echo "  3. Set size: 360px or 480px width"
    echo "  4. Set frame rate: 10 FPS"
    echo "  5. Download and save as: screenshots/app_demo.gif"
    exit 1
fi

# Step 3: Convert to GIF
echo ""
echo "Step 2: Converting video to GIF..."
echo "  - Frame rate: 10 FPS"
echo "  - Width: 360px (height: auto)"
echo "  - Quality: High (lanczos scaling)"
echo "  - Loop: Infinite"
echo ""

cd screenshots
ffmpeg -i app_demo.mp4 \
    -vf "fps=10,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
    -loop 0 \
    app_demo_unoptimized.gif \
    -y

echo "✓ GIF created"

# Step 4: Check if gifsicle is installed for optimization
if ! command -v gifsicle &> /dev/null; then
    echo ""
    echo "⚠️  Gifsicle not found. Skipping optimization."
    echo "To optimize GIF, install gifsicle:"
    echo "  brew install gifsicle"
    echo ""
    mv app_demo_unoptimized.gif app_demo.gif
else
    # Step 4: Optimize GIF
    echo ""
    echo "Step 3: Optimizing GIF..."
    gifsicle -O3 --colors 256 app_demo_unoptimized.gif -o app_demo.gif
    rm app_demo_unoptimized.gif
    echo "✓ GIF optimized"
fi

cd ..

# Step 5: Display file info
echo ""
echo "=========================================="
echo "✅ Demo GIF created successfully!"
echo ""
echo "File information:"
ls -lh screenshots/app_demo.*
echo ""
echo "📂 Location: screenshots/app_demo.gif"
echo "📝 Referenced in: README.md"
echo ""
echo "Next steps:"
echo "  1. Preview the GIF: open screenshots/app_demo.gif"
echo "  2. If satisfied, commit to git:"
echo "     git add screenshots/app_demo.gif README.md"
echo "     git commit -m 'Add animated demo GIF showing app navigation'"
echo "     git push origin master"
echo ""
