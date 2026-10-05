/**
 * The easter egg: press every orange stain on the page and night falls, slowly. Night then stays for
 * the rest of the visit: nothing is kept, so reloading the page brings the day back.
 *
 * Nothing in the markup or the stylesheet gives it away. The stains carry no mark (they are picked
 * out here by their colour), and the night palette and every style involved are applied from this
 * script. They lie behind the content, so each click on the page is checked for one under it.
 */

import { chime, nightfall } from './sound';

/** Night: ink and paper trade places, so whatever was dark on light is now light on dark. */
const NIGHT: Record<string, string> = {
  bg: '#1c1b18',
  'bg-2': '#25231f',
  paper: '#2e2c27',
  ink: '#f2eee3',
  'ink-2': '#aaa699',
  rule: 'rgba(242, 238, 227, 0.16)',
  accent: '#e07d55',
  'accent-ink': '#eb9d7e',
  'accent-inv': '#a94f31',
  olive: '#a2a977',
  sky: '#86a8cc',
  ochre: '#d9aa55',
  plum: '#b08cab',
};
/** How strongly a found stain shows. */
const LIT = '0.42';
/** How long the glow takes to cross the screen, in milliseconds. */
const BLOOM_TIME = 2400;

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** The background stains filled with the accent colour. */
function findStains() {
  const probe = document.createElement('i');
  probe.style.color = 'var(--accent)';
  document.body.append(probe);
  const accent = getComputedStyle(probe).color;
  probe.remove();
  return Array.from(document.querySelectorAll<SVGElement>('main svg.drift')).filter(
    (svg) => getComputedStyle(svg).fill === accent,
  );
}

function light(stain: SVGElement) {
  stain.style.transition = 'opacity 0.6s ease-out';
  stain.style.opacity = LIT;
}

/** The stain answers the press with a squeeze. */
function squeeze(stain: SVGElement) {
  if (reducedMotion.matches) return;
  stain.querySelector('path')?.animate([{ scale: 1 }, { scale: 1.16 }, { scale: 0.96 }, { scale: 1 }], {
    duration: 520,
    easing: 'ease-out',
  });
}

/** An orange glow that spreads from the stain to the far corner of the screen and fades as the colours turn. */
function bloom(x: number, y: number) {
  if (reducedMotion.matches) return;
  const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const glow = document.createElement('div');
  Object.assign(glow.style, {
    position: 'fixed',
    zIndex: '59',
    left: `${x}px`,
    top: `${y}px`,
    width: `${reach * 3}px`,
    height: `${reach * 3}px`,
    borderRadius: '50%',
    background: 'radial-gradient(circle, var(--accent) 0, transparent 70%)',
    translate: '-50% -50%',
    pointerEvents: 'none',
  });
  document.body.append(glow);
  glow.animate(
    [
      { scale: 0.04, opacity: 0 },
      { opacity: 0.5, offset: 0.35 },
      { scale: 1, opacity: 0 },
    ],
    { duration: BLOOM_TIME, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' },
  ).onfinish = () => glow.remove();
}

function fallNight() {
  for (const [name, value] of Object.entries(NIGHT)) root.style.setProperty(`--${name}`, value);
  root.style.colorScheme = 'dark';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', NIGHT.bg);
}

export function initEgg() {
  const stains = findStains();
  if (!stains.length) return;

  // The stains take no clicks as they come; their shapes do from here on, so they can be found under one
  for (const stain of stains) {
    const shape = stain.querySelector('path');
    if (!shape) continue;
    shape.style.pointerEvents = 'auto';
    shape.style.transformOrigin = '100px 100px';
  }

  const found = new Set<SVGElement>();

  const onClick = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('main') || target.closest('a, button, [data-dialog]')) return;
    const under = document.elementsFromPoint(event.clientX, event.clientY);
    const stain = stains.find((el) => under.some((hit) => el.contains(hit)));
    if (!stain || found.has(stain)) return;

    found.add(stain);
    light(stain);
    squeeze(stain);
    if (found.size < stains.length) return chime(found.size);

    document.removeEventListener('click', onClick);
    fallNight();
    bloom(event.clientX, event.clientY);
    nightfall();
  };
  document.addEventListener('click', onClick);
}
