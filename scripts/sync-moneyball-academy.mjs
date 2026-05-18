import fs from 'fs/promises';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = process.cwd();
const ACADEMY_DIR = path.join(ROOT, 'academy');
const PUBLIC_ACADEMY_DIR = path.join(ROOT, 'public', 'moneyball', 'academy');
const STATIC_DIR_NAMES = new Set(['data', 'figures', 'site_libs']);
const ROUTABLE_PAGE_BASENAMES = new Set([
  'index',
  'lecture0',
  'lecture1',
  'lecture2',
  'lecture3',
  'lecture4',
  'lecture5',
  'lecture6',
  'lecture7',
  'lecture8',
  'ps0',
  'ps1',
  'ps2',
  'ps3',
  'ps4',
  'ps5',
  'ps6',
  'ps7',
  'ps8',
  'tc_lecture1',
  'tc_lecture2',
  'tc_lecture3',
  'tc_lecture4',
  'tc_lecture5',
  'tc_lecture_data_sources',
  'tc_ps1',
  'tc_ps2',
  'tc_ps3',
]);

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyRecursive(source, destination) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
}

async function listAcademyRmdFiles() {
  const entries = await fs.readdir(ACADEMY_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => {
      if (!entry.isFile() || !entry.name.endsWith('.Rmd')) return false;
      const basename = entry.name.replace(/\.Rmd$/i, '');
      return ROUTABLE_PAGE_BASENAMES.has(basename);
    })
    .map((entry) => path.join(ACADEMY_DIR, entry.name))
    .sort();
}

async function getOutdatedRmdFiles() {
  const rmdFiles = await listAcademyRmdFiles();
  const outdated = [];

  for (const rmdFile of rmdFiles) {
    const htmlFile = rmdFile.replace(/\.Rmd$/i, '.html');
    if (!(await pathExists(htmlFile))) {
      outdated.push(rmdFile);
      continue;
    }

    const [rmdStat, htmlStat] = await Promise.all([fs.stat(rmdFile), fs.stat(htmlFile)]);
    if (rmdStat.mtimeMs > htmlStat.mtimeMs) outdated.push(rmdFile);
  }

  return outdated;
}

function ensureRMarkdownSupport() {
  try {
    execFileSync('Rscript', [
      '-e',
      "ok <- requireNamespace('rmarkdown', quietly = TRUE) && requireNamespace('knitr', quietly = TRUE); if (!ok) quit(status = 1)",
    ], { stdio: 'ignore' });
  } catch {
    throw new Error(
      'Academy source is newer than rendered HTML, but R packages `rmarkdown` and `knitr` are not installed. Install them before building.'
    );
  }
}

function renderRmdFiles(files) {
  if (files.length === 0) return;

  ensureRMarkdownSupport();
  execFileSync(
    'Rscript',
    [
      '-e',
      `
args <- commandArgs(trailingOnly = TRUE)
for (input in args) {
  output_file <- paste0(tools::file_path_sans_ext(basename(input)), ".html")
  rmarkdown::render(
    input = input,
    output_file = output_file,
    output_dir = dirname(input),
    quiet = TRUE,
    envir = new.env(parent = globalenv())
  )
}
      `.trim(),
      ...files,
    ],
    { stdio: 'inherit', cwd: ACADEMY_DIR }
  );
}

async function syncRuntimeAssets() {
  await fs.rm(PUBLIC_ACADEMY_DIR, { recursive: true, force: true });
  await fs.mkdir(PUBLIC_ACADEMY_DIR, { recursive: true });

  const entries = await fs.readdir(ACADEMY_DIR, { withFileTypes: true });
  const assetEntries = entries.filter((entry) => {
    if (!entry.isDirectory()) return false;
    return STATIC_DIR_NAMES.has(entry.name) || entry.name.endsWith('_files');
  });

  for (const entry of assetEntries) {
    const source = path.join(ACADEMY_DIR, entry.name);
    const destination = path.join(PUBLIC_ACADEMY_DIR, entry.name);
    await copyRecursive(source, destination);
  }
}

async function main() {
  const outdated = await getOutdatedRmdFiles();
  renderRmdFiles(outdated);
  await syncRuntimeAssets();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
