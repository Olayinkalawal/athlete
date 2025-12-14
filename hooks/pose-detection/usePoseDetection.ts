import { useEffect, useRef, useState, useCallback } from 'react';

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResults {
  landmarks: PoseLandmark[];
  worldLandmarks: PoseLandmark[];
}

// Dynamically load MediaPipe
const loadMediaPipe = async () => {
  const { Pose } = await import('@mediapipe/pose');
  const { Camera } = await import('@mediapipe/camera_utils');
  return { Pose, Camera };
};

export const usePoseDetection = () => {
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [results, setResults] = useState<PoseResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  // FPS tracking
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const initializePose = async () => {
      try {
        console.log('Starting MediaPipe initialization...');

        // Set a timeout for initialization
        const timeout = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('MediaPipe initialization timed out after 15 seconds'));
          }, 15000);
        });

        const init = async () => {
          // Dynamically load MediaPipe modules
          console.log('Loading MediaPipe modules...');
          const { Pose } = await loadMediaPipe();
          console.log('MediaPipe modules loaded');

          console.log('Creating Pose instance...');
          // Initialize MediaPipe Pose
          const pose = new Pose({
            locateFile: (file: string) => {
              const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
              console.log('Loading file:', url);
              return url;
            }
          });
          console.log('Pose instance created');

          console.log('Setting options...');
          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          pose.onResults((poseResults: any) => {
            if (poseResults.poseLandmarks) {
              setResults({
                landmarks: poseResults.poseLandmarks as PoseLandmark[],
                worldLandmarks: (poseResults.poseWorldLandmarks || []) as PoseLandmark[]
              });

              // Calculate FPS
              frameCountRef.current++;
              const now = Date.now();
              const elapsed = now - lastTimeRef.current;

              if (elapsed >= 1000) {
                setFps(Math.round((frameCountRef.current * 1000) / elapsed));
                frameCountRef.current = 0;
                lastTimeRef.current = now;
              }
            }
          });

          console.log('MediaPipe Pose configured, ready to use!');
          return pose;
        };

        // Race between initialization and timeout
        const pose = await Promise.race([init(), timeout]) as any;
        poseRef.current = pose;
        setIsLoading(false); // Mark as ready after setup
        clearTimeout(timeoutId);
        console.log('Initialization complete!');

      } catch (err) {
        console.error('MediaPipe initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize pose detection');
        setIsLoading(false);
        clearTimeout(timeoutId);
      }
    };

    initializePose();

    return () => {
      clearTimeout(timeoutId);
      if (poseRef.current) {
        poseRef.current.close();
      }
    };
  }, []);

  const startCamera = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!poseRef.current) {
      setError('Pose detection not initialized');
      return;
    }

    try {
      const { Camera } = await loadMediaPipe();

      const camera = new Camera(videoElement, {
        onFrame: async () => {
          if (poseRef.current) {
            await poseRef.current.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720
      });

      await camera.start();
      cameraRef.current = camera;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start camera');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
  }, []);

  // Process a single frame from a video element
  const processVideoFrame = useCallback(async (videoElement: HTMLVideoElement) => {
    if (!poseRef.current) {
      return;
    }

    try {
      await poseRef.current.send({ image: videoElement });
    } catch (err) {
      console.error('Error processing video frame:', err);
    }
  }, []);

  return {
    results,
    isLoading,
    error,
    fps,
    startCamera,
    stopCamera,
    processVideoFrame
  };
};
