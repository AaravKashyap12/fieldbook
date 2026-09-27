// Interface sounds, synthesized live with Web Audio: no audio files, no
// dependencies. Cue names follow CueLume (MIT), the sound library in Aarav's
// resource shelf. Every cue pairs with a visible state change; sound never
// carries meaning on its own. Nothing plays on hover.
//
// Default: on, unless the visitor prefers reduced motion. The header toggle
// persists the choice. Browsers only allow audio after a user gesture, which
// is also the only time these cues fire.

const KEY = 'fieldbook:sound';
// Everything routes through one output stage: a gain and a limiter, so cues
// are clearly audible on laptop speakers and overlaps never distort.
const MASTER = 0.9;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

let ctx = null;
let out = null;
let enabled = readPreference();

function readPreference() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch {}
  return !reduced.matches;
}

export const isEnabled = () => enabled;
export function setEnabled(value) {
  enabled = Boolean(value);
  try { localStorage.setItem(KEY, enabled ? '1' : '0'); } catch {}
}

function context() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    limiter.connect(ctx.destination);
    out = limiter;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// A tone with an exponential envelope, optionally through a low-pass filter.
function tone(ac, { type = 'sine', from, to = from, at = 0, dur, gain, lowpass }) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain * MASTER, t + 0.004);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node = osc;
  if (lowpass) {
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    osc.connect(filter);
    node = filter;
  }
  node.connect(env).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

// A short band-passed noise burst: paper sliding over paper.
function rustle(ac, { at = 0, dur = 0.11, gain = 0.14, freq = 2600, q = 0.9 }) {
  const t = ac.currentTime + at;
  const length = Math.ceil(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.setValueAtTime(freq, t);
  band.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
  band.Q.value = q;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain * MASTER, t + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(band).connect(env).connect(out);
  src.start(t);
  src.stop(t + dur + 0.02);
}

const cues = {
  // A crisp tick for pressing a link, row, chip or button.
  tick: ac => tone(ac, { type: 'triangle', from: 1750, to: 1150, dur: 0.05, gain: 0.34, lowpass: 5200 }),
  // Click then clack: something switched between states.
  toggle: ac => {
    tone(ac, { type: 'square', from: 820, to: 640, dur: 0.035, gain: 0.16, lowpass: 2600 });
    tone(ac, { from: 1450, dur: 0.07, at: 0.035, gain: 0.3 });
  },
  // Two rising notes for a confirmed copy or a sent submission.
  success: ac => {
    tone(ac, { from: 880, dur: 0.14, gain: 0.38 });
    tone(ac, { from: 1318, dur: 0.2, at: 0.08, gain: 0.32 });
  },
  // A page turning in the notebook.
  page: ac => {
    rustle(ac, { dur: 0.16, gain: 0.7, freq: 3000 });
    tone(ac, { from: 180, to: 120, dur: 0.09, at: 0.07, gain: 0.3, lowpass: 700 });
  },
  // Sound switched on, and off.
  on: ac => { tone(ac, { from: 660, dur: 0.1, gain: 0.3 }); tone(ac, { from: 990, dur: 0.14, at: 0.07, gain: 0.3 }); },
  off: ac => tone(ac, { from: 660, to: 440, dur: 0.12, gain: 0.3 })
};

export function play(name, { force = false } = {}) {
  if (!enabled && !force) return;
  const cue = cues[name];
  if (!cue) return;
  try {
    const ac = context();
    if (ac) cue(ac);
  } catch {
    // Audio is an enhancement; it must never break an interaction.
  }
}
