import { Download, RotateCcw, Share2, Sparkles, Trophy, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SessionStats, SessionSummary } from "../types/domain";

interface SummaryViewProps {
  summary: SessionSummary;
  stats: SessionStats;
  onBackHome: () => void;
}

const ERROR_LABELS: Record<string, string> = {
  shoulder_high: "肩膀紧张",
  knee_inward: "膝盖内扣",
  spine_rounding: "脊柱卷动",
  posture_adjust: "姿势微调",
};

export function SummaryView({ summary, stats, onBackHome }: SummaryViewProps) {
  const [posterOpen, setPosterOpen] = useState(false);
  const [toast, setToast] = useState("");
  const totalErrors = useMemo(() => Object.values(stats.errorCounts).reduce((sum, value) => sum + value, 0), [stats.errorCounts]);
  const durationLabel = `${Math.max(1, Math.round(stats.durationSec / 60))} 分钟`;
  const mainIssue = useMemo(() => getMainIssue(stats.errorCounts), [stats.errorCounts]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-4 text-forest safe-bottom sm:px-5">
      <section className="relative overflow-hidden rounded-[34px] bg-night p-5 text-white shadow-soft">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-mint/24 blur-2xl" />
        <div className="absolute -bottom-12 left-8 h-28 w-28 rounded-full bg-lime/16 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lime">
            <Sparkles size={14} /> 练习完成
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">{summary.summary_title}</h1>
          <p className="mt-3 text-sm leading-6 text-white/68">{summary.ai_feedback}</p>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <StatCard label="标准率" value={`${stats.accuracyScore}%`} tone="strong" />
        <StatCard label="时长" value={durationLabel} />
        <StatCard label="提醒" value={`${totalErrors} 次`} />
      </section>

      <section className="mt-4 rounded-[30px] bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-mint/70 text-sage">
              <Trophy size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-forest/50">今日徽章</p>
              <h2 className="mt-0.5 text-xl font-semibold text-forest">{summary.badge_awarded}</h2>
            </div>
          </div>
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-sage">新手友好</span>
        </div>

        <div className="mt-5 grid gap-3">
          <InsightCard label="主要进步" value={getProgressText(stats.accuracyScore, totalErrors)} />
          <InsightCard label="下次建议" value={summary.next_practice_suggestion || "下次继续用轻松节奏练 8-10 分钟，先稳定，再慢慢增加幅度。"} />
          <InsightCard label="重点关注" value={mainIssue} muted={totalErrors === 0} />
        </div>
      </section>

      <section className="mt-4 rounded-[30px] bg-[#fff8ef] p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-clay">打卡海报</p>
            <p className="mt-1 text-sm leading-6 text-forest/60">生成一张适合发给朋友看的练习记录，数据更轻，不像成绩单。</p>
          </div>
          <button onClick={() => setPosterOpen(true)} className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-clay text-white shadow-card transition active:scale-95" aria-label="生成打卡海报">
            <Share2 size={20} />
          </button>
        </div>
      </section>

      <div className="mt-auto grid gap-2 pt-5">
        <button onClick={() => setPosterOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-sage px-5 py-4 font-semibold text-white shadow-soft transition active:translate-y-[1px]">
          <Share2 size={18} /> 生成打卡海报
        </button>
        <button onClick={onBackHome} className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-5 py-3.5 text-sm font-semibold text-forest shadow-card transition active:translate-y-[1px]">
          <RotateCcw size={16} /> 回到首页
        </button>
      </div>

      {posterOpen ? (
        <SharePosterModal summary={summary} stats={stats} durationLabel={durationLabel} totalErrors={totalErrors} onClose={() => setPosterOpen(false)} onToast={setToast} />
      ) : null}

      {toast ? <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 rounded-full bg-night px-4 py-3 text-center text-sm font-semibold text-white shadow-soft">{toast}</div> : null}
    </main>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "strong" }) {
  return (
    <div className={["rounded-[24px] p-4 text-center shadow-card", tone === "strong" ? "bg-sage text-white" : "bg-white text-forest"].join(" ")}>
      <p className={["text-xs font-semibold", tone === "strong" ? "text-white/68" : "text-forest/50"].join(" ")}>{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
    </div>
  );
}

function InsightCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-[24px] bg-cream p-4">
      <p className={["text-xs font-semibold", muted ? "text-sage" : "text-forest/48"].join(" ")}>{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-forest/72">{value}</p>
    </div>
  );
}

function SharePosterModal({ summary, stats, durationLabel, totalErrors, onClose, onToast }: {
  summary: SessionSummary;
  stats: SessionStats;
  durationLabel: string;
  totalErrors: number;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  function savePoster() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 不可用");
      drawPoster(ctx, { summary, stats, durationLabel, totalErrors });

      const link = document.createElement("a");
      link.download = `YogaMind-AI-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      onToast("海报已生成");
    } catch {
      onToast("海报生成失败，请稍后再试");
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-night/62 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:pb-10" role="dialog" aria-modal="true">
      <section className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-[34px] bg-white p-4 text-forest shadow-soft">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-cream text-forest/62 transition active:scale-95" aria-label="关闭海报">
          <X size={18} />
        </button>

        <div className="overflow-hidden rounded-[30px] bg-[#f9f5ea] p-4">
          <PosterPreview summary={summary} stats={stats} durationLabel={durationLabel} totalErrors={totalErrors} />
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button onClick={savePoster} className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-sage px-5 py-4 font-semibold text-white shadow-soft transition active:translate-y-[1px]">
            <Download size={18} /> 保存海报
          </button>
          <button onClick={onClose} className="rounded-[22px] bg-cream px-5 py-4 text-sm font-semibold text-forest/70 transition active:translate-y-[1px]">关闭</button>
        </div>
      </section>
    </div>
  );
}

function PosterPreview({ summary, stats, durationLabel, totalErrors }: { summary: SessionSummary; stats: SessionStats; durationLabel: string; totalErrors: number }) {
  return (
    <article className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-[#fbf8ef] p-6 shadow-card">
      <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-mint/70 blur-2xl" />
      <div className="absolute -bottom-20 left-4 h-44 w-44 rounded-full bg-[#f2c6b6]/70 blur-2xl" />
      <div className="relative">
        <p className="text-sm font-semibold text-sage">YogaMind AI · 灵瑜 AI</p>
        <h2 className="mt-5 text-4xl font-semibold leading-tight text-night">今天完成了一次温柔练习</h2>
        <p className="mt-3 text-sm leading-6 text-forest/62">{summary.ai_feedback}</p>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <PosterMetric label="标准率" value={`${stats.accuracyScore}%`} />
          <PosterMetric label="时长" value={durationLabel} />
          <PosterMetric label="提醒" value={`${totalErrors}次`} />
        </div>

        <div className="mt-8 rounded-[26px] bg-white/82 p-4 shadow-card">
          <p className="text-xs font-semibold text-forest/45">获得徽章</p>
          <p className="mt-1 text-2xl font-semibold text-sage">{summary.badge_awarded}</p>
          <p className="mt-3 text-sm leading-6 text-forest/58">{summary.next_practice_suggestion || "下一次继续慢慢来，先舒服，再稳定。"}</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-forest/10 pt-4 text-xs font-semibold text-forest/46">
          <span>本地识别，隐私不上云</span>
          <span>H5 体验版</span>
        </div>
      </div>
    </article>
  );
}

function PosterMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white/78 p-3 text-center shadow-card">
      <p className="text-[11px] font-semibold text-forest/42">{label}</p>
      <p className="mt-1 text-lg font-semibold text-night">{value}</p>
    </div>
  );
}

function getMainIssue(errorCounts: Record<string, number>) {
  const entries = Object.entries(errorCounts).filter(([, value]) => value > 0);
  if (!entries.length) return "今天没有明显反复出现的问题，继续保持这个轻松节奏。";
  const [key, count] = entries.sort((a, b) => b[1] - a[1])[0];
  return `${ERROR_LABELS[key] || "姿势微调"}出现 ${count} 次，下次练习时先放慢呼吸，再进入动作。`;
}

function getProgressText(accuracyScore: number, totalErrors: number) {
  if (accuracyScore >= 90 && totalErrors <= 1) return "今天的动作稳定度很好，说明你已经能跟上基础节奏。";
  if (accuracyScore >= 82) return "你完成了大部分关键动作，提醒出现时也能继续保持练习。";
  return "你已经迈出第一步，先把动作做慢、做舒服，比追求标准更重要。";
}

function drawPoster(ctx: CanvasRenderingContext2D, data: { summary: SessionSummary; stats: SessionStats; durationLabel: string; totalErrors: number }) {
  const { summary, stats, durationLabel, totalErrors } = data;
  ctx.fillStyle = "#FBF8EF";
  ctx.fillRect(0, 0, 900, 1200);
  drawCircle(ctx, 760, 90, 180, "rgba(184, 226, 204, 0.76)");
  drawCircle(ctx, 140, 1060, 220, "rgba(242, 198, 182, 0.62)");

  ctx.fillStyle = "#5A7A66";
  ctx.font = "700 30px Microsoft YaHei, sans-serif";
  ctx.fillText("YogaMind AI · 灵瑜 AI", 70, 96);

  ctx.fillStyle = "#1E2F28";
  drawWrappedText(ctx, "今天完成了一次温柔练习", 70, 185, 720, 58, "700 54px Microsoft YaHei, sans-serif");

  ctx.fillStyle = "#526158";
  drawWrappedText(ctx, summary.ai_feedback, 70, 330, 760, 36, "400 27px Microsoft YaHei, sans-serif", 4);

  drawRoundedRect(ctx, 70, 520, 760, 170, 34, "rgba(255,255,255,0.78)");
  drawPosterStat(ctx, "标准率", `${stats.accuracyScore}%`, 110, 580);
  drawPosterStat(ctx, "时长", durationLabel, 355, 580);
  drawPosterStat(ctx, "提醒", `${totalErrors}次`, 600, 580);

  drawRoundedRect(ctx, 70, 750, 760, 230, 38, "rgba(255,255,255,0.82)");
  ctx.fillStyle = "#6E7B72";
  ctx.font = "700 24px Microsoft YaHei, sans-serif";
  ctx.fillText("获得徽章", 115, 815);
  ctx.fillStyle = "#5A7A66";
  drawWrappedText(ctx, summary.badge_awarded, 115, 875, 650, 46, "700 42px Microsoft YaHei, sans-serif", 2);
  ctx.fillStyle = "#526158";
  drawWrappedText(ctx, summary.next_practice_suggestion || "下一次继续慢慢来，先舒服，再稳定。", 115, 950, 660, 32, "400 25px Microsoft YaHei, sans-serif", 2);

  ctx.strokeStyle = "rgba(45,58,50,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 1070);
  ctx.lineTo(830, 1070);
  ctx.stroke();

  ctx.fillStyle = "#7A847C";
  ctx.font = "700 22px Microsoft YaHei, sans-serif";
  ctx.fillText("本地识别，隐私不上云", 70, 1125);
  ctx.fillText("H5 体验版", 680, 1125);
}

function drawPosterStat(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number) {
  ctx.fillStyle = "#7A847C";
  ctx.font = "700 22px Microsoft YaHei, sans-serif";
  ctx.fillText(label, x, y);
  ctx.fillStyle = "#1E2F28";
  ctx.font = "700 42px Microsoft YaHei, sans-serif";
  ctx.fillText(value, x, y + 56);
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, font: string, maxLines = 3) {
  ctx.font = font;
  const words = text.split("");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const testLine = line + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = word;
      lines += 1;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y + lines * lineHeight);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
