import { useEffect, useState } from 'react';
import type { Message } from '@/types/chat';
import { isDraftId, useChatStore } from '@/stores/ChatStore';
import { PostChat, parseAssistantContent } from '@/apis/ChatAPI';
import { trackFediChatSent } from '@/lib/analytics';
import {
  useSubscriptionStore,
  getEffectivePlan,
  toBillingPlan,
} from '@/stores/SubscriptionStore';

// 플로팅 패널(AgentChat)과 전체화면(AgentPage)이 같이 쓰는 대화 상태·전송 로직.

// 응답이 3~8초 걸려서 기다리는 동안 단계를 보여준다(실제 진행과 연동되진 않음)
export const LOADING_STEPS = ['질문 이해', '데이터 조회', '답변 정리'];
const LOADING_STEP_DELAYS_MS = [1200, 3200];

export const DEFAULT_SUGGESTIONS = [
  '이번 시즌 여성복 트렌드 키워드',
  '여성복 스타일 무드별 추천',
  '경쟁사 여성복 디자인 비교',
  '여성복 시즌 컬러·소재 제안',
];

// 대화의 마지막 답변에 달린 연관 질문 — 이전 대화를 다시 열어도 칩이 이어진다
function lastChips(messages: Message[]): string[] | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const p = messages[i].parsed;
    if (messages[i].role !== 'assistant' || !p) continue;
    const chips = p.v2?.chips?.length ? p.v2.chips : p.chips;
    if (chips && chips.length > 0) return chips;
  }
  return undefined;
}

export function useAgentConversation(conversationId: string) {
  const { conversations, saveMessages, promoteDraft, pendingConversationId, setPending } =
    useChatStore((s) => s);
  const conv = conversations.find((c) => c.id === conversationId);
  const subscription = useSubscriptionStore((s) => s.subscription);
  // 요금제를 아직 못 불러왔으면 "Enterprise 전용" 안내 대신 확인 중으로 둔다
  const planLoaded = useSubscriptionStore((s) => s.loaded);
  // AI Agent는 Enterprise 전용 기능이다 — 화면은 모두에게 노출하되,
  // 실제로 입력해서 보내는 건 Enterprise만 가능하게 막는다.
  const isEnterprise = toBillingPlan(getEffectivePlan(subscription)) === 'enterprise';

  // 메시지는 스토어가 원본이다 — 화면을 닫았다 열거나 응답이 늦게 와도
  // 같은 대화에 그대로 쌓인다.
  const messages = conv?.messages ?? [];
  // 응답 대기는 한 번에 한 대화만 — 대기 중인 대화를 다시 열어도 로딩이 보인다
  const isLoading = pendingConversationId === conversationId;
  // 서버에서 대화 내용을 불러오는 중이면 보내기를 막는다(캐시를 덮어쓰지 않게)
  const isLoadingHistory = !!conv && !conv.loaded;
  const isBusy = pendingConversationId !== null || isLoadingHistory;

  const [loadingStep, setLoadingStep] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(
    () => lastChips(conv?.messages ?? []) ?? DEFAULT_SUGGESTIONS,
  );

  useEffect(() => {
    if (!isLoading) return;
    setLoadingStep(0);
    const timers = LOADING_STEP_DELAYS_MS.map((ms, i) => setTimeout(() => setLoadingStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

  // 서버에서 대화 내용을 늦게 받아오면 그때 칩을 맞춘다
  useEffect(() => {
    if (conv?.loaded) setSuggestions(lastChips(conv.messages) ?? DEFAULT_SUGGESTIONS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv?.loaded]);

  const send = async (text: string) => {
    if (!isEnterprise) return;
    const query = text.trim();
    if (!query || isBusy) return;

    const nextMessages: Message[] = [...messages, { id: `${Date.now()}-user`, role: 'user', content: query }];
    saveMessages(conversationId, nextMessages);
    setPending(conversationId);

    try {
      // FEDI 에이전트 채팅 전송 — feature_viewed(조회)와 분리된 별도 이벤트.
      // 위 가드(!isEnterprise, 빈 입력/로딩 중)를 통과한 뒤라 여기가 "요청이
      // 실제로 나가는" 지점이다.
      trackFediChatSent();
      // 서버 대화에 이어서 보내야 후속 질문("그럼 블랙은?")이 앞 질문을 이해한다.
      // 초안(새 대화)이면 conversationId 없이 보내고 응답의 id를 받아 둔다.
      const data = await PostChat(query, isDraftId(conversationId) ? undefined : conversationId);

      const raw = data.answer || '';
      const parsed = data.parsed || parseAssistantContent(raw);
      saveMessages(conversationId, [
        ...nextMessages,
        { id: `${Date.now()}-assistant`, role: 'assistant', content: raw, parsed, mode: data.mode },
      ]);
      if (data.conversationId != null) promoteDraft(conversationId, String(data.conversationId));

      // v2는 parsed.v2.chips가 원본 — 없으면 기존 parsed.chips
      const chips: string[] | undefined = parsed?.v2?.chips?.length ? parsed.v2.chips : parsed?.chips;
      if (chips && chips.length > 0) setSuggestions(chips);
    } catch {
      saveMessages(conversationId, [
        ...nextMessages,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: '응답 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        },
      ]);
    } finally {
      setPending(null);
    }
  };

  return {
    conv,
    messages,
    isEnterprise,
    planLoaded,
    isLoading,
    isLoadingHistory,
    isBusy,
    loadingStep,
    suggestions,
    send,
  };
}
