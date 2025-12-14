import { PoseLandmark } from '@/hooks/pose-detection/usePoseDetection';

// MediaPipe Pose landmark indices
export const POSE_LANDMARKS = {
  // Face
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // Upper body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // Lower body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// Skeleton connections (bones)
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],

  // Upper body
  [11, 12],  // Shoulders
  [11, 13], [13, 15],  // Left arm
  [15, 17], [15, 19], [15, 21],  // Left hand
  [12, 14], [14, 16],  // Right arm
  [16, 18], [16, 20], [16, 22],  // Right hand

  // Torso
  [11, 23], [12, 24],  // Shoulders to hips
  [23, 24],  // Hips

  // Left leg
  [23, 25], [25, 27], [27, 29], [27, 31],

  // Right leg
  [24, 26], [26, 28], [28, 30], [28, 32],
];

// Sport-specific key joints to highlight
export const SPORT_KEY_JOINTS: Record<string, number[]> = {
  football: [
    POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,     // Plant knee
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,       // Hip rotation
    POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE    // Foot positioning
  ],
  basketball: [
    POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,   // Shooting form
    POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,   // Release point
    POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER // Shot power
  ],
  boxing: [
    POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, // Guard position
    POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,   // Punch angles
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP        // Power generation
  ],
  mma: [
    POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE
  ],
  taekwondo: [
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,       // Flexibility
    POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,     // Kick height
    POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.RIGHT_ANKLE    // Kick extension
  ],
  'american-football': [
    POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER, // Stance
    POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.RIGHT_KNEE,     // Athletic position
    POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP
  ]
};

/**
 * Draw skeleton overlay on canvas
 */
export const drawSkeleton = (
  canvas: HTMLCanvasElement,
  landmarks: PoseLandmark[],
  options: {
    lineColor?: string;
    lineWidth?: number;
    pointColor?: string;
    pointRadius?: number;
    minVisibility?: number;
    clearCanvas?: boolean;
    discipline?: string; // Sport-specific joint highlighting
    highlightColor?: string;
    highlightRadius?: number;
  } = {}
) => {
  const {
    lineColor = '#00ff00',
    lineWidth = 3,
    pointColor = '#00ff00',
    pointRadius = 5,
    minVisibility = 0.5,
    clearCanvas = true,
    discipline,
    highlightColor = '#ffff00', // Yellow for key joints
    highlightRadius = 12
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx || !landmarks || landmarks.length === 0) return;

  // Get key joints for this sport
  const keyJoints = discipline ? (SPORT_KEY_JOINTS[discipline] || []) : [];

  // Only clear canvas for real-time overlay (not when drawing on video frames for AI)
  if (clearCanvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Draw connections (bones)
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;

  POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    // Only draw if both points are visible enough
    if (start && end && start.visibility > minVisibility && end.visibility > minVisibility) {
      ctx.beginPath();
      ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
      ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
      ctx.stroke();
    }
  });

  // Draw joints (circles)
  landmarks.forEach((point, index) => {
    if (point && point.visibility > minVisibility) {
      const isKeyJoint = keyJoints.includes(index);

      // Draw key joints larger and in highlight color
      ctx.fillStyle = isKeyJoint ? highlightColor : pointColor;
      const radius = isKeyJoint ? highlightRadius : pointRadius;

      ctx.beginPath();
      ctx.arc(
        point.x * canvas.width,
        point.y * canvas.height,
        radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
  });
};

/**
 * Calculate angle between 3 points in 3D space (in degrees)
 */
export const calculateAngle = (
  a: PoseLandmark,
  b: PoseLandmark,
  c: PoseLandmark
): number => {
  // Vector BA
  const ba = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };

  // Vector BC
  const bc = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: c.z - b.z
  };

  // Dot product
  const dotProduct = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;

  // Magnitudes
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  // Avoid division by zero
  if (magBA === 0 || magBC === 0) return 0;

  // Angle in radians → degrees
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (magBA * magBC))));
  return angleRad * (180 / Math.PI);
};

/**
 * Get all major joint angles
 */
export interface JointAngles {
  leftElbow: number;
  rightElbow: number;
  leftKnee: number;
  rightKnee: number;
  leftShoulder: number;
  rightShoulder: number;
  leftHip: number;
  rightHip: number;
}

export const getJointAngles = (landmarks: PoseLandmark[]): JointAngles | null => {
  if (!landmarks || landmarks.length < 33) return null;

  const { LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, LEFT_KNEE, LEFT_ANKLE,
    RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE } = POSE_LANDMARKS;

  // Only calculate if landmarks are visible
  const isVisible = (idx: number) => landmarks[idx] && landmarks[idx].visibility > 0.5;

  return {
    leftElbow: isVisible(LEFT_SHOULDER) && isVisible(LEFT_ELBOW) && isVisible(LEFT_WRIST)
      ? calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW], landmarks[LEFT_WRIST])
      : 0,

    rightElbow: isVisible(RIGHT_SHOULDER) && isVisible(RIGHT_ELBOW) && isVisible(RIGHT_WRIST)
      ? calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW], landmarks[RIGHT_WRIST])
      : 0,

    leftKnee: isVisible(LEFT_HIP) && isVisible(LEFT_KNEE) && isVisible(LEFT_ANKLE)
      ? calculateAngle(landmarks[LEFT_HIP], landmarks[LEFT_KNEE], landmarks[LEFT_ANKLE])
      : 0,

    rightKnee: isVisible(RIGHT_HIP) && isVisible(RIGHT_KNEE) && isVisible(RIGHT_ANKLE)
      ? calculateAngle(landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE], landmarks[RIGHT_ANKLE])
      : 0,

    leftShoulder: isVisible(LEFT_ELBOW) && isVisible(LEFT_SHOULDER) && isVisible(LEFT_HIP)
      ? calculateAngle(landmarks[LEFT_ELBOW], landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP])
      : 0,

    rightShoulder: isVisible(RIGHT_ELBOW) && isVisible(RIGHT_SHOULDER) && isVisible(RIGHT_HIP)
      ? calculateAngle(landmarks[RIGHT_ELBOW], landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP])
      : 0,

    leftHip: isVisible(LEFT_SHOULDER) && isVisible(LEFT_HIP) && isVisible(LEFT_KNEE)
      ? calculateAngle(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_KNEE])
      : 0,

    rightHip: isVisible(RIGHT_SHOULDER) && isVisible(RIGHT_HIP) && isVisible(RIGHT_KNEE)
      ? calculateAngle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_KNEE])
      : 0,
  };
};
