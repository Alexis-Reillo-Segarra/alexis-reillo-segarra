import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.alexisreillo.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
});
