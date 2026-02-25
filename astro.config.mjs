// @ts-check
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const websiteRoot = path.resolve(__dirname, '.');
['.env', '.env.local', '.env.development'].forEach((f) => dotenv.config({ path: path.join(websiteRoot, f) }));

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  vite: {
    plugins: [tailwindcss()],
    envPrefix: ['GITHUB_', 'SESSION_'],
  },
  redirects: {
    '/data': '/members/data',
    '/seminar/data': '/members/data',
    '/lab/data': '/members/data',
    '/moneyball/data': '/members/data',
    '/moneyball': '/moneyball/academy',
    '/moneyball/academy/tc/lecture1': '/moneyball/tc/lecture1',
    '/moneyball/academy/tc/lecture2': '/moneyball/tc/lecture2',
    '/moneyball/academy/tc/lecture3': '/moneyball/tc/lecture3',
    '/moneyball/academy/tc/lecture4': '/moneyball/tc/lecture4',
    '/moneyball/academy/tc/lecture5': '/moneyball/tc/lecture5',
    '/moneyball/academy/tc/data-sources': '/moneyball/tc/data-sources',
    '/moneyball/academy/tc/ps1': '/moneyball/tc/ps1',
    '/moneyball/academy/tc/ps2': '/moneyball/tc/ps2',
    '/moneyball/academy/tc/ps3': '/moneyball/tc/ps3',
    '/moneyball/academy/tc/tc-lecture1': '/moneyball/tc/lecture1',
    '/moneyball/academy/tc/tc-lecture2': '/moneyball/tc/lecture2',
    '/moneyball/academy/tc/tc-lecture3': '/moneyball/tc/lecture3',
    '/moneyball/academy/tc/tc-lecture4': '/moneyball/tc/lecture4',
    '/moneyball/academy/tc/tc-lecture5': '/moneyball/tc/lecture5',
    '/moneyball/academy/tc/tc-data-sources': '/moneyball/tc/data-sources',
    '/moneyball/academy/tc/tc-ps1': '/moneyball/tc/ps1',
    '/moneyball/academy/tc/tc-ps2': '/moneyball/tc/ps2',
    '/moneyball/academy/tc/tc-ps3': '/moneyball/tc/ps3',
  },
});