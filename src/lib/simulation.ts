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

const reasonTags: ReasonTag[] = ['경제', '공정성', '지역격차', '세대갈등', '교육', '일자리', '복지', '재정', '생활비', '문화'];

const stanceLabel: Record<Stance, string> = {
  support: '찬성',
  oppose: '반대',
  neutral: '중립',
  conditional: '조건부',
};

const keywordMatrix: Record<ReasonTag, string[]> = {
  경제: ['경제', '성장', '투자'],
  공정성: ['공정', '형평', '불평등'],
  지역격차: ['지역', '수도권', '지방'],
  세대갈등: ['세대', '청년', '노년'],
  교육: ['교육', '대학', '학교'],
  일자리: ['고용', '일자리', '취업'],
  복지: ['복지', '지원', '돌봄'],
  재정: ['예산', '재정', '세금'],
  생활비: ['물가', '생활비', '주거'],
  문화: ['문화', '여가', '콘텐츠'],
};

const pickReasonTags = (question: string, persona: Persona): ReasonTag[] => {
  const hits = reasonTags.filter((tag) => keywordMatrix[tag].some((word) => question.includes(word)));
  const base = [hits[0], persona.interests.includes('교육') ? '교육' : undefined, persona.interests.includes('일자리') ? '일자리' : undefined].filter(Boolean) as ReasonTag[];
  const unique = [...new Set(base)];
  while (unique.length < 2) {
    unique.push(reasonTags[(persona.age + unique.length) % reasonTags.length]);
  }
  return unique.slice(0, 3);
};

const decideStance = (question: string, persona: Persona): Stance => {
  let score = 0;
  if (question.includes('복지') || question.includes('지원')) score += persona.age >= 50 ? 2 : 1;
  if (question.includes('규제') || question.includes('세금')) score += persona.incomeLevel === '높음' ? -2 : -1;
  if (question.includes('일자리') || question.includes('고용')) score += persona.ageGroup === '20대' || persona.ageGroup === '30대' ? 2 : 1;
  if (question.includes('교육')) score += persona.education === '대학원 이상' ? -1 : 1;
  if (persona.lifestyle === '안정추구형') score += 1;
  if (persona.lifestyle === '경험중시형') score -= 1;

  if (score >= 2) return 'support';
  if (score <= -2) return 'oppose';
  if (Math.abs(score) === 1) return 'conditional';
  return 'neutral';
};

const generateResponse = (persona: Persona, stance: Stance, question: string, tags: ReasonTag[]): string => {
  const tone = stance === 'support'
    ? '정책 방향에는 공감합니다.'
    : stance === 'oppose'
      ? '현 시점에서 추진은 신중해야 합니다.'
      : stance === 'conditional'
        ? '취지는 이해하지만 보완이 필요합니다.'
        : '추가 검토가 필요하다고 봅니다.';

  return `${persona.region}에 사는 ${persona.ageGroup} ${persona.occupation} 입장에서, "${question}"에 대해 ${tone} 특히 ${tags.join(', ')} 관점이 중요합니다.`;
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

export const runSimulation = (input: SurveyInput): SimulationResult => {
  const normalizedFilters = normalizeInputFilters(input);
  const fallbackOrder: FilterLevel[] = ['region+ageGroup+education', 'region+ageGroup', 'region', 'all'];
  let usedFilterLevel: FilterLevel = 'region+ageGroup+education';
  const picked = new Map<string, Persona>();

  for (const level of fallbackOrder) {
    const levelMatches = personas.filter((persona) => matchByLevel(persona, normalizedFilters, level));
    const sampledAtLevel = samplePersonas(levelMatches, input.sampleSize);
    sampledAtLevel.forEach((persona) => {
      if (picked.size < input.sampleSize && !picked.has(persona.id)) {
        picked.set(persona.id, persona);
      }
    });
    if (picked.size >= input.sampleSize) {
      usedFilterLevel = level;
      break;
    }
    usedFilterLevel = level;
  }

  const strictEligible = personas.filter((persona) => matchByLevel(persona, normalizedFilters, 'region+ageGroup+education'));
  const sampled = [...picked.values()].slice(0, Math.min(input.sampleSize, personas.length));
  const strictSet = new Set(strictEligible.map((p) => p.id));
  const strictMatchedCount = sampled.filter((p) => strictSet.has(p.id)).length;
  const supplementedCount = sampled.length - strictMatchedCount;

  const raw = sampled.map((persona) => {
    const stance = decideStance(input.question, persona);
    const tags = pickReasonTags(input.question, persona);
    return {
      personaId: persona.id,
      personaName: persona.name,
      region: persona.region,
      ageGroup: persona.ageGroup,
      education: persona.education,
      occupation: persona.occupation,
      description: persona.description,
      stance,
      response: generateResponse(persona, stance, input.question, tags),
      reasonTags: tags,
      matchedStrictly: strictSet.has(persona.id),
    } as PersonaSimulation;
  });

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

  return {
    id: `sim-${Date.now()}`,
    createdAt: new Date().toISOString(),
    question: input.question,
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
