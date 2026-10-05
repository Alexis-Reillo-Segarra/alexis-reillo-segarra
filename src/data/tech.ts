/**
 * The technologies named across the site, each with its official logo (from thesvg.org, on a
 * light ground) and brand colour, so a stack reads like a row of type badges.
 */
const logos = import.meta.glob<string>('../assets/tech/*.svg', { eager: true, query: '?url', import: 'default' });
const logo = (name: string) => logos[`../assets/tech/${name}.svg`];

export interface Tech {
  logo: string;
  color: string;
  /** Brand colours too pale to carry light lettering get dark lettering instead. */
  pale?: boolean;
}

const postgres: Tech = { logo: logo('postgresql'), color: '#336791' };
const dotnet: Tech = { logo: logo('dotnet'), color: '#512BD4' };

export const tech: Record<string, Tech> = {
  'Next.js': { logo: logo('nextjs'), color: '#191918' },
  // The official tile keeps its letters in a corner, which reads as off-centre in a disc this small:
  // this copy of it is re-framed around them.
  TypeScript: { logo: logo('typescript'), color: '#3178C6' },
  'Tailwind CSS': { logo: logo('tailwindcss'), color: '#06B6D4', pale: true },
  Drizzle: { logo: logo('drizzle'), color: '#C5F74F', pale: true },
  Postgres: postgres,
  PostgreSQL: postgres,
  // Apple publishes no logo for either framework: SwiftUI wears Swift's, SpriteKit Apple's own.
  SwiftUI: { logo: logo('swift'), color: '#F05138' },
  SpriteKit: { logo: logo('apple'), color: '#5E5D58' },
  NestJS: { logo: logo('nestjs'), color: '#E0234E' },
  Supabase: { logo: logo('supabase'), color: '#3ECF8E', pale: true },
  Astro: { logo: logo('astro'), color: '#BC52EE' },
  'Cloudflare Workers': { logo: logo('cloudflare-workers'), color: '#F38020', pale: true },
  Cloudflare: { logo: logo('cloudflare'), color: '#F38020', pale: true },
  '.NET': dotnet,
  '.NET 10': dotnet,
  'C#': { logo: logo('csharp'), color: '#68217A' },
  Python: { logo: logo('python'), color: '#3776AB' },
  FastAPI: { logo: logo('fastapi'), color: '#009688' },
  React: { logo: logo('react'), color: '#087EA4' },
  Angular: { logo: logo('angular'), color: '#DD0031' },
  Vue: { logo: logo('vue'), color: '#41B883', pale: true },
  AWS: { logo: logo('aws'), color: '#FF9900', pale: true },
  Vercel: { logo: logo('vercel'), color: '#191918' },
  Git: { logo: logo('git'), color: '#F05032' },
  Docker: { logo: logo('docker'), color: '#1D63ED' },
  Jenkins: { logo: logo('jenkins'), color: '#D24939' },
  Sentry: { logo: logo('sentry'), color: '#362D59' },
};
