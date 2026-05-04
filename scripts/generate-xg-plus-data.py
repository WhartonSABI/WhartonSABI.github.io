from __future__ import annotations

import json
import math
import shutil
from pathlib import Path

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT.parent / "lab/projects/xG-plus/paul/tf/pl_2022-2025.parquet"
OUT_DIR = ROOT / "public/xg-plus"
OUT_GIF_DIR = OUT_DIR / "gifs"
OUT_FILE = OUT_DIR / "data.json"
BBC_GIF_DIR = ROOT.parent / "lab/projects/xG-plus/bbc"

MIN_TEAM_CHAINS = 150
MIN_ATTACKER_CHANCES = 20

GIFS = [
    {"file": "atk268.gif", "caption": "A cutback to Trent Alexander-Arnold creates the game-winning chance."},
    {"file": "atk285.gif", "caption": "Harvey Elliott dribbles inside and curls the winner past three defenders."},
    {"file": "atk340.gif", "caption": "Mohamed Salah dribbles inside and curls in a low-angle finish."},
    {"file": "atk408.gif", "caption": "Jeremy Doku cuts inside and scores."},
]

TEAM_CANONICAL = {
    "AFC Bournemouth": "Bournemouth",
    "West Ham": "West Ham United",
}


def canonical_team(name: str) -> str:
    n = (name or "").strip()
    return TEAM_CANONICAL.get(n, n)


def season_from_date(date_series: pd.Series) -> pd.Series:
    dt = pd.to_datetime(date_series, errors="coerce")
    year = dt.dt.year
    month = dt.dt.month
    start_year = np.where(month >= 7, year, year - 1)
    return pd.Series(start_year.astype(str) + "-" + (start_year + 1).astype(str), index=date_series.index)


def percentile_from_rank(rank: int, n: int) -> float:
    if n <= 1:
        return 50.0
    return (rank / (n - 1)) * 100.0


def finalize_entities(rows_by_season: dict[str, list[dict]], min_count: int) -> list[dict]:
    by_entity: dict[str, dict] = {}

    for season in sorted(rows_by_season.keys()):
        rows = [r for r in rows_by_season[season] if r["shots"] >= min_count and math.isfinite(r["raw"])]
        if not rows:
            continue

        mean_raw = sum(r["raw"] for r in rows) / len(rows)
        sorted_rows = sorted(rows, key=lambda x: x["raw"])
        rank_map = {r["key"]: i for i, r in enumerate(sorted_rows)}

        for r in rows:
            key = r["key"]
            centered = r["raw"] - mean_raw
            percentile = percentile_from_rank(rank_map[key], len(sorted_rows))
            season_year = int(season[:4])

            if key not in by_entity:
                by_entity[key] = {
                    "name": r["name"],
                    "totalShots": 0,
                    "centeredSum": 0.0,
                    "seasons": set(),
                    "teams": set(),
                    "series": [],
                }

            e = by_entity[key]
            e["totalShots"] += int(r["shots"])
            e["centeredSum"] += centered
            e["seasons"].add(season)
            for t in r.get("teams", []):
                e["teams"].add(t)
            e["series"].append(
                {
                    "season": season,
                    "year": season_year,
                    "raw": r["raw"],
                    "centered": centered,
                    "percentile": percentile,
                    "shots": int(r["shots"]),
                    "goals": int(r["goals"]),
                    "forRate": r.get("forRate"),
                    "againstRate": r.get("againstRate"),
                    "diffRate": r.get("diffRate"),
                }
            )

    out = []
    for e in by_entity.values():
        e["series"].sort(key=lambda x: x["year"])
        seasons_present = len(e["seasons"])
        mean_centered = e["centeredSum"] / seasons_present if seasons_present else 0.0
        out.append(
            {
                "name": e["name"],
                "seasonsPresent": seasons_present,
                "totalShots": e["totalShots"],
                "meanCentered": mean_centered,
                "teams": sorted(e["teams"]) if e["teams"] else None,
                "series": e["series"],
            }
        )

    out.sort(key=lambda x: (-x["meanCentered"], -x["seasonsPresent"], -x["totalShots"], x["name"]))
    return out


