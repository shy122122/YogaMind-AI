import { HelpCircle, Play, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import type { FocusTarget } from "../types/domain";

const focusOptions: Array<{ value: FocusTarget; label: string; desc: string }> = [
  { value: "shoulder", label: "肩颈舒缓", desc: "久坐、低头后先放松上背" },
  { value: "spine", label: "脊柱唤醒", desc: "轻柔打开背部和胸腔" },
  { value: "full_body", label: "全身舒展", desc: "低强度完整练一轮" },
];

interface PrepareViewProps {
  focus: FocusTarget;
  loading: boolean;
  onFocusChange: (focus: FocusTarget) => void;
  onStart: () => void;
  onDemo: () => void;
  onGuide: () => void;
}

export function PrepareView({ focus, loading, onFocusChange, onStart, onDemo, onGuide }: PrepareViewProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-5 safe-bottom">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-sage">灵瑜 AI</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-forest">YogaMind AI</h1>
        </div>
        <button onClick={onGuide} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-card" aria-label="打开新手引导">
          <HelpCircle size={20} />
        </button>
      </header>

      <section className="mt-5 rounded-[32px] bg-night p-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-lime">给瑜伽小白的实时陪练</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight">看示范，听提醒，慢慢跟着做。</h2>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-white/78">
          <div className="rounded-2xl bg-white/10 px-2 py-3"><ShieldCheck className="mx-auto mb-1" size={17} />本地识别</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3"><Sparkles className="mx-auto mb-1" size={17} />定制课表</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3"><Volume2 className="mx-auto mb-1" size={17} />温和纠错</div>
        </div>
      </section>

      <section className="mt-5 flex-1 rounded-[30px] bg-white p-4 shadow-card">
        <p className="text-sm font-semibold text-forest/72">今天想练什么？</p>
        <div className="mt-3 space-y-2.5">
          {focusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFocusChange(option.value)}
              className={["w-full rounded-[22px] border p-4 text-left transition", focus === option.value ? "border-sage bg-mint/40" : "border-linen bg-cream"].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-forest">{option.label}</span>
                <span className={["h-3 w-3 rounded-full", focus === option.value ? "bg-sage" : "bg-linen"].join(" ")} />
              </div>
              <p className="mt-1 text-sm leading-6 text-forest/58">{option.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-2">
        <button disabled={loading} onClick={onStart} className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-sage px-5 py-4 text-base font-semibold text-white shadow-soft disabled:opacity-60">
          <Play size={18} /> {loading ? "正在生成课表..." : "开始 10 分钟跟练"}
        </button>
        <button onClick={onDemo} className="rounded-[22px] bg-white px-5 py-3.5 text-sm font-semibold text-forest shadow-card">演示模式，不开摄像头</button>
      </div>
    </main>
  );
}
