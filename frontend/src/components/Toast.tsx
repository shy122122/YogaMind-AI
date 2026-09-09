export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-[22px] bg-night px-4 py-3 text-sm font-semibold text-lime shadow-soft">
      {message}
    </div>
  );
}
