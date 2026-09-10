import { Eye, Smartphone, Sparkles, Volume2, X } from "lucide-react";
import { onboardingSteps } from "../data/onboarding";

const icons = [Smartphone, Eye, Volume2];

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-night/34 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-cream p-5 shadow-soft">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-mint/40 blur-2xl" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sage shadow-card">
              <Sparkles size={14} /> 第一次练习前
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-forest">先把手机和身体放到舒服的位置</h2>
            <p className="mt-2 text-sm leading-6 text-forest/58">不用追求完美，先能看懂、能呼吸、能听到提醒就很好。</p>
          </div>
          <button onClick={onClose} className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-forest/70 shadow-card transition active:scale-95" aria-label="关闭新手引导">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {onboardingSteps.map((step, index) => {
            const StepIcon = icons[index] || Sparkles;
            return (
              <article key={step.title} className="flex gap-3 rounded-[24px] bg-white p-3.5 shadow-card">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-night text-lime">
                  <StepIcon size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-forest">{step.title}</h3>
                    <span className="rounded-full bg-mint/45 px-2 py-0.5 text-[11px] font-semibold text-sage">{index + 1} · {step.tag}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-forest/64">{step.text}</p>
                </div>
              </article>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-[24px] bg-night px-5 py-4 text-base font-semibold text-lime shadow-soft transition active:translate-y-[1px]">
          我知道了，开始准备
        </button>
      </section>
    </div>
  );
}
