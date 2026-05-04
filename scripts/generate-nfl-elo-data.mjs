import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_ROOT = path.resolve(ROOT, '../lab/projects/nfl-elo/data/output');
const OUT_FILE = path.resolve(ROOT, 'public/nfl-elo/data.json');
const MATCHUPS_FILE = path.resolve(ROOT, '../lab/projects/nfl-elo/data/input/matchups.csv');
const GAME_IDS_FILE = path.resolve(ROOT, '../lab/projects/nfl-elo/data/input/hudl_iq_game_ids.csv');

const MODELS = [
  { key: 'win', label: 'Win Model', file: 'win/path_uncertainty_weekly_win_bt_ridge.csv' },
  { key: 'severity', label: 'Severity Model', file: 'severity/path_uncertainty_weekly_severity_bt_ridge.csv' },
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

function toBool(v) {
  return String(v).toLowerCase() === 'true';
}

function roleLabel(role) {
  if (role === 'Rusher') return 'Rushers';
  if (role === 'Blocker') return 'Blockers';
  return role;
}

function buildSnapLookup() {
  const gameIdsRaw = fs.readFileSync(GAME_IDS_FILE, 'utf8');
  const gameRows = parseCSV(gameIdsRaw);
  const gameToWeek = new Map();
  for (const r of gameRows) {
    const gid = r.game_id;
    const week = toNum(r.week);
    if (gid && week !== null) gameToWeek.set(gid, week);
  }

  const matchupsRaw = fs.readFileSync(MATCHUPS_FILE, 'utf8');
  const matchupRows = parseCSV(matchupsRaw);
  const snapMap = new Map();

  for (const r of matchupRows) {
    const gid = r.game_id;
    const week = gameToWeek.get(gid);
    if (week === undefined) continue;

    const rusher = r.rusher_name;
    const blocker = r.blocker_name;
    if (rusher) {
      const key = `Rusher|${rusher}|${week}`;
      snapMap.set(key, (snapMap.get(key) ?? 0) + 1);
    }
    if (blocker) {
      const key = `Blocker|${blocker}|${week}`;
      snapMap.set(key, (snapMap.get(key) ?? 0) + 1);
    }
  }

  return snapMap;
}

function modelFromCSV(filePath, snapLookup) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(raw)
    .map((r) => ({
      player: r.player_name,
      role: r.role,
      week: toNum(r.week_index),
      weekNum: toNum(r.week_num),
      playedThisWeek: toBool(r.played_this_week),
      score: toNum(r.observed_score),
    }))
    .filter((r) => r.player && r.role && r.week !== null && r.score !== null);

  const byRole = new Map();

  for (const row of rows) {
    if (!byRole.has(row.role)) byRole.set(row.role, new Map());
    const rolePlayers = byRole.get(row.role);
    if (!rolePlayers.has(row.player)) rolePlayers.set(row.player, []);
    rolePlayers.get(row.player).push(row);
  }

  const roles = {};

  for (const [role, playerMap] of byRole.entries()) {
    const players = [];

    for (const [player, items] of playerMap.entries()) {
      items.sort((a, b) => a.week - b.week);
      let gamesPlayed = 0;
      let scoreSum = 0;
      const series = items.map((r) => {
        if (r.playedThisWeek) gamesPlayed += 1;
        scoreSum += r.score;
        const snapsInGame = snapLookup.get(`${role}|${player}|${r.weekNum}`) ?? 0;
        return {
          week: r.week,
          weekNum: r.weekNum,
          playedThisWeek: r.playedThisWeek,
          gamesPlayed,
          score: r.score,
          snapsInGame,
        };
      });

      players.push({
        name: player,
        role,
        weeksPresent: series.length,
        gamesPlayedFinal: gamesPlayed,
        meanScore: scoreSum / series.length,
        scoreDelta: series[series.length - 1].score - series[0].score,
        series,
      });
    }

    const eligible = players.filter((p) => p.gamesPlayedFinal >= 8);
    const top5 = [...eligible].sort((a, b) => b.meanScore - a.meanScore).slice(0, 5).map((p) => p.name);

    roles[role] = {
      label: roleLabel(role),
      players,
      defaultPlayers: top5,
    };
  }

  return { roles };
}

function main() {
  const snapLookup = buildSnapLookup();

  const payload = {
    generatedAt: new Date().toISOString(),
    season: '2021',
    models: {},
  };

  for (const m of MODELS) {
    const filePath = path.join(SRC_ROOT, m.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing source file: ${filePath}`);
    }
    payload.models[m.key] = {
      label: m.label,
      ...modelFromCSV(filePath, snapLookup),
    };
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(`Wrote ${OUT_FILE}`);
}

main();
