# Background Video Setup Instructions

## Quick Start

Your video is **2.9MB** - perfect size! No compression needed.

### Step 1: Add Your Video

1. **Place your video file** in the project:
   ```
   /Users/olayinkalawal/.gemini/antigravity/scratch/athlete-dashboard/public/videos/hero-bg.mp4
   ```

2. The `public/videos/` folder has been created - just drop your MP4 file there.

### Step 2: (Optional) Create WebM Version

For better compression and modern browser support:

**Using FFmpeg:**
```bash
cd public/videos
ffmpeg -i hero-bg.mp4 -c:v libvpx-vp9 -b:v 1500k -an hero-bg.webm
```

**Or use online converter:**
- Go to https://cloudconvert.com/mp4-to-webm
- Upload `hero-bg.mp4`
- Download `hero-bg.webm`
- Put it in `public/videos/`

### Step 3: (Optional) Create Poster Image

A poster image shows while the video loads:

```bash
# Extract first frame as JPG
ffmpeg -i hero-bg.mp4 -ss 00:00:00 -vframes 1 hero-poster.jpg
```

Or take a screenshot of the video and save as `hero-poster.jpg`

## What I've Implemented

✅ **Video background** with auto-play, loop, muted
✅ **Dark overlay** (60% black) for text readability
✅ **Gradient overlay** for better contrast
✅ **Mobile optimized** with `playsInline`
✅ **Fallback support** (WebM → MP4)
✅ **Poster image** support (optional thumbnail)

## File Structure

```
public/
└── videos/
    ├── hero-bg.mp4      ← Your video (required)
    ├── hero-bg.webm     ← WebM version (optional, recommended)
    └── hero-poster.jpg  ← Thumbnail (optional)
```

## What Happens Next

1. **Drop your video** in `public/videos/hero-bg.mp4`
2. **Refresh the page** - video will play automatically
3. **Test on mobile** - should work smoothly

## Performance Tips

Your 2.9MB is already great, but if needed:

- **Reduce quality:** Re-export at 720p instead of 1080p
- **Shorter duration:** 10-15 seconds loop is ideal
- **Remove audio:** Use `-an` flag in FFmpeg (saves ~50%)

Ready to go! Just add your video file and it'll work immediately. 🎬
