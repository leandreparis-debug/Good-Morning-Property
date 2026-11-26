/**
 * Short alert sound with the Web Audio API (no audio file). Browsers only allow audio after a
 * user gesture: call `unlockAudio()` from a click (« Lancer la roue »).
 */
let context: AudioContext | null = null;

/** Creates / resumes the audio context. Call it from a click handler. */
export function unlockAudio(): void {
  if (typeof window === "undefined") return;
  try {
    context ??= new AudioContext();
    if (context.state === "suspended") void context.resume();
  } catch {
    context = null; // No audio available: the visual alert remains.
  }
}

/** Three short beeps (880 Hz). Silent if audio was never unlocked. */
export function playAlert(): void {
  const audio = context;
  if (audio?.state !== "running") return;
  const start = audio.currentTime + 0.05;
  for (let i = 0; i < 3; i++) {
    const at = start + i * 0.32;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.22);
  }
}
