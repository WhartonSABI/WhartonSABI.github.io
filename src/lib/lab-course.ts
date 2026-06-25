export interface CourseLink {
  label: string;
  url?: string;
}

export interface CourseDay {
  isoDate: string;
  displayDate: string;
  isNoClass?: boolean;
  lecture: CourseLink;
  lab: CourseLink;
  data: CourseLink[];
  additionalReadings: CourseLink[];
}

export interface LabCourseYear {
  year: number;
  title: string;
  description: string;
  days: CourseDay[];
  noClassDates: { isoDate: string; label: string }[];
}

interface DayOverrides {
  lecture?: CourseLink;
  lab?: CourseLink;
  data?: CourseLink[];
  additionalReadings?: CourseLink[];
}

interface CourseYearConfig {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  noClassDates: string[];
  lecturePdfBaseUrl?: string;
  labPdfBaseUrl?: string;
  dataBaseUrl?: string;
  lectureFiles?: string[];
  labFiles?: string[];
  dataFilesByLab?: Record<number, string[]>;
  noLabDates?: string[];
  noLectureDates?: string[];
  overrides?: Record<string, DayOverrides>;
}

const COURSE_CONFIG: Record<number, CourseYearConfig> = {
  2026: {
    title: 'Summer Lab 2026 Course Schedule',
    description:
      'Weekday schedule for June 2026 through Thursday, July 2, 2026. Excludes no-class dates.',
    startDate: '2026-06-01',
    endDate: '2026-07-02',
    noClassDates: ['2026-06-19', '2026-07-04'],
    noLabDates: ['2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02'],
    overrides: {
      '2026-06-01': {
        lecture: {
          label: 'Simple Linear Regression',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/01_simple-linear-regression.pdf',
        },
        lab: {
          label: 'Lab 1',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/01_simple-linear-regression.pdf',
        },
        data: [
          {
            label: 'MLB BA 2020-2021',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/01_ba-2020-2021.csv',
          },
          {
            label: 'IPBA by Season',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/01_ipba-by-season.csv',
          },
          {
            label: 'MLB Payrolls',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/01_mlb-payrolls.csv',
          },
          {
            label: 'MLB Team Seasons',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/01_mlb-team-seasons.csv',
          },
        ],
        additionalReadings: [
          {
            label: 'dplyr Cheat Sheet',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/supplementary/coding/cheat-sheets/dplyr.pdf',
          },
          {
            label: 'ggplot2 Cheat Sheet',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/supplementary/coding/cheat-sheets/ggplot2.pdf',
          },
          {
            label: 'R Markdown Cheat Sheet',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/supplementary/coding/cheat-sheets/r-markdown.pdf',
          },
          {
            label: 'readr Cheat Sheet',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/supplementary/coding/cheat-sheets/readr.pdf',
          },
          {
            label: 'tidyr Cheat Sheet',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/supplementary/coding/cheat-sheets/tidyr.pdf',
          },
        ],
      },
      '2026-06-02': {
        lecture: {
          label: 'Multivariable Linear Regression',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/02_multivariable-linear-regression.pdf',
        },
        lab: {
          label: 'Lab 2',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/02_multivariable-linear-regression.pdf',
        },
        data: [
          {
            label: 'NCAAB Games',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/02_ncaa-games.csv',
          },
          {
            label: 'NFL Draft Second Contracts',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/02_nfl-draft-second-contracts.csv',
          },
          {
            label: 'Expected Points',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/02_expected-points.csv',
          },
          {
            label: 'NBA Four Factors',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/02_nba-four-factors.csv',
          },
          {
            label: 'Punts',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/02_punts.csv',
          },
        ],
        additionalReadings: [
          {
            label: 'The Research Process',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/research/research-process.pdf',
          },
        ],
      },
      '2026-06-03': {
        lecture: {
          label: 'Logistic Regression',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/03_logistic-regression.pdf',
        },
        lab: {
          label: 'Lab 3',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/03_logistic-regression.pdf',
        },
        data: [
          {
            label: 'First Putts Clean',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/data/03_first-putts-clean.csv',
          },
          {
            label: 'Field Goals',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/03_field-goals.csv',
          },
          {
            label: 'NCAAB Results',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/03_ncaab-results.csv',
          },
          {
            label: 'NCAAB Teams',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/03_ncaab-teams.csv',
          },
        ],
        additionalReadings: [
          {
            label: 'Beyond xG',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/research/beyond-xg.pptx',
          },
          {
            label: 'Pass Rush Ratings',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/research/pass-rush-bt.pdf',
          },
        ],
      },
      '2026-06-04': {
        lecture: {
          label: 'GLMs and GAMs',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/04_glm-and-gam.pdf',
        },
        lab: {
          label: 'Lab 4',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/04_glm-and-gam.pdf',
        },
        data: [
          {
            label: 'NFL Draft Second Contracts',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/04_nfl-draft-second-contracts.csv',
          },
          {
            label: 'MLB BA 2020-2021',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/04_ba-2020-2021.csv',
          },
          {
            label: 'Field Goals',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/04_field-goals.csv',
          },
        ],
        additionalReadings: [
          {
            label: 'Max WP Loser',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/research/max-wp-loser.pdf',
          },
          {
            label: 'Max WP Note',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/research/max-wp-note.pdf',
          },
          {
            label: "The Loser's Curse",
            url: 'https://faculty.wharton.upenn.edu/wp-content/uploads/2013/08/massey---thaler---losers-curse---management-science-july-2013.pdf',
          },
          {
            label: 'NFL Draft Utility Function',
            url: 'https://arxiv.org/abs/2411.10400',
          },
        ],
      },
      '2026-06-05': {
        lecture: {
          label: "Models Do What They're Told",
          url: "https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/05_models-do-what-they're-told.pdf",
        },
        lab: {
          label: 'Lab 5',
          url: "https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/05_models-do-what-they're-told.pdf",
        },
        data: [
          {
            label: 'Time Through the Order Penalty',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/05_ttop-starter-pa.csv',
          },
          {
            label: 'Expected Points',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/05_expected-points.csv',
          },
        ],
      },
      '2026-06-08': {
        lecture: {
          label: 'Statistical Inference',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/06_statistical-inference.pdf',
        },
        lab: {
          label: 'Lab 6',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/06_statistical-inference.pdf',
        },
        data: [
          {
            label: 'Diving',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/06_diving.csv',
          },
          {
            label: 'Diving',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/06_diving.csv',
          },
          {
            label: 'Time Through the Order Penalty',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/06_tto.csv',
          },
        ],
      },
      '2026-06-09': {
        lecture: {
          label: 'Causal Inference',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/07_causal-inference.pdf',
        },
        lab: {
          label: 'Lab 7',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/07_causal-inference.pdf',
        },
        data: [
          {
            label: 'Timeout Opportunities',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/07_timeout-opportunities.csv',
          },
        ],
      },
      '2026-06-10': {
        lecture: {
          label: 'Large Sample Inference',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/08_large-sample-inference.pdf',
        },
        lab: {
          label: 'Lab 8',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/08_large-sample-inference.pdf',
        },
        data: [
          {
            label: 'NBA Free Throws',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/08_nba-free-throws.csv',
          },
        ],
      },
      '2026-06-11': {
        lecture: {
          label: 'The Bootstrap',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/09_the-bootstrap.pdf',
        },
        lab: {
          label: 'Lab 9',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/09_the-bootstrap.pdf',
        },
        data: [
          {
            label: 'Expected Points',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/09_expected-points.csv',
          },
          {
            label: 'NBA Free Throws',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/09_nba-free-throws.csv',
          },
        ],
      },
      '2026-06-12': {
        lecture: {
          label: 'Sports Betting',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/10_sports-betting.pdf',
        },
        lab: {
          label: 'Lab 10',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/10_sports-betting.pdf',
        },
        data: [],
      },
      '2026-06-15': {
        lecture: {
          label: 'Priors as Fake Data',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/11_priors-as-fake-data.pdf',
        },
        lab: {
          label: 'Lab 11',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/11_priors-as-fake-data.pdf',
        },
        data: [
          {
            label: 'NBA Free Throws',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/11_nba-free-throws.csv',
          },
        ],
      },
      '2026-06-16': {
        lecture: {
          label: 'Empirical Bayes',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/12_empirical-bayes.pdf',
        },
        lab: {
          label: 'Lab 12',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/12_empirical-bayes.pdf',
        },
        data: [
          {
            label: 'MLB BA 2020-2021',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/12_ba-2020-2021.csv',
          },
          {
            label: 'Field Goals',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/12_field-goals.csv',
          },
        ],
      },
      '2026-06-17': {
        lecture: {
          label: 'Shrinkage Estimation',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/13_shrinkage-estimation.pdf',
        },
        lab: {
          label: 'Lab 13',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/13_shrinkage-estimation.pdf',
        },
        data: [
          {
            label: 'Putts Test',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/13_putts-test.csv',
          },
          {
            label: 'Putts Train',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/13_putts-train.csv',
          },
        ],
      },
      '2026-06-18': {
        lecture: {
          label: 'Fully Bayesian Models',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/14_fully-bayesian-models.pdf',
        },
        lab: {
          label: 'Lab 14',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/14_fully-bayesian-models.pdf',
        },
        data: [
          {
            label: 'NFL Games',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/14_nfl-games.csv',
          },
        ],
      },
      '2026-06-22': {
        lecture: {
          label: 'Regularization and Ridge Regression',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/15_regularization-and-ridge.pdf',
        },
        lab: {
          label: 'Lab 15',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/15_regularization-and-ridge.pdf',
        },
        data: [
          {
            label: 'NBA Lineups',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/15_nba-lineups.rds',
          },
        ],
      },
      '2026-06-23': {
        lecture: {
          label: 'Tree-Based Models',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/16_tree-models.pdf',
        },
        lab: {
          label: 'Lab 16',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/16_tree-models.pdf',
        },
        data: [
          {
            label: 'NFL Win Probability',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/16_win-probability.csv',
          },
        ],
      },
      '2026-06-24': {
        lecture: {
          label: 'Neural Networks',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/17_neural-networks.pdf',
        },
        lab: {
          label: 'Lab 17',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/17_neural-networks.pdf',
        },
        data: [
          {
            label: '2022 NFL Features',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/17_bdb-static-features.csv',
          },
          {
            label: '2022 NFL Plays',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/17_bdb-static-plays.csv',
          },
          {
            label: '2022 NFL Snaps',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/data/17_bdb-static-snap.csv',
          },
          {
            label: 'Play Action Vs Run',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/17_play-action-vs-run.csv',
          },
          {
            label: 'Snap Examples',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/17_snap-examples.csv',
          },
        ],
      },
      '2026-06-25': {
        lecture: {
          label: 'Unsupervised Learning',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/18_unsupervised-learning.pdf',
        },
        lab: {
          label: 'Lab 18',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/18_unsupervised-learning.pdf',
        },
        data: [
          {
            label: 'NBA Player Seasons',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/18_nba-clusters.csv',
          },
        ],
      },
      '2026-06-26': {
        lecture: {
          label: 'Kernel Methods',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/lectures/19_kernel-methods.pdf',
        },
        lab: {
          label: 'Lab 19',
          url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/19_kernel-methods.pdf',
        },
        data: [
          {
            label: 'EPL Shots 2024-2025',
            url: 'https://github.com/WhartonSABI/lab-materials/blob/main/2026/labs/data/19_shots.csv',
          },
        ],
      },
      '2026-06-29': { lecture: { label: 'Requested Lecture 1' } },
      '2026-06-30': { lecture: { label: 'Requested Lecture 2' } },
      '2026-07-01': { lecture: { label: 'Requested Lecture 3' } },
      '2026-07-02': { lecture: { label: 'Requested Lecture 4' } },
    },
  },
  2025: {
    title: 'Summer Lab 2025 Course Schedule',
    description:
      'Weekday schedule for June 2025 through Monday, June 30, 2025. Excludes no-class dates.',
    startDate: '2025-06-02',
    endDate: '2025-06-30',
    noClassDates: ['2025-06-19', '2025-07-04'],
    lecturePdfBaseUrl:
      'https://github.com/WhartonSABI/lab-materials/blob/main/2025/lectures',
    labPdfBaseUrl:
      'https://github.com/WhartonSABI/lab-materials/blob/main/2025/labs',
    dataBaseUrl:
      'https://github.com/WhartonSABI/lab-materials/blob/main/2025/labs/data',
    lectureFiles: [
      '01_probability-review.pdf',
      '02_simple-linear-regression.pdf',
      '03_multivariable-linear-regression.pdf',
      '04_logistic-regression.pdf',
      '05_confounding.pdf',
      "06_models-do-what-they're-told.pdf",
      '07_significance-and-p-values.pdf',
      '08_clt-and-bin-conf-int.pdf',
      '09_the-bootstrap.pdf',
      '10_kelly-betting.pdf',
      '11_priors-and-fake-data.pdf',
      '12_empirical-bayes.pdf',
      '13_shrinkage-estimation.pdf',
      '14_fully-bayesian-models.pdf',
      '15_regularization-and-ridge.pdf',
      '16_bias-variance-tradeoff.pdf',
      '17_decision-trees.pdf',
      '18_random-forests-and-boosting.pdf',
      '19_clustering.pdf',
      '20_game-theory.pdf',
    ],
    labFiles: [
      '01_research-process.pdf',
      '02_simple-linear-regression.pdf',
      '03_multivariable-linear-regression.pdf',
      '04_logistic-regression.pdf',
      '05_confounding.pdf',
      "06_models-do-what-they're-told.pdf",
      '07_significance-and-p-values.pdf',
      '08_clt-and-bin-conf-int.pdf',
      '09_the-bootstrap.pdf',
      '10_kelly-betting.pdf',
      '11_priors-and-fake-data.pdf',
      '12_empirical-bayes.pdf',
      '13_shrinkage-estimation.pdf',
      '14_fully-bayesian-models.pdf',
      '15_regularization-and-ridge.pdf',
      '16_bias-variance-tradeoff.pdf',
      '18_random-forests-and-boosting.pdf',
      '19_clustering.pdf',
      '20_game-theory.pdf',
    ],
    dataFilesByLab: {
      2: ['02_mlb-payrolls.csv', '02_mlb-team-seasons.csv'],
      3: ['03_nba-four-factors.csv', '03_punts.csv'],
      4: ['04_field-goals.csv', '04_ncaab-results.csv', '04_ncaab-teams.csv'],
      5: ['05_park-effects.csv'],
      6: ['06_expected-points.csv'],
      7: ['07_diving.csv', '07_tto.csv'],
      8: ['08_nba-free-throws.csv'],
      9: ['09_nba-free-throws.csv'],
      11: ['11_nba-free-throws.csv'],
      12: ['12_field-goals.csv', '12_nba-box-scores.csv'],
      13: ['13_putts-test.csv', '13_putts-train.csv'],
      14: ['14_nfl-games.csv'],
      15: ['15_nba-lineups.rds'],
      16: ['16_park-effects.csv'],
      18: ['18_nfl-wp.csv'],
      19: ['19_spotify-test.csv', '19_spotify-train.csv'],
    },
    noLabDates: ['2025-06-25', '2025-06-30'],
    overrides: {},
  },
};

