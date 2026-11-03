import { useState } from "react";
import { Icon } from "@iconify/react";
import { useUIStore } from "@/stores/UIStore";

// FEDI Agent 소개 창 — Enterprise 가 아닌 고객이 Agent 화면에 들어오면 띄운다.
// 어디에 쓰는지, 일반 AI 챗봇(GPT·Claude)과 무엇이 다른지, 어떤 답이 나오는지(예시 답변)를 보여 주고 문의로 안내한다.
// 예시 답변의 숫자는 화면 설명용 예시 값이다(실제 답변은 그때그때 FEDIT 데이터로 계산된다).

const CONTACT_URL = "https://mify.im/fedit/contact-us";

const USES = [
  { icon: "ph:calendar-check", title: "시즌 기획", desc: "다음 시즌에 뜨는 실루엣·소재·컬러를 랭킹과 신상 데이터로 바로 물어봐요." },
  { icon: "ph:binoculars", title: "경쟁사 모니터링", desc: "경쟁 브랜드의 신상품, 가격대, 디자인 비중을 우리 브랜드와 비교해요." },
  { icon: "ph:chart-line-up", title: "리오더·소싱 판단", desc: "급상승 상품과 리뷰 반응을 근거로 무엇을 더 만들고 뺄지 정해요." },
];

const DIFFS: { label: string; general: string; fedi: string }[] = [
  {
    label: "전문 분야",
    general: "모든 분야를 두루 다루는 범용 AI",
    fedi: "패션 기획 특화 — 핏·기장·소재·컬러·시즌 같은 패션 언어로 분석",
  },
  {
    label: "데이터",
    general: "웹에 공개된 일반 지식, 학습 시점에 멈춘 정보",
    fedi: "지금 분석 중인 경쟁사의 실제 상품 데이터(무신사·29CM·W컨셉·자사몰 상품·랭킹·리뷰, 매주 수집)",
  },
  {
    label: "상품 이미지",
    general: "실제로 없는 상품 이미지·링크를 지어내기도 해요",
    fedi: "실제 판매 중인 상품의 이미지와 상세 링크만 보여 줘요",
  },
  {
    label: "분석 깊이",
    general: "상품명·설명 글 수준의 일반론",
    fedi: "상품 이미지를 AI로 분석한 핏·기장·소재·디테일 비중까지 숫자로",
  },
  {
    label: "정확도",
    general: "출처가 불분명해 확인하기 어려워요",
    fedi: "경쟁사 상품 데이터에서 직접 계산한 수치를 근거와 함께 정확하게",
  },
];

type Example = {
  q: string;
  summary: string;
  rows?: { label: string; top: number; all: number; lift: string }[];
  tiles?: { k: string; v: string }[];
  points: string[];
  action: string;
};

const EXAMPLES: Example[] = [
  {
    q: "이번 시즌 여성복 트렌드 키워드",
    summary: "최근 4주 여성 상의 랭킹 상위 100개에서 크롭 기장·스웨이드·하이넥이 전체 평균보다 크게 늘었어요.",
    rows: [
      { label: "크롭 기장", top: 46, all: 28, lift: "1.6배" },
      { label: "스웨이드 소재", top: 19, all: 9, lift: "2.1배" },
      { label: "하이넥", top: 22, all: 14, lift: "1.6배" },
    ],
    points: ["상위권 니트의 절반이 크롭·숏 기장이에요.", "스웨이드는 아우터에서 상의로 넘어오는 중이에요."],
    action: "다음 시즌 아우터·상의에 스웨이드 숏 기장 비중을 늘려 보세요.",
  },
  {
    q: "경쟁사 여성복 디자인 비교 (COS vs ZARA)",
    summary: "COS는 오버핏·미니멀 비중이 높고, ZARA는 슬림핏·디테일 장식 상품이 많아요.",
    tiles: [
      { k: "평균 판매가", v: "COS 12.9만 · ZARA 6.9만" },
      { k: "오버핏 비중", v: "COS 52% · ZARA 31%" },
      { k: "신상 출시(4주)", v: "COS 84개 · ZARA 213개" },
    ],
    points: ["ZARA는 같은 기간 신상이 2.5배 많아 회전이 빨라요.", "COS는 울·코튼 같은 천연 소재 비중이 높아요."],
    action: "가격대가 COS에 가깝다면 오버핏 니트·울 블렌드로 차별화해 보세요.",
  },
  {
    q: "여성복 시즌 컬러·소재 제안",
    summary: "비중은 작지만 여러 브랜드가 동시에 늘리고 있는 색은 버터 옐로우와 체리 레드예요.",
    rows: [
      { label: "버터 옐로우", top: 4, all: 1, lift: "+186%" },
      { label: "체리 레드", top: 3, all: 1, lift: "+142%" },
      { label: "세이지 그린", top: 3, all: 1, lift: "+117%" },
    ],
    points: ["4개 SPA 브랜드가 최근 3개월 동시에 출시를 늘렸어요.", "아직 비중이 작아 선점 여지가 있어요."],
    action: "포인트 컬러로 버터 옐로우 니트를 소량 먼저 테스트해 보세요.",
  },
];

