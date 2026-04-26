interface StatCardProps {
  label: string;
  value: string;
  tone: 'green' | 'red' | 'slate' | 'amber';
}

const toneMap = {
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-50 text-amber-700',
};

export function StatCard({ label, value, tone }: StatCardProps) {
  return (
    <article className={`rounded-xl p-4 ${toneMap[tone]}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </article>
  );
}
