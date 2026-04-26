import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SimulationResult } from '../types';
import { PersonaQuoteCard } from './PersonaQuoteCard';
import { StatCard } from './StatCard';

interface ResultDashboardProps {
  result: SimulationResult;
  onSelectPersona: (personaId: string) => void;
  selectedPersonaId: string | null;
}

const stanceRows = [
  { name: '찬성', value: 'support' as const, color: '#10b981' },
  { name: '반대', value: 'oppose' as const, color: '#f43f5e' },
  { name: '중립', value: 'neutral' as const, color: '#64748b' },
  { name: '조건부', value: 'conditional' as const, color: '#f59e0b' },
];

function GroupTable({ title, rows }: { title: string; rows: SimulationResult['byRegion'] }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-2">그룹</th>
              <th className="py-2">찬성</th>
              <th className="py-2">반대</th>
              <th className="py-2">중립</th>
              <th className="py-2">조건부</th>
              <th className="py-2">총합</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-slate-100">
                <td className="py-2">{row.key}</td>
                <td>{row.support}</td>
                <td>{row.oppose}</td>
                <td>{row.neutral}</td>
                <td>{row.conditional}</td>
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ResultDashboard({ result, onSelectPersona, selectedPersonaId }: ResultDashboardProps) {
  const filterLevelLabel = {
    'region+ageGroup+education': '지역 + 나이대 + 학력',
    'region+ageGroup': '지역 + 나이대',
    region: '지역',
    all: '전체 페르소나',
  } as const;

  const chartData = stanceRows.map((row) => ({
    name: row.name,
    count: result.stanceCounts[row.value],
    percentage: result.stancePercentages[row.value],
  }));

  return (
    <section className="space-y-5">
      <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
        본 결과는 실제 여론조사가 아니라 합성 페르소나 기반 사회 반응 시뮬레이션입니다.
      </div>
      <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
        실제 사용된 필터 수준: <span className="font-semibold">{filterLevelLabel[result.usedFilterLevel]}</span>
      </div>
      {result.supplementedCount > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          조건에 정확히 일치한 페르소나는 {result.strictMatchedCount}명이며, 표본 안정성을 위해 유사 페르소나 {result.supplementedCount}명을 보강했습니다.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="찬성" value={`${result.stancePercentages.support}%`} tone="green" />
        <StatCard label="반대" value={`${result.stancePercentages.oppose}%`} tone="red" />
        <StatCard label="중립" value={`${result.stancePercentages.neutral}%`} tone="slate" />
        <StatCard label="조건부" value={`${result.stancePercentages.conditional}%`} tone="amber" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">입장 분포</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="인원 수" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <GroupTable title="지역별 결과" rows={result.byRegion} />
        <GroupTable title="나이대별 결과" rows={result.byAgeGroup} />
        <GroupTable title="학력별 결과" rows={result.byEducation} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">주요 reason tags TOP 5</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {result.topReasonTags.map((item) => (
            <span key={item.tag} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
              #{item.tag} ({item.count})
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">대표 발언 5개</h3>
        <div className="grid gap-3 lg:grid-cols-2">
          {result.representativeQuotes.map((quote) => (
            <PersonaQuoteCard key={quote.personaId} quote={quote} onSelect={(p) => onSelectPersona(p.personaId)} selected={selectedPersonaId === quote.personaId} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">샘플 페르소나 선택</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {result.raw.slice(0, 12).map((row) => (
            <button
              key={row.personaId}
              type="button"
              onClick={() => onSelectPersona(row.personaId)}
              className={`rounded-xl border p-3 text-left text-sm ${selectedPersonaId === row.personaId ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="font-semibold">{row.personaName}</p>
              <p className="text-slate-600">{row.region} · {row.ageGroup} · {row.education}</p>
              <p className="mt-1 text-xs text-slate-500">{row.matchedStrictly ? '조건 일치' : '유사 조건 보강'}</p>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
