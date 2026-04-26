export type Region =
  | '서울'
  | '부산'
  | '대구'
  | '인천'
  | '광주'
  | '대전'
  | '울산'
  | '세종'
  | '경기'
  | '강원'
  | '충북'
  | '충남'
  | '전북'
  | '전남'
  | '경북'
  | '경남'
  | '제주';

export type AgeGroup = '20대' | '30대' | '40대' | '50대' | '60대+';
export type Education = '고졸' | '전문대졸' | '대졸' | '대학원 이상';
export type IncomeLevel = '낮음' | '중간' | '높음';
export type Stance = 'support' | 'oppose' | 'neutral' | 'conditional';
export type ReasonTag =
  | '경제'
  | '공정성'
  | '지역격차'
  | '세대갈등'
  | '교육'
  | '일자리'
  | '복지'
  | '재정'
  | '생활비'
  | '문화';
export type FilterLevel = 'region+ageGroup+education' | 'region+ageGroup' | 'region' | 'all';

export interface Persona {
  id: string;
  name: string;
  region: Region;
  age: number;
  ageGroup: AgeGroup;
  education: Education;
  occupation: string;
  incomeLevel: IncomeLevel;
  lifestyle: string;
  interests: string[];
  description: string;
}

export interface SurveyFilters {
  regions: Region[];
  ageGroups: AgeGroup[];
  educations: Education[];
}

export interface SurveyInput {
  question: string;
  filters: SurveyFilters;
  sampleSize: 20 | 50 | 100;
}

export interface PersonaSimulation {
  personaId: string;
  personaName: string;
  region: Region;
  ageGroup: AgeGroup;
  education: Education;
  occupation: string;
  description: string;
  stance: Stance;
  response: string;
  reasonTags: ReasonTag[];
  matchedStrictly: boolean;
}

export interface GroupStats {
  key: string;
  support: number;
  oppose: number;
  neutral: number;
  conditional: number;
  total: number;
}

export interface SimulationResult {
  id: string;
  createdAt: string;
  question: string;
  sampledCount: number;
  totalEligible: number;
  strictMatchedCount: number;
  supplementedCount: number;
  usedFilterLevel: FilterLevel;
  stanceCounts: Record<Stance, number>;
  stancePercentages: Record<Stance, number>;
  byRegion: GroupStats[];
  byAgeGroup: GroupStats[];
  byEducation: GroupStats[];
  topReasonTags: { tag: ReasonTag; count: number }[];
  representativeQuotes: PersonaSimulation[];
  raw: PersonaSimulation[];
}

export interface SurveyHistoryItem {
  input: SurveyInput;
  result: SimulationResult;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
