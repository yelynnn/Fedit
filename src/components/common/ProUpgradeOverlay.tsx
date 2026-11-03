import { Icon } from "@iconify/react";
import { useState } from "react";
import { useUIStore } from "@/stores/UIStore";
import ColorCard from "@/assets/planCard/ColorCard.svg";
import RunwayCard from "@/assets/planCard/RunwayCard.svg";
import TypeCard from "@/assets/planCard/TypeCard.svg";
import runwayIcon from "@/assets/etc/runwayIcon.svg";
import colorIcon from "@/assets/etc/colorIcon.svg";
import categoryIcon from "@/assets/etc/categoryIcon.svg";
import cancelIcon from "@/assets/planCard/cancel.svg";
import upgradeArrow from "@/assets/planCard/upgrade_arrow.svg";

type FeatureConfig = {
  // 이 기능이 열리는 가장 낮은 요금제 — basic 이면 "멤버십 전용"·Basic 업그레이드 안내
  minPlan: "basic" | "pro";
  // icon(이미지) 대신 iconify 아이콘을 쓸 수 있다. image 가 없으면 큰 미리보기 그림은 뺀다
  icon?: string;
  iconify?: string;
  image?: string;
  /** "분석 기능 · 멤버십 전용"의 앞부분(기본 "분석 기능") */
  kind?: string;
  /** 창 제목(기본은 탭 이름) */
  title?: string;
  /** 담기는 내용(항목 + 한 줄 설명) — 리포트처럼 구성이 정해진 기능 */
  contents?: { icon: string; title: string; desc: string }[];
  contentsTitle?: string;
  /** "이런 걸 할 수 있어요" 대신 쓸 제목 */
  checklistTitle?: string;
  /** 받는 방법 안내 줄 */
  howTo?: string[];
  /** 버튼 위 작은 안내 한 줄 */
  note?: string;
  heading: string;
  description: string;
  checklist: string[];
};

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  "패션쇼 분석": {
    minPlan: "pro",
    icon: runwayIcon,
    image: RunwayCard,
    heading: "런웨이에서 시즌 트렌드를 먼저 읽기",
    description:
      "패션쇼 분석은 시즌 런웨이의 키 컬러·소재·실루엣을 정리해 보여줘요. 컬렉션이 시장에 내려오기 전에, 다가올 트렌드를 미리 준비할 수 있습니다.",
    checklist: [
      "다가오는 F/W 시즌의 핵심 컬러와 소재를 미리 파악하세요.",
      "브랜드별 런웨이 방향성을 비교해 벤치마킹하세요.",
      "'이번 시즌 볼륨 실루엣이 주류인가요?'와 같은 질문을 하세요.",
    ],
  },
  "색상 분석": {
    minPlan: "basic",
    icon: colorIcon,
    image: ColorCard,
    heading: "브랜드별 색상 트렌드를 한눈에",
    description:
      "색상 분석을 열면 브랜드마다 어떤 컬러를 얼마나 쓰는지, 시즌이 바뀌며 색이 어떻게 이동하는지 확인할 수 있어요. 브랜드 상품 데이터를 기반으로 매주 갱신됩니다.",
    checklist: [
      "이번 시즌 우리 브랜드가 놓친 컬러가 뭔지 확인하세요.",
      "경쟁 브랜드의 색상 점유율과 비교해 컬러 전략을 세우세요.",
      "'지난달 대비 어떤 색이 뜨고 있나요?'와 같은 질문을 하세요.",
    ],
  },
  리포트: {
    minPlan: "basic",
    iconify: "ph:file-text-fill",
    title: "브랜드 맞춤 리포트",
    kind: "월 1회 제공",
    heading: "우리 브랜드 맞춤 시즌 기획 리포트",
    description:
      "관심 브랜드와 경쟁사를 FEDIT 데이터로 비교해, 다음 시즌 기획에 바로 쓸 인사이트를 한 문서로 정리해 드려요.",
    contentsTitle: "리포트가 답해 주는 질문",
    contents: [
      { icon: "ph:scales", title: "우리 브랜드는 시장과 무엇이 다른가", desc: "색상·유형 구성을 시장·경쟁사와 나란히 놓고 과한 곳과 빈 곳을 짚어요." },
      { icon: "ph:target", title: "다음 시즌 무엇을 늘릴까", desc: "경쟁사가 동시에 늘리는 색, 시장 상위인데 우리에게 없는 카테고리를 골라요." },
      { icon: "ph:users-three", title: "우리 고객은 어디서 또 사나", desc: "우리 고객이 경쟁사에서 실제로 산 상품 TOP 10과 리뷰로 빈자리를 확인해요." },
      { icon: "ph:calendar-check", title: "작년 이맘때 무엇이 팔렸나", desc: "전년 같은 시즌 경쟁사 판매 상위 상품을 우리 대표 상품과 비교해요." },
      { icon: "ph:magnifying-glass", title: "지금 수요는 어디에 있나", desc: "플랫폼별 검색 상위 키워드로 이번 시즌 수요를 확인해요." },
      { icon: "ph:lightbulb", title: "그래서 무엇을 하면 되나", desc: "데이터에서 찾은 인사이트와 다음 시즌 제안을 핵심 요약으로 정리해요." },
    ],
    checklistTitle: "화면 분석과 다른 점",
    checklist: [
      "여러 탭에 흩어진 데이터를 우리 브랜드 기준 한 흐름으로 엮어 드려요.",
      "화면에서 따로 보기 어려운 전년 동기 판매와 고객 교차 구매를 함께 담아요.",
      "숫자만이 아니라 FEDIT가 찾은 인사이트와 제안이 들어간 기획 문서예요.",
    ],
    howTo: [
      "관심 브랜드를 기준으로 월 1회 만들어 리포트 탭에 올려 드려요.",
      "Basic은 리포트 일부, Pro부터 전체를 볼 수 있어요.",
      "무료체험 중에도 맞춤 리포트를 1회 받아 볼 수 있어요.",
    ],
  },
  "유형 분석": {
    minPlan: "basic",
    icon: categoryIcon,
    image: TypeCard,
    heading: "뜨는 실루엣 · 카테고리를 데이터로",
    description:
      "유형 분석은 스커트·팬츠·아우터 등 카테고리별 판매 비중과 급상승 실루엣을 보여줘요. 어떤 유형이 시장에서 성장하고 있는지 흐름을 남보다 먼저 잡을 수 있습니다.",
    checklist: [
      "다음 시즌 어떤 카테고리에 물량을 실을지 근거를 확보하세요.",
      "급상승 중인 실루엣을 초기에 발견해 기획에 반영하세요.",
      "'요즘 미니 스커트가 계속 오르고 있나요?'와 같은 질문을 하세요.",
    ],
  },
};

