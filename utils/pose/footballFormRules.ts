import { JointAngles } from '@/utils/pose/poseUtils';

export type FeedbackType = 'error' | 'warning' | 'success' | 'info';

export interface FormFeedback {
  type: FeedbackType;
  message: string;
  metric?: string;
}

/**
 * Football-specific form rules
 */
export const analyzeFootballForm = (angles: JointAngles | null): FormFeedback[] => {
  if (!angles) return [];

  const feedback: FormFeedback[] = [];

  // === SHOOTING STANCE ===
  
  // Plant foot knee bend (should be 120-150° for stability)
  if (angles.leftKnee > 0 && angles.leftKnee < 110) {
    feedback.push({
      type: 'warning',
      message: 'Plant leg too bent - straighten for more power',
      metric: `${Math.round(angles.leftKnee)}°`
    });
  } else if (angles.leftKnee > 150 && angles.leftKnee < 180) {
    feedback.push({
      type: 'success',
      message: 'Good plant leg form!',
      metric: `${Math.round(angles.leftKnee)}°`
    });
  }

  // Kicking leg hip angle (should be 60-90° for power shots)
  if (angles.rightHip > 0 && angles.rightHip < 50) {
    feedback.push({
      type: 'error',
      message: 'Not enough hip rotation - swing through!',
      metric: `${Math.round(angles.rightHip)}°`
    });
  } else if (angles.rightHip >= 60 && angles.rightHip <= 100) {
    feedback.push({
      type: 'success',
      message: 'Perfect hip rotation for power!',
      metric: `${Math.round(angles.rightHip)}°`
    });
  }

  // === DRIBBLING POSTURE ===
  
  // Both knees should be bent (100-140°) for low center of gravity
  const avgKnee = (angles.leftKnee + angles.rightKnee) / 2;
  if (avgKnee > 150) {
    feedback.push({
      type: 'warning',
      message: 'Lower your center of gravity - bend knees more',
      metric: `${Math.round(avgKnee)}°`
    });
  } else if (avgKnee >= 110 && avgKnee <= 140) {
    feedback.push({
      type: 'success',
      message: 'Good dribbling stance!',
      metric: `${Math.round(avgKnee)}°`
    });
  }

  // === SPRINT MECHANICS ===
  
  // Knee drive should be high (hip angle < 90° at peak)
  if (angles.leftHip > 0 && angles.leftHip < 80) {
    feedback.push({
      type: 'success',
      message: 'Great knee drive!',
      metric: `${Math.round(angles.leftHip)}°`
    });
  }

  // Arms should be bent ~90° while running
  const avgElbow = (angles.leftElbow + angles.rightElbow) / 2;
  if (avgElbow >= 80 && avgElbow <= 100) {
    feedback.push({
      type: 'success',
      message: 'Perfect arm swing form!',
      metric: `${Math.round(avgElbow)}°`
    });
  } else if (avgElbow > 120) {
    feedback.push({
      type: 'warning',
      message: 'Bend arms more for efficient running',
      metric: `${Math.round(avgElbow)}°`
    });
  }

  // === BALANCE CHECK ===
  
  // Check for symmetry (left vs right should be similar)
  const kneeDiff = Math.abs(angles.leftKnee - angles.rightKnee);
  if (kneeDiff > 30 && angles.leftKnee > 0 && angles.rightKnee > 0) {
    feedback.push({
      type: 'info',
      message: 'Uneven stance - check your balance',
      metric: `Δ ${Math.round(kneeDiff)}°`
    });
  }

  return feedback;
};

/**
 * Get color for feedback type
 */
export const getFeedbackColor = (type: FeedbackType): string => {
  switch (type) {
    case 'error':
      return 'bg-red-500/90';
    case 'warning':
      return 'bg-yellow-500/90';
    case 'success':
      return 'bg-emerald-500/90';
    case 'info':
      return 'bg-blue-500/90';
    default:
      return 'bg-zinc-500/90';
  }
};

/**
 * Get icon for feedback type
 */
export const getFeedbackIcon = (type: FeedbackType): string => {
  switch (type) {
    case 'error':
      return '🚫';
    case 'warning':
      return '⚠️';
    case 'success':
      return '✅';
    case 'info':
      return 'ℹ️';
    default:
      return '•';
  }
};
