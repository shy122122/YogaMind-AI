import type { Landmark, PoseAnalysisResult, PoseItem, PoseMismatchState, ReadingMode, TrackingQuality } from "../types/domain";
import { calculateAngle, visibleLandmarks } from "./poseMath";

const entryInstructions: Record<string, string> = {
  standing: "先站到垫子中央，双脚踩稳，让头顶和肩膀进入画面。",
  all_fours: "先回到垫面四足跪姿，双手撑地，膝盖落在髋部下方。",
  mat_fold: "先跪坐到垫子上，身体向前放松，额头靠近垫面。",
  seated: "先坐稳，背部轻轻立起来，肩膀自然下沉。",
  unknown: "先对照示范，把身体摆到相同的起始姿势。",
};

function expectedPattern(pose: PoseItem) {
  const name = `${pose.pose_id} ${pose.pose_name}`.toLowerCase();
  if (name.includes("cat") || name.includes("猫牛")) return "all_fours";
  if (name.includes("child") || name.includes("婴儿")) return "mat_fold";
  if (name.includes("seated") || name.includes("坐姿")) return "seated";
  if (name.includes("mountain") || name.includes("站") || name.includes("breathing")) return "standing";
  return "unknown";
}

function detectPattern(landmarks: Landmark[]) {
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const shouldersY = ((leftShoulder?.y ?? 0.5) + (rightShoulder?.y ?? 0.5)) / 2;
  const hipsY = ((leftHip?.y ?? 0.62) + (rightHip?.y ?? 0.62)) / 2;
  const kneesY = ((leftKnee?.y ?? 0.82) + (rightKnee?.y ?? 0.82)) / 2;
  const torsoHeight = Math.abs(hipsY - shouldersY);

  if (!nose || visibleLandmarks(landmarks).length < 12) return "unknown";
  if (torsoHeight > 0.2 && kneesY > hipsY + 0.12) return "standing";
  if (shouldersY > hipsY - 0.06 && kneesY > hipsY - 0.02) return "all_fours";
  if (nose.y > shouldersY && shouldersY > hipsY - 0.05) return "mat_fold";
  if (torsoHeight > 0.12 && kneesY < hipsY + 0.16) return "seated";
  return "unknown";
}

function trackingQuality(landmarks: Landmark[]): TrackingQuality {
  const count = visibleLandmarks(landmarks).length;
  if (count === 0) return "no_pose";
  if (count < 14) return "partial_body";
  return "stable";
}

function readingMode(landmarks: Landmark[]): ReadingMode {
  const visible = visibleLandmarks(landmarks);
  if (visible.length < 10) return "normal";
  const xs = visible.map((p) => p.x);
  const ys = visible.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return width < 0.38 && height < 0.62 ? "far" : "normal";
}

function mismatchForPose(pose: PoseItem, landmarks: Landmark[]): PoseMismatchState | null {
  const expected = expectedPattern(pose);
  const detected = detectPattern(landmarks);
  if (expected === "unknown" || detected === "unknown" || expected === detected) return null;
  return {
    mismatched: true,
    expectedPattern: expected,
    detectedPattern: detected,
    confidence: 0.72,
    tip: entryInstructions[expected] || entryInstructions.unknown,
    highlightJoints: [11, 12, 23, 24, 25, 26],
  };
}

export function analyzePose(pose: PoseItem, landmarks: Landmark[]): PoseAnalysisResult {
  const quality = trackingQuality(landmarks);
  if (quality === "no_pose") {
    return {
      formError: false,
      pendingCorrection: false,
      correctionTip: "请后退一点，让头肩进入画面。",
      angleLabel: "等待识别",
      highlightJoints: [],
      trackingQuality: quality,
      readingMode: "normal",
    };
  }

  const mismatch = mismatchForPose(pose, landmarks);
  if (mismatch) {
    return {
      formError: true,
      pendingCorrection: false,
      correctionTip: mismatch.tip,
      angleLabel: "动作匹配度低",
      errorKey: "pose_mismatch",
      highlightJoints: mismatch.highlightJoints,
      trackingQuality: quality,
      readingMode: readingMode(landmarks),
      mismatch,
    };
  }

  const min = pose.target_angle_min ?? 140;
  const max = pose.target_angle_max ?? 180;
  const angle = landmarks[11] && landmarks[23] && landmarks[25]
    ? calculateAngle(landmarks[11], landmarks[23], landmarks[25])
    : 180;
  const outOfRange = angle < min || angle > max;

  return {
    formError: outOfRange,
    pendingCorrection: false,
    correctionTip: outOfRange ? pose.guidance_tip || "动作放小一点，保持舒服。" : "很好，保持现在的呼吸节奏。",
    angleLabel: `${angle}° · 目标 ${min}°-${max}°`,
    errorKey: outOfRange ? pose.correction_error_key || "posture_adjust" : undefined,
    highlightJoints: outOfRange ? [11, 12, 23, 25] : [],
    trackingQuality: quality,
    readingMode: readingMode(landmarks),
  };
}

export function mockLandmarks(frame: number, mismatched = false): Landmark[] {
  const sway = Math.sin(frame / 18) * 0.012;
  const base: Landmark[] = Array.from({ length: 33 }, (_, index) => ({ x: 0.5, y: 0.5, visibility: 0.9, z: 0 }));
  base[0] = { x: 0.5 + sway, y: mismatched ? 0.18 : 0.28, visibility: 0.95 };
  base[11] = { x: 0.38 + sway, y: mismatched ? 0.32 : 0.38, visibility: 0.94 };
  base[12] = { x: 0.62 + sway, y: mismatched ? 0.32 : 0.38, visibility: 0.94 };
  base[23] = { x: 0.42 + sway, y: mismatched ? 0.58 : 0.52, visibility: 0.92 };
  base[24] = { x: 0.58 + sway, y: mismatched ? 0.58 : 0.52, visibility: 0.92 };
  base[25] = { x: 0.4 + sway, y: mismatched ? 0.82 : 0.64, visibility: 0.9 };
  base[26] = { x: 0.6 + sway, y: mismatched ? 0.82 : 0.64, visibility: 0.9 };
  base[13] = { x: 0.31 + sway, y: 0.48, visibility: 0.9 };
  base[14] = { x: 0.69 + sway, y: 0.48, visibility: 0.9 };
  base[15] = { x: 0.28 + sway, y: 0.6, visibility: 0.9 };
  base[16] = { x: 0.72 + sway, y: 0.6, visibility: 0.9 };
  base[27] = { x: 0.39 + sway, y: 0.9, visibility: 0.9 };
  base[28] = { x: 0.61 + sway, y: 0.9, visibility: 0.9 };
  return base;
}