export default function ProUpgradeOverlay({
  featureName,
  onShowDemo,
}: {
  featureName: string;
  /** 있으면 "예시 화면 보기" — 예시 브랜드 데이터로 이 화면을 연다(색상·유형 분석) */
  onShowDemo?: () => void;
}) {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const [dismissed, setDismissed] = useState(false);
  const config = FEATURE_CONFIG[featureName];
  // 리포트처럼 담기는 내용이 많은 창은 넓게·촘촘하게 — 스크롤 없이 한 화면에 들어오게
  const compact = !!config?.contents;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px]" />

      {!dismissed && config && (
        <div
          className={`relative z-10 flex max-h-[94vh] flex-col items-start overflow-y-auto rounded-xl bg-surface-modal p-6 shadow-[0_12px_32px_0_rgba(0,0,0,0.18)] ${
            compact ? "w-[800px] max-w-[94vw] gap-4" : "w-[600px] gap-6"
          }`}
        >
          <div className="flex flex-col w-full gap-0">
            <div className="flex items-center justify-end w-full h-7">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="flex h-7 w-7 items-center justify-center gap-2.5 rounded-pill border border-line-alt bg-fill-bg p-1 hover:bg-fill-bg-strong"
              >
                <img src={cancelIcon} alt="닫기" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {config.iconify ? (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-base">
                  <Icon icon={config.iconify} className="h-6 w-6 text-[#242628]" />
                </span>
              ) : (
                <img
                  src={config.icon}
                  alt=""
                  className="object-contain h-11 w-11 shrink-0"
                />
              )}
              <div className="flex flex-col">
                <h2 className="type-headline text-tx-strong">{config.title ?? featureName}</h2>
                <p className="type-body-small text-tx-alt">
                  {config.kind ?? "분석 기능"} · {config.minPlan === "basic" ? "멤버십 전용" : "Pro 전용"}
                </p>
              </div>
            </div>
          </div>

          {config.image && (
            <img
              src={config.image}
              alt={featureName}
              className="w-full rounded-xl"
            />
          )}

          <div className="flex flex-col gap-2">
            {config.heading && (
              <h3 className="type-title-medium break-keep text-tx-strong">
                {config.heading}
              </h3>
            )}
            <p className="type-body-medium break-keep text-tx-alt">
              {config.description}
            </p>
          </div>

          {config.contents && (
            <div className="flex w-full flex-col gap-3">
              <h4 className="type-title-medium text-tx-strong">{config.contentsTitle ?? "리포트에 담기는 내용"}</h4>
              <ul className="grid w-full grid-cols-3 gap-2">
                {config.contents.map((c) => (
                  <li key={c.title} className="flex flex-col gap-1 rounded-lg bg-surface-base px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <Icon icon={c.icon} className="h-4 w-4 shrink-0 text-tx-neutral" />
                      <span className="text-[13.5px] font-semibold text-tx-strong">{c.title}</span>
                    </span>
                    <span className="text-[12.5px] leading-[1.5] break-keep text-tx-alt">{c.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={compact && (config.checklist.length > 0 || config.howTo) ? "grid w-full grid-cols-2 gap-3" : "contents"}>
          {config.checklist.length > 0 && (
          <div className={`flex flex-col ${compact ? "gap-2 rounded-lg border border-line-alt px-4 py-3" : "gap-3"}`}>
            <h4 className={compact ? "text-[13px] font-semibold text-tx-strong" : "type-title-medium text-tx-strong"}>
              {config.checklistTitle ?? "이런 걸 할 수 있어요"}
            </h4>
            <ul className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
              {config.checklist.map((item) => (
                <li
                  key={item}
                  className={`flex items-start gap-2 break-keep text-tx-alt ${compact ? "text-[13px] leading-5" : "type-body-medium"}`}
                >
                  <Icon
                    icon="ph:check-bold"
                    className="w-4 h-4 mt-1 shrink-0 text-data-blue"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          )}

          {config.howTo && (
            <div className="flex w-full flex-col gap-1.5 rounded-lg border border-line-alt px-4 py-3">
              <p className="text-[13px] font-semibold text-tx-strong">받는 방법</p>
              {config.howTo.map((t) => (
                <p key={t} className="flex items-start gap-1.5 text-[13px] leading-5 break-keep text-tx-alt">
                  <span aria-hidden>·</span>
                  {t}
                </p>
              ))}
            </div>
          )}
          </div>

          {config.note && <p className="w-full text-[12.5px] text-tx-assistive">{config.note}</p>}

          <div className={`flex items-center justify-between w-full ${compact ? "mt-1" : "mt-3"}`}>
            {onShowDemo ? (
              <button
                type="button"
                onClick={onShowDemo}
                className="flex items-center justify-center gap-1.5 rounded-md border border-line-alt bg-white px-3 py-2 type-body-medium text-tx-neutral hover:bg-surface-base"
              >
                <Icon icon="ph:eye" className="w-5 h-5" />
                예시 화면 보기
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openSettingsModal("구독")}
                className="flex items-center gap-1 px-2 h-7 rounded-pill type-body-small text-tx-alt hover:bg-fill-bg-strong"
              >
                모든 요금제 비교하기
              </button>
            )}
            <button
              type="button"
              onClick={() => openSettingsModal("구독")}
              className="flex items-center justify-center gap-1.5 rounded-md bg-fill-primary px-3 py-2 type-body-medium text-tx-inverse"
            >
              <img src={upgradeArrow} alt="" className="h-6 w-6" />
              {config.minPlan === "basic" ? "Basic 플랜 요금제로" : "Pro 플랜 요금제로"} 업그레이드하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
