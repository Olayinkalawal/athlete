/**
 * Extract frames from a video file at specified intervals
 * Returns canvas elements containing the frame images
 */

export interface FrameExtractionOptions {
  intervalMs?: number;      // Extract frame every N milliseconds (default: 500ms)
  maxFrames?: number;        // Maximum number of frames to extract (default: 30)
  width?: number;            // Resize width (default: 640)
  height?: number;           // Resize height (default: 480)
}

export interface ExtractedFrame {
  canvas: HTMLCanvasElement;
  timestamp: number;         // In seconds
  frameNumber: number;
}

export async function extractFramesFromVideo(
  videoFile: File,
  options: FrameExtractionOptions = {}
): Promise<ExtractedFrame[]> {
  const {
    intervalMs = 500,
    maxFrames = 30,
    width = 640,
    height = 480
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const frames: ExtractedFrame[] = [];
    let currentFrameNumber = 0;

    // Create object URL from file
    const videoURL = URL.createObjectURL(videoFile);
    video.src = videoURL;
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const intervalSec = intervalMs / 1000;
      const totalFrames = Math.min(
        Math.floor(duration / intervalSec),
        maxFrames
      );

      console.log(`Video duration: ${duration}s, extracting ${totalFrames} frames`);

      let currentTime = 0;

      const extractFrame = () => {
        if (currentFrameNumber >= totalFrames || currentTime > duration) {
          // Cleanup
          URL.revokeObjectURL(videoURL);
          video.remove();
          console.log(`Extracted ${frames.length} frames`);
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        try {
          // Create canvas and draw current frame
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Draw video frame to canvas
          ctx.drawImage(video, 0, 0, width, height);

          frames.push({
            canvas,
            timestamp: video.currentTime,
            frameNumber: currentFrameNumber
          });

          console.log(`Extracted frame ${currentFrameNumber + 1}/${totalFrames} at ${video.currentTime.toFixed(2)}s`);

          currentFrameNumber++;
          currentTime += intervalSec;
          
          // Extract next frame
          extractFrame();
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = (error) => {
        URL.revokeObjectURL(videoURL);
        reject(new Error('Video loading failed'));
      };

      // Start extraction
      extractFrame();
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error('Failed to load video file'));
    };

    // Start loading video
    video.load();
  });
}

/**
 * Preview a single frame from a video file (for thumbnails)
 */
export async function getVideoThumbnail(
  videoFile: File,
  timeSeconds: number = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoURL = URL.createObjectURL(videoFile);
    
    video.src = videoURL;
    video.currentTime = timeSeconds;
    video.muted = true;

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(video, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      URL.revokeObjectURL(videoURL);
      video.remove();
      resolve(dataURL);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error('Failed to load video'));
    };

    video.load();
  });
}

/**
 * Get video metadata without extracting frames
 */
export async function getVideoMetadata(videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoURL = URL.createObjectURL(videoFile);
    
    video.src = videoURL;
    video.muted = true;

    video.onloadedmetadata = () => {
      const metadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: videoFile.size
      };
      
      URL.revokeObjectURL(videoURL);
      video.remove();
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(videoURL);
      reject(new Error('Failed to load video'));
    };

    video.load();
  });
}
