import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_DATA_DIR = path.resolve(ROOT, '../seminar/projects/rugby-ep/data');
const SOURCE_BBC_DIR = path.resolve(ROOT, '../seminar/projects/rugby-ep/bbc');
const SOURCE_PAPER_DIR = path.resolve(ROOT, '../seminar/projects/rugby-ep/paper');
const OUT_DIR = path.resolve(ROOT, 'public/rugby-ep');
const OUT_BBC_DIR = path.join(OUT_DIR, 'bbc');
const OUT_FILE = path.join(OUT_DIR, 'data.json');

const SHIFT_FILE = path.join(SOURCE_DATA_DIR, 'decision_bootstrap_shift_summary.csv');
const PRIMARY_FILE = path.join(SOURCE_DATA_DIR, 'decision_bootstrap_primary_summary.csv');
const CASE_FILE = path.join(SOURCE_DATA_DIR, 'case_study_all_penalties_bootstrap_summary.csv');
const CASE_SUMMARY_FILE = path.join(SOURCE_DATA_DIR, 'case_study_summary_metrics_bootstrap.csv');
const CASE_RAW_FILE = path.join(SOURCE_DATA_DIR, 'All Blacks vs South Africa Game Sep 16th.csv');

const FEATURED_GRAPHICS = [
  {
    file: 'delta_plot_bootstrap.png',
    caption: 'Expected-points differential (lineout minus kick) versus meters gained to touch, with 95% bootstrap intervals.',
  },
  {
    file: 'delta_bootstrap_marker.png',
    caption: 'Bootstrap uncertainty at the 20-meter marker scenario for kick, lineout, and their expected-points differential.',
  },
  {
    file: 'kick_attempt_dead_on_intervals.png',
    caption: 'Expected points from kick attempts as a function of location, with uncertainty intervals.',
  },
  {
    file: 'multinomial_bootstrap.png',
    caption: 'Bootstrap uncertainty for the lineout phase-outcome model.',
  },
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? '';
    });
    return row;
  });
}

function parseLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }

  out.push(cur);
  return out;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeTeam(v) {
  const x = String(v || '').trim().toUpperCase();
  if (x === 'AB') return 'NZ';
  return x;
}

function readCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing source file: ${filePath}`);
  }
  return parseCSV(fs.readFileSync(filePath, 'utf8'));
}

function pickGraphicsSourceDir() {
  if (fs.existsSync(SOURCE_BBC_DIR)) return SOURCE_BBC_DIR;
  if (fs.existsSync(SOURCE_PAPER_DIR)) return SOURCE_PAPER_DIR;
  throw new Error(`Missing graphics directory: ${SOURCE_BBC_DIR} and ${SOURCE_PAPER_DIR}`);
}

function copyGraphics() {
  const sourceDir = pickGraphicsSourceDir();
  fs.mkdirSync(OUT_BBC_DIR, { recursive: true });

  const files = fs.readdirSync(sourceDir)
    .filter((name) => name.toLowerCase().endsWith('.png'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(OUT_BBC_DIR, file));
  }
  return files;
}

function loadShiftCurve() {
  const rows = readCSV(SHIFT_FILE)
    .map((r) => ({
      dTouch: toNum(r.d_touch),
      deltaMean: toNum(r.delta_mean),
      deltaLo: toNum(r.delta_lo_2_5),
      deltaHi: toNum(r.delta_hi_97_5),
      prLineoutBetter: toNum(r.pr_lineout_better),
    }))
    .filter((r) => r.dTouch !== null && r.deltaMean !== null && r.deltaLo !== null && r.deltaHi !== null && r.prLineoutBetter !== null)
    .sort((a, b) => a.dTouch - b.dTouch);

  return rows.map((r) => ({
    ...r,
    recommendation: r.deltaMean > 0 ? 'lineout' : 'kick',
  }));
}

function loadPrimarySummary() {
  const rows = readCSV(PRIMARY_FILE)
    .map((r) => ({
      component: String(r.component || ''),
      dTouch: toNum(r.d_touch),
      mean: toNum(r.mean),
      lo: toNum(r.lo_2_5),
      hi: toNum(r.hi_97_5),
    }))
    .filter((r) => r.component && r.dTouch !== null && r.mean !== null && r.lo !== null && r.hi !== null);

  const lineout = rows.find((r) => r.component.startsWith('lineout_ep_d_touch_'));
  const kick = rows.find((r) => r.component === 'kick_attempt_ep');
  const delta = rows.find((r) => r.component.startsWith('delta_ep_d_touch_'));
  const dTouch = lineout?.dTouch ?? kick?.dTouch ?? delta?.dTouch ?? 20;

  return {
    dTouch,
    lineout: lineout ? { mean: lineout.mean, lo: lineout.lo, hi: lineout.hi } : null,
    kick: kick ? { mean: kick.mean, lo: kick.lo, hi: kick.hi } : null,
    delta: delta ? { mean: delta.mean, lo: delta.lo, hi: delta.hi } : null,
  };
}

function loadCaseFeatures() {
  const rows = readCSV(CASE_RAW_FILE);
  return rows.map((r, i) => ({
    id: i + 1,
    team: normalizeTeam(r.Team),
    decision: String(r.Decision || '').trim().toLowerCase(),
    time: toNum(r.Time),
    x: toNum(r['x location']),
    y: toNum(r['y location']),
    yAfterShift: toNum(r.distance_from_try_after_shift),
    lessThan2Min: Number(toNum(r.Less_Than_2_Min_val) ?? 0),
  }));
}

function loadCaseStudy() {
  const features = loadCaseFeatures();
  const rows = readCSV(CASE_FILE);
  return rows.map((r, i) => {
    const f = features[i] ?? {};
    const team = String(r.Team || '').trim();
    const decision = String(r.Decision || '').trim().toLowerCase();
    const optimalDecision = String(r.optimal_decision || '').trim().toLowerCase();

    return {
      id: i + 1,
      label: `Penalty ${i + 1} (${team}, ${decision})`,
      team,
      decision,
      optimalDecision,
      features: {
        team: f.team ?? normalizeTeam(team),
        decision: f.decision ?? decision,
        time: f.time,
        x: f.x,
        y: f.y,
        yAfterShift: f.yAfterShift,
        lessThan2Min: f.lessThan2Min ?? 0,
      },
      lineout: {
        mean: toNum(r.lineout_ep_mean),
        lo: toNum(r.lineout_ep_lo_2_5),
        hi: toNum(r.lineout_ep_hi_97_5),
      },
      kick: {
        mean: toNum(r.kick_ep_mean),
        lo: toNum(r.kick_ep_lo_2_5),
        hi: toNum(r.kick_ep_hi_97_5),
      },
      delta: {
        mean: toNum(r.delta_ep_mean),
        lo: toNum(r.delta_ep_lo_2_5),
        hi: toNum(r.delta_ep_hi_97_5),
      },
      prLineoutBetter: toNum(r.pr_lineout_better),
      regret: {
        mean: toNum(r.R_mean),
        lo: toNum(r.R_lo_2_5),
        hi: toNum(r.R_hi_97_5),
      },
    };
  }).filter((r) => r.lineout.mean !== null && r.kick.mean !== null && r.delta.mean !== null && r.prLineoutBetter !== null);
}

function numberBounds(values, fallback = 0) {
  const clean = values.filter((v) => Number.isFinite(v));
  if (!clean.length) return { min: fallback, max: fallback, default: fallback };
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const mid = clean[Math.floor(clean.length / 2)] ?? min;
  return { min, max, default: mid };
}

function buildCaseFeatureMeta(penalties) {
  const teams = [...new Set(penalties.map((p) => p.features?.team).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const decisions = [...new Set(penalties.map((p) => p.features?.decision).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const lessThan2MinValues = [...new Set(penalties.map((p) => p.features?.lessThan2Min).filter((v) => v === 0 || v === 1))].sort((a, b) => a - b);

  const xBounds = numberBounds(penalties.map((p) => p.features?.x), 16);
  const yBounds = numberBounds(penalties.map((p) => p.features?.y), 40);
  const shiftBounds = numberBounds(penalties.map((p) => p.features?.yAfterShift), 20);
  const timeBounds = numberBounds(penalties.map((p) => p.features?.time), 0);

  const first = penalties[0]?.features ?? {};
  return {
    teams,
    decisions,
    lessThan2MinValues,
    x: { ...xBounds, default: Number.isFinite(first.x) ? first.x : xBounds.default },
    y: { ...yBounds, default: Number.isFinite(first.y) ? first.y : yBounds.default },
    yAfterShift: { ...shiftBounds, default: Number.isFinite(first.yAfterShift) ? first.yAfterShift : shiftBounds.default },
    time: { ...timeBounds, default: Number.isFinite(first.time) ? first.time : timeBounds.default },
    defaults: {
      team: first.team ?? teams[0] ?? 'NZ',
      decision: first.decision ?? decisions[0] ?? 'kick',
      lessThan2Min: first.lessThan2Min === 1 ? 1 : 0,
    },
  };
}

function loadCaseSummary() {
  const row = readCSV(CASE_SUMMARY_FILE)[0] || {};
  return {
    totalRegretMean: toNum(row.total_regret_mean),
    totalRegretLo: toNum(row.total_regret_lo_2_5),
    totalRegretHi: toNum(row.total_regret_hi_97_5),
    propOptimal: toNum(row.prop_optimal),
  };
}

function buildGraphicsList(copiedFiles) {
  const available = new Set(copiedFiles);
  const featured = FEATURED_GRAPHICS
    .filter((g) => available.has(g.file))
    .map((g) => ({
      file: g.file,
      src: `rugby-ep/bbc/${g.file}`,
      caption: g.caption,
    }));

  if (featured.length > 0) return featured;

  return copiedFiles.slice(0, 6).map((file) => ({
    file,
    src: `rugby-ep/bbc/${file}`,
    caption: file.replace(/_/g, ' ').replace(/\.png$/i, ''),
  }));
}

function main() {
  const curve = loadShiftCurve();
  if (!curve.length) {
    throw new Error('No rows found in decision bootstrap shift summary.');
  }
  const penalties = loadCaseStudy();

  const copiedFiles = copyGraphics();
  const payload = {
    generatedAt: new Date().toISOString(),
    dataSource: {
      shiftSummary: path.relative(ROOT, SHIFT_FILE),
      primarySummary: path.relative(ROOT, PRIMARY_FILE),
      caseStudy: path.relative(ROOT, CASE_FILE),
      caseSummary: path.relative(ROOT, CASE_SUMMARY_FILE),
    },
    controls: {
      dTouchMin: curve[0].dTouch,
      dTouchMax: curve[curve.length - 1].dTouch,
      dTouchDefault: 20,
    },
    decisionCurve: curve,
    markerSummary: loadPrimarySummary(),
    caseStudy: {
      penalties,
      featureMeta: buildCaseFeatureMeta(penalties),
      summary: loadCaseSummary(),
    },
    graphics: buildGraphicsList(copiedFiles),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
  console.log(`Copied ${copiedFiles.length} graphics into ${OUT_BBC_DIR}`);
}

main();
