import { AgeGroup, Education, Persona, Region } from '../types';

const regions: Region[] = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
];

const ageGroups: AgeGroup[] = ['20대', '30대', '40대', '50대', '60대+'];
const educations: Education[] = ['고졸', '전문대졸', '대졸', '대학원 이상'];
const names = [
  '민준', '서준', '도윤', '예준', '시우', '지호', '하준', '현우', '주원', '건우',
  '서연', '지우', '하윤', '서윤', '민서', '지민', '채원', '수아', '윤아', '소율',
  '태호', '성민', '유진', '은지', '지훈', '다은', '준호', '지아', '하린', '시은',
];

const occupations = [
  '사무직', '자영업', '제조업', '교사', '간호사', '공무원', '개발자', '디자이너', '물류기사', '프리랜서',
];
const lifestyles = ['절약형', '경험중시형', '가족중심형', '커리어중심형', '안정추구형'];
const interestsPool = ['부동산', '교육', '복지', '스타트업', '주식', '지역개발', '문화생활', '환경', '교통', '일자리'];
const skillsPool = ['협업', '문제해결', '고객응대', '데이터분석', '문서작성', '현장운영', '조정', '기획', '소통', '리더십'];

const ageBase: Record<AgeGroup, number> = {
  '20대': 25,
  '30대': 35,
  '40대': 45,
  '50대': 55,
  '60대+': 66,
};

export const personas: Persona[] = Array.from({ length: 204 }, (_, i) => {
  const region = regions[i % regions.length];
  const ageGroup = ageGroups[i % ageGroups.length];
  const education = educations[i % educations.length];
  const age = ageBase[ageGroup] + (i % 4);
  const name = `${names[i % names.length]}${String.fromCharCode(65 + (i % 26))}`;
  const occupation = occupations[(i + 2) % occupations.length];
  const lifestyle = lifestyles[(i + 3) % lifestyles.length];
  const interests = [
    interestsPool[i % interestsPool.length],
    interestsPool[(i + 4) % interestsPool.length],
    interestsPool[(i + 7) % interestsPool.length],
  ];
  const skills = [
    skillsPool[(i + 1) % skillsPool.length],
    skillsPool[(i + 5) % skillsPool.length],
  ];

  return {
    id: `persona-${i + 1}`,
    name,
    region,
    age,
    ageGroup,
    education,
    occupation,
    incomeLevel: i % 3 === 0 ? '높음' : i % 3 === 1 ? '중간' : '낮음',
    lifestyle,
    interests,
    skills,
    description: `${region} 거주 ${ageGroup} ${occupation}으로, ${lifestyle} 성향이 강하며 ${interests.join(', ')}에 관심이 큼.`,
  };
});