def build_payload() -> dict:
    cols = [
        "game",
        "date",
        "home_id",
        "home_name",
        "away_id",
        "away_name",
        "attack_team_id",
        "attack_merged",
        "period",
        "periodGameClockTime",
        "player_id",
        "player_name",
        "is_shot",
        "goal_proba",
        "is_goal",
    ]
    df = pd.read_parquet(SOURCE_FILE, columns=cols)

    df["home_name"] = df["home_name"].astype(str).map(canonical_team)
    df["away_name"] = df["away_name"].astype(str).map(canonical_team)
    df["season"] = season_from_date(df["date"])

    df["home_id"] = df["home_id"].astype(str)
    df["away_id"] = df["away_id"].astype(str)
    df["attack_team_id"] = df["attack_team_id"].astype(str)
    home_mask = df["attack_team_id"] == df["home_id"]
    away_mask = df["attack_team_id"] == df["away_id"]
    df = df[home_mask | away_mask].copy()

    df["attack_team"] = np.where(home_mask.loc[df.index], df["home_name"], df["away_name"])
    df["defense_team"] = np.where(home_mask.loc[df.index], df["away_name"], df["home_name"])

    df["goal_proba"] = pd.to_numeric(df["goal_proba"], errors="coerce").fillna(0.0).clip(0, 1)
    df["is_goal"] = df["is_goal"].astype(bool)
    df["is_shot"] = df["is_shot"].astype(bool)

    # second bucket consolidation (to avoid next-second double counting artifacts)
    df["int_sec"] = pd.to_numeric(df["periodGameClockTime"], errors="coerce").fillna(0).astype(int)
    df["attack_merged"] = df["attack_merged"].fillna(-1).astype(int).astype(str)
    df["chain_key"] = df["game"].astype(str) + "|" + df["attack_merged"]

    sec = (
        df.groupby(
            ["season", "game", "attack_team", "defense_team", "chain_key", "int_sec"], as_index=False
        )
        .agg(sec_p=("goal_proba", "max"), sec_goal=("is_goal", "max"))
    )
    sec["log_comp"] = np.log1p(-sec["sec_p"].clip(0, 1))

    chain = (
        sec.groupby(["season", "game", "attack_team", "defense_team", "chain_key"], as_index=False)
        .agg(sum_log_comp=("log_comp", "sum"), chain_goal=("sec_goal", "max"), chain_secs=("int_sec", "nunique"))
    )
    chain["chain_p"] = 1 - np.exp(chain["sum_log_comp"])
    total_pred = float(chain["chain_p"].sum())
    total_goals = float(chain["chain_goal"].sum())
    correction_factor = (total_goals / total_pred) if total_pred > 0 else 1.0

    for_team = (
        chain.groupby(["season", "attack_team"], as_index=False)
        .agg(shotsFor=("chain_key", "nunique"), xgPlusFor=("chain_p", "sum"), goalsFor=("chain_goal", "sum"))
        .rename(columns={"attack_team": "team"})
    )
    against_team = (
        chain.groupby(["season", "defense_team"], as_index=False)
        .agg(
            shotsAgainst=("chain_key", "nunique"),
            xgPlusAgainst=("chain_p", "sum"),
            goalsAgainst=("chain_goal", "sum"),
        )
        .rename(columns={"defense_team": "team"})
    )
    team = for_team.merge(against_team, how="outer", on=["season", "team"]).fillna(0)
    team["xgPlusFor"] = team["xgPlusFor"] * correction_factor
    team["xgPlusAgainst"] = team["xgPlusAgainst"] * correction_factor
    team["diff"] = team["xgPlusFor"] - team["xgPlusAgainst"]

    # Attacker view (chance-level cumulative xG+ by player)
    players = df.copy()
    players["player_name"] = players["player_name"].astype(str).str.strip()
    players = players[players["player_name"] != ""]

    sec_player = (
        players.groupby(
            ["season", "player_name", "game", "chain_key", "int_sec"], as_index=False
        )
        .agg(sec_p=("goal_proba", "max"), sec_goal=("is_goal", "max"))
    )
    sec_player["log_comp"] = np.log1p(-sec_player["sec_p"].clip(0, 1))

    chain_player = (
        sec_player.groupby(["season", "player_name", "game", "chain_key"], as_index=False)
        .agg(sum_log_comp=("log_comp", "sum"), chance_secs=("int_sec", "nunique"))
    )
    chain_player["chain_p"] = 1 - np.exp(chain_player["sum_log_comp"])
    chain_player["chain_p"] = chain_player["chain_p"] * correction_factor

    att = (
        chain_player.groupby(["season", "player_name"], as_index=False)
        .agg(chances=("chain_key", "nunique"), xgPlusFor=("chain_p", "sum"))
        .rename(columns={"player_name": "name"})
    )
    goals_by_player = (
        players[players["is_goal"]]
        .groupby(["season", "player_name"], as_index=False)
        .size()
        .rename(columns={"player_name": "name", "size": "goals"})
    )
    att = att.merge(goals_by_player, on=["season", "name"], how="left")
    att["goals"] = att["goals"].fillna(0).astype(int)

    att_teams = (
        players.groupby(["season", "player_name"])["attack_team"]
        .agg(lambda x: sorted(set(x)))
        .reset_index()
        .rename(columns={"player_name": "name", "attack_team": "teams"})
    )
    att = att.merge(att_teams, on=["season", "name"], how="left")

    seasons = sorted(df["season"].dropna().unique().tolist())

    team_rows_by_season: dict[str, list[dict]] = {s: [] for s in seasons}
    for _, r in team.iterrows():
        season = r["season"]
        team_rows_by_season[season].append(
            {
                "key": r["team"],
                "name": r["team"],
                "shots": int(r["shotsFor"]),
                "raw": float(r["diff"]),
                "goals": int(r["goalsFor"]),
                "forRate": float(r["xgPlusFor"]),
                "againstRate": float(r["xgPlusAgainst"]),
                "diffRate": float(r["diff"]),
            }
        )

    att_rows_by_season: dict[str, list[dict]] = {s: [] for s in seasons}
    for _, r in att.iterrows():
        season = r["season"]
        att_rows_by_season[season].append(
            {
                "key": str(r["name"]).strip().lower(),
                "name": r["name"],
                "shots": int(r["chances"]),
                "raw": float(r["xgPlusFor"]),
                "goals": int(r["goals"]),
                "forRate": float(r["xgPlusFor"]),
                "againstRate": None,
                "diffRate": None,
                "teams": r["teams"] if isinstance(r["teams"], list) else [],
            }
        )

    team_players = finalize_entities(team_rows_by_season, MIN_TEAM_CHAINS)
    attacker_players = finalize_entities(att_rows_by_season, MIN_ATTACKER_CHANCES)

    return {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "dataSource": {
            "file": "lab/projects/xG-plus/paul/tf/pl_2022-2025.parquet",
            "competition": "EPL",
            "measure": "teams: second-bucketed chain cumulative 1 - product(1 - p); attackers: player-chain cumulative 1 - product(1 - p)",
            "seasonRule": "july_boundary",
            "visualScaleCorrectionFactor": correction_factor,
            "visualScaleCorrectionBasis": "global_goals_over_global_predicted_chain_sum",
        },
        "seasons": seasons,
        "metricLabels": {
            "centered": "Centered xG+",
            "percentile": "xG+ Percentile",
        },
        "gifs": [{"file": g["file"], "src": f"xg-plus/gifs/{g['file']}", "caption": g["caption"]} for g in GIFS],
        "modes": {
            "teams": {
                "label": "Teams",
                "minShotsPerSeason": MIN_TEAM_CHAINS,
                "defaultPlayers": [p["name"] for p in team_players[:5]],
                "players": team_players,
            },
            "attackers": {
                "label": "Attackers",
                "minShotsPerSeason": MIN_ATTACKER_CHANCES,
                "defaultPlayers": [p["name"] for p in attacker_players[:5]],
                "players": attacker_players,
            },
        },
    }


def copy_gifs() -> None:
    OUT_GIF_DIR.mkdir(parents=True, exist_ok=True)
    for gif in GIFS:
        src = BBC_GIF_DIR / gif["file"]
        if not src.exists():
            raise FileNotFoundError(f"Missing GIF source: {src}")
        shutil.copy2(src, OUT_GIF_DIR / gif["file"])


def main() -> None:
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Missing source file: {SOURCE_FILE}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    copy_gifs()
    payload = build_payload()
    OUT_FILE.write_text(json.dumps(payload) + "\n", encoding="utf-8")
    print(f"[xg-plus] Wrote {OUT_FILE}")


if __name__ == "__main__":
    main()
