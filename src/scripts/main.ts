import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Dialog, initDialogs } from './dialog';
import { initEgg } from './egg';
import { Guide, wave } from './guide';
import { initStage } from './stage';
import { loadPage, switchLanguage } from './lang';
import { isSoundOn, setSound, sfx, unlock, type SfxName } from './sound';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const MOTION_OK = '(prefers-reduced-motion: no-preference)';
/** Any computer screen gets the stage; below this width it is the simplified version. */
const STAGE_MIN_WIDTH = '64rem';
/** The beat of empty page between the intro going and the hero coming in, in seconds. */
const INTRO_PAUSE = 0.45;
/** Sections the docked guide comments on as they come into view, keyed by his line. */
const GUIDE_STOPS: Record<string, string> = {
  hero: '#top',
  about: '#about',
  journey: '#journey',
  skills: '#skills',
  projects: '#projects',
  contact: '#contact',
};

/* ---------- Intro («Press Start») ---------- */

function initIntro(onDone: (played: boolean) => void) {
  const intro = document.querySelector<HTMLElement>('[data-intro-screen]');
  if (!intro || root.dataset.intro !== 'on') return onDone(false);

  const startBtn = intro.querySelector<HTMLElement>('[data-intro-start]')!;
  const main = document.querySelector<HTMLElement>('main');
  main?.setAttribute('inert', '');

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    try {
      sessionStorage.setItem('intro', 'done');
    } catch {
      /* storage unavailable: the intro simply shows again next visit */
    }
    document.removeEventListener('keydown', onKey);
    main?.removeAttribute('inert');
    intro.classList.add('is-leaving');
    intro.addEventListener(
      'animationend',
      () => {
        root.dataset.intro = 'done';
        onDone(true);
      },
      { once: true },
    );
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };

  const dialog = new Dialog(intro.querySelector<HTMLElement>('[data-dialog]')!, close);

  startBtn.addEventListener('click', () => {
    intro.dataset.phase = 'talk';
    wave(intro.querySelector<HTMLElement>('.intro__talk [data-character]'));
    dialog.start();
    dialog.focusNext();
  });
  intro.querySelector('[data-intro-skip]')?.addEventListener('click', close);
  // Choosing a language here changes the words in place: a page load would restart the title screen
  intro.querySelectorAll<HTMLAnchorElement>('[data-intro-lang]').forEach((link) => {
    const warm = () => void loadPage(link.href).catch(() => {});
    link.addEventListener('pointerenter', warm);
    link.addEventListener('focus', warm);
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      switchLanguage(link.href).catch(() => location.assign(link.href));
    });
  });
  document.addEventListener('keydown', onKey);
  startBtn.focus();
}

/* ---------- Scroll animations ---------- */

