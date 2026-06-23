import { useRef } from 'react';
import { Icon } from '@iconify/react';
import type { Message, AiResponse, AiProduct } from '@/types/chat';

export type { Message, AiResponse, AiProduct };

const PLACEHOLDER_COLORS = ['#2c2c2c', '#3a3a3a', '#1e1e1e', '#333', '#2a2a2a'];

interface Props {
  message: Message;
}

export default function AgentMessage({ message }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-white rounded-2xl px-4 py-2.5 max-w-[85%] text-sm text-gray-800 shadow-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const p = message.parsed;

  return (
    <div className="flex flex-col gap-2">
      <div className="bg-white/60 rounded-2xl p-4 text-sm text-gray-800 leading-relaxed">
        {!p && <p>{message.content}</p>}

        {p && (
          <>
            <p className="leading-relaxed">{p.message.summary}</p>

            {p.message.points && p.message.points.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {p.message.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="text-gray-400 mt-px flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {p.message.detail && (
              <p className="mt-2.5 text-xs text-gray-500 leading-relaxed border-t border-black/5 pt-2.5">
                {p.message.detail}
              </p>
            )}

            {p.products && p.products.length > 0 && (
              <div className="relative mt-3">
                <div ref={carouselRef} className="flex gap-2 overflow-x-auto hide-scrollbar pr-8">
                  {p.products.map((product, i) => (
                    <div key={product.id} className="flex-shrink-0 w-[88px]">
                      <div
                        className="w-full h-[88px] rounded-xl overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length] }}
                      >
                        {product.image && (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="mt-1.5 px-0.5">
                        <p className="text-[11px] text-gray-700 truncate font-medium">{product.name}</p>
                        {product.price && (
                          <p className="text-[11px] text-gray-500">{product.price}</p>
                        )}
                        {product.metric && (
                          <p className="text-[10px] text-indigo-500 font-medium">{product.metric}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-[44px] -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Icon icon="mdi:chevron-right" width={16} className="text-gray-600" />
                </button>
              </div>
            )}

            {p.products && p.products.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Icon icon="ph:sparkle-fill" width={11} />
                {p.products.length}개의 아이템을 찾았어요.
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 px-1">
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="lucide:copy" width={15} />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="mdi:thumb-up-outline" width={15} />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="mdi:thumb-down-outline" width={15} />
        </button>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Icon icon="mdi:refresh" width={15} />
        </button>
      </div>
    </div>
  );
}
