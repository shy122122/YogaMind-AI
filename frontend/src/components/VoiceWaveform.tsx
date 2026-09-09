export function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div className="flex h-8 items-center justify-center gap-1.5" aria-label={active ? "正在语音提醒" : "语音待命"}>
      {[0, 1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={["block w-1.5 rounded-full bg-lime", active ? "animate-wave" : "opacity-35"].join(" ")}
          style={{ height: `${12 + (bar % 3) * 6}px`, animationDelay: `${bar * 90}ms` }}
        />
      ))}
    </div>
  );
}
