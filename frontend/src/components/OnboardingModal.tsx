import { X } from "lucide-react";
import { onboardingSteps } from "../data/onboarding";

export function OnboardingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-night/30 px-4 pb-4 pt-10 backdrop-blur-sm sm:items-center sm:justify-center">
      <section className="w-full max-w-md rounded-[30px] border border-white/80 bg-cream p-5 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-sage">第一次练习前</p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight text-forest">先花 20 秒把体验调舒服</h2>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linen text-forest/70">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {onboardingSteps.map((step, index) => (
            <article key={step.title} className="flex gap-3 rounded-[22px] bg-white p-3.5 shadow-card">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-night text-sm font-semibold text-lime">{index + 1}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-forest">{step.title}</h3>
                  <span className="rounded-full bg-mint/45 px-2 py-0.5 text-[11px] font-semibold text-sage">{step.tag}</span>
                </div>
                <p className="mt-1.5 text-sm leading-6 text-forest/64">{step.text}</p>
              </div>
            </article>
          ))}
        </div>
        <button onClick={onClose} className="mt-5 w-full rounded-[22px] bg-night px-5 py-4 text-base font-semibold text-lime shadow-soft">
          我知道了，开始准备
        </button>
      </section>
    </div>
  );
}
