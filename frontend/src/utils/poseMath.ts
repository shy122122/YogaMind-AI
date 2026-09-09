import type { Landmark } from "../types/domain";

export const POSE_CONNECTIONS: Array<[number, number]> = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32], [0, 11], [0, 12],
];

export function visibleLandmarks(landmarks: Landmark[], threshold = 0.45) {
  return landmarks.filter((point) => (point.visibility ?? 1) >= threshold);
}

export function calculateAngle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLength = Math.hypot(ab.x, ab.y);
  const cbLength = Math.hypot(cb.x, cb.y);
  if (!abLength || !cbLength) return 180;
  const cosine = Math.min(1, Math.max(-1, dot / (abLength * cbLength)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

export function drawSkeleton(
  canvas: HTMLCanvasElement,
  landmarks: Landmark[],
  options: { mirrored?: boolean; highlightJoints?: number[]; formError?: boolean } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  if (!landmarks.length) return;

  const highlight = new Set(options.highlightJoints ?? []);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [from, to] of POSE_CONNECTIONS) {
    const a = landmarks[from];
    const b = landmarks[to];
    if (!a || !b || (a.visibility ?? 1) < 0.35 || (b.visibility ?? 1) < 0.35) continue;
    const hot = highlight.has(from) || highlight.has(to);
    ctx.strokeStyle = hot ? "rgba(224, 122, 95, 0.92)" : "rgba(190, 232, 210, 0.82)";
    ctx.lineWidth = hot ? 4 : 2.25;
    ctx.shadowBlur = hot ? 16 : 10;
    ctx.shadowColor = hot ? "rgba(224, 122, 95, 0.42)" : "rgba(190, 232, 210, 0.38)";
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }

  landmarks.forEach((point, index) => {
    if ((point.visibility ?? 1) < 0.35) return;
    const hot = highlight.has(index);
    ctx.beginPath();
    ctx.fillStyle = hot ? "#E07A5F" : "#DDF58C";
    ctx.shadowBlur = hot ? 18 : 8;
    ctx.shadowColor = hot ? "rgba(224, 122, 95, 0.55)" : "rgba(221, 245, 140, 0.38)";
    ctx.arc(point.x * width, point.y * height, hot ? 5.8 : 3.8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
