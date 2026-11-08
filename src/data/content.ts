import type { Lang } from '../i18n/ui';

type Localized = Record<Lang, string>;

export const profile = {
  name: 'Alexis Reillo Segarra',
  role: 'FullStack Developer · AI Engineer',
  location: 'Alicante',
  email: 'alexisreillo12@gmail.com',
  linkedin: 'https://www.linkedin.com/in/alexis-reillo-segarra',
  github: 'https://github.com/Alexis-Reillo-Segarra',
};

/** The story, one paragraph per string. */
export const story: Record<Lang, string[]> = {
  es: [
    'Mi historia en esto empieza en 2021, en el ciclo de Desarrollo de Aplicaciones Web del IES Mare Nostrum, en Alicante.',
    'En 2023 llegó mi primer trabajo: casi tres años como backend developer en GFT Technologies. Desde mayo de 2026 soy fullstack developer en Grupo gtt. Por el camino fundé Blck Belt, mi consultoría de IA.',
    'La IA es lo que más me mueve: me fascina todo lo que nos ha dado y me obsesiona construir cosas útiles y bien hechas. Ahora estoy centrado en el machine learning, y aquí iré dejando lo que construya.',
    'Fuera de la pantalla: café, rutas de montaña y deporte.',
  ],
  en: [
    'My story in this starts in 2021, studying Web Application Development at IES Mare Nostrum in Alicante.',
    'In 2023 I landed my first job: almost three years as a backend developer at GFT Technologies. Since May 2026 I have been a fullstack developer at Grupo gtt. Along the way I founded Blck Belt, my AI consultancy.',
    'AI is what drives me: I am fascinated by everything it has given us, and obsessed with building things that are useful and well made. Right now I am focused on machine learning, and this is where I will share what I build.',
    'Away from the screen: coffee, mountain trails and sport.',
  ],
};

export interface Milestone {
  period: Localized;
  title: Localized;
  org: string;
}

/** Newest first. */
export const milestones: Milestone[] = [
  {
    period: { es: 'may. 2026 — hoy', en: 'May 2026 — now' },
    title: { es: 'Fullstack Developer', en: 'Fullstack Developer' },
    org: 'Grupo gtt',
  },
  {
    period: { es: 'jul. 2023 — may. 2026', en: 'Jul 2023 — May 2026' },
    title: { es: 'Backend Developer', en: 'Backend Developer' },
    org: 'GFT Technologies',
  },
  {
    period: { es: '2021 — 2023', en: '2021 — 2023' },
    title: {
      es: 'CFGS Desarrollo de Aplicaciones Web',
      en: 'Higher Vocational Degree in Web Application Development',
    },
    org: 'IES Mare Nostrum',
  },
];

export interface Project {
  name: string;
  year: string;
  /** What it does and with what data, in a sentence or two. */
  summary: Localized;
  /** The headline result, if there is one to show. */
  result?: Localized;
  code?: string;
  demo?: string;
  /** A post, notebook or paper about it. */
  writeup?: string;
}

/**
 * Machine learning projects, newest first. While the list is empty the section says they are on the
 * way. Each one looks like this:
 *
 *   {
 *     name: 'Project name',
 *     year: '2026',
 *     summary: { es: 'Qué hace y con qué datos.', en: 'What it does and on what data.' },
 *     result: { es: 'F1 de 0,91 en test', en: 'F1 of 0.91 on the test set' },
 *     code: 'https://github.com/Alexis-Reillo-Segarra/project-name',
 *   },
 */
export const projects: Project[] = [];
