import type { ImageMetadata } from 'astro';
import type { Lang } from '../i18n/ui';
import myCashImage from '../assets/projects/my-cash.jpg';
import grindingImage from '../assets/projects/grinding.jpg';
import blckBeltImage from '../assets/projects/blck-belt.jpg';

type Localized = Record<Lang, string>;

export const profile = {
  name: 'Alexis Reillo',
  shortName: 'Alexis',
  role: 'FullStack Developer | AI Engineer',
  location: 'Alicante',
  email: 'alexisreillo12@gmail.com',
  linkedin: 'https://www.linkedin.com/in/alexis-reillo-segarra',
  github: 'https://github.com/Alexis-Reillo-Segarra',
  activeSince: '2023',
};

export const aboutLines: Record<Lang, string[]> = {
  es: [
    'Enamorado de la IA y de los avances que nos ha dado.',
    'Fanático de crear soluciones realmente útiles y optimizadas.',
    'Obsesionado con lo nuevo y con el desarrollo escalable.',
  ],
  en: [
    'In love with AI and the progress it has brought us.',
    'A fanatic about building truly useful, optimised solutions.',
    'Obsessed with what is new and with scalable development.',
  ],
};

export const bag: Localized[] = [
  { es: 'Café', en: 'Coffee' },
  { es: 'Rutas de montaña', en: 'Mountain trails' },
  { es: 'Deporte', en: 'Sport' },
];

export interface Stop {
  kind: 'edu' | 'work';
  period: Localized;
  org: string;
  role: Localized;
  place: string;
  stack?: string[];
  /** What the guide says when he walks up to this stop. */
  comment: Localized;
}

/** Chronological: the horizontal route is walked from left to right. */
export const journey: Stop[] = [
  {
    kind: 'edu',
    period: { es: '2021 — 2023', en: '2021 — 2023' },
    org: 'IES Mare Nostrum',
    role: {
      es: 'CFGS Desarrollo de Aplicaciones Web',
      en: 'Higher Vocational Degree in Web Application Development',
    },
    place: 'Alicante',
    comment: {
      es: 'Aquí empezó todo: dos años de DAW en el IES Mare Nostrum.',
      en: 'It all started here: two years studying web development at IES Mare Nostrum.',
    },
  },
  {
    kind: 'work',
    period: { es: 'Jul. 2023 — May. 2026', en: 'Jul 2023 — May 2026' },
    org: 'GFT Technologies',
    role: { es: 'Backend Developer', en: 'Backend Developer' },
    place: 'Alicante',
    comment: {
      es: 'Mi primer trabajo: casi tres años de backend en GFT.',
      en: 'My first job: almost three years of backend at GFT.',
    },
  },
  {
    kind: 'work',
    period: { es: 'May. 2026 — Actualidad', en: 'May 2026 — Present' },
    org: 'Grupo gtt',
    role: { es: 'Fullstack Developer', en: 'Fullstack Developer' },
    place: 'Alicante',
    stack: ['.NET 10', 'TypeScript', 'React', 'Angular', 'Vue', 'Jenkins', 'Docker', 'AWS'],
    comment: {
      es: 'Y aquí estoy hoy: fullstack en Grupo gtt desde mayo de 2026.',
      en: "And this is where I am today: fullstack at Grupo gtt since May 2026.",
    },
  },
];

export interface SkillGroup {
  type: Localized;
  color: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  { type: { es: 'Lenguajes', en: 'Languages' }, color: 'accent', skills: ['TypeScript', 'Python', 'C#'] },
  { type: { es: 'Frontend', en: 'Frontend' }, color: 'sky', skills: ['React', 'Next.js', 'Angular', 'Vue'] },
  { type: { es: 'Backend', en: 'Backend' }, color: 'olive', skills: ['NestJS', 'FastAPI', '.NET'] },
  { type: { es: 'Cloud', en: 'Cloud' }, color: 'ochre', skills: ['AWS', 'Vercel', 'Cloudflare', 'Supabase'] },
  { type: { es: 'Herramientas', en: 'Tooling' }, color: 'plum', skills: ['Git', 'Docker', 'Jenkins', 'Sentry'] },
];

export const certifications = ['Next.js App Router Fundamentals'];

export interface Project {
  name: string;
  description: Localized;
  stack: string[];
  image: ImageMetadata;
  imageAlt: Localized;
  /** CSS object-position, for screenshots that don't match the card's ratio. */
  imagePosition?: string;
  status?: Localized;
  url?: string;
  repo?: string;
}

export const projects: Project[] = [
  {
    name: 'My Cash',
    description: {
      es: 'Dashboard de finanzas personales: ingresos, gasto libre, ahorro y evolución de los últimos 12 meses. Pensado como PWA.',
      en: 'Personal finance dashboard: income, free spending, savings and a 12-month trend. Built as a PWA.',
    },
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Drizzle', 'Postgres'],
    image: myCashImage,
    imageAlt: {
      es: 'Panel de My Cash con datos de ejemplo',
      en: 'My Cash dashboard with sample data',
    },
    imagePosition: 'left top',
    status: { es: 'En desarrollo', en: 'In development' },
  },
  {
    name: 'Grinding',
    description: {
      es: 'Temporizador de foco para iOS: cada sesión completada da monedas para reformar tu habitación, de cuarto destrozado a setup de gama alta.',
      en: 'Focus timer for iOS: every completed session earns coins to rebuild your room, from a wrecked bedroom to a high-end setup.',
    },
    stack: ['SwiftUI', 'SpriteKit', 'NestJS', 'PostgreSQL', 'Supabase'],
    image: grindingImage,
    imageAlt: {
      es: 'Pantalla de inicio de Grinding con la habitación en pixel art',
      en: 'Grinding home screen with the pixel art room',
    },
    imagePosition: 'center 62%',
  },
  {
    name: 'Blck Belt',
    description: {
      es: 'Mi consultoría de IA. Diseñé y desarrollé su web, con un asistente que responde a partir del contenido de la propia página.',
      en: "My AI consultancy. I designed and built its website, with an assistant that answers from the page's own content.",
    },
    stack: ['Astro', 'TypeScript', 'Tailwind CSS', 'Cloudflare Workers'],
    image: blckBeltImage,
    imageAlt: {
      es: 'Portada de la web de Blck Belt',
      en: 'Blck Belt website hero',
    },
    imagePosition: 'left top',
    url: 'https://blckbelt.es',
  },
];
