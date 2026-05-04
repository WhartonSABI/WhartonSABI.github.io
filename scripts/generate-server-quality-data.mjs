import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.resolve(ROOT, '../lab/projects/server-quality/figures/bbc_visuals/historical_sqs');
const OUT_FILE = path.resolve(ROOT, 'public/server-quality/data.json');

const TOURNAMENTS = [
  { key: 'wimb', label: 'Wimbledon' },
  { key: 'us', label: 'US Open' },
];
const GENDERS = [
  { key: 'men', label: 'Men' },
  { key: 'women', label: 'Women' },
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseLine(line);
    const out = {};
    headers.forEach((h, i) => {
      out[h] = cols[i] ?? '';
    });
    return out;
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

function buildGroup(tournament, gender) {
  const file = path.join(SRC_DIR, `historical_projected_sqs_${tournament}_${gender}.csv`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing source file: ${file}`);
  }

  const raw = fs.readFileSync(file, 'utf8');
  const rows = parseCSV(raw)
    .map((r) => ({
      year: toNum(r.year),
      player: r.ServerName,
      centered: toNum(r.SQS_FE_centered),
      percentile: toNum(r.SQS_percentile),
      serves: toNum(r.n_serves),
      rank: toNum(r.SQS_rank),
    }))
    .filter((r) => r.year && r.player && r.centered !== null && r.percentile !== null && r.serves !== null);

  const byPlayer = new Map();
  const yearSet = new Set();

  for (const row of rows) {
    yearSet.add(row.year);
    if (!byPlayer.has(row.player)) {
      byPlayer.set(row.player, {
        player: row.player,
        series: [],
        years: new Set(),
        totalServes: 0,
        centeredSum: 0,
      });
    }

    const p = byPlayer.get(row.player);
    p.series.push({
      year: row.year,
      centered: row.centered,
      percentile: row.percentile,
      serves: row.serves,
      rank: row.rank,
    });
    p.years.add(row.year);
    p.totalServes += row.serves;
    p.centeredSum += row.centered;
  }

  const players = Array.from(byPlayer.values()).map((p) => {
    p.series.sort((a, b) => a.year - b.year);
    const yearsPresent = p.years.size;
    const meanCentered = p.centeredSum / yearsPresent;
    return {
      name: p.player,
      yearsPresent,
      totalServes: Math.round(p.totalServes),
      meanCentered,
      series: p.series,
    };
  });

  players.sort((a, b) => {
    if (b.meanCentered !== a.meanCentered) return b.meanCentered - a.meanCentered;
    if (b.yearsPresent !== a.yearsPresent) return b.yearsPresent - a.yearsPresent;
    return b.totalServes - a.totalServes;
  });

  const recurring = players
    .filter((p) => p.yearsPresent >= 5)
    .sort((a, b) => {
      if (b.yearsPresent !== a.yearsPresent) return b.yearsPresent - a.yearsPresent;
      if (b.meanCentered !== a.meanCentered) return b.meanCentered - a.meanCentered;
      return b.totalServes - a.totalServes;
    });

  const defaultPlayers = recurring.slice(0, 10).map((p) => p.name);
  const years = Array.from(yearSet).sort((a, b) => a - b);

  return {
    years,
    defaultPlayers,
    players,
  };
}

function main() {
  const payload = {
    generatedAt: new Date().toISOString(),
    metricDefaults: {
      defaultMetric: 'centered',
      labels: {
        centered: 'Centered SQS',
        percentile: 'SQS Percentile',
      },
    },
    tournaments: {},
  };

  for (const t of TOURNAMENTS) {
    payload.tournaments[t.key] = {
      label: t.label,
      genders: {},
    };

    for (const g of GENDERS) {
      payload.tournaments[t.key].genders[g.key] = {
        label: g.label,
        ...buildGroup(t.key, g.key),
      };
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload)}\n`, 'utf8');

  console.log(`Wrote ${OUT_FILE}`);
}

main();
