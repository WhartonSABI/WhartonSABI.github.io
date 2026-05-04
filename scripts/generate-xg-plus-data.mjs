import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_FILE = path.resolve(ROOT, '../lab/projects/xG-plus/paul/tf/sample_1s_all.csv');
const OUT_DIR = path.resolve(ROOT, 'public/xg-plus');
const OUT_GIF_DIR = path.join(OUT_DIR, 'gifs');
const OUT_FILE = path.join(OUT_DIR, 'data.json');
const BBC_GIF_DIR = path.resolve(ROOT, '../lab/projects/xG-plus/bbc');

const MIN_TEAM_SHOTS = 150;
const MIN_ATTACKER_SHOTS = 20;

const GIFS = [
  { file: 'atk268.gif', caption: 'A cutback to Trent Alexander-Arnold creates the game-winning chance.' },
  { file: 'atk285.gif', caption: 'Harvey Elliott dribbles inside and curls the winner past three defenders.' },
  { file: 'atk340.gif', caption: 'Mohamed Salah dribbles inside and curls in a low-angle finish.' },
  { file: 'atk408.gif', caption: 'Jeremy Doku cuts inside and scores.' },
];

const TEAM_CANONICAL = {
  'AFC Bournemouth': 'Bournemouth',
  'West Ham': 'West Ham United',
};

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

function canonicalTeam(name) {
  const trimmed = String(name || '').trim();
  return TEAM_CANONICAL[trimmed] ?? trimmed;
}

