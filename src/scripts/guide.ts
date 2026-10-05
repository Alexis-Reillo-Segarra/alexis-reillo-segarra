import { sfx } from './sound';

const CHAR_DELAY = 24;
/** How long a finished comment stays on screen. */
const HOLD = 5200;
const WAVE_BEATS = 8;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** Where Alexis is: still in the hero card, or out travelling the page. */
export type Speaker = 'card' | 'guide';

/** Puts a character sprite in one of its poses, by the name its layer carries in `data-f`. */
export function pose(sprite: Element | null, name: string) {
  const layer = sprite?.querySelector(`[data-f="${name}"]`);
  if (!sprite || !layer) return;
  sprite.querySelector('.is-on')?.classList.remove('is-on');
  layer.classList.add('is-on');
  sprite.setAttribute('data-frame', name);
}

/** Greeting: alternates the two waving frames for a moment, then returns to idle. */
export function wave(sprite: Element | null, beats = WAVE_BEATS) {
  if (!sprite || reducedMotion.matches) return 0;
  let beat = 0;
  const timer = window.setInterval(() => {
    beat++;
    pose(sprite, beat > beats ? 'idle' : beat % 2 ? 'wave1' : 'wave2');
    if (beat > beats) window.clearInterval(timer);
  }, 190);
  return timer;
}

/**
 * Alexis's commentary. Only one of him is on screen at a time, so each line is spoken from a bubble
 * beside whichever one is currently showing.
 */
export class Guide {
  private lines: Record<string, string>;
  private live: HTMLElement | null;
  private speaker?: Speaker;
  private last?: { key: string; wave: boolean };
  private open = false;
  private typing = 0;
  private closing = 0;
  private waving = 0;
  /** Set by the stage, which animates his poses itself and only needs to know when to greet. */
  onWave?: () => void;

  constructor(private root: HTMLElement) {
    this.lines = JSON.parse(root.dataset.lines ?? '{}');
    this.live = root.querySelector<HTMLElement>('[data-guide-live]');
    root.querySelector('[data-guide-repeat]')?.addEventListener('click', () => {
      this.say(this.last?.key ?? 'hero', { wave: true, force: true });
    });
    root.classList.add('is-on');
  }

  /**
   * Moves Alexis to another place; a line still on screen (or waiting for him) is said again there,
   * unless he is too busy to `carry` it over.
   */
  setSpeaker(speaker: Speaker, carry = true) {
    if (speaker === this.speaker) return;
    const pending = carry && (this.open || !this.speaker) ? this.last : undefined;
    this.close();
    this.speaker = speaker;
    this.root.classList.toggle('is-hidden', speaker !== 'guide');
    if (pending) this.say(pending.key, { wave: pending.wave, force: true });
  }

  say(key: string, { wave: greet = false, force = false } = {}) {
    const text = this.lines[key];
    if (!text || (key === this.last?.key && !force)) return;
    this.last = { key, wave: greet };

    const bubble = this.speaker && document.querySelector<HTMLElement>(`[data-bubble="${this.speaker}"]`);
    if (!bubble) return;

    this.close();
    this.open = true;
    if (this.live) this.live.textContent = text;
    // Sized for the whole line from the start, so it does not grow under the words as they are typed.
    bubble.style.width = '';
    bubble.textContent = text;
    bubble.style.width = `${bubble.offsetWidth}px`;
    bubble.textContent = '';
    bubble.classList.add('is-open');
    if (greet) this.wave();

    const finish = () => {
      bubble.textContent = text;
      this.closing = window.setTimeout(() => this.close(), HOLD);
    };
    if (reducedMotion.matches) return finish();

    let shown = 0;
    const step = () => {
      shown++;
      bubble.textContent = text.slice(0, shown);
      if (shown % 2 === 0) sfx.type();
      if (shown >= text.length) return finish();
      this.typing = window.setTimeout(step, CHAR_DELAY);
    };
    step();
  }

  /** Cuts the comment short: he has his hands full. */
  hush() {
    if (this.open) this.close();
  }

  private wave() {
    if (this.onWave) return this.onWave();
    const scope = this.speaker === 'card' ? document.querySelector('[data-slot="card"]') : this.root;
    window.clearInterval(this.waving);
    this.waving = wave(scope?.querySelector('[data-character]') ?? null);
  }

  private close() {
    window.clearTimeout(this.typing);
    window.clearTimeout(this.closing);
    this.open = false;
    document.querySelectorAll('[data-bubble].is-open').forEach((bubble) => bubble.classList.remove('is-open'));
  }
}
