import { Camera, CheckCircle2, HelpCircle, Play, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-4 safe-bottom">
      <header className="flex items-center justify-between px-1">
        <div>
          <p className="text-sm font-semibold text-sage">灵瑜 AI · YogaMind AI</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight text-forest">新手友好瑜伽陪练</h1>
        </div>
        <button onClick={onGuide} className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-card transition active:scale-95" aria-label="打开新手引导">
          <HelpCircle size={20} />
        </button>
      </header>

      <section className="relative mt-4 overflow-hidden rounded-[34px] bg-night p-5 text-white shadow-soft">
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-mint/25 blur-2xl" />
        <div className="absolute -bottom-16 left-8 h-32 w-32 rounded-full bg-lime/15 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-lime">
            <Sparkles size={14} /> 给零基础小白
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.05]">看示范，听提醒，慢慢跟着做。</h2>
          <p className="mt-3 text-sm leading-6 text-white/64">不监考，不催促。动作做错时，只提醒一句最关键的调整。</p>
        </div>
        <div className="relative mt-5 rounded-[28px] border border-white/10 bg-white/8 p-3">
          <div className="relative h-44 overflow-hidden rounded-[24px] bg-[#eef4e8]">
            <div className="absolute inset-x-10 bottom-8 h-16 rounded-[100%] bg-sage/12" />
            <div className="absolute left-1/2 top-8 h-20 w-20 -translate-x-1/2 rounded-full border-2 border-dashed border-sage/40" />
            <div className="absolute left-1/2 top-24 h-28 w-20 -translate-x-1/2 rounded-[999px] border-2 border-dashed border-sage/40" />
            <div className="absolute left-1/2 top-20 h-32 w-32 -translate-x-1/2 rounded-full border border-lime/45 animate-breathe" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full bg-night/72 px-3 py-2 text-xs font-semibold text-white/74 backdrop-blur">
              <span className="inline-flex items-center gap-1.5"><Camera size={14} /> 准备识别站位</span>
              <span className="text-lime">全身入镜后开始</span>
            </div>
          </div>
        </div>
        <div className="relative mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-white/78">
          <div className="rounded-2xl bg-white/10 px-2 py-3"><ShieldCheck className="mx-auto mb-1" size={17} />本地识别</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3"><Sparkles className="mx-auto mb-1" size={17} />定制课表</div>
          <div className="rounded-2xl bg-white/10 px-2 py-3"><Volume2 className="mx-auto mb-1" size={17} />温和纠错</div>
        </div>
      </section>

      <section className="mt-4 flex-1 rounded-[30px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-forest/72">今天想练什么？</p>
          <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-sage">10 分钟</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {focusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFocusChange(option.value)}
              className={["w-full rounded-[24px] border p-4 text-left transition active:scale-[0.99]", focus === option.value ? "border-sage bg-mint/40 shadow-card" : "border-linen bg-cream"].join(" ")}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-forest">{option.label}</span>
                <span className={["grid h-6 w-6 place-items-center rounded-full", focus === option.value ? "bg-sage text-white" : "bg-white text-transparent"].join(" ")}>
                  <CheckCircle2 size={15} />
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-forest/58">{option.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-2">
        <button disabled={loading} onClick={onStart} className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-sage px-5 py-4 text-base font-semibold text-white shadow-soft transition active:translate-y-[1px] disabled:opacity-60">
          <Play size={18} /> {loading ? "正在生成课表..." : "开始 10 分钟跟练"}
        </button>
        <button onClick={onDemo} className="rounded-[22px] bg-white px-5 py-3.5 text-sm font-semibold text-forest shadow-card transition active:translate-y-[1px]">演示模式，不开摄像头</button>
      </div>
    </main>
  );
}
