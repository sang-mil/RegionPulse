import { AgeGroup, Education, Region, SurveyInput } from '../types';

interface SurveyFormProps {
  value: SurveyInput;
  onChange: (next: SurveyInput) => void;
  onSubmit: () => void;
  isRunning: boolean;
}

const regions: Region[] = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const ageGroups: AgeGroup[] = ['20대', '30대', '40대', '50대', '60대+'];
const educations: Education[] = ['고졸', '전문대졸', '대졸', '대학원 이상'];
const sampleSizes: Array<20 | 50 | 100> = [20, 50, 100];

const toggle = <T,>(arr: T[], value: T): T[] => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

export function SurveyForm({ value, onChange, onSubmit, isRunning }: SurveyFormProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="text-xl font-semibold">조사 생성</h2>
      <p className="mt-1 text-sm text-slate-600">질문과 조건을 선택하면 합성 페르소나 반응을 시뮬레이션합니다.</p>

      <label className="mt-5 block text-sm font-medium">사회 이슈 질문</label>
      <textarea
        className="mt-2 h-28 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none"
        placeholder="예: 청년 주거 지원 예산을 확대해야 할까요?"
        value={value.question}
        onChange={(e) => onChange({ ...value, question: e.target.value })}
      />

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium">지역 선택</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => onChange({ ...value, filters: { ...value.filters, regions: toggle(value.filters.regions, region) } })}
                className={`rounded-full px-3 py-1 text-sm ${value.filters.regions.includes(region) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {region}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">나이대 선택</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ageGroups.map((ageGroup) => (
              <button
                key={ageGroup}
                type="button"
                onClick={() => onChange({ ...value, filters: { ...value.filters, ageGroups: toggle(value.filters.ageGroups, ageGroup) } })}
                className={`rounded-full px-3 py-1 text-sm ${value.filters.ageGroups.includes(ageGroup) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {ageGroup}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">학력 선택</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {educations.map((education) => (
              <button
                key={education}
                type="button"
                onClick={() => onChange({ ...value, filters: { ...value.filters, educations: toggle(value.filters.educations, education) } })}
                className={`rounded-full px-3 py-1 text-sm ${value.filters.educations.includes(education) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {education}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">샘플 수</legend>
          <div className="mt-2 flex gap-2">
            {sampleSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...value, sampleSize: size })}
                className={`rounded-lg px-4 py-2 text-sm ${value.sampleSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        type="button"
        disabled={!value.question.trim() || isRunning}
        onClick={onSubmit}
        className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isRunning ? '시뮬레이션 실행 중...' : '시뮬레이션 실행'}
      </button>
    </section>
  );
}
