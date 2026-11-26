/** First focusable element: jumps over the header to the main content. */
export function SkipLink() {
  return (
    <a
      href="#contenu"
      className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-ink px-5 py-3 font-semibold text-white focus:translate-y-0"
    >
      Aller au contenu
    </a>
  );
}
