import { useState } from 'react';
import { ResultDashboard } from './components/ResultDashboard';
import { SurveyForm } from './components/SurveyForm';
import { runSimulation } from './lib/simulation';
import { SimulationResult, SurveyInput } from './types';

const initialInput: SurveyInput = {
  question: '',
  filters: {
    regions: [],
    ageGroups: [],
    educations: [],
  },
  sampleSize: 50,
};

export default function App() {
  const [input, setInput] = useState<SurveyInput>(initialInput);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [message, setMessage] = useState('질문과 조건을 입력한 뒤 시뮬레이션을 실행해 주세요.');
  const [isRunning, setIsRunning] = useState(false);

  const handleSubmit = () => {
    setIsRunning(true);
    const next = runSimulation(input);
    if (next.totalEligible === 0) {
      setMessage('선택한 조건에 맞는 페르소나가 없습니다. 필터를 완화해 주세요.');
      setResult(null);
      setIsRunning(false);
      return;
    }
    if (next.sampledCount < input.sampleSize) {
      setMessage(`조건에 맞는 페르소나가 ${next.totalEligible}명이라 ${next.sampledCount}명만 분석했습니다.`);
    } else {
      setMessage(`총 ${next.sampledCount}명의 합성 페르소나를 분석했습니다.`);
    }
    setResult(next);
    setIsRunning(false);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">RegionPulse AI</h1>
        <p className="mt-2 text-slate-600">지역·연령·학력 조건 기반 사회 이슈 반응 가설 탐색 도구</p>
      </header>

      <SurveyForm value={input} onChange={setInput} onSubmit={handleSubmit} isRunning={isRunning} />

      <section className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</section>

      {result ? (
        <ResultDashboard result={result} />
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          아직 결과가 없습니다. 질문을 입력하고 시뮬레이션을 실행하세요.
        </section>
      )}
    </main>
  );
}
