import { OpinionSignals, Persona } from '../types';

const clamp = (value: number): number => Math.max(0, Math.min(1, Number(value.toFixed(3))));

const seededNoise = (seedText: string): number => {
  const seed = seedText.split('').reduce((acc, cur) => acc + cur.charCodeAt(0), 0);
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 0.06 - 0.03;
};

const includesAny = (text: string, keywords: string[]): boolean => keywords.some((keyword) => text.includes(keyword));

export const extractPersonaSignals = (persona: Persona): OpinionSignals => {
  const signals: OpinionSignals = {
    economicSensitivity: 0.45,
    traditionPreference: 0.4,
    fairnessSensitivity: 0.45,
    localCommunityOrientation: 0.45,
    institutionalTrust: 0.45,
    securityConcern: 0.4,
    welfarePreference: 0.45,
    youthConcern: 0.4,
    genderEqualitySensitivity: 0.4,
    practicalRiskSensitivity: 0.45,
  };

  if (persona.age >= 60) {
    signals.traditionPreference += 0.25;
    signals.practicalRiskSensitivity += 0.2;
    signals.welfarePreference += 0.15;
  }

  if (persona.age >= 20 && persona.age < 40) {
    signals.youthConcern += 0.25;
    signals.fairnessSensitivity += 0.15;
    signals.genderEqualitySensitivity += 0.1;
  }

  if (persona.education === '대학원 이상') {
    signals.institutionalTrust += 0.1;
    signals.fairnessSensitivity += 0.1;
  }

  if (persona.education === '고졸') {
    signals.practicalRiskSensitivity += 0.15;
    signals.economicSensitivity += 0.15;
  }

  if (includesAny(persona.occupation, ['교사', '교육'])) {
    signals.fairnessSensitivity += 0.2;
    signals.youthConcern += 0.2;
    signals.welfarePreference += 0.1;
  }

  if (includesAny(persona.occupation, ['군인', '경찰', '소방', '보안'])) {
    signals.securityConcern += 0.3;
    signals.institutionalTrust += 0.15;
  }

  if (includesAny(persona.occupation, ['하역', '건설', '운송', '노동', '자영업', '물류'])) {
    signals.economicSensitivity += 0.25;
    signals.practicalRiskSensitivity += 0.25;
  }

  if (persona.incomeLevel === '낮음') signals.economicSensitivity += 0.12;
  if (persona.incomeLevel === '높음') signals.practicalRiskSensitivity += 0.08;
  if (persona.lifestyle === '안정추구형') signals.traditionPreference += 0.1;

  if (includesAny(persona.interests.join(' '), ['지역개발', '교통'])) signals.localCommunityOrientation += 0.1;
  if (includesAny((persona.skills ?? []).join(' '), ['협업', '조정'])) signals.localCommunityOrientation += 0.05;

  const description = persona.description;
  if (includesAny(description, ['전통시장', '목욕탕', '동네', '이웃', '지역'])) signals.localCommunityOrientation += 0.2;
  if (includesAny(description, ['고집', '옛 방식', '질서', '관습'])) signals.traditionPreference += 0.2;
  if (includesAny(description, ['생활비', '전월세', '월세', '재정', '소득', '당 수치', '건강 걱정'])) {
    signals.economicSensitivity += 0.15;
    signals.practicalRiskSensitivity += 0.1;
  }
  if (includesAny(description, ['정치 이야기', '뉴스', '세상 돌아가는'])) {
    const variation = seededNoise(persona.id + description);
    signals.institutionalTrust += variation;
    signals.fairnessSensitivity -= variation / 2;
  }

  const regionAdjustment = ['강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].includes(persona.region) ? 0.05 : 0.02;
  signals.localCommunityOrientation += regionAdjustment;

  return {
    economicSensitivity: clamp(signals.economicSensitivity + seededNoise(`${persona.id}-eco`)),
    traditionPreference: clamp(signals.traditionPreference + seededNoise(`${persona.id}-trad`)),
    fairnessSensitivity: clamp(signals.fairnessSensitivity + seededNoise(`${persona.id}-fair`)),
    localCommunityOrientation: clamp(signals.localCommunityOrientation + seededNoise(`${persona.id}-local`)),
    institutionalTrust: clamp(signals.institutionalTrust + seededNoise(`${persona.id}-trust`)),
    securityConcern: clamp(signals.securityConcern + seededNoise(`${persona.id}-sec`)),
    welfarePreference: clamp(signals.welfarePreference + seededNoise(`${persona.id}-welfare`)),
    youthConcern: clamp(signals.youthConcern + seededNoise(`${persona.id}-youth`)),
    genderEqualitySensitivity: clamp(signals.genderEqualitySensitivity + seededNoise(`${persona.id}-gender`)),
    practicalRiskSensitivity: clamp(signals.practicalRiskSensitivity + seededNoise(`${persona.id}-risk`)),
  };
};