function initMotion(afterIntro: boolean) {
  const mm = gsap.matchMedia();
  const guideEl = document.querySelector<HTMLElement>('[data-guide]');
  const guide = guideEl ? new Guide(guideEl) : undefined;

  mm.add(MOTION_OK, () => {
    gsap.from('[data-hero]', {
      opacity: 0,
      y: 28,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.09,
      delay: afterIntro ? INTRO_PAUSE : 0,
    });

    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((shape) => {
      gsap.to(shape, {
        yPercent: Number(shape.dataset.parallax),
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08, overwrite: true }),
    });
  });

  // Wide screens get the full stage: Alexis leaves the hero card and travels down the page.
  // Elsewhere he waits in the card and then keeps the visitor company from the bottom corner.
  mm.add({ stage: `(min-width: ${STAGE_MIN_WIDTH}) and ${MOTION_OK}`, always: 'all' }, (context) => {
    if (!guide || !guideEl) return;
    if (context.conditions?.stage) return initStage(guide, guideEl);

    const card = document.querySelector('[data-slot="card"]');
    const watcher = new IntersectionObserver(([entry]) => guide.setSpeaker(entry.isIntersecting ? 'card' : 'guide'));
    if (card) watcher.observe(card);
    else guide.setSpeaker('guide');

    // He greets on arrival and comments on each section as it takes over the screen. On the stage
    // his lines come from the route itself instead.
    for (const [key, selector] of Object.entries(GUIDE_STOPS)) {
      ScrollTrigger.create({
        trigger: selector,
        start: 'top 60%',
        end: 'bottom 60%',
        onToggle: (self) => {
          if (self.isActive) guide.say(key, { wave: key === 'hero' || key === 'contact' });
        },
      });
    }
    return () => watcher.disconnect();
  });

  // Encounter-style wipe into the contact section.
  mm.add(MOTION_OK, () => {
    const wipe = document.querySelector<HTMLElement>('[data-wipe]');
    if (!wipe) return;

    wipe.classList.add('is-on');
    gsap.to(wipe.children, {
      scaleY: 1,
      ease: 'steps(7)',
      stagger: { each: 0.03, from: 'random' },
      scrollTrigger: { trigger: wipe, start: 'top 92%', end: 'top 45%', scrub: true, onEnter: () => sfx.battle() },
    });

    return () => wipe.classList.remove('is-on');
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- Small interactions ---------- */

function initMenu() {
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;

  const setOpen = (open: boolean) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
}

/** Arrow keys move between the options of a battle-style menu. */
function initArrowMenus() {
  document.querySelectorAll<HTMLElement>('[data-arrow-menu]').forEach((menu) => {
    const items = Array.from(menu.querySelectorAll<HTMLElement>('a, button'));
    menu.addEventListener('keydown', (event) => {
      const current = items.indexOf(document.activeElement as HTMLElement);
      if (current < 0) return;
      const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 }[event.key];
      if (!delta) return;
      const next = items[current + delta];
      if (!next) return;
      event.preventDefault();
      next.focus();
    });
  });
}

function initCopy() {
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  let reset = 0;
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy ?? '');
      } catch {
        return;
      }
      if (!status) return;
      status.textContent = button.dataset.copied ?? '';
      window.clearTimeout(reset);
      reset = window.setTimeout(() => {
        status.textContent = status.dataset.default ?? '';
      }, 2500);
    });
  });
}

/** Interface sounds: a blip when the cursor lands on an option, a confirm when it is pressed. */
function initSound() {
  const OPTION = 'a, button, [data-dialog]';
  const toggle = document.querySelector<HTMLElement>('[data-sound-toggle]');
  const state = toggle?.querySelector<HTMLElement>('[data-sound-state]');

  const render = () => {
    toggle?.setAttribute('aria-pressed', String(isSoundOn()));
    if (state) state.textContent = isSoundOn() ? 'ON' : 'OFF';
  };
  render();
  toggle?.addEventListener('click', () => {
    setSound(!isSoundOn());
    render();
    sfx.select();
  });

  // Audio may only start inside a user gesture. Not every first gesture counts (Esc, a touch),
  // so each click tries again; `unlock()` does nothing once everything is playing.
  for (const type of ['pointerdown', 'keydown'] as const) {
    document.addEventListener(type, unlock, { once: true });
  }

  document.addEventListener('click', (event) => {
    unlock();
    const option = (event.target as HTMLElement).closest<HTMLElement>(OPTION);
    if (!option) return;
    const name = option.closest<HTMLElement>('[data-sfx]')?.dataset.sfx ?? 'select';
    if (name in sfx) sfx[name as SfxName]();
  });

  document.addEventListener('mouseover', (event) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>('a, button');
    if (!option || option.contains(event.relatedTarget as Node | null)) return;
    sfx.move();
  });
  document.addEventListener('focusin', (event) => {
    if ((event.target as HTMLElement).matches('a:focus-visible, button:focus-visible')) sfx.move();
  });
}

/** Matches the colour behind the page to the dark closing section, so overscrolling past the bottom shows no light strip. */
function initEdgeColor() {
  const contact = document.querySelector('#contact');
  if (!contact) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) root.dataset.edge = 'dark';
    else delete root.dataset.edge;
  }).observe(contact);
}

initEdgeColor();
initEgg();
initSound();
initMenu();
initArrowMenus();
initCopy();
initIntro((played) => {
  initDialogs();
  initMotion(played);
});
