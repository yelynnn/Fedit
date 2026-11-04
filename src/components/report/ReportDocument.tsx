import { Icon } from "@iconify/react";
import type { CustomerReport, ReportBarRow, ReportSection, ReportSegment, ReportStackRow } from "@/types/Report";

// 계정별 맞춤 리포트 문서 — 화면이 아니라 "문서"처럼 보여 준다(A4 폭 종이 한 장, 작은 글씨·촘촘한 표).
// 고객 분석 탭의 리포트 창(CustomerReportModal)에서 띄우고, PDF 는 이 문서(#report-doc)를 그대로 찍는다(lib/reportPdf).
// 요금제: Pro·Enterprise 는 전체, Trial·Basic(과 체험 전·만료)은 아래쪽을 흐리게 하고 "전체 보기"(Pro 안내)를 단다.
// 예시 리포트는 흐림 없이 전부 보여 준다(locked 를 넘기지 않는다).

const HIGHLIGHT_HEX = { a: "#3566C4", b: "#1F7A4A" } as const;
const OTHER_HEX = "#E9EAEA";

// 배경이 밝으면 어두운 글씨
const isLight = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 165;
};

function SectionHead({ no, s }: { no: number; s: { eyebrow: string; title: string; desc?: string } }) {
  return (
    <div className="mb-3 flex flex-col gap-1">
      <p className="text-[10.5px] font-semibold tracking-[0.12em] text-[#8A8C8E]">
        {String(no).padStart(2, "0")} · {s.eyebrow}
      </p>
      <h3 className="text-[16px] font-bold leading-snug text-[#111]">{s.title}</h3>
      {s.desc && <p className="text-[12.5px] leading-[1.65] break-keep text-[#5A5C5E]">{s.desc}</p>}
    </div>
  );
}

function Segment({ seg }: { seg: ReportSegment }) {
  const bg = seg.hex ?? (seg.highlight ? HIGHLIGHT_HEX[seg.highlight] : OTHER_HEX);
  const light = isLight(bg);
  const text = seg.name ? `${seg.name} ${seg.pct}%` : `${seg.pct}%`;
  const show = seg.pct >= (seg.name ? 12 : 8);
  return (
    <div
      className={`flex h-full items-center overflow-hidden whitespace-nowrap px-1.5 text-[10.5px] ${light ? "text-[#2A2C2E]" : "text-white"}`}
      style={{ width: `${seg.pct}%`, background: bg, boxShadow: bg === "#FFFFFF" ? "inset 0 0 0 1px #E3E4E5" : undefined }}
      title={text}
    >
      {show && (
        <span className="truncate">
          {seg.name && <b className="font-semibold">{seg.name} </b>}
          {seg.pct}%
        </span>
      )}
    </div>
  );
}

