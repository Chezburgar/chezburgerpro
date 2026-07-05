// Lightweight UI sound effects, fully synthesized with the Web Audio API so no
// audio files need to ship on the static host. Subtle by design and respects a
// persisted on/off toggle (Settings). Browsers block audio until the first user
// gesture, so the AudioContext is created/resumed lazily on interaction.

const STORAGE_KEY = "cbp_sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = readEnabled();

function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function isSoundOn(): boolean {
  return enabled;
}

export function setSoundOn(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // storage unavailable — applies for this visit only
  }
  if (on) ensure();
}

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type ToneOpts = {
  freq: number;
  freqEnd?: number;
  type?: OscillatorType;
  dur?: number;
  gain?: number;
  delay?: number;
  attack?: number;
};

function tone(o: ToneOpts) {
  const c = ctx;
  if (!c || !master) return;
  const t0 = c.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.12;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + dur);
  const peak = o.gain ?? 0.2;
  const atk = o.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type SoundName = "tap" | "hover" | "toggle" | "success" | "open" | "error";

export function playSound(name: SoundName): void {
  if (!enabled) return;
  const c = ensure();
  if (!c || c.state !== "running") return;
  switch (name) {
    case "tap":
      tone({ freq: 520, freqEnd: 380, type: "triangle", dur: 0.07, gain: 0.12 });
      break;
    case "hover":
      tone({ freq: 880, type: "sine", dur: 0.05, gain: 0.035 });
      break;
    case "toggle":
      tone({ freq: 440, type: "square", dur: 0.05, gain: 0.05 });
      tone({ freq: 680, type: "sine", dur: 0.08, gain: 0.05, delay: 0.02 });
      break;
    case "success":
      // A short rising major triad — feels rewarding.
      tone({ freq: 523.25, type: "sine", dur: 0.12, gain: 0.11 });
      tone({ freq: 659.25, type: "sine", dur: 0.12, gain: 0.11, delay: 0.08 });
      tone({ freq: 783.99, type: "triangle", dur: 0.18, gain: 0.12, delay: 0.16 });
      break;
    case "open":
      // Vault-opening swell.
      tone({ freq: 180, freqEnd: 540, type: "sine", dur: 0.36, gain: 0.13, attack: 0.02 });
      tone({ freq: 720, freqEnd: 1080, type: "triangle", dur: 0.3, gain: 0.045, delay: 0.05 });
      break;
    case "error":
      tone({ freq: 220, freqEnd: 150, type: "sawtooth", dur: 0.22, gain: 0.08 });
      break;
  }
}

// Attach a document-wide listener that plays a click sound for any button/link
// (or an element carrying data-sound="..."). Returns a cleanup function.
export function installClickSounds(): () => void {
  const onDown = (e: Event) => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest?.(
      "[data-sound], button, a[href], [role='button']",
    ) as HTMLElement | null;
    if (!el || el.getAttribute("aria-disabled") === "true" || (el as HTMLButtonElement).disabled) {
      // Still unlock the audio context on any gesture.
      ensure();
      return;
    }
    const s = (el.dataset?.sound as SoundName) || "tap";
    playSound(s);
  };
  document.addEventListener("pointerdown", onDown);
  return () => document.removeEventListener("pointerdown", onDown);
}
