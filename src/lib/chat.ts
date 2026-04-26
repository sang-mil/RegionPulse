import { ChatMessage, PersonaSimulation } from '../types';

interface ChatInput {
  persona: PersonaSimulation;
  surveyQuestion: string;
  userMessage: string;
}

const stanceTone = {
  support: '전반적으로 긍정적으로 보고 있어요.',
  oppose: '아직은 우려가 더 커요.',
  neutral: '판단을 유보하고 있어요.',
  conditional: '조건이 맞으면 동의할 수 있어요.',
} as const;

export function generatePersonaReply({ persona, surveyQuestion, userMessage }: ChatInput): string {
  const keywordHint = userMessage.includes('왜')
    ? `${persona.reasonTags.join(', ')} 측면에서 보면`
    : userMessage.includes('대안')
      ? '대안으로는 단계적 시행과 대상 기준 명확화가 필요하고'
      : `${persona.region} 생활 맥락에서`;

  return `${persona.region} ${persona.ageGroup} ${persona.occupation}로서 말씀드리면, "${surveyQuestion}" 이슈에 대해 ${stanceTone[persona.stance]} ${keywordHint} ${persona.description}`;
}

export function createChatMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}
