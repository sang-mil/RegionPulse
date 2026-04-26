import { ClassifiedTopic, Topic } from '../types';

const topicKeywords: Record<Topic, string[]> = {
  military_security: ['군대', '병역', '징병', '안보', '국방', '복무'],
  gender: ['여성', '남성', '성평등', '젠더', '차별'],
  welfare: ['복지', '기본소득', '지원금', '수당', '돌봄'],
  education: ['교육', '입시', '학교', '교사', '대학'],
  economy: ['경제', '성장', '세금', '재정', '물가'],
  housing: ['집값', '전세', '월세', '부동산', '주거'],
  labor: ['최저임금', '노동', '근로', '일자리', '고용'],
  regional: ['지방소멸', '지역', '수도권', '균형발전'],
  healthcare: ['건강보험', '의료', '병원', '건강'],
  culture: ['문화', '예술', '콘텐츠', '여가'],
  general: [],
};

export const classifyTopic = (question: string): ClassifiedTopic => {
  const scored = (Object.entries(topicKeywords) as Array<[Topic, string[]]>).map(([topic, keywords]) => ({
    topic,
    matched: keywords.filter((keyword) => question.includes(keyword)),
  }));

  const relevant = scored
    .filter((item) => item.matched.length > 0)
    .sort((a, b) => b.matched.length - a.matched.length);

  if (relevant.length === 0) {
    return {
      primary: 'general',
      keywords: [],
    };
  }

  return {
    primary: relevant[0].topic,
    secondary: relevant.slice(1, 3).map((r) => r.topic),
    keywords: relevant.flatMap((r) => r.matched).slice(0, 6),
  };
};
