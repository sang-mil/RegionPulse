import { Persona } from '../types';
import { PersonaOpinion, generateOpinion } from './opinionEngine';

export type OpinionProvider = 'builtin' | 'gemini' | 'local_api';

interface ProviderOptions {
  provider?: OpinionProvider;
}

interface ProviderPayload {
  stance: PersonaOpinion['stance'];
  confidence: number;
  response: string;
  reasonTags: PersonaOpinion['reasonTags'];
  personaSignals: string[];
}

const safeParse = (text: string): ProviderPayload | null => {
  try {
    const parsed = JSON.parse(text) as Partial<ProviderPayload>;
    if (!parsed.stance || !parsed.response) return null;
    return {
      stance: parsed.stance,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
      response: parsed.response,
      reasonTags: Array.isArray(parsed.reasonTags) ? parsed.reasonTags : ['경제', '공정성', '일자리'],
      personaSignals: Array.isArray(parsed.personaSignals) ? parsed.personaSignals : [],
    };
  } catch {
    return null;
  }
};

const resolveProvider = (provider?: OpinionProvider): OpinionProvider => {
  if (provider) return provider;
  const envProvider = (import.meta.env.VITE_OPINION_PROVIDER as OpinionProvider | undefined) ?? 'builtin';
  return envProvider;
};

async function generateWithGemini(persona: Persona, question: string): Promise<ProviderPayload | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const prompt = `다음 페르소나의 질문 반응을 JSON으로만 반환하세요.\n페르소나:${JSON.stringify(persona)}\n질문:${question}\n반환 스키마:{"stance":"support|oppose|neutral|conditional","confidence":0~1,"response":"...","reasonTags":["경제"],"personaSignals":["..."]}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
  if (!text) return null;
  return safeParse(text);
}

async function generateWithLocalApi(persona: Persona, question: string): Promise<ProviderPayload | null> {
  const url = (import.meta.env.VITE_LOCAL_OPINION_API_URL as string | undefined) ?? '';
  if (!url) return null;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona, question }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return safeParse(JSON.stringify(data));
}

export async function generateOpinionWithProvider(persona: Persona, question: string, options?: ProviderOptions): Promise<PersonaOpinion> {
  const provider = resolveProvider(options?.provider);
  const base = generateOpinion(persona, question);

  try {
    if (provider === 'gemini') {
      const response = await generateWithGemini(persona, question);
      if (response) return { ...base, ...response };
    }
    if (provider === 'local_api') {
      const response = await generateWithLocalApi(persona, question);
      if (response) return { ...base, ...response };
    }
  } catch {
    return base;
  }

  return base;
}
