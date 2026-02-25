import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

/** Academy HTML files live in the website repo for independent builds */
const ACADEMY_SOURCE = path.join(process.cwd(), 'academy');
const BASE_PATH = '/moneyball/academy';
const TC_BASE_PATH = '/moneyball/training-camp';

/** Maps our routes to source HTML files */
export const ACADEMY_PAGES: Record<string, { file: string; title: string }> = {
  index: { file: 'index.html', title: 'Wharton Moneyball Camps 2025' },
  lecture0: { file: 'lecture0.html', title: 'Lecture 0' },
  ps0: { file: 'ps0.html', title: 'Problem Set 0' },
  lecture1: { file: 'lecture1.html', title: 'Lecture 1' },
  lecture2: { file: 'lecture2.html', title: 'Lecture 2' },
  lecture3: { file: 'lecture3.html', title: 'Lecture 3' },
  lecture4: { file: 'lecture4.html', title: 'Lecture 4' },
  lecture5: { file: 'lecture5.html', title: 'Lecture 5' },
  lecture6: { file: 'lecture6.html', title: 'Lecture 6' },
  lecture7: { file: 'lecture7.html', title: 'Lecture 7' },
  lecture8: { file: 'lecture8.html', title: 'Lecture 8' },
  ps1: { file: 'ps1.html', title: 'Problem Set 1' },
  ps2: { file: 'ps2.html', title: 'Problem Set 2' },
  ps3: { file: 'ps3.html', title: 'Problem Set 3' },
  ps4: { file: 'ps4.html', title: 'Problem Set 4' },
  ps5: { file: 'ps5.html', title: 'Problem Set 5' },
  ps6: { file: 'ps6.html', title: 'Problem Set 6' },
  ps7: { file: 'ps7.html', title: 'Problem Set 7' },
  ps8: { file: 'ps8.html', title: 'Problem Set 8' },
};

export const TC_PAGES: Record<string, { file: string; title: string }> = {
  lecture1: { file: 'tc_lecture1.html', title: 'Lecture 1' },
  lecture2: { file: 'tc_lecture2.html', title: 'Lecture 2' },
  lecture3: { file: 'tc_lecture3.html', title: 'Lecture 3' },
  lecture4: { file: 'tc_lecture4.html', title: 'Lecture 4' },
  lecture5: { file: 'tc_lecture5.html', title: 'Lecture 5' },
  'data-sources': { file: 'tc_lecture_data_sources.html', title: 'Data Sources' },
  ps1: { file: 'tc_ps1.html', title: 'Problem Set 1' },
  ps2: { file: 'tc_ps2.html', title: 'Problem Set 2' },
  ps3: { file: 'tc_ps3.html', title: 'Problem Set 3' },
};

const FILE_TO_ROUTE: Record<string, string> = {
  index: '',
  lecture0: 'lecture0',
  lecture1: 'lecture1',
  lecture2: 'lecture2',
  lecture3: 'lecture3',
  lecture4: 'lecture4',
  lecture5: 'lecture5',
  lecture6: 'lecture6',
  lecture7: 'lecture7',
  lecture8: 'lecture8',
  ps0: 'ps0',
  ps1: 'ps1',
  ps2: 'ps2',
  ps3: 'ps3',
  ps4: 'ps4',
  ps5: 'ps5',
  ps6: 'ps6',
  ps7: 'ps7',
  ps8: 'ps8',
  tc_lecture1: 'lecture1',
  tc_lecture2: 'lecture2',
  tc_lecture3: 'lecture3',
  tc_lecture4: 'lecture4',
  tc_lecture5: 'lecture5',
  tc_lecture_data_sources: 'data-sources',
  tc_ps1: 'ps1',
  tc_ps2: 'ps2',
  tc_ps3: 'ps3',
};

function rewriteHref(href: string): string {
  if (!href || href.startsWith('#') || href.startsWith('http')) return href;
  const clean = href.replace(/\.html$/, '');
  const route = FILE_TO_ROUTE[clean] ?? (clean.startsWith('tc_') ? clean.replace('tc_', '').replace(/_/g, '-') : clean);
  const isTc = clean.startsWith('tc_');
  const base = isTc ? TC_BASE_PATH : BASE_PATH;
  return `${base}/${route}`.replace(/\/$/, '') || base;
}

function rewriteSrc(src: string): string {
  if (!src || src.startsWith('data:') || src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `${BASE_PATH}/${src}`;
}

export function extractAcademyContent(htmlPath: string, slug: string): { title: string; content: string } {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);

  $('script, style, .navbar, .dropdown, link[rel="stylesheet"]').remove();

  const mainContainer = $('.main-container').first();
  if (!mainContainer.length) throw new Error(`No main-container in ${htmlPath}`);

  const header = mainContainer.find('#header').first();
  const title = header.find('h1').text().trim() || $('title').text().trim();
  // Keep header (with h1 title) in content so it displays on the page
  // header.remove();

  const contentEl = mainContainer.children().not('script').get();
  let contentHtml = '';
  for (const el of contentEl) {
    contentHtml += $.html(el);
  }

  const $content = cheerio.load(contentHtml, { decodeEntities: false });

  $content('a[href]').each((_, el) => {
    const href = $content(el).attr('href');
    if (href) $content(el).attr('href', rewriteHref(href));
  });
  $content('img[src]').each((_, el) => {
    const src = $content(el).attr('src');
    if (src) $content(el).attr('src', rewriteSrc(src));
  });

  let content = $content.html() || '';
  if (slug === 'index') {
    // The Academy landing page is for the 2025 camp; ensure the intro copy matches.
    content = content.replace(
      /the webpage for the\s+2024\s+Wharton Moneyball Academy\s*\/\s*Training Camp/gi,
      'the webpage for the 2025 Wharton Moneyball Academy / Training Camp'
    );
    content = content.replace(/\b2024\s+Wharton Moneyball Academy\b/g, '2025 Wharton Moneyball Academy');
  }

  return { title, content };
}

export function loadAcademyPage(slug: string): { title: string; content: string } | null {
  const entry = ACADEMY_PAGES[slug];
  if (!entry) return null;
  const htmlPath = path.join(ACADEMY_SOURCE, entry.file);
  if (!fs.existsSync(htmlPath)) return null;
  return extractAcademyContent(htmlPath, slug);
}

export function loadTcPage(slug: string): { title: string; content: string } | null {
  const entry = TC_PAGES[slug];
  if (!entry) return null;
  const htmlPath = path.join(ACADEMY_SOURCE, entry.file);
  if (!fs.existsSync(htmlPath)) return null;
  return extractAcademyContent(htmlPath, slug);
}