function StackRows({ rows }: { rows: ReportStackRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[92px_1fr] items-center gap-3">
          <div className="leading-tight">
            <p className={`text-[12.5px] ${r.own ? "font-bold text-[#111]" : "text-[#3D3F41]"}`}>
              {r.label}
              {r.own && <span className="ml-1 text-[10.5px] font-semibold text-[#1F7A4A]">자사</span>}
            </p>
            {r.sub && <p className="text-[10.5px] text-[#8A8C8E]">{r.sub}</p>}
          </div>
          <div className="flex h-6 overflow-hidden rounded-[4px] border border-[#E3E4E5]">
            {r.segments.map((seg, i) => (
              <Segment key={i} seg={seg} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BarRows({ rows, swatches, muted }: { rows: ReportBarRow[]; swatches?: boolean; muted?: boolean }) {
  const max = Math.max(...rows.map((r) => r.value));
  // 상품 줄(브랜드·사진이 있는 줄)은 이름이 길어서 칸을 넓히고 줄바꿈을 허용한다
  const productRows = rows.some((r) => r.brand);
  // 사진이 하나도 없으면(예: 예시 리포트의 가린 비교 브랜드) 빈 사진 칸을 두지 않는다
  const withImages = rows.some((r) => r.img);
  return (
    <div className={`flex flex-col ${productRows ? "gap-1" : "gap-1.5"}`}>
      {rows.map((r, i) => {
        const label = productRows ? (
          <span className="flex min-w-0 items-center gap-2.5">
            {withImages && (
              <span className="h-[38px] w-8 shrink-0 overflow-hidden rounded-[3px] bg-[#F3F3F3]">
                {r.img && <img src={r.img} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />}
              </span>
            )}
            <span className="min-w-0 leading-tight">
              <span className={`block text-[10.5px] ${r.own ? "font-semibold text-[#3566C4]" : "text-[#8A8C8E]"}`}>{r.brand}</span>
              <span className={`block text-[12px] break-keep ${r.own ? "font-bold text-[#111]" : "text-[#2A2C2E]"}`}>{r.label}</span>
            </span>
          </span>
        ) : (
          <span className={`flex min-w-0 items-center gap-2 text-[12.5px] ${r.own ? "font-bold text-[#111]" : "text-[#3D3F41]"}`}>
            {swatches && r.hex && (
              <span className="h-3 w-3 shrink-0 rounded-[3px] border border-black/10" style={{ background: r.hex }} />
            )}
            <span className="truncate" title={r.label}>{r.label}</span>
          </span>
        );
        return (
          <div
            key={`${r.label}-${i}`}
            className={`grid items-center gap-3 ${productRows ? "grid-cols-[minmax(0,300px)_1fr_64px] py-0.5" : "grid-cols-[minmax(0,190px)_1fr_118px]"}`}
          >
            {r.url ? (
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 hover:underline">
                {label}
              </a>
            ) : (
              label
            )}
            <span className="h-2 rounded-full bg-[#F0F1F1]">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(r.value / max) * 100}%`, background: r.own ? "#3566C4" : muted ? "#B3B6B8" : "#3566C4" }}
              />
            </span>
            <span className={`text-right text-[12px] tabular-nums ${r.own ? "font-bold text-[#111]" : "text-[#5A5C5E]"}`}>{r.display}</span>
          </div>
        );
      })}
    </div>
  );
}

// part — head: 구매 브랜드·종류별 키워드, tail: 많이 산 상품 TOP·리뷰 샘플(Trial·Basic 은 tail 부터 흐리게)
function CrossBlock({ s, part = "all" }: { s: Extract<ReportSection, { kind: "cross" }>; part?: "all" | "head" | "tail" }) {
  return (
    <div className="flex flex-col gap-5">
      {part !== "tail" && (
      <>
      <div className="report-block">
        <p className="mb-2 text-[13px] font-semibold text-[#111]">{s.brandsTitle}</p>
        <BarRows rows={s.brands} />
        <p className="mt-3 text-[12.5px] leading-[1.7] break-keep text-[#3D3F41]">{s.paragraph}</p>
      </div>

      <div className="report-block">
        <p className="mb-2 text-[13px] font-semibold text-[#111]">상의 종류별 구매율과 선호 키워드</p>
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="border-y border-[#DADCDD] text-left text-[11px] text-[#8A8C8E]">
              <th className="w-[84px] py-1.5 font-medium">종류</th>
              <th className="w-[64px] py-1.5 text-right font-medium">구매자%</th>
              <th className="py-1.5 pl-4 font-medium">상품명에 많이 나온 특징</th>
            </tr>
          </thead>
          <tbody>
            {s.kinds.map((k) => (
              <tr key={k.kind} className="border-b border-[#EEEFEF]">
                <td className="py-1.5 text-[#111]">{k.kind}</td>
                <td className="py-1.5 text-right tabular-nums text-[#111]">{k.pct}</td>
                <td className="py-1.5 pl-4 text-[#3D3F41]">{k.keywords}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {part !== "head" && (
      <>
      <div className="report-block">
        <p className="mb-2 text-[13px] font-semibold text-[#111]">많이 산 상의 TOP {s.top.length}</p>
        {/* 한 줄 5개 작은 카드 — 사진 + 순위·브랜드·상품·종류·별점·가격·구매자 */}
        <div className="grid grid-cols-5 gap-2.5">
          {s.top.map((t) => (
            <a
              key={t.rank}
              href={t.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col overflow-hidden rounded-md border border-[#E3E4E5] bg-white transition-colors hover:border-[#B3B6B8]"
            >
              <div className="relative aspect-[5/6] bg-[#F3F3F3]">
                {t.img && <img src={t.img} alt={t.name} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />}
                <span className="absolute left-1.5 top-1.5 rounded-[3px] bg-[#111] px-1.5 py-px text-[10.5px] font-bold text-white">
                  {t.rank}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 px-2 py-1.5">
                <p className="truncate text-[10.5px] text-[#8A8C8E]">{t.brand}</p>
                <p className="line-clamp-2 min-h-[30px] text-[11.5px] font-medium leading-[1.3] text-[#111]" title={t.name}>
                  {t.name}
                </p>
                <p className="truncate text-[10.5px] text-[#8A8C8E]">
                  {t.type} · ★{t.rating}
                </p>
                <p className="flex items-baseline justify-between gap-1 whitespace-nowrap">
                  <span className="text-[10.5px] tabular-nums text-[#5A5C5E]">{t.price}</span>
                  <span className="text-[11.5px] font-bold text-[#3566C4]">구매 {t.buyers}명</span>
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="report-block">
        <p className="mb-2 text-[13px] font-semibold text-[#111]">리뷰 샘플 — 재구매가 많은 상의의 공통 언어</p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {s.reviews.map((r) => (
            <div
              key={r.product}
              className={`border-l-[3px] bg-[#FAFAFA] px-3 py-2 ${r.tone === "good" ? "border-[#3566C4]" : "border-[#D2691E]"}`}
            >
              <p className="text-[11.5px]">
                <b className="font-semibold text-[#111]">{r.product}</b>
                <span className="ml-1.5 text-[#8A8C8E]">{r.meta}</span>
              </p>
              <p className="mt-1 text-[12px] leading-[1.6] break-keep text-[#3D3F41]">“{r.quote}”</p>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function SectionBody({ s }: { s: ReportSection }) {
  switch (s.kind) {
    case "stack":
      return (
        <>
          {s.legend && (
            <div className="mb-2.5 flex flex-wrap gap-3 text-[11px] text-[#5A5C5E]">
              {s.legend.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-[2px] border border-black/5" style={{ background: l.hex }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}
          <StackRows rows={s.rows} />
          {s.note && <p className="mt-2 text-[11px] text-[#8A8C8E]">{s.note}</p>}
        </>
      );
    case "bars":
      return <BarRows rows={s.rows} swatches={s.swatches} muted={s.muted} />;
    case "cross":
      return <CrossBlock s={s} />;
    case "keywords":
      return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {s.columns.map((c) => (
            <div key={c.platform} className="rounded-md border border-[#E3E4E5] px-3 py-2.5">
              <p className="mb-1.5 text-[11px] font-semibold text-[#8A8C8E]">{c.platform}</p>
              <ol className="flex flex-col gap-1 text-[12.5px]">
                {c.items.map((it, i) => (
                  <li key={it.text} className={it.hl ? "font-bold text-[#111]" : "text-[#3D3F41]"}>
                    <span className="mr-1.5 tabular-nums text-[#A1A3A5]">{i + 1}</span>
                    {it.text}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      );
  }
}

// Trial·Basic(과 체험 전·만료)은 아래쪽을 흐리게 — 교차 구매 섹션의 "많이 산 상품 TOP"부터 잠근다
// (교차 구매 섹션이 없으면 절반부터)
const lockFrom = (n: number) => Math.ceil(n / 2);

function LockedCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex w-[380px] max-w-[90%] flex-col items-center gap-3 rounded-xl border border-[#E3E4E5] bg-white px-6 py-5 text-center shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#F2F3F5]">
        <Icon icon="ph:lock-simple-fill" className="h-5 w-5 text-[#242628]" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-bold text-[#111]">전체 리포트는 Pro부터 볼 수 있어요</p>
        <p className="text-[12.5px] leading-[1.6] break-keep text-[#5A5C5E]">
          많이 산 상품 TOP 10, 리뷰, 전년 히트 상품, 시장 검색어까지 모두 열려요.
        </p>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="h-[40px] w-full rounded-md bg-fill-primary text-[14px] font-semibold text-tx-inverse hover:opacity-90"
      >
        전체 보기
      </button>
    </div>
  );
}

export function ReportDocument({
  report,
  locked,
  example,
  onUpgrade,
}: {
  report: CustomerReport;
  /** 아래 절반을 흐리게(Trial·Basic) */
  locked: boolean;
  /** 받은 리포트가 아직 없어 예시를 보여 주는 중 */
  example: boolean;
  onUpgrade: () => void;
}) {
  const crossIdx = report.sections.findIndex((s) => s.kind === "cross");
  // 잠금 시 — 교차 구매가 있으면 그 섹션의 앞부분까지 보이고 TOP 부터 흐리게, 없으면 절반부터
  const splitCross = locked && crossIdx >= 0;
  const cut = !locked ? report.sections.length : splitCross ? crossIdx + 1 : lockFrom(report.sections.length);
  const renderSection = (s: ReportSection, i: number, part?: "head") => (
    <section key={s.id} className={`mt-7 border-t border-[#E3E4E5] pt-5 ${s.kind === "cross" ? "" : "report-block"}`}>
      <SectionHead no={i + 1} s={s} />
      {s.kind === "cross" && part ? <CrossBlock s={s} part="head" /> : <SectionBody s={s} />}
    </section>
  );
  const crossSection = splitCross ? report.sections[crossIdx] : null;
  return (
    <article
      id="report-doc"
      className="relative mx-auto w-full max-w-[820px] border border-[#E3E4E5] bg-white px-10 py-9 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
    >
      {example && (
        <span className="absolute right-10 top-9 rounded-[3px] border border-[#DADCDD] px-1.5 py-0.5 text-[10.5px] font-semibold tracking-[0.08em] text-[#8A8C8E]">
          예시 리포트
        </span>
      )}
      <header className="report-block border-b-2 border-[#111] pb-4">
        <p className="text-[10.5px] font-semibold tracking-[0.14em] text-[#1F7A4A]">{report.eyebrow}</p>
        <h1 className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] text-[#111]">{report.title}</h1>
        <dl className="mt-3 grid grid-cols-[64px_1fr] gap-x-3 gap-y-1 text-[12px]">
          <dt className="text-[#8A8C8E]">발행</dt>
          <dd className="text-[#3D3F41]">{report.publishedAt}</dd>
          <dt className="text-[#8A8C8E]">대상</dt>
          <dd className="text-[#3D3F41]">
            <b className="font-semibold text-[#111]">{report.ownBrand}</b> (자사) · 비교 {report.compareBrands.join(", ")}
          </dd>
          <dt className="text-[#8A8C8E]">데이터</dt>
          <dd className="text-[#3D3F41]">{report.basis}</dd>
        </dl>
      </header>

      <section className="report-block mt-5 bg-[#F6F7F7] px-5 py-4">
        <p className="mb-2 text-[12px] font-bold text-[#111]">핵심 요약</p>
        <ol className="flex flex-col gap-1.5">
          {report.summary.map((t, i) => (
            <li key={t} className="flex gap-2 text-[12.5px] leading-[1.6] break-keep text-[#2A2C2E]">
              <span className="w-4 shrink-0 font-semibold tabular-nums text-[#1F7A4A]">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      {report.sections.slice(0, cut).map((s, i) => renderSection(s, i, splitCross && i === crossIdx ? "head" : undefined))}

      {(cut < report.sections.length || splitCross) && (
        // 잠긴 아래 절반 — 흐리게 그려서 PDF 에도 흐린 채로 들어간다. 안내 카드는 맨 위에 붙어 있다
        <div className="relative">
          <div className="pointer-events-none select-none" style={{ filter: "blur(6px)" }} aria-hidden>
            {crossSection?.kind === "cross" && (
              <div className="mt-5">
                <CrossBlock s={crossSection} part="tail" />
              </div>
            )}
            {report.sections.slice(cut).map((s, i) => renderSection(s, cut + i))}
          </div>
          <div className="absolute inset-x-0 top-16 flex justify-center">
            <LockedCard onUpgrade={onUpgrade} />
          </div>
        </div>
      )}

      <footer className="mt-8 flex items-center justify-between border-t border-[#E3E4E5] pt-3 text-[10.5px] text-[#A1A3A5]">
        <span>FEDIT · {example ? "예시 리포트" : `${report.ownBrand} 계정 전용 리포트`}</span>
        <span>{report.publishedAt} 발행</span>
      </footer>
    </article>
  );
}
