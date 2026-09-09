import { RotateCcw, Share2, Trophy } from "lucide-react";
import type { SessionStats, SessionSummary } from "../types/domain";

interface SummaryViewProps {
  summary: SessionSummary;
  stats: SessionStats;
  onBackHome: () => void;
}

export function SummaryView({ summary, stats, onBackHome }: SummaryViewProps) {
  const totalErrors = Object.values(stats.errorCounts).reduce((sum, value) => sum + value, 0);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-5 safe-bottom">
      <header className="rounded-[32px] bg-night p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-lime">练习完成</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{summary.summary_title}</h1>
        <p className="mt-3 text-sm leading-6 text-white/68">{summary.ai_feedback}</p>
      </header>

      <section className="mt-4 grid grid-cols-3 gap-2">
        <StatCard label="标准率" value={`${stats.accuracyScore}%`} />
        <StatCard label="时长" value={`${Math.round(stats.durationSec / 60)}分`} />
        <StatCard label="提醒" value={`${totalErrors}次`} />
      </section>

      <section className="mt-4 rounded-[30px] bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-mint/55 text-sage"><Trophy size={22} /></div>
          <div>
            <p className="text-sm font-semibold text-forest/58">今日徽章</p>
            <h2 className="text-xl font-semibold text-forest">{summary.badge_awarded}</h2>
          </div>
        </div>
        <p className="mt-4 rounded-[22px] bg-cream p-4 text-sm leading-6 text-forest/68">
          {summary.next_practice_suggestion || "下次继续用轻松节奏练 8-10 分钟，先稳定，再慢慢增加幅度。"}
        </p>
      </section>

      <div className="mt-auto grid gap-2 pt-5">
        <button className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-sage px-5 py-4 font-semibold text-white shadow-soft">
          <Share2 size={18} /> 生成打卡海报
        </button>
        <button onClick={onBackHome} className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-white px-5 py-3.5 text-sm font-semibold text-forest shadow-card">
          <RotateCcw size={16} /> 回到首页
        </button>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-white p-4 text-center shadow-card">
      <p className="text-xs font-semibold text-forest/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-forest">{value}</p>
    </div>
  );
}