function seasonFromDate(dateStr) {
  const d = new Date(dateStr);
  if (!Number.isFinite(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  if (month >= 7) return `${year}-${year + 1}`;
  return `${year - 1}-${year}`;
}

function startYearFromSeason(season) {
  const head = Number(String(season).slice(0, 4));
  return Number.isFinite(head) ? head : null;
}

function ensureModeBucket(map, season, mode) {
  if (!map.has(season)) map.set(season, { teams: new Map(), attackers: new Map() });
  return map.get(season)[mode];
}

function upsertTeam(bucket, name) {
  if (!bucket.has(name)) {
    bucket.set(name, {
      key: name,
      name,
      shotsFor: 0,
      xgPlusFor: 0,
      goalsFor: 0,
      shotsAgainst: 0,
      xgPlusAgainst: 0,
      goalsAgainst: 0,
    });
  }
  return bucket.get(name);
}

function upsertAttacker(bucket, id, name, team) {
  const cleanName = String(name || '').trim();
  const key = cleanName.toLowerCase();
  if (!bucket.has(key)) {
    bucket.set(key, {
      key,
      name: cleanName,
      playerId: id || null,
      shots: 0,
      xgPlusFor: 0,
      goals: 0,
      teams: new Set(),
    });
  }
  const row = bucket.get(key);
  if (team) row.teams.add(team);
  return row;
}

function percentileForRank(index, n) {
  if (n <= 1) return 50;
  return (index / (n - 1)) * 100;
}

function finalizeMode({ seasonBuckets, seasons, minShots, rawScore, extraFields = () => ({}) }) {
  const yearlyValues = new Map();

  for (const season of seasons) {
    const entries = seasonBuckets.get(season) || new Map();
    const accepted = [];

    for (const entity of entries.values()) {
      const shots = entity.shots ?? entity.shotsFor ?? 0;
      if (shots < minShots) continue;
      const raw = rawScore(entity);
      if (!Number.isFinite(raw)) continue;
      accepted.push({
        key: entity.key,
        name: entity.name,
        shots,
        raw,
        goals: entity.goals ?? entity.goalsFor ?? 0,
        teams: entity.teams ? [...entity.teams].sort((a, b) => a.localeCompare(b)) : undefined,
        ...extraFields(entity),
      });
    }

    const mean = accepted.length
      ? accepted.reduce((sum, x) => sum + x.raw, 0) / accepted.length
      : 0;
    const sorted = [...accepted].sort((a, b) => a.raw - b.raw);
    const rankMap = new Map();
    sorted.forEach((row, i) => rankMap.set(row.key, i));

    yearlyValues.set(
      season,
      accepted.map((row) => ({
        ...row,
        centered: row.raw - mean,
        percentile: percentileForRank(rankMap.get(row.key), sorted.length),
      })),
    );
  }

  const byEntity = new Map();

  for (const season of seasons) {
    const year = startYearFromSeason(season);
    const points = yearlyValues.get(season) || [];
    for (const p of points) {
      if (!byEntity.has(p.key)) {
        byEntity.set(p.key, {
          key: p.key,
          name: p.name,
          totalShots: 0,
          centeredSum: 0,
          seasons: new Set(),
          teams: new Set(),
          series: [],
        });
      }
      const entity = byEntity.get(p.key);
      entity.totalShots += p.shots;
      entity.centeredSum += p.centered;
      entity.seasons.add(season);
      (p.teams || []).forEach((team) => entity.teams.add(team));
      entity.series.push({
        season,
        year,
        raw: p.raw,
        centered: p.centered,
        percentile: p.percentile,
        shots: p.shots,
        goals: p.goals,
        forRate: p.forRate,
        againstRate: p.againstRate,
        diffRate: p.diffRate,
      });
    }
  }

  const players = [...byEntity.values()].map((entity) => {
    entity.series.sort((a, b) => a.year - b.year);
    const seasonsPresent = entity.seasons.size;
    const meanCentered = seasonsPresent ? entity.centeredSum / seasonsPresent : 0;
    return {
      name: entity.name,
      seasonsPresent,
      totalShots: entity.totalShots,
      meanCentered,
      teams: entity.teams.size ? [...entity.teams].sort((a, b) => a.localeCompare(b)) : undefined,
      series: entity.series,
    };
  });

  players.sort((a, b) => {
    if (b.meanCentered !== a.meanCentered) return b.meanCentered - a.meanCentered;
    if (b.seasonsPresent !== a.seasonsPresent) return b.seasonsPresent - a.seasonsPresent;
    if (b.totalShots !== a.totalShots) return b.totalShots - a.totalShots;
    return a.name.localeCompare(b.name);
  });

  return players;
}

function buildPayload() {
  const raw = fs.readFileSync(SOURCE_FILE, 'utf8');
  const rows = parseCSV(raw);
  const seasonData = new Map();
  const attackMap = new Map();

  for (const row of rows) {
    const season = seasonFromDate(row.date);
    const homeTeam = canonicalTeam(row.home_name);
    const awayTeam = canonicalTeam(row.away_name);
    const homeId = String(row.home_id || '').trim();
    const awayId = String(row.away_id || '').trim();
    const attackId = String(row.attack_team_id || '').trim();
    const attackMerged = String(row.attack_merged || '').trim();
    const gameId = String(row.game || '').trim();
    const playerName = String(row.player_name || '').trim();
    const playerId = String(row.player_id || '').trim();
    const goalProba = toNum(row.goal_proba) ?? 0;
    const isGoal = toBool(row.is_goal);
    const isShot = toBool(row.is_shot);

    if (!season || !homeTeam || !awayTeam || !homeId || !awayId || !attackId) continue;

    let attackTeam = null;
    let defenseTeam = null;
    if (attackId === homeId) {
      attackTeam = homeTeam;
      defenseTeam = awayTeam;
    } else if (attackId === awayId) {
      attackTeam = awayTeam;
      defenseTeam = homeTeam;
    } else {
      continue;
    }

    // Team-level xG+ should be one value per attack chain, not per 1-second sample.
    const chainId = attackMerged || `shot:${gameId}:${row.period}:${row.periodGameClockTime}:${playerId || playerName}`;
    if (chainId && gameId) {
      const attackKey = `${season}|${gameId}|${chainId}|${attackTeam}|${defenseTeam}`;
      const p = Math.max(0, Math.min(1, goalProba));
      if (!attackMap.has(attackKey)) {
        attackMap.set(attackKey, {
          season,
          attackTeam,
          defenseTeam,
          complementProd: 1 - p,
          isGoal,
        });
      } else {
        const bucket = attackMap.get(attackKey);
        bucket.complementProd *= 1 - p;
        if (isGoal) bucket.isGoal = true;
      }
    }

    // Keep attacker aggregation at shot level using shooter attribution.
    if (isShot && playerName) {
      const attackerBucket = ensureModeBucket(seasonData, season, 'attackers');
      const attacker = upsertAttacker(attackerBucket, playerId, playerName, attackTeam);
      attacker.shots += 1;
      attacker.xgPlusFor += goalProba;
      if (isGoal) attacker.goals += 1;
    }
  }

  for (const attack of attackMap.values()) {
    const teamBucket = ensureModeBucket(seasonData, attack.season, 'teams');
    const attackTeamRow = upsertTeam(teamBucket, attack.attackTeam);
    const defenseTeamRow = upsertTeam(teamBucket, attack.defenseTeam);
    const chainProb = Math.max(0, Math.min(1, 1 - attack.complementProd));

    attackTeamRow.shotsFor += 1;
    attackTeamRow.xgPlusFor += chainProb;
    if (attack.isGoal) attackTeamRow.goalsFor += 1;

    defenseTeamRow.shotsAgainst += 1;
    defenseTeamRow.xgPlusAgainst += chainProb;
    if (attack.isGoal) defenseTeamRow.goalsAgainst += 1;
  }

  const seasons = [...seasonData.keys()].sort((a, b) => a.localeCompare(b));
  const teamPlayers = finalizeMode({
    seasonBuckets: new Map(seasons.map((s) => [s, seasonData.get(s).teams])),
    seasons,
    minShots: MIN_TEAM_SHOTS,
    rawScore: (t) => t.xgPlusFor - t.xgPlusAgainst,
    extraFields: (t) => {
      const forRate = t.xgPlusFor;
      const againstRate = t.xgPlusAgainst;
      return {
        forRate,
        againstRate,
        diffRate: forRate - againstRate,
      };
    },
  });

  const attackerPlayers = finalizeMode({
    seasonBuckets: new Map(seasons.map((s) => [s, seasonData.get(s).attackers])),
    seasons,
    minShots: MIN_ATTACKER_SHOTS,
    rawScore: (a) => a.xgPlusFor,
    extraFields: (a) => {
      const forRate = a.xgPlusFor;
      return {
        forRate,
        againstRate: null,
        diffRate: null,
      };
    },
  });

  return {
    generatedAt: new Date().toISOString(),
    dataSource: {
      file: 'lab/projects/xG-plus/paul/tf/sample_1s_all.csv',
      competition: 'EPL',
      measure: 'teams: attack-level cumulative 1 - product(1 - goal_proba) from 1-second samples; attackers: shot-level goal_proba',
      seasonRule: 'july_boundary',
    },
    seasons,
    metricLabels: {
      centered: 'Centered xG+',
      percentile: 'xG+ Percentile',
    },
    gifs: GIFS.map((g) => ({
      file: g.file,
      src: `xg-plus/gifs/${g.file}`,
      caption: g.caption,
    })),
    modes: {
      teams: {
        label: 'Teams',
        minShotsPerSeason: MIN_TEAM_SHOTS,
        defaultPlayers: teamPlayers.slice(0, 5).map((p) => p.name),
        players: teamPlayers,
      },
      attackers: {
        label: 'Attackers',
        minShotsPerSeason: MIN_ATTACKER_SHOTS,
        defaultPlayers: attackerPlayers.slice(0, 5).map((p) => p.name),
        players: attackerPlayers,
      },
    },
  };
}

function copyGifs() {
  fs.mkdirSync(OUT_GIF_DIR, { recursive: true });
  for (const gif of GIFS) {
    const src = path.join(BBC_GIF_DIR, gif.file);
    const dest = path.join(OUT_GIF_DIR, gif.file);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing GIF source: ${src}`);
    }
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Missing source file: ${SOURCE_FILE}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  copyGifs();
  const payload = buildPayload();
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
  console.log(`[xg-plus] Wrote ${OUT_FILE}`);
}

main();
