import { PersonaSimulation } from '../types';

interface PersonaQuoteCardProps {
  quote: PersonaSimulation;
  onSelect?: (quote: PersonaSimulation) => void;
  selected?: boolean;
}

export function PersonaQuoteCard({ quote, onSelect, selected }: PersonaQuoteCardProps) {
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm ${selected ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-slate-200'}`}>
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
      {onSelect && (
        <button
          type="button"
          onClick={() => onSelect(quote)}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
        >
          이 페르소나와 대화
        </button>
      )}
    </article>
  );
}
