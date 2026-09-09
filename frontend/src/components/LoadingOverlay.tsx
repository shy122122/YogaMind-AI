export function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-cream/86 px-5 backdrop-blur-md">
      <section className="w-full max-w-xs rounded-[30px] bg-white p-6 text-center shadow-soft">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-mint/50">
          <div className="h-11 w-11 rounded-full bg-sage/70 animate-breathe" />
        </div>
        <p className="mt-5 text-base font-semibold text-forest">{text}</p>
        <p className="mt-2 text-sm leading-6 text-forest/56">如果网络较慢，会自动切换离线课表。</p>
      </section>
    </div>
  );
}
