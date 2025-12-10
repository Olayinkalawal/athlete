import { PoseLandmark, PoseResults } from '@/hooks/pose-detection/usePoseDetection';
import { getJointAngles, JointAngles } from '@/utils/pose/poseUtils';
import { ExtractedFrame } from './frameExtractor';

export interface PoseDataPoint {
  timestamp: number;
  frameNumber: number;
  landmarks: PoseLandmark[];
  angles: JointAngles;
  confidence: number; // Average visibility of landmarks
}

// Dynamically load MediaPipe
const loadMediaPipe = async () => {
  const { Pose } = await import('@mediapipe/pose');
  return { Pose };
};

/**
 * Process multiple video frames to extract pose data
 */
export async function processPoseData(
  frames: ExtractedFrame[],
  onProgress?: (current: number, total: number) => void
): Promise<PoseDataPoint[]> {
  console.log(`Starting pose detection for ${frames.length} frames...`);
  
  const poseDataPoints: PoseDataPoint[] = [];

  try {
    // Load MediaPipe
    const { Pose } = await loadMediaPipe();
    
    // Initialize Pose detector
    const pose = new Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: false, // Don't smooth for batch processing
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    // Process each frame
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      try {
        const results = await new Promise<any>((resolve) => {
          pose.onResults((result) => {
            resolve(result);
          });
          
          pose.send({ image: frame.canvas });
        });

        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
          const landmarks = results.poseLandmarks as PoseLandmark[];
          
          // Calculate confidence (average visibility)
          const confidence = landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;
          
          // Calculate joint angles
          const angles = getJointAngles(landmarks);
          
          if (angles) {
            poseDataPoints.push({
              timestamp: frame.timestamp,
              frameNumber: frame.frameNumber,
              landmarks,
              angles,
              confidence
            });
            
            console.log(`Frame ${i + 1}/${frames.length}: Pose detected (confidence: ${(confidence * 100).toFixed(1)}%)`);
          }
        } else {
          console.log(`Frame ${i + 1}/${frames.length}: No pose detected`);
        }
      } catch (error) {
        console.error(`Error processing frame ${i}:`, error);
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, frames.length);
      }
    }

    // Cleanup
    pose.close();
    
    console.log(`Pose detection complete. Found ${poseDataPoints.length}/${frames.length} valid poses`);
    return poseDataPoints;
    
  } catch (error) {
    console.error('Pose processing failed:', error);
    throw error;
  }
}

/**
 * Calculate overall quality score from pose data
 */
export function calculatePoseQualityScore(poseData: PoseDataPoint[]): number {
  if (poseData.length === 0) return 0;
  
  // Average confidence across all frames
  const avgConfidence = poseData.reduce((sum, point) => sum + point.confidence, 0) / poseData.length;
  
  // Convert to 0-100 scale
  return Math.round(avgConfidence * 100);
}

/**
 * Get summary statistics from pose data
 */
export function getPoseStatistics(poseData: PoseDataPoint[]): {
  avgKneeAngle: number;
  avgHipAngle: number;
  avgElbowAngle: number;
  confidence: number;
} {
  if (poseData.length === 0) {
    return {
      avgKneeAngle: 0,
      avgHipAngle: 0,
      avgElbowAngle: 0,
      confidence: 0
    };
  }

  const avgLeftKnee = poseData.reduce((sum, p) => sum + p.angles.leftKnee, 0) / poseData.length;
  const avgRightKnee = poseData.reduce((sum, p) => sum + p.angles.rightKnee, 0) / poseData.length;
  const avgLeftHip = poseData.reduce((sum, p) => sum + p.angles.leftHip, 0) / poseData.length;
  const avgRightHip = poseData.reduce((sum, p) => sum + p.angles.rightHip, 0) / poseData.length;
  const avgLeftElbow = poseData.reduce((sum, p) => sum + p.angles.leftElbow, 0) / poseData.length;
  const avgRightElbow = poseData.reduce((sum, p) => sum + p.angles.rightElbow, 0) / poseData.length;
  const avgConfidence = poseData.reduce((sum, p) => sum + p.confidence, 0) / poseData.length;

  return {
    avgKneeAngle: (avgLeftKnee + avgRightKnee) / 2,
    avgHipAngle: (avgLeftHip + avgRightHip) / 2,
    avgElbowAngle: (avgLeftElbow + avgRightElbow) / 2,
    confidence: avgConfidence
  };
}

/**
 * Format pose data for AI analysis prompt using sport-specific terminology
 */
export function formatPoseDataForAI(poseData: PoseDataPoint[], discipline: string = 'football'): string {
  if (poseData.length === 0) {
    return "No pose data available.";
  }

  const stats = getPoseStatistics(poseData);
  
  // Football-specific terminology
  const getFootballTerms = (angles: {avgKneeAngle: number, avgHipAngle: number, avgElbowAngle: number}) => {
    const terms: string[] = [];
    
    // Analyze knee bend (plant leg)
    if (angles.avgKneeAngle < 100) {
      terms.push("Plant leg too bent - limits power transfer");
    } else if (angles.avgKneeAngle > 150) {
      terms.push("Plant leg locked straight - good stability");
    } else {
      terms.push("Plant leg has optimal bend");
    }
    
    // Analyze hip rotation (shooting power)
    if (angles.avgHipAngle < 50) {
      terms.push("Minimal hip rotation - 'pushing' the ball instead of 'striking'");
    } else if (angles.avgHipAngle >= 60 && angles.avgHipAngle <= 90) {
      terms.push("Strong hip rotation - generating good power");
    } else {
      terms.push("Moderate hip rotation");
    }
    
    // Analyze arm position (balance)
    if (angles.avgElbowAngle > 140) {
      terms.push("Arms too straight - check your balance");
    } else if (angles.avgElbowAngle >= 80 && angles.avgElbowAngle <= 110) {
      terms.push("Good arm positioning for balance");
    }
    
    return terms;
  };
  
  const technicalInsights = getFootballTerms(stats);
  
  let summary = `TECHNIQUE ANALYSIS (${poseData.length} frames analyzed):\n\n`;
  summary += `KEY OBSERVATIONS:\n`;
  technicalInsights.forEach(insight => {
    summary += `• ${insight}\n`;
  });
  
  summary += `\nFRAME-BY-FRAME BREAKDOWN:\n`;
  poseData.forEach((point) => {
    const timestamp = point.timestamp.toFixed(1);
    const knee = Math.round((point.angles.leftKnee + point.angles.rightKnee) / 2);
    const hip = Math.round((point.angles.leftHip + point.angles.rightHip) / 2);
    
    // Translate to football terms
    let frameNote = "";
    if (knee < 100) {
      frameNote = "plant leg bent too much";
    } else if (hip < 50) {
      frameNote = "not enough hip drive";
    } else if (hip > 80) {
      frameNote = "excellent follow-through";
    }
    
    summary += `${timestamp}s: ${frameNote || "technique check"}\n`;
  });
  
  summary += `\nUSE THIS DATA: Reference specific timestamps and techniques in your feedback. Speak like a coach using football terminology, not medical/technical terms.`;
  
  return summary;
}
