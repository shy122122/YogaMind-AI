import type { CourseResponse, FocusTarget, SessionStats, SessionSummary } from "../types/domain";
import { buildFallbackCourse, fallbackSummary } from "../data/fallbackCourse";

const DEFAULT_API_BASE = "http://localhost:8000";

function apiBaseUrl() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("api") === "offline") return "offline";
  return params.get("apiBase") || import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
}

async function fetchJsonWithTimeout<T>(url: string, init: RequestInit, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function generateCourse(targetFocus: FocusTarget): Promise<{ course: CourseResponse; offline: boolean }> {
  const base = apiBaseUrl();
  if (base === "offline") return { course: buildFallbackCourse(targetFocus), offline: true };

  try {
    const course = await fetchJsonWithTimeout<CourseResponse>(`${base}/api/v1/course/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_level: "beginner", target_focus: targetFocus, duration_minutes: 10 }),
    });

    if (!course?.poses?.[0]?.target_angle_min || !course?.poses?.[0]?.target_angle_max) {
      throw new Error("课程结构不完整");
    }
    return { course, offline: false };
  } catch {
    return { course: buildFallbackCourse(targetFocus), offline: true };
  }
}

export async function submitSession(courseId: string, stats: SessionStats): Promise<{ summary: SessionSummary; offline: boolean }> {
  const base = apiBaseUrl();
  if (base === "offline") return { summary: fallbackSummary, offline: true };

  try {
    const summary = await fetchJsonWithTimeout<SessionSummary>(`${base}/api/v1/session/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        actual_duration_sec: stats.durationSec,
        accuracy_score: stats.accuracyScore,
        error_counts: stats.errorCounts,
      }),
    });
    return { summary, offline: false };
  } catch {
    return { summary: fallbackSummary, offline: true };
  }
}
