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
  lectureFiles?: string[];
  labFiles?: string[];
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
    noLabDates: ['2025-06-25', '2025-06-30'],
    overrides: {},
  },
};

function toTitleFromFile(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '');
  const withoutPrefix = base.replace(/^\d+_/, '');
  return withoutPrefix
    .split('-')
    .map((part) => (part.length ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
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