function ExampleAnswer({ ex }: { ex: Example }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line-alt bg-white p-4">
      <div className="flex justify-end">
        <span className="rounded-2xl rounded-br-md bg-[#F2F3F5] px-3 py-2 text-[13px] text-tx-neutral">{ex.q}</span>
      </div>
      <p className="text-[14px] font-semibold leading-6 break-keep text-tx-strong">{ex.summary}</p>
      {ex.rows && (
        <ul className="flex flex-col gap-2">
          {ex.rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[88px_1fr_56px] items-center gap-2 text-[12px]">
              <span className="truncate text-tx-neutral">{r.label}</span>
              <span className="relative h-2 rounded-full bg-surface-base">
                <span className="absolute inset-y-0 left-0 rounded-full bg-[#C7CCD6]" style={{ width: `${Math.min(100, r.all * 2)}%` }} />
                <span className="absolute inset-y-0 left-0 rounded-full bg-[#4F46E5]" style={{ width: `${Math.min(100, r.top * 2)}%`, opacity: 0.85 }} />
              </span>
              <span className="text-right font-semibold text-[#E5484D]">{r.lift}</span>
            </li>
          ))}
        </ul>
      )}
      {ex.tiles && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ex.tiles.map((t) => (
            <div key={t.k} className="rounded-lg bg-surface-base px-3 py-2">
              <p className="text-[11px] text-tx-alt">{t.k}</p>
              <p className="text-[12.5px] font-semibold text-tx-strong">{t.v}</p>
            </div>
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-1">
        {ex.points.map((p) => (
          <li key={p} className="flex gap-1.5 text-[13px] leading-5 break-keep text-tx-alt">
            <span aria-hidden>·</span>
            {p}
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-[#F5F8FF] px-3 py-2 text-[13px] leading-5 break-keep text-tx-neutral">
        <b className="font-semibold">제안</b> {ex.action}
      </p>
    </div>
  );
}

export default function AgentIntroModal({ onClose }: { onClose: () => void }) {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const [tab, setTab] = useState(0);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="FEDI Agent 소개"
        className="relative z-10 flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_32px_0_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-divider px-6 py-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[20px] font-bold text-tx-strong">FEDI Agent</h2>
              <span className="rounded-full bg-[#EEF0FF] px-2 py-0.5 text-[11px] font-bold text-[#4F46E5]">Enterprise</span>
            </div>
            <p className="text-[14px] break-keep text-tx-alt">
              패션 기획에 특화된 AI예요. 지금 분석 중인 경쟁사의 실제 상품 데이터를 근거로 정확하게 답해요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-tx-alt hover:bg-surface-base"
          >
            <Icon icon="ph:x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-7 overflow-y-auto px-6 py-6">
          <section className="flex flex-col gap-3">
            <h3 className="text-[15px] font-semibold text-tx-strong">이렇게 활용해요</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {USES.map((u) => (
                <div key={u.title} className="flex flex-col gap-1.5 rounded-lg bg-surface-base p-4">
                  <Icon icon={u.icon} className="h-5 w-5 text-tx-neutral" aria-hidden />
                  <p className="text-[14px] font-semibold text-tx-strong">{u.title}</p>
                  <p className="text-[13px] leading-5 break-keep text-tx-alt">{u.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-[15px] font-semibold text-tx-strong">일반 AI 챗봇(GPT·Claude)과 무엇이 다른가요?</h3>
            <div className="overflow-hidden rounded-lg border border-line-alt">
              <div className="grid grid-cols-[84px_1fr_1fr] bg-surface-base text-[12px] font-semibold text-tx-alt">
                <span className="px-3 py-2" />
                <span className="px-3 py-2">일반 AI 챗봇</span>
                <span className="px-3 py-2 text-[#4F46E5]">FEDI Agent</span>
              </div>
              {DIFFS.map((d) => (
                <div key={d.label} className="grid grid-cols-[84px_1fr_1fr] border-t border-line-alt text-[13px] leading-5">
                  <span className="px-3 py-2.5 font-semibold text-tx-neutral">{d.label}</span>
                  <span className="px-3 py-2.5 break-keep text-tx-alt">{d.general}</span>
                  <span className="bg-[#FAFAFF] px-3 py-2.5 break-keep text-tx-neutral">{d.fedi}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-tx-strong">이런 답을 받아 볼 수 있어요</h3>
              <span className="text-[12px] text-tx-assistive">예시 답변 · 실제 답변엔 상품 이미지와 링크가 함께 나와요</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.q}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] ${
                    tab === i
                      ? "border-fill-primary bg-fill-primary text-tx-inverse"
                      : "border-line-alt bg-white text-tx-neutral hover:bg-surface-base"
                  }`}
                >
                  {ex.q}
                </button>
              ))}
            </div>
            <ExampleAnswer ex={EXAMPLES[tab]} />
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-divider px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              openSettingsModal("구독");
            }}
            className="text-[13px] text-tx-alt underline-offset-2 hover:underline"
          >
            모든 요금제 비교하기
          </button>
          <button
            type="button"
            onClick={() => window.open(CONTACT_URL, "_blank", "noopener,noreferrer")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-fill-primary px-4 py-2.5 text-[14px] font-semibold text-tx-inverse"
          >
            Enterprise 도입 문의하기
            <Icon icon="ph:arrow-right" className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
