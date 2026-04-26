import { PersonaSimulation } from '../types';

export function PersonaQuoteCard({ quote }: { quote: PersonaSimulation }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-2 text-sm text-slate-500">
        {quote.personaName} · {quote.region} · {quote.ageGroup} · {quote.education}
      </p>
      <p className="text-sm leading-relaxed">{quote.response}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {quote.reasonTags.map((tag) => (
          <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}
