import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pose, type Guide } from './guide';

/**
 * The stage: Alexis's whole route down the page, zigzagging from one side of it to the other.
 *
 *   card ─ out over its sill, backwards ─ drop ─ floor (walks left) ─ ladder
 *        ─ journey (walks right, stopping at every node) ─ ladder ─ floor (walks left)
 *        ─ parachute ─ landing
 *
 * Where he is depends only on the scroll position, so the route plays backwards just as well when
 * scrolling up. He trails the scroll by a moment, which turns a wheel step into movement instead of
 * a jump, and a single ticker callback places him with transforms only.
 */

/** Scroll before he stirs. The hero is then pinned while he leaves the card, one beat after another. */
const LEAVE_AT = 30;
/** The card's picture pulls back until all of him fits in it. */
const ZOOM = 90;
/**
 * Out of the card backwards, over the sill of its screen: each pose, the scroll it lasts and how
 * many stage units (two sprite pixels each) below the sill it puts his feet.
 */
const CLIMB_OUT = [
  { pose: 'idle', scroll: 30, below: 0 },
  { pose: 'stand', scroll: 20, below: 0 },
  { pose: 'back', scroll: 30, below: 0 },
  { pose: 'backCrouch', scroll: 45, below: 0 },
  { pose: 'backLeg', scroll: 55, below: 8 },
  { pose: 'back', scroll: 45, below: 13 },
  { pose: 'backLower', scroll: 45, below: 25 },
  { pose: 'backHang', scroll: 50, below: 35 },
];
/** He lets go, falls to the hero's floor and gets up from the crouch he lands in. */
const DROP = 90;
const GET_UP = [
  { pose: 'backCrouch', scroll: 40 },
  { pose: 'back', scroll: 25 },
];
/** How far into his first crossing he is when the hero lets go of the page. */
const HEAD_START = 170;
/** Scroll spent standing still in the journey: on landing, at each stop, and at the last node. */
const LANDING_HOLD = 260;
const STOP_HOLD = 350;
const NEXT_HOLD = 240;
/** Route covered per pixel of scroll on the way to the first stop, which is a whole screen away. */
const FIRST_LEG_PACE = 1.6;
/** Scroll he takes to strap the parachute on, the least the flight may get, and the share of it that is the jump. */
const STRAP = 70;
const MIN_FLIGHT = 520;
const HOP = 0.08;
/** Stage units covered per frame of the walk and of the climb, and the fastest either may tick over. */
const STRIDE = 2.5;
const RUNG = 6;
const MAX_FPS = 14;
/** The walk has twice the frames of the climb, so it may tick over twice as fast. */
const WALK_FPS = 28;
/** How long after stopping he turns to face the visitor. */
const SETTLE_MS = 160;
const WAVE_MS = 1700;
/** How closely he trails the scroll: the time constant of the lag. */
const LAG_MS = 110;
const WALK = ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8'];
const CLIMB = ['backClimb1', 'backClimb2'];

