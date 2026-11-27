/** Skeleton shown while a page loads (same layout as the screens: overline, title, cards). */
export default function Loading() {
  return (
    <div role="status" aria-label="Chargement" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-3 w-40 rounded-full bg-card/60 motion-safe:animate-pulse" />
        <div className="h-11 w-72 max-w-full rounded-full bg-card/70 motion-safe:animate-pulse" />
      </div>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-28 max-w-2xl rounded-card-sm bg-card/60 shadow-card motion-safe:animate-pulse sm:rounded-card"
        />
      ))}
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
