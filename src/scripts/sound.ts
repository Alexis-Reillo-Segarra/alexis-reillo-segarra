/**
 * Chiptune-style interface sounds, synthesised with Web Audio, over a looping jazz track.
 * Browsers only allow audio after a user gesture, so nothing plays until `unlock()` has run inside one.
 *
 * Music: «jazz improv looped» by Pro Sensory (Alex McCulloch), CC0 / public domain.
 * https://opengameart.org/content/jazz-improvisation-looped
 */

import musicUrl from '../assets/audio/jazz-improv-looped.mp3';

const STORAGE_KEY = 'sound';
/** Quiet enough to sit behind the interface sounds. */
const MUSIC_VOLUME = 0.25;

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let music: HTMLAudioElement | undefined;
let enabled = true;
/** Sound belongs to the stage: a window narrowed down to the plain site goes quiet. */
const stage = window.matchMedia('(min-width: 64rem)');

try {
  enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
} catch {
  /* storage unavailable: keep the default */
}

export function isSoundOn() {
  return enabled;
}

export function setSound(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* preference just won't persist */
  }
  if (on) unlock();
  else music?.pause();
}

export function unlock() {
  if (!enabled) return;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  if (!music) {
    music = new Audio(musicUrl);
    music.loop = true;
    music.volume = MUSIC_VOLUME;
  }
  resumeMusic();
}

function resumeMusic() {
  if (!enabled || !music || document.hidden || !stage.matches) return;
  music.play().catch(() => {
    /* not a gesture the browser accepts (Esc, a touch that scrolls): the next `unlock()` retries */
  });
}

// The music does not keep playing in a tab nobody is looking at.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music?.pause();
  else resumeMusic();
});

stage.addEventListener('change', () => {
  if (stage.matches) resumeMusic();
  else music?.pause();
});

interface Note {
  freq: number;
  at?: number;
  length?: number;
  gain?: number;
  type?: OscillatorType;
}

function play(notes: Note[]) {
  if (!enabled || !stage.matches || !ctx || !master || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  for (const { freq, at = 0, length = 0.06, gain = 0.06, type = 'square' } of notes) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(gain, now + at);
    env.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
    osc.connect(env).connect(master);
    osc.start(now + at);
    osc.stop(now + at + length + 0.02);
  }
}

export const sfx = {
  /** One character of dialog text. */
  type: () => play([{ freq: 1320, length: 0.02, gain: 0.02 }]),
  /** Cursor moving onto an option. */
  move: () => play([{ freq: 988, length: 0.04, gain: 0.04 }]),
  /** Confirming an option: the two-step «pi-ko». */
  select: () =>
    play([
      { freq: 1568, length: 0.05 },
      { freq: 2093, at: 0.05, length: 0.1 },
    ]),
  back: () =>
    play([
      { freq: 784, length: 0.05 },
      { freq: 587, at: 0.05, length: 0.09 },
    ]),
  start: () => play([659, 784, 988, 1319].map((freq, i) => ({ freq, at: i * 0.07, length: i === 3 ? 0.22 : 0.07 }))),
  /** Encounter-style zigzag for the wipe into the contact section. */
  battle: () =>
    play(
      Array.from({ length: 10 }, (_, i) => ({
        freq: i % 2 ? 1568 - i * 90 : 784 + i * 70,
        at: i * 0.045,
        length: 0.05,
        gain: 0.045,
      })),
    ),
};

/** One of the hidden stains found: each one rings a step higher than the last. */
export function chime(step: number) {
  const freq = [784, 988, 1175][step - 1] ?? 1175;
  play([
    { freq, length: 0.09 },
    { freq: freq * 1.5, at: 0.08, length: 0.18 },
  ]);
}

/** Night falling: a slow way down the scale. */
export function nightfall() {
  play([1319, 988, 784, 659, 494, 392].map((freq, i) => ({ freq, at: i * 0.16, length: 0.32, gain: 0.07, type: 'triangle' })));
}

export type SfxName = keyof typeof sfx;
