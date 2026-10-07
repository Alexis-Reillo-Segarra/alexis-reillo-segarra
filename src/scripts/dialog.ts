import { sfx } from './sound';

const CHAR_DELAY = 28;
const PAUSE_DELAY = 220;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

type State = 'idle' | 'typing' | 'waiting' | 'done';

/** DS-style text box: types each line, waits for a press, then moves on. */
export class Dialog {
  private lines: string[] = [];
  private textEl: HTMLElement;
  private index = 0;
  private timer = 0;
  private state: State = 'idle';
  private closable: boolean;

  constructor(
    private el: HTMLElement,
    private onClose?: () => void,
  ) {
    this.textEl = el.querySelector<HTMLElement>('[data-dialog-text]')!;
    this.closable = 'closable' in el.dataset;
    el.addEventListener('click', () => this.advance());
  }

  start() {
    if (this.state !== 'idle') return;
    // Read only now: the lines can still change language while the dialog waits
    this.lines = JSON.parse(this.el.dataset.lines ?? '[]');
    this.typeLine();
  }

  focusNext() {
    this.el.querySelector<HTMLElement>('[data-dialog-next]')?.focus();
  }

  private setState(state: State) {
    this.state = state;
    this.el.dataset.state = state;
  }

  private typeLine() {
    const line = this.lines[this.index];
    this.setState('typing');
    if (reducedMotion.matches) return this.finishLine();

    let shown = 0;
    const step = () => {
      shown++;
      this.textEl.textContent = line.slice(0, shown);
      if (shown % 2 === 0 && line[shown - 1] !== ' ') sfx.type();
      if (shown >= line.length) return this.finishLine();
      const pause = /[.,!?…]/.test(line[shown - 1]) ? PAUSE_DELAY : CHAR_DELAY;
      this.timer = window.setTimeout(step, pause);
    };
    step();
  }

  private finishLine() {
    window.clearTimeout(this.timer);
    this.textEl.textContent = this.lines[this.index];
    const isLast = this.index === this.lines.length - 1;
    this.setState(isLast && !this.closable ? 'done' : 'waiting');
  }

  private advance() {
    if (this.state === 'typing') return this.finishLine();
    if (this.state !== 'waiting') return;
    if (this.index === this.lines.length - 1) {
      this.setState('done');
      this.onClose?.();
      return;
    }
    this.index++;
    this.typeLine();
  }
}

/** Dialogs not marked as manual start typing the first time they scroll into view. */
export function initDialogs() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        dialogs.get(entry.target)?.start();
      }
    },
    { threshold: 0.6 },
  );
  const dialogs = new Map<Element, Dialog>();
  document.querySelectorAll<HTMLElement>('[data-dialog]:not([data-manual])').forEach((el) => {
    dialogs.set(el, new Dialog(el));
    observer.observe(el);
  });
}
