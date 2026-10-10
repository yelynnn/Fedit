import AgentMessage from './AgentMessage';
import { IconCheck, Spin } from './AgentV2Answer';
import { LOADING_STEPS } from './useAgentConversation';
import type { Message } from '@/types/chat';

// 대화 메시지 목록 + 응답 대기 단계 — 패널과 전체화면이 같은 모양으로 그린다.

interface Props {
  messages: Message[];
  isLoading: boolean;
  loadingStep: number;
  onSend: (text: string) => void;
  sendDisabled: boolean;
}

export default function AgentThread({ messages, isLoading, loadingStep, onSend, sendDisabled }: Props) {
  return (
    <>
      {messages.map((msg, i) => (
        <AgentMessage
          key={msg.id}
          message={msg}
          onSend={onSend}
          sendDisabled={sendDisabled}
          question={
            msg.role === 'assistant' && messages[i - 1]?.role === 'user' ? messages[i - 1].content : undefined
          }
        />
      ))}

      {/* .steps — 응답 대기 중 "생각 중…" + 단계 목록(가짜 진행) */}
      {isLoading && (
        <div className="text-[12px] text-[#666]">
          <div className="flex items-center gap-[5px] py-0.5">
            <Spin />
            <span className="text-[10px] font-bold px-[7px] py-px rounded-full bg-[#F1F1F1] text-[#666]">
              생각 중…
            </span>
          </div>
          <ol className="mt-1.5 flex flex-col gap-1 text-[11.5px] text-[#8A8A8A]">
            {LOADING_STEPS.slice(0, loadingStep + 1).map((step, i) => (
              <li key={step} className="flex gap-1.5 items-start">
                {i < loadingStep ? <IconCheck /> : <Spin />}
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
