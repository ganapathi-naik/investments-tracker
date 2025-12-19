# Creating Demo GIF for Investment Tracker

## Instructions for Recording App Navigation

### Step 1: Prepare the Emulator
1. Ensure the emulator is running with Investment Tracker app installed
2. Open the Investment Tracker app
3. Navigate to the Dashboard (home screen)

### Step 2: Record Screen Video

**Option A: Using Android Studio (Recommended)**
1. Open Android Studio
2. Go to: View → Tool Windows → Running Devices
3. Click on the camera icon with a record symbol
4. Start recording
5. Navigate through the app in this order:
   - Dashboard (pause 3 seconds)
   - Tap Portfolio tab (pause 3 seconds, scroll to show investments)
   - Tap Reports tab (pause 3 seconds, scroll to show yearly returns and charts)
   - Tap Settings tab (pause 2 seconds)
   - Return to Dashboard
6. Stop recording
7. Save the video as `app_demo.mp4` in the screenshots directory

**Option B: Using ADB Command (Already Running)**
The recording has already started with a 30-second limit. Please:
1. Open Investment Tracker app NOW
2. Navigate through screens:
   - Dashboard → Portfolio → Reports → Settings → Dashboard
3. Recording will auto-stop after 30 seconds
4. Pull the video: `adb pull /sdcard/app_demo.mp4 screenshots/`

### Step 3: Convert Video to GIF

**Using FFmpeg** (Install with: `brew install ffmpeg`)

```bash
# Create screenshots directory if it doesn't exist
mkdir -p screenshots

# Pull the recorded video from device
adb pull /sdcard/app_demo.mp4 screenshots/

# Convert to optimized GIF
cd screenshots
ffmpeg -i app_demo.mp4 -vf "fps=10,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 app_demo.gif

# Alternative: Higher quality GIF
ffmpeg -i app_demo.mp4 -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 app_demo_hq.gif
```

**Parameters Explained:**
- `fps=10` - 10 frames per second (good for file size)
- `scale=360:-1` - Width 360px, height auto (maintains aspect ratio)
- `flags=lanczos` - High quality scaling
- `-loop 0` - Infinite loop

### Step 4: Optimize GIF Size

```bash
# Using gifsicle (Install with: brew install gifsicle)
gifsicle -O3 --colors 256 app_demo.gif -o app_demo_optimized.gif

# Check file size
ls -lh app_demo*.gif
```

### Step 5: Update README

The README has been prepared with a placeholder for the GIF. Once you have the GIF file, it will be automatically referenced.

## Quick Commands Summary

```bash
# 1. Pull video from device
adb pull /sdcard/app_demo.mp4 screenshots/

# 2. Convert to GIF
cd screenshots
ffmpeg -i app_demo.mp4 -vf "fps=10,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 app_demo.gif

# 3. Optimize
gifsicle -O3 --colors 256 app_demo.gif -o app_demo_optimized.gif

# 4. Move to final location
mv app_demo_optimized.gif app_demo.gif

# 5. Commit to git
cd ..
git add screenshots/app_demo.gif README.md
git commit -m "Add animated GIF demo showing app navigation"
git push origin master
```

## Alternative: Use Online Tools

If you prefer not to install FFmpeg:

1. **Pull video**: `adb pull /sdcard/app_demo.mp4 ~/Downloads/`
2. **Use online converter**: https://ezgif.com/video-to-gif
   - Upload `app_demo.mp4`
   - Set size: 360px width or 480px width
   - Set frame rate: 10 FPS
   - Click "Convert to GIF"
   - Optimize using "Optimize GIF" tool on the same site
3. **Download** and save as `screenshots/app_demo.gif`

## Tips for Best Results

1. **Recording Duration**: 20-30 seconds is ideal
2. **Screen Size**: Keep the emulator window at a reasonable size (not full screen)
3. **Navigation Speed**: Pause 2-3 seconds on each screen
4. **File Size**: Aim for < 5MB for GitHub (use optimization)
5. **Dimensions**: 360-480px width is perfect for README
6. **Frame Rate**: 10-15 FPS is good balance between smoothness and file size

## Expected File Sizes

- Video (MP4): 5-10 MB
- GIF (unoptimized): 10-20 MB
- GIF (optimized): 2-5 MB ✓ (This is what we want)
