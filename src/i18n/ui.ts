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
    'hero.quote': '«Hay que imaginarse a Sísifo feliz.»',
    'story.timeline': 'Trayectoria',
    'projects.empty': 'Próximamente: aquí iré publicando mis proyectos de machine learning.',
    'projects.code': 'código',
    'projects.demo': 'demo',
    'projects.writeup': 'artículo',
    'contact.lead': '¿Hablamos?',
    'contact.copy': 'copiar',
    'contact.copied': 'copiado',
    'contact.copiedMsg': 'El email se ha copiado al portapapeles.',
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
    'hero.quote': '“One must imagine Sisyphus happy.”',
    'story.timeline': 'Timeline',
    'projects.empty': 'Coming soon: this is where my machine learning projects will go.',
    'projects.code': 'code',
    'projects.demo': 'demo',
    'projects.writeup': 'write-up',
    'contact.lead': 'Shall we talk?',
    'contact.copy': 'copy',
    'contact.copied': 'copied',
    'contact.copiedMsg': 'The email has been copied to the clipboard.',
  },
} as const;

export type UiKey = keyof (typeof ui)['es'];

export function useTranslations(lang: Lang) {
  return (key: UiKey) => ui[lang][key];
}
