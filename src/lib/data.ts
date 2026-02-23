import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Config lives in src/config/ (not content collections)
const configDir = path.join(process.cwd(), 'src/config');

export interface Deliverable {
  label: string;
  path: string;
}

export interface Project {
  name: string;
  repo: string;
  description: string;
  org_override?: string;
  deliverables?: Deliverable[];
}

export interface ProgramConfig {
  org: string;
  projects: Project[];
}

export interface ReposConfig {
  seminar: ProgramConfig;
  lab: ProgramConfig;
  moneyball: ProgramConfig;
}

export function loadRepos(): ReposConfig {
  const file = path.join(configDir, 'repos.yaml');
  const content = fs.readFileSync(file, 'utf8');
  return yaml.load(content) as ReposConfig;
}

export interface Person {
  name: string;
  role: string;
  bio: string;
  image?: string | null;
  github?: string | null;
  /** @deprecated use projects */
  project?: string;
  /** Project repo slugs (only those on our site). Can be multiple. */
  projects?: string[];
}

export interface PeopleConfig {
  year: number;
  program: string;
  instructors?: Person[];  // optional – shown first per year
  people: Person[];
}

export function loadPeople(): PeopleConfig[] {
  const peopleDir = path.join(configDir, 'people');
  const files = fs.readdirSync(peopleDir).filter((f) => f.endsWith('.yaml'));
  const configs: PeopleConfig[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(peopleDir, file), 'utf8');
    configs.push(yaml.load(content) as PeopleConfig);
  }
  return configs.sort((a, b) => b.year - a.year);
}

export function getRawUrl(org: string, repo: string, filePath: string): string {
  return `https://github.com/${org}/${repo}/raw/main/${filePath}`;
}

const PROJECT_LINKS: Record<string, { href: string; display: string }> = {
  curlers: { href: '/seminar/projects', display: 'Curlers' },
  'rugby-ep': { href: '/seminar/projects', display: 'Rugby Expected Points' },
  halo2026: { href: '/seminar/projects', display: 'Halo 2026' },
  'nba-lineups': { href: '/lab/projects', display: 'NBA Lineups' },
  'nfl-elo': { href: '/lab/projects', display: 'NFL Elo' },
  'server-quality': { href: '/lab/projects', display: 'Server Quality' },
  'xg-plus': { href: '/lab/projects', display: 'xG+' },
  'nba-draft-lottery': { href: '/moneyball/projects', display: 'NBA Draft Lottery' },
  'qb-pressure': { href: '/moneyball/projects', display: 'QB Pressure' },
  'serve-performance': { href: '/moneyball/projects', display: 'Serve Performance' },
  'stolen-base-leads': { href: '/moneyball/projects', display: 'Stolen Base Leads' },
};

export function getProjectLink(repo: string): { href: string; display: string } | null {
  return PROJECT_LINKS[repo] || null;
}
