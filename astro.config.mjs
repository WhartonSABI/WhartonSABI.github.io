// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import favicons from 'astro-favicons';

// https://astro.build/config
export default defineConfig({
  site: 'https://whartonsabi.github.io',
  integrations: [
    favicons({
      input: 'public/images/wharton-logo.png',
    }),
    sitemap({
      lastmod: new Date(),
      namespaces: {
        news: false,
        xhtml: false,
        image: false,
        video: false,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  },
  redirects: {
    '/moneyball': '/moneyball/academy',
    '/moneyball/people': '/moneyball/academy/people',
    '/moneyball/academy/tc/lecture1': '/moneyball/training-camp/lecture1',
    '/moneyball/academy/tc/lecture2': '/moneyball/training-camp/lecture2',
    '/moneyball/academy/tc/lecture3': '/moneyball/training-camp/lecture3',
    '/moneyball/academy/tc/lecture4': '/moneyball/training-camp/lecture4',
    '/moneyball/academy/tc/lecture5': '/moneyball/training-camp/lecture5',
    '/moneyball/academy/tc/data-sources': '/moneyball/training-camp/data-sources',
    '/moneyball/academy/tc/ps1': '/moneyball/training-camp/ps1',
    '/moneyball/academy/tc/ps2': '/moneyball/training-camp/ps2',
    '/moneyball/academy/tc/ps3': '/moneyball/training-camp/ps3',
    '/moneyball/academy/tc/tc-lecture1': '/moneyball/training-camp/lecture1',
    '/moneyball/academy/tc/tc-lecture2': '/moneyball/training-camp/lecture2',
    '/moneyball/academy/tc/tc-lecture3': '/moneyball/training-camp/lecture3',
    '/moneyball/academy/tc/tc-lecture4': '/moneyball/training-camp/lecture4',
    '/moneyball/academy/tc/tc-lecture5': '/moneyball/training-camp/lecture5',
    '/moneyball/academy/tc/tc-data-sources': '/moneyball/training-camp/data-sources',
    '/moneyball/academy/tc/tc-ps1': '/moneyball/training-camp/ps1',
    '/moneyball/academy/tc/tc-ps2': '/moneyball/training-camp/ps2',
    '/moneyball/academy/tc/tc-ps3': '/moneyball/training-camp/ps3',
    '/moneyball/tc/lecture1': '/moneyball/training-camp/lecture1',
    '/moneyball/tc/lecture2': '/moneyball/training-camp/lecture2',
    '/moneyball/tc/lecture3': '/moneyball/training-camp/lecture3',
    '/moneyball/tc/lecture4': '/moneyball/training-camp/lecture4',
    '/moneyball/tc/lecture5': '/moneyball/training-camp/lecture5',
    '/moneyball/tc/data-sources': '/moneyball/training-camp/data-sources',
    '/moneyball/tc/ps1': '/moneyball/training-camp/ps1',
    '/moneyball/tc/ps2': '/moneyball/training-camp/ps2',
    '/moneyball/tc/ps3': '/moneyball/training-camp/ps3',
  },
});