import { personas } from '../data/personas';
import {
  FilterLevel,
  GroupStats,
  Persona,
  PersonaSimulation,
  ReasonTag,
  SimulationResult,
  Stance,
  SurveyInput,
} from '../types';
import { generateOpinionWithProvider } from './opinionApi';

const stanceLabel: Record<Stance, string> = {
  support: '찬성',
  oppose: '반대',
  neutral: '중립',
  conditional: '조건부',
};

const normalizeRegion = (value: string): string => value.replace(/\s+/g, '').toLowerCase();
const normalizeAgeGroup = (value: string): string => value.replace(/\s+/g, '').replace('세', '').toLowerCase();
const normalizeEducation = (value: string): string => value.replace(/\s+/g, '').toLowerCase();

const normalizeInputFilters = (input: SurveyInput) => ({
  regions: input.filters.regions.map((v) => normalizeRegion(v)),
  ageGroups: input.filters.ageGroups.map((v) => normalizeAgeGroup(v)),
  educations: input.filters.educations.map((v) => normalizeEducation(v)),
});

const isIncludedOrWildcard = (filterValues: string[], target: string): boolean =>
  filterValues.length === 0 || filterValues.includes(target);

const matchByLevel = (
  persona: Persona,
  normalizedFilters: ReturnType<typeof normalizeInputFilters>,
  level: FilterLevel,
): boolean => {
  const region = normalizeRegion(persona.region);
  const ageGroup = normalizeAgeGroup(persona.ageGroup);
  const education = normalizeEducation(persona.education);

  if (level === 'all') return true;
  if (level === 'region') return isIncludedOrWildcard(normalizedFilters.regions, region);
  if (level === 'region+ageGroup') {
    return isIncludedOrWildcard(normalizedFilters.regions, region)
      && isIncludedOrWildcard(normalizedFilters.ageGroups, ageGroup);
  }
  return isIncludedOrWildcard(normalizedFilters.regions, region)
    && isIncludedOrWildcard(normalizedFilters.ageGroups, ageGroup)
    && isIncludedOrWildcard(normalizedFilters.educations, education);
};

const samplePersonas = (list: Persona[], sampleSize: number): Persona[] => {
  const shuffled = [...list].sort((a, b) => (a.id > b.id ? 1 : -1));
  const step = Math.max(1, Math.floor(shuffled.length / sampleSize));
  const sampled: Persona[] = [];
  for (let i = 0; i < shuffled.length && sampled.length < sampleSize; i += step) {
    sampled.push(shuffled[i]);
  }
  return sampled.slice(0, Math.min(sampleSize, list.length));
};

const buildGroupStats = (rows: PersonaSimulation[], key: 'region' | 'ageGroup' | 'education'): GroupStats[] => {
  const map = new Map<string, GroupStats>();

  for (const row of rows) {
    const groupKey = row[key];
    if (!map.has(groupKey)) {
      map.set(groupKey, {
        key: groupKey,
        support: 0,
        oppose: 0,
        neutral: 0,
        conditional: 0,
        total: 0,
      });
    }
    const bucket = map.get(groupKey)!;
    bucket[row.stance] += 1;
    bucket.total += 1;
  }

  return [...map.values()].sort((a, b) => b.total - a.total);
};

const questionTypeMap = {
  military_security: '군사',
  gender: '젠더',
  welfare: '복지',
  education: '교육',
  economy: '경제',
  housing: '경제',
  labor: '경제',
  regional: '경제',
  healthcare: '복지',
  culture: '기타',
  general: '기타',
} as const;

export const runSimulation = async (input: SurveyInput): Promise<SimulationResult> => {
  const normalizedFilters = normalizeInputFilters(input);
  const fallbackOrder: FilterLevel[] = ['region+ageGroup+education', 'region+ageGroup', 'region', 'all'];
  let usedFilterLevel: FilterLevel = 'region+ageGroup+education';
  const picked = new Map<string, Persona>();

  for (const level of fallbackOrder) {
    const levelMatches = personas.filter((persona) => matchByLevel(persona, normalizedFilters, level));
    const sampledAtLevel = samplePersonas(levelMatches, input.sampleSize);
    sampledAtLevel.forEach((persona) => {
      if (picked.size < input.sampleSize && !picked.has(persona.id)) picked.set(persona.id, persona);
    });
    usedFilterLevel = level;
    if (picked.size >= input.sampleSize) break;
  }

  const strictEligible = personas.filter((persona) => matchByLevel(persona, normalizedFilters, 'region+ageGroup+education'));
  const sampled = [...picked.values()].slice(0, Math.min(input.sampleSize, personas.length));
  const strictSet = new Set(strictEligible.map((p) => p.id));
  const strictMatchedCount = sampled.filter((p) => strictSet.has(p.id)).length;
  const supplementedCount = sampled.length - strictMatchedCount;

  const raw = await Promise.all(sampled.map(async (persona) => {
    const opinion = await generateOpinionWithProvider(persona, input.question);
    return {
      personaId: persona.id,
      personaName: persona.name,
      region: persona.region,
      ageGroup: persona.ageGroup,
      education: persona.education,
      occupation: persona.occupation,
      description: persona.description,
      stance: opinion.stance,
      response: opinion.response,
      reasonTags: opinion.reasonTags as ReasonTag[],
      matchedStrictly: strictSet.has(persona.id),
      confidence: opinion.confidence,
      personaSignals: opinion.personaSignals,
      signals: opinion.signals,
      topic: opinion.topic,
    } as PersonaSimulation;
  }));

  const stanceCounts: Record<Stance, number> = { support: 0, oppose: 0, neutral: 0, conditional: 0 };
  raw.forEach((item) => {
    stanceCounts[item.stance] += 1;
  });

  const sampledCount = raw.length;
  const stancePercentages: Record<Stance, number> = {
    support: sampledCount ? Math.round((stanceCounts.support / sampledCount) * 100) : 0,
    oppose: sampledCount ? Math.round((stanceCounts.oppose / sampledCount) * 100) : 0,
    neutral: sampledCount ? Math.round((stanceCounts.neutral / sampledCount) * 100) : 0,
    conditional: sampledCount ? Math.round((stanceCounts.conditional / sampledCount) * 100) : 0,
  };

  const reasonCounter = new Map<ReasonTag, number>();
  raw.forEach((item) => {
    item.reasonTags.forEach((tag) => {
      reasonCounter.set(tag, (reasonCounter.get(tag) ?? 0) + 1);
    });
  });

  const topReasonTags = [...reasonCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => ({ tag, count }));

  const representativeQuotes = [...raw]
    .sort((a, b) => stanceLabel[a.stance].localeCompare(stanceLabel[b.stance]))
    .slice(0, 5);

  const primaryTopic = raw[0]?.topic.primary ?? 'general';

  return {
    id: `sim-${Date.now()}`,
    createdAt: new Date().toISOString(),
    question: input.question,
    questionType: questionTypeMap[primaryTopic],
    sampledCount,
    totalEligible: strictEligible.length,
    strictMatchedCount,
    supplementedCount,
    usedFilterLevel,
    stanceCounts,
    stancePercentages,
    byRegion: buildGroupStats(raw, 'region'),
    byAgeGroup: buildGroupStats(raw, 'ageGroup'),
    byEducation: buildGroupStats(raw, 'education'),
    topReasonTags,
    representativeQuotes,
    raw,
  };
};