function toTitleFromFile(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/i, '');
  const withoutPrefix = base.replace(/^\d+_/, '');
  const tokenMap: Record<string, string> = {
    mlb: 'MLB',
    nba: 'NBA',
    nfl: 'NFL',
    ncaa: 'NCAA',
    ncaab: 'NCAAB',
    ba: 'BA',
    ipba: 'IPBA',
    wp: 'WP',
    tto: 'TTO',
  };
  return withoutPrefix
    .split('-')
    .map((part) => {
      const normalized = part.toLowerCase();
      if (tokenMap[normalized]) return tokenMap[normalized];
      return part.length ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part;
    })
    .join(' ');
}

function dedupeCourseLinks(links: CourseLink[]): CourseLink[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.label.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map((v) => parseInt(v, 10));
  return new Date(year, month - 1, day);
}

function formatDate(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatNoClassLabel(isoDate: string): string {
  const d = parseIsoDate(isoDate);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDays(config: CourseYearConfig): CourseDay[] {
  const start = parseIsoDate(config.startDate);
  const end = parseIsoDate(config.endDate);
  const noClassSet = new Set(config.noClassDates);
  const noLabSet = new Set(config.noLabDates ?? []);
  const noLectureSet = new Set(config.noLectureDates ?? []);
  const days: CourseDay[] = [];
  let classDayNumber = 1;
  let labNumber = 1;
  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = cursor.getDay();
    if (weekday === 0 || weekday === 6) continue;

    const isoDate = toIsoDate(cursor);
    const isNoClass = noClassSet.has(isoDate);
    const isNoLectureDay = noLectureSet.has(isoDate);
    const isNoLabDay = noLabSet.has(isoDate);
    const overrides = config.overrides?.[isoDate];
    const lectureFile = config.lectureFiles?.[classDayNumber - 1];
    const labFile = config.labFiles?.[labNumber - 1];
    const dataFiles = config.dataFilesByLab?.[labNumber] ?? [];
    const lectureDefault = lectureFile ? toTitleFromFile(lectureFile) : `Lecture ${classDayNumber}`;
    const labDefault = `Lab ${labNumber}`;
    const lecturePdfUrl =
      config.lecturePdfBaseUrl
        ? lectureFile
          ? `${config.lecturePdfBaseUrl}/${lectureFile}`
          : `${config.lecturePdfBaseUrl}/lecture-${String(classDayNumber).padStart(2, '0')}.pdf`
        : undefined;
    const labPdfUrl =
      config.labPdfBaseUrl
        ? labFile
          ? `${config.labPdfBaseUrl}/${labFile}`
          : `${config.labPdfBaseUrl}/lab-${String(labNumber).padStart(2, '0')}.pdf`
        : undefined;
    const dataDefaults: CourseLink[] =
      config.dataBaseUrl && dataFiles.length > 0
        ? dataFiles.map((fileName) => ({
            label: toTitleFromFile(fileName),
            url: `${config.dataBaseUrl}/${fileName}`,
          }))
        : [];
    days.push({
      isoDate,
      displayDate: formatDate(isoDate),
      isNoClass,
      lecture: isNoClass
        ? { label: '-' }
        : isNoLectureDay
          ? { label: '-' }
        : (overrides?.lecture ?? { label: lectureDefault, url: lecturePdfUrl }),
      lab: isNoClass
        ? { label: '-' }
        : isNoLabDay
          ? { label: '-' }
        : (overrides?.lab ?? { label: labDefault, url: labPdfUrl }),
      data: isNoClass
        ? [{ label: '-' }]
        : isNoLabDay
          ? [{ label: '-' }]
          : dedupeCourseLinks(
              overrides?.data ?? (dataDefaults.length > 0 ? dataDefaults : [{ label: '-' }]),
            ),
      additionalReadings: isNoClass ? [{ label: '-' }] : (overrides?.additionalReadings ?? []),
    });
    if (!isNoClass) {
      if (!isNoLabDay) labNumber += 1;
      classDayNumber += 1;
    }
  }

  return days;
}

export function listLabCourseYears(): number[] {
  return Object.keys(COURSE_CONFIG)
    .map((v) => parseInt(v, 10))
    .sort((a, b) => a - b);
}

export function getLabCourseYear(year: number): LabCourseYear | null {
  const config = COURSE_CONFIG[year];
  if (!config) return null;

  return {
    year,
    title: config.title,
    description: config.description,
    days: buildDays(config),
    noClassDates: config.noClassDates.map((isoDate) => ({
      isoDate,
      label: formatNoClassLabel(isoDate),
    })),
  };
}
