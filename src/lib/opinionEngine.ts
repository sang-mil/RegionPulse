import { ClassifiedTopic, OpinionSignals, Persona, ReasonTag, Stance } from '../types';
import { extractPersonaSignals } from './personaSignals';
import { classifyTopic } from './topicClassifier';

export interface PersonaOpinion {
  personaId: string;
  stance: Stance;
  confidence: number;
  response: string;
  reasonTags: ReasonTag[];
  personaSignals: string[];
  signals: OpinionSignals;
  topic: ClassifiedTopic;
}

const clamp = (v: number): number => Math.max(0, Math.min(1, Number(v.toFixed(3))));

const toneByOccupation = (occupation: string): string => {
  if (occupation.includes('교사') || occupation.includes('공무원')) return '제도 설계와 집행 기준이 중요합니다.';
  if (occupation.includes('자영업') || occupation.includes('물류') || occupation.includes('제조')) return '현장 부담과 비용을 먼저 봐야 합니다.';
  return '실행 과정에서의 현실성을 함께 따져야 합니다.';
};

const selectTemplate = (stance: Stance, seed: string): string => {
  const templates: Record<Stance, string[]> = {
    support: [
      '기본 취지에는 찬성합니다. 다만 실행 과정은 세밀해야 합니다.',
      '공정성 측면에서 필요하다고 봅니다.',
      '시대가 바뀐 만큼 제도도 바뀔 수 있다고 생각합니다.',
      '사회적 효과를 고려하면 추진할 가치가 있다고 봅니다.',
    ],
    oppose: [
      '취지는 알겠지만 저는 반대에 가깝습니다.',
      '현장에서 보면 말처럼 간단한 문제가 아닙니다.',
      '제도를 늘리기 전에 기존 문제부터 손봐야 합니다.',
      '부작용 가능성이 커 보여서 신중해야 한다고 봅니다.',
    ],
    conditional: [
      '방향은 이해하지만 조건이 먼저 갖춰져야 합니다.',
      '무작정 시행하기보다 단계적으로 봐야 합니다.',
      '안전장치와 보완책이 있다면 검토할 수 있습니다.',
      '원칙에는 동의하지만 현장 적용 기준이 필요합니다.',
    ],
    neutral: [
      '판단하기 어려운 문제라고 봅니다.',
      '장단점이 분명해서 더 많은 설명이 필요합니다.',
      '추가 데이터가 있어야 입장을 정하기 쉽겠습니다.',
      '당장 찬반보다 영향 분석이 먼저라고 생각합니다.',
    ],
  };
  const idx = seed.split('').reduce((acc, cur) => acc + cur.charCodeAt(0), 0) % templates[stance].length;
  return templates[stance][idx];
};

const toPersonaSignalTags = (signals: OpinionSignals): string[] => {
  const candidates: Array<[string, number]> = [
    ['생활비민감', signals.economicSensitivity],
    ['전통선호', signals.traditionPreference],
    ['공정성민감', signals.fairnessSensitivity],
    ['지역공동체지향', signals.localCommunityOrientation],
    ['제도신뢰', signals.institutionalTrust],
    ['안보관심', signals.securityConcern],
    ['복지선호', signals.welfarePreference],
    ['청년이슈관심', signals.youthConcern],
    ['성평등민감', signals.genderEqualitySensitivity],
    ['실행리스크민감', signals.practicalRiskSensitivity],
  ];

  return candidates.filter(([, score]) => score >= 0.58).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([tag]) => tag);
};

const scoreByTopic = (topic: ClassifiedTopic, signals: OpinionSignals) => {
  let support = 0.3;
  let oppose = 0.3;
  let conditional = 0.25;
  let neutral = 0.2;

  const topics = [topic.primary, ...(topic.secondary ?? [])];
  topics.forEach((t) => {
    switch (t) {
      case 'military_security':
        support += signals.securityConcern * 0.35 + signals.fairnessSensitivity * 0.15;
        oppose += signals.traditionPreference * 0.2;
        conditional += signals.practicalRiskSensitivity * 0.3 + signals.economicSensitivity * 0.15;
        break;
      case 'gender':
        support += signals.genderEqualitySensitivity * 0.35 + signals.fairnessSensitivity * 0.2;
        oppose += signals.traditionPreference * 0.28;
        conditional += signals.practicalRiskSensitivity * 0.18;
        break;
      case 'welfare':
        support += signals.welfarePreference * 0.4 + signals.fairnessSensitivity * 0.2;
        oppose += signals.economicSensitivity * 0.18;
        conditional += signals.practicalRiskSensitivity * 0.25;
        break;
      case 'education':
        support += signals.fairnessSensitivity * 0.25 + signals.youthConcern * 0.25;
        oppose += signals.traditionPreference * 0.2;
        conditional += signals.practicalRiskSensitivity * 0.2;
        break;
      case 'housing':
      case 'economy':
      case 'labor':
        support += signals.fairnessSensitivity * 0.15;
        oppose += signals.economicSensitivity * 0.2;
        conditional += signals.practicalRiskSensitivity * 0.35 + signals.economicSensitivity * 0.2;
        break;
      case 'regional':
        support += signals.localCommunityOrientation * 0.35;
        conditional += signals.practicalRiskSensitivity * 0.2;
        neutral += (1 - signals.localCommunityOrientation) * 0.15;
        break;
      case 'healthcare':
        support += signals.welfarePreference * 0.3;
        conditional += signals.practicalRiskSensitivity * 0.25;
        oppose += signals.economicSensitivity * 0.12;
        break;
      case 'culture':
        support += signals.genderEqualitySensitivity * 0.15;
        neutral += 0.1;
        break;
      default:
        neutral += 0.15;
        conditional += 0.1;
    }
  });

  return { support, oppose, conditional, neutral };
};

export const generateOpinion = (persona: Persona, question: string): PersonaOpinion => {
  const signals = extractPersonaSignals(persona);
  const topic = classifyTopic(question);
  const scores = scoreByTopic(topic, signals);
  const rank = (Object.entries(scores) as Array<[Stance, number]>).sort((a, b) => b[1] - a[1]);
  const stance = rank[0][0];
  const confidence = clamp((rank[0][1] - rank[1][1]) / (rank[0][1] + 0.0001));
  const personaSignals = toPersonaSignalTags(signals);
  const reasonTags: ReasonTag[] = [
    personaSignals.includes('생활비민감') ? '생활비' : '경제',
    personaSignals.includes('공정성민감') ? '공정성' : '재정',
    personaSignals.includes('지역공동체지향') ? '지역격차' : '일자리',
  ];

  const dialectHint = persona.age >= 60 && /시장|현장|전라도|사투리/.test(persona.description)
    ? '현장에서 체감되는 부분이 꽤 큽니다.'
    : '';

  const response = `${selectTemplate(stance, persona.id + question)} ${toneByOccupation(persona.occupation)} ${dialectHint}`.trim();

  return {
    personaId: persona.id,
    stance,
    confidence,
    response,
    reasonTags,
    personaSignals,
    signals,
    topic,
  };
};
