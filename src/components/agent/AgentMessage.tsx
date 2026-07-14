import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@iconify/react';
import type { Message, AiResponse, AiProduct } from '@/types/chat';

export type { Message, AiResponse, AiProduct };

// 이미지가 없을 때 쓰는 '밝은 중립' 플레이스홀더 (검정 박스 방지)
const PLACEHOLDER_COLORS = ['#f1f2f4', '#e9ebef', '#eef0f3', '#e6e8ec', '#f3f4f6'];

// 12345 -> "1.2만", 2650 -> "2,650"
function compactNum(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000) / 10}만`;
  return n.toLocaleString('ko-KR');
}

// 지표 게이지 한 줄: 라벨 + 바 + 숫자 (0~100 실값 기준)
function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-gray-500 w-[46px] flex-shrink-0">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9.5px] font-semibold w-[22px] text-right" style={{ color }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

// **굵게** 인라인 처리
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    return m ? (
      <strong key={i} className="font-semibold text-gray-900">
        {m[1]}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}

// 경량 마크다운 렌더러 (제목/불릿/번호목록/굵게/줄바꿈)
function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol key={`b${blocks.length}`} className="list-decimal pl-4 my-1 flex flex-col gap-0.5">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ol>
      ) : (
        <ul key={`b${blocks.length}`} className="list-disc pl-4 my-1 flex flex-col gap-0.5">
          {items.map((it, i) => (
            <li key={i}>{renderInline(it)}</li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      flush();
      blocks.push(
        <p key={`b${blocks.length}`} className="font-semibold text-gray-900 mt-2 mb-0.5">
          {renderInline(h[1])}
        </p>,
      );
      continue;
    }
    const b = line.match(/^[-*•]\s+(.*)$/);
    if (b) {
      if (!list || list.ordered) {
        flush();
        list = { ordered: false, items: [] };
      }
      list.items.push(b[1]);
      continue;
    }
    const o = line.match(/^\d+\.\s+(.*)$/);
    if (o) {
      if (!list || !list.ordered) {
        flush();
        list = { ordered: true, items: [] };
      }
      list.items.push(o[1]);
      continue;
    }
    flush();
    blocks.push(
      <p key={`b${blocks.length}`} className="my-1">
        {renderInline(line)}
      </p>,
    );
  }
  flush();
  return <div className="leading-relaxed">{blocks}</div>;
}

interface Props {
  message: Message;
}

export default function AgentMessage({ message }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false); // 출처 목록 기본 접힘

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
        {!p && <Markdown text={message.content} />}

        {p && (
          <>
            <p className="leading-relaxed font-medium">{renderInline(p.message.summary)}</p>

            {p.message.points && p.message.points.length > 0 && (
              <ul className="mt-2.5 flex flex-col gap-1.5">
                {p.message.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="text-gray-400 mt-px flex-shrink-0">•</span>
                    <span>{renderInline(point)}</span>
                  </li>
                ))}
              </ul>
            )}

            {p.message.detail && (
              <div className="mt-2.5 text-xs text-gray-500 leading-relaxed border-t border-black/5 pt-2.5 whitespace-pre-line">
                {renderInline(p.message.detail)}
              </div>
            )}

            {p.comparison && p.comparison.rows && p.comparison.rows.length > 0 && (
              <div className="mt-3 overflow-x-auto hide-scrollbar">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="text-left font-semibold text-gray-400 py-1.5 pr-2 whitespace-nowrap">
                        항목
                      </th>
                      <th className="text-left font-semibold text-indigo-600 py-1.5 px-2">
                        {p.comparison.left}
                      </th>
                      <th className="text-left font-semibold text-gray-700 py-1.5 px-2">
                        {p.comparison.right}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.comparison.rows.map((r, i) => (
                      <tr key={i} className="border-b border-black/5 align-top">
                        <td className="py-1.5 pr-2 text-gray-500 whitespace-nowrap">{r.label}</td>
                        <td className="py-1.5 px-2 text-gray-700">{r.left}</td>
                        <td className="py-1.5 px-2 text-gray-700">{r.right}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {p.products && p.products.length > 0 && (
              <div className="relative mt-3">
                <div ref={carouselRef} className="flex gap-2.5 overflow-x-auto hide-scrollbar pr-8">
                  {p.products.map((product, i) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-[148px] bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden"
                    >
                      <div
                        className="relative w-full h-[120px] flex items-center justify-center"
                        style={{ backgroundColor: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length] }}
                      >
                        {/* 이미지가 없거나 로드 실패해도 보이는 기본 아이콘 */}
                        <Icon icon="ph:image" width={24} className="text-gray-400" />
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="eager"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="px-2.5 pt-1.5 pb-2">
                        {product.brand && (
                          <p className="text-[10px] text-gray-400 truncate font-medium tracking-tight">
                            {product.brand}
                          </p>
                        )}
                        <p className="text-[11.5px] text-gray-800 truncate font-semibold leading-tight">
                          {product.name}
                        </p>
                        {product.price && (
                          <p className="text-[12px] text-gray-900 font-bold mt-0.5">{product.price}</p>
                        )}

                        {/* 실지표 게이지 — 서버가 DB 실값으로만 주입 */}
                        {(product.trendScore != null || product.purchaseScore != null) && (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {product.trendScore != null && (
                              <MetricBar label="트렌드 지수" value={product.trendScore} color="#6366f1" />
                            )}
                            {product.purchaseScore != null && (
                              <MetricBar label="구매 화력" value={product.purchaseScore} color="#f97316" />
                            )}
                          </div>
                        )}

                        {(product.sales != null || product.searchCount != null) && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {[
                              product.sales != null ? `판매 ${compactNum(product.sales)}` : null,
                              product.searchCount != null ? `검색 ${compactNum(product.searchCount)}` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}

                        {(product.color || product.material) && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {[product.color, product.material].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={scrollRight}
                  className="absolute right-0 top-[60px] -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
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

            {p.sources && p.sources.length > 0 && (
              <div className="mt-3 border-t border-black/5 pt-2">
                {/* 출처는 기본 접힘 — 클릭 시 펼침 (답변이 근거 목록에 묻히지 않게) */}
                <button
                  type="button"
                  onClick={() => setSourcesOpen((v) => !v)}
                  className="w-full flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
                >
                  <Icon icon="mdi:fire" width={13} className="text-orange-400" />
                  실데이터 출처 {p.sources.length}
                  <Icon
                    icon={sourcesOpen ? 'ph:caret-up-bold' : 'ph:caret-down-bold'}
                    width={11}
                    className="text-gray-400"
                  />
                </button>
                {sourcesOpen && (
                  <ul className="flex flex-col gap-1.5 mt-1.5">
                    {p.sources.map((s, i) => (
                      <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                        <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 mt-px">
                          {s.platform}
                        </span>
                        <span>
                          <span className="text-gray-800 font-medium">{s.title}</span>
                          {s.note && <span className="text-gray-400"> — {s.note}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {p.accounts && p.accounts.length > 0 && (
              <div className="mt-3 border-t border-black/5 pt-2.5">
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <Icon icon="mdi:instagram" width={13} className="text-pink-400" />
                  주목할 국내 인스타 계정
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.accounts.map((a, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-white/80 border border-white/60 rounded-full px-2 py-1 text-gray-600"
                    >
                      <span className="font-medium text-gray-800">{a.name}</span>
                      {a.handle && <span className="text-gray-400"> {a.handle}</span>}
                      {a.note && <span className="text-gray-400"> · {a.note}</span>}
                    </span>
                  ))}
                </div>
              </div>
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
