import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Config lives in src/config/ (not content collections)
const configDir = path.join(process.cwd(), 'src/config');

export interface Deliverable {
  label: string;
  /** GitHub blob path (builds https://github.com/{org}/{repo}/blob/main/{path}). Omit if url is set. */
  path?: string;
  /** External URL (e.g. Wharton Research Notes). Use instead of path for off-repo links. */
  url?: string;
  /** Icon: 'article' (doc with text), 'report' (doc with chart), 'presentation' (slides/screen). */
  icon?: 'article' | 'report' | 'presentation';
}

export interface Project {
  name: string;
  repo: string;
  description: string;
  org_override?: string;
  /** Optional external URL (e.g. arXiv, OSF) for preprint. */
  preprint?: string;
  /** Highlights: awards, publication status, etc. (e.g. "CSAS 2026 Finalist", "In review at JQAS"). */
  highlights?: string[];
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
  const config = yaml.load(content) as ReposConfig;
  for (const program of [config.seminar, config.lab, config.moneyball]) {
    program.projects.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }
  return config;
}

export interface Person {
  name: string;
  role: string;
  bio: string;
  image?: string | null;
  email?: string | null;
  github?: string | null;
  linkedin?: string | null;
  /** @deprecated use projects */
  project?: string;
  /** Project repo slugs (only those on our site). Can be multiple. */
  projects?: string[];
}

export interface PeopleConfig {
  year: number;
  program: string;
  instructors?: Person[];  // optional – shown first per year
  leadership?: Person[];   // optional – e.g. Head TAs, shown after instructors
  people: Person[];
}

interface ProgramEntry {
  program: string;
  year: number;
  type?: 'instructor' | 'organizer' | 'leadership';
  role?: string;
}

interface RosterPerson extends Omit<Person, 'projects'> {
  programs: (string | ProgramEntry)[];
  projects?: string[];
}

interface RosterConfig {
  people: RosterPerson[];
}

function parseProgramEntry(entry: string | ProgramEntry): ProgramEntry {
  if (typeof entry === 'object' && 'program' in entry) {
    return {
      program: entry.program,
      year: entry.year,
      type: entry.type,
      role: entry.role,
    };
  }
  const s = String(entry).trim();
  const parts = s.split(/\s+/);
  if (parts.length < 2) throw new Error(`Invalid program entry: ${entry}`);
  const program = parts[0];
  const year = parseInt(parts[1], 10);
  const type = parts[2] === 'instructor' || parts[2] === 'organizer' || parts[2] === 'leadership' ? parts[2] : undefined;
  return { program, year, type };
}

/** Extract first name for sorting. Strips titles (Dr., Prof., etc.). People are alphabetized by first name. */
function firstNameSortKey(name: string): string {
  const t = name.trim().replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const first = t.split(/\s+/)[0] ?? t;
  return `${first.toLowerCase()}|${t}`;
}

export function sortPeopleByFirstName(people: { name: string }[]): void {
  people.sort((a, b) => firstNameSortKey(a.name).localeCompare(firstNameSortKey(b.name)));
}

export function loadPeople(): PeopleConfig[] {
  const rosterPath = path.join(configDir, 'people', 'roster.yaml');
  if (!fs.existsSync(rosterPath)) return [];
  const content = fs.readFileSync(rosterPath, 'utf8');
  const roster = yaml.load(content) as RosterConfig;
  if (!roster?.people?.length) return [];

  const configMap = new Map<string, PeopleConfig>();
  const key = (program: string, year: number) => `${program}:${year}`;

  for (const r of roster.people) {
    const basePerson: Person = {
      name: r.name,
      role: r.role,
      bio: r.bio ?? '',
      image: r.image,
      email: r.email,
      github: r.github,
      linkedin: r.linkedin,
      projects: r.projects,
    };

    for (const entry of r.programs) {
      const parsed = parseProgramEntry(entry);
      const pk = key(parsed.program, parsed.year);
      if (!configMap.has(pk)) {
        configMap.set(pk, {
          year: parsed.year,
          program: parsed.program,
          instructors: [],
          people: [],
        });
      }
      const config = configMap.get(pk)!;
      const person: Person = {
        ...basePerson,
        role: parsed.role ?? basePerson.role,
      };

      if (parsed.type === 'instructor' || parsed.type === 'organizer') {
        config.instructors = config.instructors || [];
        config.instructors.push(person);
      } else if (parsed.type === 'leadership') {
        config.leadership = config.leadership || [];
        config.leadership.push(person);
      } else {
        config.people.push(person);
      }
    }
  }

  for (const config of configMap.values()) {
    if (config.instructors) sortPeopleByFirstName(config.instructors);
    if (config.leadership) sortPeopleByFirstName(config.leadership);
    sortPeopleByFirstName(config.people);
  }

  const configs = Array.from(configMap.values());
  return configs.sort((a, b) => b.year - a.year);
}

const PROJECT_LINKS: Record<string, { href: string; display: string }> = {
  curlers: { href: '/seminar/projects', display: 'Curling Power Play' },
  'rugby-ep': { href: '/seminar/projects', display: 'Rugby Expected Points' },
  halo2026: { href: '/seminar/projects', display: 'Hockey Forechecking' },
  'nba-lineups': { href: '/lab/projects', display: 'NBA Player Acquisition' },
  'nfl-elo': { href: '/lab/projects', display: 'Pass Rush Elo' },
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

/** Training Camp cohorts from unified roster. Programs: training-camp-june, training-camp-july. More recent first. */
export function loadTrainingCampPeople(): PeopleConfig[] {
  const all = loadPeople();
  const tc = all.filter((c) => c.program.startsWith('training-camp-'));
  return tc.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (b.program === 'training-camp-july' ? 1 : 0) - (a.program === 'training-camp-july' ? 1 : 0);
  });
}

/** GitHub usernames from roster – used as member allowlist for auth */
export function getMemberGithubUsernames(): Set<string> {
  const configs = loadPeople();
  const usernames = new Set<string>();
  for (const c of configs) {
    const add = (p: { github?: string | null }) => {
      if (p.github) usernames.add(String(p.github).toLowerCase());
    };
    c.instructors?.forEach(add);
    c.leadership?.forEach(add);
    c.people.forEach(add);
  }
  return usernames;
}
