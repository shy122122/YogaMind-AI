import type { CourseResponse, FocusTarget, SessionSummary } from "../types/domain";

const asset = (name: string) => `/assets/demo/${name}.png`;

export const fallbackCourse: CourseResponse = {
  course_id: "course_local_fallback",
  course_title: "10分钟肩颈舒缓放松跟练",
  total_duration_sec: 600,
  plan_reason: "今天先用低压力节奏唤醒肩颈和脊柱，重点是舒服、稳定、能呼吸。",
  poses: [
    {
      pose_id: "breathing_center",
      pose_name: "站姿呼吸",
      duration_sec: 45,
      cv_rule_key: "shoulder_relax",
      correction_error_key: "shoulder_high",
      camera_mode_required: "half_body",
      demo_visual_key: "standing_breath",
      demo_media_url: asset("standing_breath"),
      key_points_tip: "双脚踩稳，锁骨轻轻展开，肩膀自然远离耳朵。",
      target_angle_min: 150,
      target_angle_max: 180,
      guidance_tip: "先站稳，把呼吸放慢，肩膀自然下沉。",
    },
    {
      pose_id: "cat_cow",
      pose_name: "猫牛式",
      duration_sec: 60,
      cv_rule_key: "spine_extension",
      correction_error_key: "spine_rounding",
      camera_mode_required: "half_body",
      demo_visual_key: "cat_cow",
      demo_media_url: asset("cat_cow"),
      key_points_tip: "双手稳定推地，跟随呼吸缓慢卷动脊柱。",
      target_angle_min: 140,
      target_angle_max: 180,
      guidance_tip: "先回到四足跪姿，保持沉肩，慢慢卷动脊柱。",
    },
    {
      pose_id: "child_pose",
      pose_name: "婴儿式",
      duration_sec: 60,
      cv_rule_key: "spine_extension",
      correction_error_key: "shoulder_high",
      camera_mode_required: "mat_view",
      demo_visual_key: "child_pose",
      demo_media_url: asset("child_pose"),
      key_points_tip: "臀部向脚跟放松，手臂向前延展，后背柔和拉长。",
      target_angle_min: 120,
      target_angle_max: 175,
      guidance_tip: "额头轻轻靠近垫面，让背部自然展开。",
    },
    {
      pose_id: "mountain_pose",
      pose_name: "山式站立",
      duration_sec: 60,
      cv_rule_key: "shoulder_relax",
      correction_error_key: "shoulder_high",
      camera_mode_required: "full_body",
      demo_visual_key: "mountain",
      demo_media_url: asset("mountain"),
      key_points_tip: "脚掌均匀踩地，头顶向上延展，肩膀自然下沉。",
      target_angle_min: 150,
      target_angle_max: 180,
      guidance_tip: "站稳后把呼吸放慢，肩膀自然远离耳朵。",
    },
  ],
};

export const fallbackSummary: SessionSummary = {
  session_id: "sess_local_fallback",
  summary_title: "很好，你完成了一次稳定练习",
  ai_feedback: "你已经完成了一轮适合新手的肩颈舒缓练习。今天最好的地方是节奏稳定，下次可以继续把肩膀放松一点，让动作更轻。",
  badge_awarded: "肩颈舒缓小能手",
  next_practice_suggestion: "下次建议继续 8-10 分钟肩颈放松，不需要追求动作幅度。",
};

export function buildFallbackCourse(targetFocus: FocusTarget): CourseResponse {
  const focusLabel = targetFocus === "spine" ? "脊柱唤醒" : targetFocus === "full_body" ? "全身舒展" : "肩颈舒缓";
  return {
    ...fallbackCourse,
    course_title: `10分钟${focusLabel}跟练`,
    plan_reason: `已为你准备一套偏${focusLabel}的离线课表，适合第一次体验。`,
  };
}
