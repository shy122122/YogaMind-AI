export type ViewState = "prepare" | "practice" | "summary";
export type TrackingQuality = "stable" | "low_light" | "partial_body" | "no_pose";
export type ReadingMode = "normal" | "far";
export type FocusTarget = "shoulder" | "spine" | "full_body";

export interface PoseItem {
  pose_id: string;
  pose_name: string;
  duration_sec: number;
  target_angle_min: number;
  target_angle_max: number;
  guidance_tip: string;
  demo_media_url?: string;
  key_points_tip?: string;
  demo_visual_key?: string;
  cv_rule_key?: string;
  correction_error_key?: string;
  camera_mode_required?: "full_body" | "half_body" | "mat_view";
}

export interface CourseResponse {
  course_id: string;
  course_title: string;
  total_duration_sec: number;
  plan_reason?: string;
  poses: PoseItem[];
}

export interface SessionSummary {
  session_id: string;
  summary_title: string;
  ai_feedback: string;
  badge_awarded: string;
  next_practice_suggestion?: string;
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseMismatchState {
  mismatched: boolean;
  tip: string;
  expectedPattern: string;
  detectedPattern: string;
  confidence: number;
  highlightJoints: number[];
}

export interface PoseAnalysisResult {
  formError: boolean;
  pendingCorrection: boolean;
  correctionTip: string;
  angleLabel: string;
  errorKey?: string;
  highlightJoints: number[];
  trackingQuality: TrackingQuality;
  readingMode: ReadingMode;
  mismatch?: PoseMismatchState | null;
}

export interface SessionStats {
  durationSec: number;
  accuracyScore: number;
  errorCounts: Record<string, number>;
}
