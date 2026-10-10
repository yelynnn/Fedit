import { Fragment, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useProductStore } from '@/stores/ProductStore';
import type { AiV2, V2AttrAxes, V2Card, V2Data, V2ListRow, V2Option } from '@/types/chat';

// 챗봇 v2(parsed.v2) 렌더러 — 서버 테스트 페이지(fedi-chat-reference/index.html)의
// R.list / R.attrs / R.graph / R.ti / R.text / R.plan / R.clarify, ansHtml(),
// axes(), rowHtml() 구조와 CSS 값을 그대로 옮겼다. 주석의 .row/.ax 등은 원본 클래스명.

// ── 텍스트 ────────────────────────────────────────────────────────────

const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

// <b> 만 허용하는 텍스트 렌더러. 그 외 태그는 제거하고(<br>은 줄바꿈),
// 결과는 React 텍스트 노드로만 만들어서 HTML이 실행될 여지가 없다.
function richText(src: string | null | undefined): ReactNode[] {
  if (!src) return [];
  const html = src.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const nodes: ReactNode[] = [];
  let bold = false;
  html.split(/(<\/?b\s*>)/i).forEach((part, i) => {
    if (/^<b\s*>$/i.test(part)) {
      bold = true;
      return;
    }
    if (/^<\/b\s*>$/i.test(part)) {
      bold = false;
      return;
    }
    const text = decodeEntities(part.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''));
    if (!text) return;
    nodes.push(bold ? <b key={i} className="font-bold">{text}</b> : <Fragment key={i}>{text}</Fragment>);
  });
  return nodes;
}

const fmtWon = (v: number) => `₩${Math.round(v).toLocaleString('ko-KR')}`;
const isHttpUrl = (u?: string) => !!u && /^https?:\/\//i.test(u.trim());

// ── 아이콘(원본 ICON) ─────────────────────────────────────────────────

const IconChev = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);
export const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3FA36B" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-[3px]">
    <path d="M5 12l5 5L20 7" />
  </svg>
);
const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);
const IconRegen = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 3v6h-6" />
  </svg>
);
const IconSpark = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#999" className="flex-none">
    <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" />
  </svg>
);

// 로딩 스피너(.spin)
export const Spin = () => (
  <span className="inline-block flex-none mt-[3px] w-3 h-3 rounded-full border-2 border-[#DDD] border-t-[#555] animate-spin" />
);

// ── 공통 조각 ─────────────────────────────────────────────────────────

// .lbl — '없음·불가'는 빨강, '실시간'은 초록, '기준·추정' 등은 주황
function Lbl({ l }: { l: string }) {
  const tone = /없음|미지원|불가|실패/.test(l)
    ? 'bg-[#FDE8E8] text-[#C0392B]'
    : /실시간/.test(l)
      ? 'bg-[#E9F7EF] text-[#1E7A4A]'
      : /추정|가설|대체|되묻기|빈 결과|스냅샷|시계열|기준|집계/.test(l)
        ? 'bg-[#FFF4E0] text-[#B7791F]'
        : 'bg-[#F1F1F1] text-[#666]';
  return <span className={`text-[10px] font-bold px-[7px] py-px rounded-full ${tone}`}>{l}</span>;
}