interface Leg {
  from: number;
  to: number;
  /** Where along the route he starts and ends it. */
  r0: number;
  r1: number;
  /** Set on holds: the line he says while standing there. */
  line?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const clamp01 = (n: number) => clamp(n, 0, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
const span = (beats: { scroll: number }[]) => beats.reduce((sum, beat) => sum + beat.scroll, 0);
const beatAt = <T extends { scroll: number }>(beats: T[], into: number) =>
  beats.find((beat) => (into -= beat.scroll) < 0) ?? beats[beats.length - 1];
const centre = (el: Element) => {
  const rect = el.getBoundingClientRect();
  return rect.left + rect.width / 2;
};
const topOf = (el: Element) => el.getBoundingClientRect().top;

export function initStage(guide: Guide, actor: HTMLElement) {
  const root = document.documentElement;
  const $ = <T extends Element = HTMLElement>(selector: string, scope: ParentNode = document) =>
    scope.querySelector<T>(selector);
  const hero = $('.hero');
  const screen = $('[data-slot="card"]');
  const card = screen?.closest<HTMLElement>('.card');
  const avatar = screen && $<SVGElement>('[data-character]', screen);
  const sill = $('[data-sill]');
  const heroFloor = $('[data-floor="hero"]');
  const section = $('[data-journey]');
  const track = $('[data-journey-track]');
  const fill = $('[data-journey-fill]');
  const wayIn = $('[data-journey-in]');
  const leftLane = $('[data-lane="left"]');
  const rightLane = $('[data-lane="right"]');
  const skills = $('#skills');
  const projects = $('#projects');
  const lowFloor = $('[data-floor="projects"]');
  const pack = $('[data-pack]');
  const landing = $('[data-landing]');
  const bubble = $('[data-bubble="guide"]', actor);
  const body = $('[data-guide-body]', actor);
  const sprite = $<SVGElement>('[data-character]', actor);
  if (
    !hero || !screen || !card || !avatar || !sill || !heroFloor || !section || !track || !wayIn || !leftLane ||
    !rightLane || !skills || !projects || !lowFloor  || !landing || !body || !sprite
  ) {
    return () => {};
  }

  root.classList.add('stage');
  section.classList.add('is-horizontal');
  actor.classList.add('is-stage');

  // Everything measured from the layout; refreshed whenever ScrollTrigger recalculates.
  const m = {
    px: 2,
    width: 64,
    height: 96,
    leftX: 0,
    rightX: 0,
    cardX: 0,
    /** Where he stands at the end of the lower floor, to jump off it. */
    edgeX: 0,
    routeY: 0,
    /** The card's tilt, in degrees, and the scale at which its picture of him is the size he is out on the page. */
    tilt: 0,
    zoom: 1,
    /** The length of each ladder. */
    descent: 0,
    lowDescent: 0,
  };
  // The scroll position at which each stretch of the route begins.
  const t = {
    zoom: 0,
    climb: 0,
    drop: 0,
    getUp: 0,
    cross: 0,
    descend: 0,
    journey: 0,
    lowDescend: 0,
    lowCross: 0,
    strap: 0,
    jump: 0,
    end: 0,
    /** Where the lower sections come far enough into view for him to comment on them. */
    skills: 0,
    projects: 0,
  };
  let legs: Leg[] = [];
  let firstNode = 0;
  let pinLength = 0;

  /**
   * The journey's script: across the first screen to the first node, then a stop at every node and
   * on to the next. He ends the first leg in the right-hand lane and stays there while the route
   * moves under him.
   */
  const planJourney = () => {
    const trackLeft = track.getBoundingClientRect().left;
    m.leftX = centre(leftLane);
    m.rightX = centre(rightLane);
    let at = m.leftX;
    let cursor = LANDING_HOLD;
    legs = [{ from: 0, to: cursor, r0: at, r1: at, line: 'journey' }];
    track.querySelectorAll<HTMLElement>('[data-stop]').forEach((stop) => {
      const node = stop.querySelector<HTMLElement>('[data-node]');
      if (!node) return;
      const r = centre(node) - trackLeft;
      const walk = Math.abs(r - at) / (legs.length > 1 ? 1 : FIRST_LEG_PACE);
      legs.push({ from: cursor, to: cursor + walk, r0: at, r1: r });
      cursor += walk;
      const hold = stop.dataset.stop === 'next' ? NEXT_HOLD : STOP_HOLD;
      legs.push({ from: cursor, to: cursor + hold, r0: r, r1: r, line: stop.dataset.stop });
      cursor += hold;
      at = r;
    });
    firstNode = legs[1]?.r1 ?? at;
    pinLength = cursor;
  };

  /** Where on screen he is for a place along the route; the route itself is shifted to match. */
  const onScreen = (r: number) =>
    r >= firstNode ? m.rightX : lerp(m.leftX, m.rightX, (r - m.leftX) / (firstNode - m.leftX || 1));

  const measure = () => {
    const viewport = window.innerHeight;
    const scroll = window.scrollY;
    const doc = (el: Element) => topOf(el) + scroll;

    m.px = root.clientWidth >= 1500 ? 3 : 2;
    m.width = 32 * m.px;
    m.height = 48 * m.px;
    root.style.setProperty('--px', `${m.px}px`);
    actor.style.setProperty('--px', `${m.px}px`);
    // Ladders are as wide as the gap between his raised hands.
    root.style.setProperty('--prop-w', `${m.width * 0.82}px`);

    m.leftX = centre(leftLane);
    m.rightX = centre(rightLane);
    m.cardX = centre(sill);
    m.edgeX = lowFloor.getBoundingClientRect().left + m.width * 0.4;
    m.routeY = wayIn.offsetHeight + 2;
    const turned = new DOMMatrixReadOnly(getComputedStyle(card).transform);
    m.tilt = (Math.atan2(turned.b, turned.a) * 180) / Math.PI;
    m.zoom = m.width / parseFloat(getComputedStyle(avatar).width);

    t.zoom = heroPin.start + LEAVE_AT;
    t.climb = t.zoom + ZOOM;
    t.drop = t.climb + span(CLIMB_OUT);
    t.getUp = t.drop + DROP;
    t.cross = t.getUp + span(GET_UP);
    t.journey = pin.start;
    t.lowDescend = pin.end;
    t.end = ScrollTrigger.maxScroll(window);

    // A floor is somewhere to walk only while it is on screen. He is off each one before it has
    // scrolled so far up that the HUD would cover him or the bubble over his head.
    const ceiling = (document.querySelector<HTMLElement>('.hud')?.offsetHeight ?? 0) + m.height + 110;
    const heroFloorDoc = heroPin.end + heroFloor.offsetTop + Math.min(0, viewport - hero.offsetHeight);
    t.descend = clamp(heroFloorDoc - Math.max(ceiling, viewport * 0.46), t.cross + 260, t.journey - 240);
    m.descent = t.journey + m.routeY - heroFloorDoc;

    // He steps onto the lower floor as it comes up from the bottom of the screen, and the flight
    // from its far end always has some scroll left to happen in.
    const lowFloorDoc = doc(lowFloor);
    t.strap = Math.min(lowFloorDoc - Math.max(ceiling, viewport * 0.3), t.end - MIN_FLIGHT) - STRAP;
    t.lowCross = clamp(lowFloorDoc - (viewport - 48), t.lowDescend + 300, t.strap - 320);
    t.jump = t.strap + STRAP;
    m.lowDescent = lowFloorDoc - (t.lowDescend + m.routeY);

    t.skills = doc(skills) - viewport * 0.6;
    t.projects = doc(projects) - viewport * 0.6;
  };

  planJourney();
  // The pinned sections refresh first, top to bottom, so that everything below them on the page
  // counts the scroll they add.
  const heroPin = ScrollTrigger.create({
    trigger: hero,
    // A hero taller than the screen is pinned by its bottom edge, where the floor he lands on is.
    start: () => (hero.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'),
    end: `+=${LEAVE_AT + ZOOM + span(CLIMB_OUT) + DROP + span(GET_UP) + HEAD_START}`,
    pin: true,
    refreshPriority: 2,
  });
  const pin = ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: () => `+=${pinLength}`,
    pin: true,
    invalidateOnRefresh: true,
    refreshPriority: 1,
    onRefreshInit: () => {
      track.style.transform = '';
      planJourney();
    },
  });
  measure();
  ScrollTrigger.addEventListener('refresh', measure);

  // The picture in the card and the actor bob and blink in step, so one can take over from the other unnoticed.
  for (const animation of document.getAnimations()) {
    const target = (animation.effect as KeyframeEffect | null)?.target;
    if (target && (avatar.contains(target) || sprite.contains(target))) animation.startTime = 0;
  }

  // While the hero is pinned it is not at the top of the page, so its anchor is not either.
  const topLinks = document.querySelectorAll<HTMLElement>('a[href="#top"]');
  const toTop = (event: Event) => {
    event.preventDefault();
    window.scrollTo({ top: 0 });
  };
  topLinks.forEach((link) => link.addEventListener('click', toTop));
  // Nor is the journey's, once it has been pinned: from further down the page it is the end of the route.
  const journeyLinks = document.querySelectorAll<HTMLElement>('a[href="#journey"]');
  const toJourney = (event: Event) => {
    event.preventDefault();
    window.scrollTo({ top: pin.start });
  };
  journeyLinks.forEach((link) => link.addEventListener('click', toJourney));

  /** Whether the card has finished coming in with the rest of the hero: he does not greet from a card nobody can see yet. */
  let arrived = false;
  let waveUntil = 0;
  guide.onWave = () => {
    waveUntil = performance.now() + WAVE_MS;
  };

  /** The scroll position he has caught up with. */
  let p = window.scrollY;
  let trackX = NaN;
  let zoomed = NaN;
  let out: boolean | undefined;
  let frame = '';
  let portrait = '';
  let loose: boolean | undefined;
  let flying = false;
  let flipped = false;
  let beside = false;
  let nudge = 0;
  let facing = -1;
  // His steps: the cycle advances with the ground he covers, on whichever stretch he is on.
  let paces = 0;
  let stretch = '';
  let trod = 0;
  let still = Infinity;
  /** What he was last told to say: a line, `null` to be cut off, `undefined` to finish what he was saying. */
  let said: string | null | undefined;

  const standing = (now: number) => (now < waveUntil ? (Math.floor(now / 190) % 2 ? 'wave1' : 'wave2') : 'idle');

  /** Counts his steps along a stretch from how far along it he is, and returns the ground just covered. */
  const tread = (on: string, at: number, per: number, dt: number, fps = MAX_FPS) => {
    const moved = on === stretch ? at - trod : 0;
    stretch = on;
    trod = at;
    // Faster than a run his legs keep to a run, and he simply covers more ground with each step.
    paces += Math.min(Math.abs(moved) / (per * m.px), (dt * fps) / 1000);
    still = Math.abs(moved) > 0.15 ? 0 : still + dt;
    return moved;
  };

  /** Walking: he faces the way he is going, and turns to the visitor once he has stopped. */
  const walking = (on: string, at: number, dt: number, now: number) => {
    const moved = tread(on, at, STRIDE, dt, WALK_FPS);
    if (Math.abs(moved) > 0.05) facing = moved > 0 ? 1 : -1;
    return still > SETTLE_MS ? standing(now) : WALK[Math.floor(paces) % WALK.length];
  };

  const climbing = (on: string, at: number, dt: number) => {
    tread(on, at, RUNG, dt);
    return CLIMB[Math.floor(paces) % CLIMB.length];
  };

  const speak = (line: string | null | undefined, greet = false) => {
    if (line === said) return;
    said = line;
    if (line) guide.say(line, { wave: greet });
    else if (line === null) guide.hush();
  };

  const update = (_time: number, delta: number) => {
    const now = performance.now();
    const dt = Math.min(delta, 64);
    const scroll = window.scrollY;
    p += (scroll - p) * (1 - Math.exp(-dt / LAG_MS));
    if (Math.abs(scroll - p) < 0.3) p = scroll;

    /* Journey: the route moves under him once he has crossed the first screen */
    const local = clamp(p - t.journey, 0, pinLength);
    const leg = legs.find((l) => local <= l.to) ?? legs[legs.length - 1];
    const r = lerp(leg.r0, leg.r1, clamp01((local - leg.from) / (leg.to - leg.from || 1)));
    const routeX = onScreen(r);
    if (routeX - r !== trackX) {
      trackX = routeX - r;
      track.style.transform = `translate3d(${trackX}px, 0, 0)`;
    }
    if (fill) fill.style.transform = `scaleX(${pinLength ? local / pinLength : 0})`;

    /* In the card: its picture pulls back onto the whole of him before he climbs out of it */
    const zoom = ease(clamp01((p - t.zoom) / ZOOM));
    if (zoom !== zoomed) {
      zoomed = zoom;
      const scale = lerp(1, m.zoom, zoom);
      avatar.style.transform = zoom ? `translateY(${(-100 / 3) * zoom}%) scale(${scale})` : '';
    }
    const leaving = p >= t.climb;
    if (leaving !== out) {
      out = leaving;
      screen.classList.toggle('is-empty', out);
      actor.classList.toggle('is-out', out);
    }
    // He speaks from the card for as long as he is holding on to it.
    guide.setSpeaker(p < t.drop ? 'card' : 'guide', false);
    if (!out) {
      const next = standing(now);
      if (next !== portrait) pose(avatar, (portrait = next));
      arrived ||= getComputedStyle(card).opacity === '1';
      speak(p < t.zoom && arrived ? 'hero' : undefined, true);
      return;
    }

    let x: number;
    let feet: number; // viewport y of his feet
    let next: string;
    /** Whether the ground under him scrolls with the page or is pinned to the screen. */
    let scrolls = true;
    let turn = 1;
    let lean = 0;
    let tilt = 0;
    let fly = false;
    /** At the landing his bubble opens beside him, clear of the contact details over his head. */
    let aside = false;

    if (p < t.getUp) {
      // On the card and off it: everything hangs from the middle of its sill.
      const from = sill.getBoundingClientRect();
      scrolls = !heroPin.isActive;
      let below: number;
      if (p < t.drop) {
        const beat = beatAt(CLIMB_OUT, p - t.climb);
        next = beat.pose === 'idle' ? standing(now) : beat.pose;
        below = beat.below * m.px;
        lean = m.tilt;
        // He turns round by his left: the side view is the half-way point.
        if (beat.pose === 'stand') turn = -1;
      } else {
        const fall = clamp01((p - t.drop) / DROP);
        const hang = CLIMB_OUT[CLIMB_OUT.length - 1].below * m.px;
        next = 'backFall';
        below = lerp(hang, topOf(heroFloor) + 2 - from.top, fall * fall);
        lean = m.tilt * (1 - fall);
        speak(null);
      }
      const angle = (lean * Math.PI) / 180;
      x = from.left - Math.sin(angle) * below;
      feet = from.top + Math.cos(angle) * below;
    } else if (p < t.descend) {
      // On the hero's floor: up from the landing, then across the page to the ladder.
      scrolls = !heroPin.isActive;
      feet = topOf(heroFloor) + 2;
      if (p < t.cross) {
        x = m.cardX;
        next = beatAt(GET_UP, p - t.getUp).pose;
        speak(null);
      } else {
        x = lerp(m.cardX, m.leftX, (p - t.cross) / (t.descend - t.cross));
        next = walking('floor', x, dt, now);
        turn = facing;
        speak('about');
      }
    } else if (p < t.journey) {
      // Down the ladder to the start of the route. Too close to what is beside it to talk.
      const down = (p - t.descend) / (t.journey - t.descend);
      scrolls = !pin.isActive;
      x = m.leftX;
      feet = lerp(topOf(heroFloor) + 2, topOf(section) + m.routeY, down);
      next = climbing('ladder', m.descent * down, dt);
      speak(null);
    } else if (p <= t.lowDescend) {
      // On the route: walking while it moves, facing the visitor while it holds.
      scrolls = !pin.isActive;
      x = routeX;
      feet = topOf(section) + m.routeY;
      next = walking('route', r, dt, now);
      turn = facing;
      if (leg.line) {
        still = Infinity;
        next = standing(now);
        speak(leg.line);
      } else {
        speak(undefined);
      }
    } else if (p < t.lowCross) {
      // Down the ladder past the stack.
      const down = (p - t.lowDescend) / (t.lowCross - t.lowDescend);
      scrolls = !pin.isActive;
      x = m.rightX;
      feet = lerp(topOf(section) + m.routeY, topOf(lowFloor) + 2, down);
      next = climbing('low ladder', m.lowDescent * down, dt);
      speak(p >= t.skills ? 'skills' : undefined);
    } else if (p < t.jump) {
      // Across the lower floor to its far end, where he straps the parachute on.
      x = lerp(m.rightX, m.edgeX, clamp01((p - t.lowCross) / (t.strap - t.lowCross)));
      feet = topOf(lowFloor) + 2;
      if (p < t.strap) {
        next = walking('low floor', x, dt, now);
        turn = facing;
      } else {
        next = 'backPack';
      }
      speak(p >= t.projects ? 'projects' : p >= t.skills ? 'skills' : undefined);
    } else {
      // Off the end of it: a hop, the canopy opens, and he drifts down to the landing at the very end of the page.
      const gone = (p - t.jump) / Math.max(1, t.end - t.jump);
      const flight = clamp01(gone / 0.985);
      const hop = clamp01(flight / HOP);
      const sway = clamp01(Math.min((flight - HOP) * 12, (1 - flight) * 14));
      x = lerp(m.edgeX, m.leftX, ease(hop)) + Math.sin(now / 900) * 9 * sway;
      feet = lerp(topOf(lowFloor) + 2, topOf(landing), flight) - Math.sin(hop * Math.PI) * m.height * 0.3;
      tilt = Math.sin(now / 650) * 5 * sway;
      fly = flight > HOP * 0.6 && flight < 1;
      aside = flight >= 1;
      next = flight < 1 ? (hop < 1 ? 'fall' : 'hang') : gone < 0.995 ? 'land' : standing(now);
      speak(flight >= 1 ? 'contact' : null, true);
    }

    if (next !== frame) pose(sprite, (frame = next));
    if (fly !== flying) {
      flying = fly;
      actor.classList.toggle('is-flying', fly);
    }
    if (scrolls !== loose) {
      loose = scrolls;
      actor.style.position = loose ? 'absolute' : '';
    }
    // His bubble floats over his head, sliding sideways only as far as it takes to stay on screen.
    const page = root.clientWidth;
    if (aside !== beside) {
      beside = aside;
      actor.classList.toggle('is-beside', beside);
    }
    if (bubble?.classList.contains('is-open')) {
      const half = bubble.offsetWidth / 2;
      const room = Math.max(0, half - 22);
      const slide = Math.round(clamp(clamp(0, 16 - (x - half), page - 16 - (x + half)), -room, room));
      if (slide !== nudge) actor.style.setProperty('--nudge', `${(nudge = slide)}px`);
    }
    // Beside him, it opens towards the middle of the page.
    if (flipped ? x > page / 2 + 60 : x < page / 2 - 60) {
      flipped = !flipped;
      actor.classList.toggle('is-flipped', flipped);
    }
    pack?.classList.toggle('is-taken', p >= t.strap);
    // Laid out in the page while the ground scrolls, so he moves with it to the pixel.
    const y = Math.round(feet - m.height + (loose ? scroll : 0));
    actor.style.transform = `translate3d(${Math.round(x - m.width / 2)}px, ${y}px, 0) rotate(${lean}deg)`;
    body.style.transform = `rotate(${tilt}deg) scaleX(${turn})`;
  };

  gsap.ticker.add(update);

  return () => {
    gsap.ticker.remove(update);
    ScrollTrigger.removeEventListener('refresh', measure);
    topLinks.forEach((link) => link.removeEventListener('click', toTop));
    journeyLinks.forEach((link) => link.removeEventListener('click', toJourney));
    heroPin.kill();
    pin.kill();
    guide.onWave = undefined;
    root.classList.remove('stage');
    root.style.removeProperty('--px');
    root.style.removeProperty('--prop-w');
    section.classList.remove('is-horizontal');
    actor.classList.remove('is-stage', 'is-out', 'is-flying', 'is-flipped', 'is-beside');
    actor.style.removeProperty('--nudge');
    screen.classList.remove('is-empty');
    pack?.classList.remove('is-taken');
    avatar.style.transform = '';
    actor.style.position = '';
    actor.style.transform = '';
    actor.style.removeProperty('--px');
    body.style.transform = '';
    track.style.transform = '';
    pose(avatar, 'idle');
    pose(sprite, 'idle');
  };
}
