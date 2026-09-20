import { Fragment, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
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

// 앱 내부 경로만 링크로 허용한다("/"로 시작, "//" 프로토콜상대 제외).
const isInternalPath = (href: string) => /^\/(?!\/)/.test(href.trim());

// 인라인 마크다운 — 화이트리스트: **볼드**, *이탤릭*(굵기로 렌더), [링크](/path).
// 나머지(인라인 코드·이미지·HTML·취소선 등)는 이스케이프 없이 제거한다.
function renderInline(text: string): ReactNode[] {
  const clean = text
    .replace(/<[^>]+>/g, '') // HTML 전면 차단
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // 이미지 문법 제거(서버가 슬롯으로 전달)
    .replace(/`([^`]+)`/g, '$1') // 인라인 코드 마커 제거(내용은 유지)
    .replace(/~~([^~]+)~~/g, '$1'); // 취소선 등 비화이트리스트 마커 제거

  const nodes: ReactNode[] = [];
  const re =
    /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\s][^*]*?)\*|(?<![A-Za-z0-9])_([^_\s][^_]*?)_(?![A-Za-z0-9])/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean)) !== null) {
    if (m.index > last) {
      nodes.push(<span key={key++}>{clean.slice(last, m.index)}</span>);
    }
    if (m[1] !== undefined) {
      const label = m[1];
      const href = m[2].trim();
      nodes.push(
        isInternalPath(href) ? (
          <Link key={key++} to={href} className="underline underline-offset-2">
            {label}
          </Link>
        ) : (
          // 외부 URL은 <a>로 만들지 않고 평문(텍스트)으로 강등
          <span key={key++}>{label}</span>
        ),
      );
    } else if (m[3] !== undefined || m[4] !== undefined) {
      nodes.push(<strong key={key++}>{m[3] ?? m[4]}</strong>);
    } else if (m[5] !== undefined || m[6] !== undefined) {
      // 한글 이탤릭 금지 → CSS(.chat-body em)가 굵기로 렌더
      nodes.push(<em key={key++}>{m[5] ?? m[6]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < clean.length) {
    nodes.push(<span key={key++}>{clean.slice(last)}</span>);
  }
  return nodes;
}

const isTableRow = (l: string) =>
  /^\|.*\|?$/.test(l) || /^\|?[\s:|-]*-[\s:|-]*$/.test(l);
const isHr = (l: string) => /^([-*_])(\s*\1){2,}$/.test(l);

// 경량 마크다운 렌더러 — 자유 텍스트 슬롯 전용 화이트리스트.
//  허용: **볼드**, *이탤릭*(굵기), 1depth 리스트, > 인용(+ warning), ### 제목,
//        [링크](/내부경로), --- (답변당 1개)
//  강등: #/## → h3
//  제거: 표 · 코드/코드블록 · 이미지 · HTML · 2depth 이상 리스트
//  줄바꿈: 빈 줄(Enter 두 번) = 문단 구분, 한 줄바꿈(Enter 한 번) = <br/>
function Markdown({ text }: { text: string }) {
  const src = text
    .replace(/\r/g, '')
    .replace(/```[\s\S]*?```/g, '') // 펜스 코드블록 제거
    .replace(/~~~[\s\S]*?~~~/g, '');
  const lines = src.split('\n');

  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let quote: { warning: boolean; rows: string[] } | null = null;
  let hrUsed = false;

  const flushList = () => {
    if (!list) return;
    const { ordered, items } = list;
    const Tag = ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag key={`b${blocks.length}`}>
        {items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  // 문단 확정 — 내부 줄바꿈은 <br/>, 문단 사이는 <p> margin.
  const flushPara = () => {
    if (para.length === 0) return;
    const rows = para;
    blocks.push(
      <p key={`b${blocks.length}`}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(row)}
          </Fragment>
        ))}
      </p>,
    );
    para = [];
  };

  const flushQuote = () => {
    if (!quote) return;
    const { warning, rows } = quote;
    blocks.push(
      <blockquote key={`b${blocks.length}`} className={warning ? 'warning' : undefined}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {renderInline(row)}
          </Fragment>
        ))}
      </blockquote>,
    );
    quote = null;
  };

  const flush = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trim();

    // 표 문법은 전부 제거 (컴포넌트가 렌더)
    if (isTableRow(line) && line.includes('|')) {
      flush();
      continue;
    }

    if (!line) {
      flush();
      continue;
    }

    // 구분선 — 답변당 1개, 초과분 제거
    if (isHr(line)) {
      flush();
      if (!hrUsed) {
        blocks.push(<hr key={`b${blocks.length}`} />);
        hrUsed = true;
      }
      continue;
    }

    // 인용 / 주의 박스 — 연속된 > 줄을 하나로
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      flushPara();
      flushList();
      let content = q[1];
      if (!quote) {
        const wm = content.match(/^\[!(warning|caution|주의)\]\s*/i);
        quote = { warning: !!wm, rows: [] };
        if (wm) content = content.slice(wm[0].length);
      }
      if (content) quote.rows.push(content);
      continue;
    }
    flushQuote();

    // 제목 — #/##/### 전부 h3로 (구조 의도는 살린다)
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      flush();
      blocks.push(<h3 key={`b${blocks.length}`}>{renderInline(h[1])}</h3>);
      continue;
    }

    // 불릿 — 들여쓰기(2depth 이상)는 평탄화해서 1depth로
    const b = line.match(/^[-*•]\s+(.*)$/);
    if (b) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(b[1]);
      continue;
    }
    const o = line.match(/^\d+[.)]\s+(.*)$/);
    if (o) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(o[1]);
      continue;
    }

    // 일반 텍스트 — 현재 문단에 누적
    flushList();
    para.push(line);
  }
  flush();
  return <>{blocks}</>;
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
        <div className="bubble-user max-w-[85%] text-sm text-gray-800 shadow-sm leading-relaxed whitespace-pre-line [word-break:keep-all] [overflow-wrap:break-word]">
          {message.content}
        </div>
      </div>
    );
  }

  const p = message.parsed;

  return (
    <div className="flex flex-col gap-2">
      {/* .chat-body(RAG 마크다운 규격)는 자유 텍스트 슬롯에만 건다.
          랭킹·비교표·캐러셀·출처 같은 구조화 컴포넌트에는 적용하지 않는다. */}
      <div className="bubble-bot text-sm text-gray-800 leading-relaxed" aria-live="polite">
        {!p && (
          <div className="chat-body">
            <Markdown text={message.content} />
          </div>
        )}

        {p && (
          <>
            <div className="chat-body">
              {/* 결론 한 줄 — 의미상 첫 요소 */}
              <p className="conclusion">{renderInline(p.message.summary)}</p>

              {p.message.points && p.message.points.length > 0 && (
                <ul>
                  {p.message.points.map((point, i) => (
                    <li key={i}>{renderInline(point)}</li>
                  ))}
                </ul>
              )}

              {p.message.detail && (
                <>
                  <hr />
                  {p.message.detail
                    .replace(/\r/g, '')
                    .split(/\n{2,}/)
                    .map((para, i) => (
                      <p key={i}>
                        {para.split('\n').map((row, j) => (
                          <Fragment key={j}>
                            {j > 0 && <br />}
                            {renderInline(row)}
                          </Fragment>
                        ))}
                      </p>
                    ))}
                </>
              )}
            </div>

            {p.comparison && p.comparison.rows && p.comparison.rows.length > 0 && (
              <div className="mt-3 overflow-x-auto hide-scrollbar">
                <table className="w-full text-xs border-collapse">
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
                  className="w-full flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
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
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
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
                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                  <Icon icon="mdi:instagram" width={13} className="text-pink-400" />
                  주목할 국내 인스타 계정
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.accounts.map((a, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white/80 border border-white/60 rounded-full px-2 py-1 text-gray-600"
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
