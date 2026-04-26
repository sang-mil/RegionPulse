import { useState } from 'react';
import { ResultDashboard } from './components/ResultDashboard';
import { SurveyForm } from './components/SurveyForm';
import { createChatMessage, generatePersonaReply } from './lib/chat';
import { runSimulation } from './lib/simulation';
import { ChatMessage, PersonaChatProfile, PersonaSimulation, SimulationResult, SurveyHistoryItem, SurveyInput } from './types';

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
  const [history, setHistory] = useState<SurveyHistoryItem[]>([]);
  const [message, setMessage] = useState('질문과 조건을 입력한 뒤 시뮬레이션을 실행해 주세요.');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatProfiles, setChatProfiles] = useState<Record<string, PersonaChatProfile>>({});

  const handleSubmit = async () => {
    setIsRunning(true);
    const next = await runSimulation(input);
    if (next.totalEligible === 0) setMessage('정확 일치 페르소나는 없지만, 유사 페르소나를 보강해 분석했습니다.');
    else if (next.sampledCount < input.sampleSize) setMessage(`조건 일치 ${next.totalEligible}명 + 유사 보강 ${next.supplementedCount}명으로 총 ${next.sampledCount}명을 분석했습니다.`);
    else setMessage(`총 ${next.sampledCount}명의 합성 페르소나를 분석했습니다.`);
    setResult(next);
    setHistory((prev) => [{ input, result: next }, ...prev].slice(0, 10));
    setSelectedPersonaId(next.raw[0]?.personaId ?? null);
    setChatMessages([]);
    setChatInput('');
    setIsRunning(false);
  };

  const selectedPersona: PersonaSimulation | null = result?.raw.find((row) => row.personaId === selectedPersonaId) ?? null;
  const selectedProfile = selectedPersonaId ? chatProfiles[selectedPersonaId] : undefined;

  const handleSendChat = () => {
    if (!selectedPersona || !result || !chatInput.trim() || !selectedProfile?.confirmed) return;
    const user = createChatMessage('user', chatInput);
    const assistant = createChatMessage('assistant', generatePersonaReply({
      persona: selectedPersona,
      surveyQuestion: result.question,
      userMessage: chatInput,
      profile: selectedProfile,
    }));
    setChatMessages((prev) => [...prev, user, assistant]);
    setChatInput('');
  };

  const handleLoadHistory = (item: SurveyHistoryItem) => {
    setInput(item.input);
    setResult(item.result);
    setSelectedPersonaId(item.result.raw[0]?.personaId ?? null);
    setChatMessages([]);
    setMessage(`이전 설문(${new Date(item.result.createdAt).toLocaleString('ko-KR')}) 결과를 불러왔습니다.`);
  };

  const updateProfile = (patch: Partial<PersonaChatProfile>) => {
    if (!selectedPersonaId) return;
    setChatProfiles((prev) => ({
      ...prev,
      [selectedPersonaId]: {
        speakingStyle: '',
        keyConcern: '',
        additionalContext: '',
        confirmed: false,
        ...(prev[selectedPersonaId] ?? {}),
        ...patch,
      },
    }));
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 md:py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">RegionPulse AI</h1>
        <p className="mt-2 text-slate-600">지역·연령·학력 조건 기반 사회 이슈 반응 가설 탐색 도구</p>
      </header>

      <SurveyForm value={input} onChange={setInput} onSubmit={handleSubmit} isRunning={isRunning} />

      <section className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div>
          {result ? (
            <ResultDashboard result={result} onSelectPersona={setSelectedPersonaId} selectedPersonaId={selectedPersonaId} />
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              아직 결과가 없습니다. 질문을 입력하고 시뮬레이션을 실행하세요.
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">페르소나 대화</h3>
            {selectedPersona ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  현재 선택: {selectedPersona.personaName} ({selectedPersona.region} · {selectedPersona.ageGroup} · {selectedPersona.occupation})
                </p>

                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold">상세 페르소나 입력 (대화 전 설정)</p>
                  <div className="mt-2 grid gap-2">
                    <input
                      value={selectedProfile?.speakingStyle ?? ''}
                      onChange={(e) => updateProfile({ speakingStyle: e.target.value, confirmed: false })}
                      placeholder="말투 예: 차분하고 분석적으로"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={selectedProfile?.keyConcern ?? ''}
                      onChange={(e) => updateProfile({ keyConcern: e.target.value, confirmed: false })}
                      placeholder="핵심 관심사 예: 생활비 부담"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={selectedProfile?.additionalContext ?? ''}
                      onChange={(e) => updateProfile({ additionalContext: e.target.value, confirmed: false })}
                      placeholder="추가 맥락 예: 자녀 교육비 지출이 큼"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateProfile({ confirmed: true })}
                    className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white"
                  >
                    상세 페르소나 확정
                  </button>
                  {!selectedProfile?.confirmed && (
                    <p className="mt-1 text-xs text-amber-700">대화를 시작하려면 상세 페르소나를 먼저 확정해 주세요.</p>
                  )}
                </div>

                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-slate-500">질문을 입력해 대화를 시작하세요.</p>
                  ) : chatMessages.map((chat) => (
                    <div key={chat.id} className={`rounded-lg p-2 text-sm ${chat.role === 'user' ? 'bg-indigo-100' : 'bg-white'}`}>
                      <p className="font-medium">{chat.role === 'user' ? '나' : '페르소나'}</p>
                      <p>{chat.content}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="추가 질문을 입력하세요"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!selectedProfile?.confirmed}
                    onClick={handleSendChat}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    전송
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">시뮬레이션 결과에서 페르소나를 먼저 선택하세요.</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">이전 설문 히스토리</h3>
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-sm text-slate-500">아직 히스토리가 없습니다.</p>
              ) : history.map((item) => (
                <button
                  key={item.result.id}
                  type="button"
                  onClick={() => handleLoadHistory(item)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-left text-sm hover:bg-slate-50"
                >
                  <p className="font-medium">{item.result.question}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.result.createdAt).toLocaleString('ko-KR')} · 표본 {item.result.sampledCount}명
                  </p>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
