export const languages = { en: 'English', es: 'Español' } as const;
export type Lang = keyof typeof languages;

export const paths: Record<Lang, string> = { en: '/', es: '/es/' };

export const ui = {
  es: {
    'meta.description':
      'Alexis Reillo, FullStack Developer y AI Engineer en Alicante: mi historia y mis proyectos de machine learning.',
    'nav.skip': 'Saltar al contenido',
    'nav.sections': 'Secciones',
    'nav.language': 'Idioma',
    'nav.story': 'historia',
    'nav.projects': 'proyectos',
    'nav.contact': 'contacto',
    'hero.quote': '«La disciplina es el arte de no traicionarte a ti mismo.»',
    'hero.quoteAuthor': 'Marco Aurelio',
    'story.timeline': 'Trayectoria',
    'projects.empty': 'Próximamente: aquí iré publicando mis proyectos de machine learning.',
    'projects.code': 'código',
    'projects.demo': 'demo',
    'projects.writeup': 'artículo',
    'contact.lead': '¿Hablamos?',
  },
  en: {
    'meta.description':
      'Alexis Reillo, FullStack Developer and AI Engineer based in Alicante: my story and my machine learning projects.',
    'nav.skip': 'Skip to content',
    'nav.sections': 'Sections',
    'nav.language': 'Language',
    'nav.story': 'story',
    'nav.projects': 'projects',
    'nav.contact': 'contact',
    'hero.quote': '“Discipline is the art of not betraying yourself.”',
    'hero.quoteAuthor': 'Marcus Aurelius',
    'story.timeline': 'Timeline',
    'projects.empty': 'Coming soon: this is where my machine learning projects will go.',
    'projects.code': 'code',
    'projects.demo': 'demo',
    'projects.writeup': 'write-up',
    'contact.lead': 'Shall we talk?',
  },
} as const;

export type UiKey = keyof (typeof ui)['es'];

export function useTranslations(lang: Lang) {
  return (key: UiKey) => ui[lang][key];
}