// .lg
function Legend({ items }: { items?: [string, string][] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex gap-2 text-[10.5px] text-[#8A8A8A]">
      {items.map(([c, t]) => (
        <span key={t} className="flex items-center gap-[3px] whitespace-nowrap">
          <i className="inline-block w-2 h-2 rounded-full" style={{ background: c }} />
          {t}
        </span>
      ))}
    </div>
  );
}

// .card + .ch
function Card({ title, right, children }: { title?: ReactNode; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-[#F5F5F5] rounded-[14px] p-3">
      {(title || right) && (
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-[12px] font-bold">{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

// .tx
function Tx({ text, bullets, after, className = '' }: { text?: string; bullets?: string[]; after?: string; className?: string }) {
  if (!text && !(bullets && bullets.length) && !after) return null;
  return (
    <div className={`text-[13px] leading-[1.65] [word-break:keep-all] ${className}`}>
      {richText(text)}
      {bullets && bullets.length > 0 && (
        <ul className="mt-1.5 ml-4 p-0 list-disc">
          {bullets.map((b, i) => (
            <li key={i} className="my-[3px]">
              {richText(b)}
            </li>
          ))}
        </ul>
      )}
      {after && <p className="mt-2">{richText(after)}</p>}
    </div>
  );
}

// .note
function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[5px] text-[11px] text-[#8A8A8A]">
      <IconSpark />
      <span>{children}</span>
    </div>
  );
}

// .opts / .opt
function Options({ options, onSend, disabled }: { options?: V2Option[]; onSend?: (t: string) => void; disabled?: boolean }) {
  if (!options || options.length === 0) return null;
  return (
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {options.map((o) => (
        <button
          key={`${o.label}-${o.send}`}
          type="button"
          onClick={() => onSend?.(o.send || o.label)}
          disabled={disabled || !onSend}
          className="text-[12px] px-3 py-2 border border-[#E6E6E6] rounded-full bg-white hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 상품 이미지 — 외부 CDN(무신사·29CM)이라 referrer를 보내지 않고, 실패하면
// 체크무늬 자리표시(.th/.imgs img 배경)만 남긴다.
function Thumb({ src, className }: { src?: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`${className} overflow-hidden bg-[repeating-conic-gradient(#DADADA_0_25%,#F2F2F2_0_50%)] bg-[length:8px_8px]`}>
      {src && !failed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="block w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

// .car + .imgs — 이미지 가로 넘김(‹ › 버튼 + 스와이프)
function ImageCarousel({ cards }: { cards: V2Card[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (cards.length === 0) return null;
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };
  const navCls =
    'absolute top-[34px] z-[1] w-[26px] h-[26px] rounded-full border border-[#E6E6E6] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] grid place-items-center text-[14px] leading-none';
  return (
    <div className="relative">
      <button type="button" aria-label="이전" onClick={() => scroll(-1)} className={`${navCls} -left-1.5`}>
        ‹
      </button>
      <div ref={ref} className="flex gap-2 overflow-x-auto pt-0.5 pb-1.5 snap-x snap-mandatory hide-scrollbar">
        {cards.map((c, i) => {
          const body = (
            <>
              <Thumb src={c.img} className="w-24 h-[120px] rounded-[9px]" />
              {(c.cap ?? c.nm) && (
                <figcaption className="text-[9.5px] text-[#8A8A8A] mt-[3px] leading-[1.3] whitespace-nowrap overflow-hidden text-ellipsis">
                  {c.cap ?? c.nm}
                </figcaption>
              )}
              {c.sub && <div className="text-[9.5px] text-[#E5484D] font-bold">{c.sub}</div>}
            </>
          );
          return (
            <figure key={`${c.url ?? c.img}-${i}`} className="m-0 flex-none w-24 snap-start">
              {isHttpUrl(c.url) ? (
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-inherit no-underline">
                  {body}
                </a>
              ) : (
                body
              )}
            </figure>
          );
        })}
      </div>
      <button type="button" aria-label="다음" onClick={() => scroll(1)} className={`${navCls} -right-1.5`}>
        ›
      </button>
    </div>
  );
}

// ── axes() — attrs 본문과 list/ti 의 breakdown(compact) ──────────────

const AXCOL: Record<string, string> = {
  fit: '#6366F1',
  length: '#0EA5A4',
  sleeve_len: '#0EA5A4',
  neckline: '#A78BFA',
  pattern: '#F59E0B',
  detail: '#E5484D',
  material_vlm: '#8A8A8A',
  l2: '#111',
};

function Axes({ bd, compact }: { bd?: V2AttrAxes | null; compact?: boolean }) {
  if (!bd || !bd.axes || bd.axes.length === 0) return null;
  const n = bd.n != null ? bd.n.toLocaleString('ko-KR') : '';
  return (
    <div className={compact ? 'bg-white rounded-[10px] px-2.5 py-2 mt-2' : 'mt-2'}>
      {compact && (
        <div className="text-[11px] font-bold mb-0.5">
          잘나가는 속성{' '}
          <small className="font-medium text-[#999]">
            · 잘 팔리는 상위 {bd.top_n}개 중 비율 (괄호: 전체 {n}개 중 비율)
          </small>
        </div>
      )}
      {bd.axes.map((a, ai) => (
        <div key={`${a.axis}-${ai}`} className="mt-2">
          <div className="text-[11px] font-bold text-[#444] mt-1.5 mb-[3px] flex justify-between">
            {a.label ?? a.axis}
            <small className="font-medium text-[#8A8A8A]">잘 팔리는 쪽 비율 · 전체 대비</small>
          </div>
          {a.rows.slice(0, compact ? 4 : 6).map((r) => {
            const liftCls =
              r.lift != null && r.lift >= 1.3
                ? 'text-[#2F9E63]'
                : r.lift && r.lift <= 0.7
                  ? 'text-[#E5484D]'
                  : 'text-[#8A8A8A]';
            return (
              <div
                key={r.v}
                title={
                  r.common
                    ? `대부분 상품에 붙는 태그(전체 ${r.share_all}%) — 변별력 낮음`
                    : `전체 ${r.share_all}% → 인기군 ${r.share_top}%`
                }
                className={`grid grid-cols-[82px_minmax(0,1fr)_74px_46px] gap-[7px] items-center py-[3px] text-[11.5px] ${
                  r.common ? 'opacity-55' : ''
                }`}
              >
                <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                  {r.v}
                  {r.common && <small className="text-[9px] text-[#8A8A8A] font-medium"> 흔함</small>}
                </div>
                <div className="h-1.5 rounded-full bg-[#E4E4E4] overflow-hidden">
                  <i
                    className="block h-full rounded-full"
                    style={{ width: `${Math.min(100, r.share_top)}%`, background: AXCOL[a.axis ?? ''] ?? '#888' }}
                  />
                </div>
                <div className="font-bold text-right" title={`전체 ${r.share_all}%`}>
                  {r.share_top}%<small className="font-medium text-[#999]"> ({r.share_all}%)</small>
                </div>
                <div className={`text-[10px] font-bold text-right ${liftCls}`}>
                  {r.lift ? `${r.lift >= 1 ? '↑' : '↓'}${r.lift}배` : '-'}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── rowHtml() — list 상품 행 ──────────────────────────────────────────

function Row({ r }: { r: V2ListRow }) {
  const setModalProductId = useProductStore((s) => s.setModalProductId);
  const nameCls = 'text-inherit no-underline hover:underline';
  return (
    <div className="grid grid-cols-[20px_40px_minmax(0,1fr)_auto_auto_auto] gap-2 items-center px-1 py-2 border-b border-[#EAEAEA] last:border-b-0">
      <div className="w-5 h-5 rounded-[5px] bg-[#111] text-white text-[11px] font-bold grid place-items-center">
        {r.rank}
      </div>
      <Thumb src={r.img} className="w-10 h-10 rounded-[7px]" />
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold leading-[1.3] overflow-hidden text-ellipsis whitespace-nowrap">
          {/* itemcode가 있으면 우리 상품 상세(모달), 없으면 원문 새 탭 */}
          {r.itemcode ? (
            <button
              type="button"
              onClick={() => setModalProductId(r.itemcode!)}
              className={`${nameCls} block w-full truncate text-left`}
            >
              {r.nm}
            </button>
          ) : isHttpUrl(r.url) ? (
            <a href={r.url} target="_blank" rel="noopener noreferrer" className={nameCls}>
              {r.nm}
            </a>
          ) : (
            r.nm
          )}
        </div>
        <div className="text-[10.5px] text-[#8A8A8A] mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{r.sb}</div>
        {r.tags && r.tags.length > 0 && (
          <div className="flex gap-[3px] flex-wrap mt-[3px]">
            {r.tags.map((t) => (
              <span key={t} className="text-[9.5px] px-[5px] rounded-[5px] bg-white border border-[#E4E4E4] text-[#555]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-[12px] font-bold text-[#E5484D] whitespace-nowrap">{r.m1}</div>
      <div className="text-[12px] whitespace-nowrap">{r.m2}</div>
      <div className="text-[11px] text-[#8A8A8A] whitespace-nowrap">{r.m3}</div>
    </div>
  );
}

// ── R.* — 형식별 본문 ─────────────────────────────────────────────────

interface BodyProps {
  data: V2Data;
  onSend?: (text: string) => void;
  sendDisabled?: boolean;
}

function ListBody({ data }: BodyProps) {
  return (
    <Card title={data.title} right={<Legend items={data.legend} />}>
      <div>
        {(data.rows ?? []).map((r, i) => (
          <Row key={`${r.itemcode ?? r.url ?? r.nm}-${i}`} r={r} />
        ))}
      </div>
      {data.tiles && data.tiles.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {data.tiles.map((t) => (
            <div key={t.k} className="bg-white rounded-[9px] px-[9px] py-[7px]">
              <div className="text-[9.5px] text-[#8A8A8A]">{t.k}</div>
              <div className="text-[11.5px] font-bold mt-px">{t.v}</div>
            </div>
          ))}
        </div>
      )}
      <Axes bd={data.breakdown} compact />
    </Card>
  );
}

function GraphBody({ data }: BodyProps) {
  const colA = data.legend?.[0]?.[0] ?? '#6366F1';
  const colB = data.legend?.[1]?.[0] ?? '#A78BFA';
  return (
    <>
      <Card title={data.title} right={<Legend items={data.legend} />}>
        {(data.rows ?? []).map((r, i) => (
          <div
            key={`${r.l}-${i}`}
            title={`${r.pa ?? ''} vs ${r.pb ?? ''}`}
            className="grid grid-cols-[96px_minmax(0,1fr)_52px] gap-2 items-center py-1.5 px-0.5"
          >
            <div className="text-[12px] whitespace-nowrap overflow-hidden text-ellipsis">{r.l}</div>
            <div className="flex flex-col gap-[3px]">
              <div className="h-1.5 rounded-full bg-[#E4E4E4] overflow-hidden">
                <i className="block h-full rounded-full" style={{ width: `${r.a ?? 0}%`, background: colA }} />
              </div>
              <div className="h-1.5 rounded-full bg-[#E4E4E4] overflow-hidden">
                <i className="block h-full rounded-full" style={{ width: `${r.b ?? 0}%`, background: colB }} />
              </div>
            </div>
            <div className={`text-[12px] font-bold text-right ${r.hot ? 'text-[#E5484D]' : ''}`}>{r.v}</div>
          </div>
        ))}
        {data.priority && data.priority.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {data.priority.map((p) => (
              <div
                key={p.n}
                className={`bg-white rounded-[9px] px-[9px] py-[7px] text-[11px] ${p.n === 1 ? 'border-[1.5px] border-[#111]' : ''}`}
              >
                <span className="text-[#999]">{p.n}순위</span>
                <b className="block text-[12px]">{p.t}</b>
                {p.sub}
              </div>
            ))}
          </div>
        )}
      </Card>
      {data.foot && <Tx text={data.foot} className="!text-[12.5px]" />}
    </>
  );
}

function AttrsBody({ data }: BodyProps) {
  const n = data.n != null ? data.n.toLocaleString('ko-KR') : '';
  return (
    <Card
      title={`${data.cond ?? ''} · 속성별 인기 순위`}
      right={
        <div className="flex gap-2 text-[10.5px] text-[#8A8A8A]">
          <span>
            잘 팔리는 상위 {data.top_n}개 중 비율 (괄호: {data.cond} 전체 {n}개 중)
          </span>
        </div>
      }
    >
      <Axes bd={data} />
    </Card>
  );
}

function TiBody({ data }: BodyProps) {
  // cards가 없으면 imgs/captions로 그린다
  const cards: V2Card[] =
    data.cards && data.cards.length > 0
      ? data.cards
      : (data.imgs ?? []).map((img, i) => ({ img, cap: data.captions?.[i] ?? '' }));
  return (
    <>
      <Tx text={data.text} bullets={data.bullets} />
      <ImageCarousel cards={cards} />
      {data.note && <Note>{data.note}</Note>}
      {data.breakdown?.axes && data.breakdown.axes.length > 0 && (
        <Card>
          <Axes bd={data.breakdown} compact />
        </Card>
      )}
    </>
  );
}

function TextBody({ data, onSend, sendDisabled }: BodyProps) {
  return (
    <>
      <Tx text={data.text} bullets={data.bullets} after={data.after} />
      <Options options={data.options} onSend={onSend} disabled={sendDisabled} />
    </>
  );
}

function PlanBody({ data }: BodyProps) {
  const ours = data.ours;
  const oursText = ours?.brand
    ? ` · 자사 ${ours.brand}: ${(ours.types ?? []).map(([t, p]) => `${t} ${p}%`).join(' · ')}${
        ours.price_lo != null && ours.price_hi != null
          ? ` / 가격대 ${fmtWon(ours.price_lo)}~${fmtWon(ours.price_hi)}`
          : ''
      }`
    : '';
  return (
    <>
      {(data.basis || oursText) && (
        <Note>
          {data.basis}
          {oursText}
        </Note>
      )}
      {(data.items ?? []).map((it, i) => (
        <div key={`${it.type}-${i}`} className="bg-[#F5F5F5] rounded-[14px] p-3 flex flex-col gap-[7px]">
          <div className="flex items-baseline gap-2 flex-wrap">
            <b className="text-[13.5px]">
              {i + 1}. {it.type}
            </b>
            {it.move && (
              <span
                className={`text-[10px] font-bold px-[7px] py-px rounded-full ${
                  it.move === '강화' ? 'bg-[#E9F7EF] text-[#1E7A4A]' : 'bg-[#EEF0FF] text-[#4F46E5]'
                }`}
              >
                자사 {it.move}
                {it.ours ? ` (${it.ours}%)` : ''}
              </span>
            )}
            {it.level && (
              <span className="text-[10px] font-bold px-[7px] py-px rounded-full bg-[#FFF4E0] text-[#B7791F]">
                {it.level === '뚜렷' ? '잘 팔리는 쪽에 뚜렷' : '참고'}
              </span>
            )}
            <span className="text-[11px] text-[#666]">
              잘 팔리는 상품의 {it.share_top}% · 전체 {it.share_all}% ({it.lift}배)
            </span>
          </div>
          {it.attrs && it.attrs.length > 0 && (
            <div className="flex gap-[5px] flex-wrap">
              {it.attrs.map((a) => (
                <span key={`${a.axis}-${a.value}`} className="text-[11px] bg-white border border-[#E4E4E4] rounded-[7px] px-[7px] py-0.5">
                  {a.axis} <b className="font-bold">{a.value}</b> {a.share_top}%
                  {a.standout && (
                    <>
                      {' · '}
                      <small className="text-[#2F9E63] font-bold">
                        {a.standout.v} {a.standout.lift}배{a.standout.level === '참고' ? '(참고)' : ''}
                      </small>
                    </>
                  )}
                </span>
              ))}
            </div>
          )}
          {it.price && (
            <div className="text-[12px]">
              인기 가격대{' '}
              <b className="font-bold">
                {fmtWon(it.price.lo)} ~ {fmtWon(it.price.hi)}
              </b>{' '}
              (중앙 {fmtWon(it.price.med)})
            </div>
          )}
          <ImageCarousel cards={it.cards ?? []} />
        </div>
      ))}
    </>
  );
}

function Body({ format, ...props }: BodyProps & { format?: string }) {
  switch (format) {
    case 'list':
      return <ListBody {...props} />;
    case 'graph':
      return <GraphBody {...props} />;
    case 'attrs':
      return <AttrsBody {...props} />;
    case 'ti':
      return <TiBody {...props} />;
    case 'plan':
      return <PlanBody {...props} />;
    case 'clarify':
      return <Options options={props.data.options} onSend={props.onSend} disabled={props.sendDisabled} />;
    default:
      return <TextBody {...props} />;
  }
}

// ── 답변 전체(.bot) ───────────────────────────────────────────────────

interface Props {
  v2: AiV2;
  onSend?: (text: string) => void;
  sendDisabled?: boolean;
  // 다시 생성(.acts regen) — 이 답변을 만든 질문을 다시 보낸다
  question?: string;
}

export default function AgentV2Answer({ v2, onSend, sendDisabled, question }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [stepsOpen, setStepsOpen] = useState(false); // 진행 단계는 기본 접힘
  const a = v2.answer;
  const steps = v2.steps ?? [];

  return (
    <div ref={rootRef} className="flex flex-col gap-2.5 text-[#111] leading-[normal]">
      {/* .steps — "N개의 단계" 접기 + 체크 목록 */}
      {steps.length > 0 && (
        <div className="text-[12px] text-[#666]">
          <button type="button" onClick={() => setStepsOpen((v) => !v)} className="flex items-center gap-[5px] py-0.5">
            <span className="text-[10px] font-bold px-[7px] py-px rounded-full bg-[#F1F1F1] text-[#666]">
              {steps.length}개의 단계
            </span>
            <IconChev />
          </button>
          {stepsOpen && (
            <ol className="mt-1.5 flex flex-col gap-1 text-[11.5px] text-[#8A8A8A]">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-1.5 items-start">
                  <IconCheck />
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* ansHtml() — 답변이 없으면 headline(.hl) */}
      {a?.summary ? (
        <div className="bg-white border border-[#E6E6E6] rounded-[14px] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="text-[14px] font-bold leading-[1.5] [word-break:keep-all]">{richText(a.summary)}</div>
          {a.points && a.points.length > 0 && (
            <ul className="m-0 pl-[18px] list-disc text-[13px] leading-[1.6] [word-break:keep-all]">
              {a.points.map((p, i) => (
                <li key={i}>{richText(p)}</li>
              ))}
            </ul>
          )}
          {a.action && (
            <div className="text-[12.5px] bg-[#EEF0FF] rounded-[9px] px-2.5 py-[7px] [word-break:keep-all]">
              💡 {richText(a.action)}
            </div>
          )}
          {a.unknown && <div className="text-[11.5px] text-[#C0392B] [word-break:keep-all]">{richText(a.unknown)}</div>}
          {a.caveat && <div className="text-[11.5px] text-[#B7791F] [word-break:keep-all]">※ {richText(a.caveat)}</div>}
        </div>
      ) : (
        v2.headline && <div className="text-[13.5px] font-bold leading-[1.5] [word-break:keep-all]">{richText(v2.headline)}</div>
      )}

      {/* .kn — 일반 지식/용어 설명(데이터와 구분) */}
      {a?.summary && v2.knowledge?.text && v2.intent !== 'knowledge' && (
        <div className="bg-[#FFFBEA] rounded-xl px-3 py-2.5 text-[12.5px] leading-[1.6] [word-break:keep-all]">
          <b className="block text-[10.5px] text-[#B7791F]">{v2.knowledge.label}</b>
          {richText(v2.knowledge.text)}
        </div>
      )}

      {v2.labels && v2.labels.length > 0 && (
        <div className="flex gap-[5px] flex-wrap">
          {v2.labels.map((l) => (
            <Lbl key={l} l={l} />
          ))}
        </div>
      )}

      {v2.data && <Body format={v2.format} data={v2.data} onSend={onSend} sendDisabled={sendDisabled} />}

      {/* res.extra — 추가 조건 결과 */}
      {(v2.extra ?? []).map((x, i) => (
        <Fragment key={i}>
          <div className="border-t border-dashed border-[#DDD] my-1" />
          <div className="text-[12.5px] font-bold leading-[1.5]">
            {x.cond_label ?? ''} · {(x.headline ?? '').replace(/<[^>]+>/g, '')}
          </div>
          {x.data && <Body format={x.format} data={x.data} onSend={onSend} sendDisabled={sendDisabled} />}
        </Fragment>
      ))}

      {v2.evidence && (
        <div className="text-[11px] text-[#8A8A8A] leading-[1.5] border-t border-[#F0F0F0] pt-2 [word-break:keep-all]">
          <b className="text-[#999] mr-1">근거</b>
          {Array.isArray(v2.evidence) ? v2.evidence.join(' · ') : v2.evidence}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          aria-label="복사"
          onClick={() => {
            const text = rootRef.current?.innerText;
            if (text) navigator.clipboard?.writeText(text).catch(() => {});
          }}
          className="p-[5px] text-[#9A9A9A] grid place-items-center rounded-md hover:bg-[#F3F3F3] hover:text-[#333]"
        >
          <IconCopy />
        </button>
        {question && onSend && (
          <button
            type="button"
            aria-label="다시"
            disabled={sendDisabled}
            onClick={() => onSend(question)}
            className="p-[5px] text-[#9A9A9A] grid place-items-center rounded-md hover:bg-[#F3F3F3] hover:text-[#333] disabled:opacity-50"
          >
            <IconRegen />
          </button>
        )}
      </div>

      {/* .rel — 연관 질문 한 줄 */}
      {v2.related?.q && (
        <div className="bg-[#F5F5F5] rounded-xl px-3 py-2.5 text-[12px] mt-1">
          <button
            type="button"
            disabled={sendDisabled || !onSend}
            onClick={() => onSend?.(v2.related!.q)}
            className="text-[#666] text-left hover:underline disabled:no-underline"
          >
            “{v2.related.q}”
          </button>
          {v2.related.a && <div className="font-semibold mt-[3px]">{v2.related.a}</div>}
        </div>
      )}
    </div>
  );
}
