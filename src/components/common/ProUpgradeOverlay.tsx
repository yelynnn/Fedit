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
  icon: string;
  image: string;
  heading: string;
  description: string;
  checklist: string[];
};

const FEATURE_CONFIG: Record<string, FeatureConfig> = {
  "패션쇼 분석": {
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
    icon: colorIcon,
    image: ColorCard,
    heading: "브랜드별 색상 트렌드를 한눈에",
    description:
      "색상 분석을 열면 브랜드마다 어떤 컬러를 얼마나 쓰는지, 시즌이 바뀌며 색이 어떻게 이동하는지 확인할 수 있어요. 무신사 크롤링 데이터를 기반으로 매주 갱신됩니다.",
    checklist: [
      "이번 시즌 우리 브랜드가 놓친 컬러가 뭔지 확인하세요.",
      "경쟁 브랜드의 색상 점유율과 비교해 컬러 전략을 세우세요.",
      "'지난달 대비 어떤 색이 뜨고 있나요?'와 같은 질문을 하세요.",
    ],
  },
  "유형 분석": {
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
}: {
  featureName: string;
}) {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const [dismissed, setDismissed] = useState(false);
  const config = FEATURE_CONFIG[featureName];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px]" />

      {!dismissed && config && (
        <div className="relative z-10 flex w-[600px] flex-col items-start gap-6 rounded-xl bg-surface-modal p-6 shadow-[0_12px_32px_0_rgba(0,0,0,0.18)]">
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
              <img
                src={config.icon}
                alt=""
                className="object-contain h-11 w-11 shrink-0"
              />
              <div className="flex flex-col">
                <h2 className="type-headline text-tx-strong">{featureName}</h2>
                <p className="type-body-small text-tx-alt">
                  분석 기능 · Pro 전용
                </p>
              </div>
            </div>
          </div>

          <img
            src={config.image}
            alt={featureName}
            className="w-full rounded-xl"
          />

          <div className="flex flex-col gap-2">
            <h3 className="type-title-medium break-keep text-tx-strong">
              {config.heading}
            </h3>
            <p className="type-body-medium break-keep text-tx-alt">
              {config.description}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="type-title-medium text-tx-strong">
              이런 걸 할 수 있어요
            </h4>
            <ul className="flex flex-col gap-2">
              {config.checklist.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 type-body-medium break-keep text-tx-alt"
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

          <div className="flex items-center justify-between w-full mt-3">
            <button
              type="button"
              onClick={() => openSettingsModal("구독")}
              className="flex items-center gap-1 px-2 h-7 rounded-pill type-body-small text-tx-alt hover:bg-fill-bg-strong"
            >
              모든 요금제 비교하기
            </button>
            <button
              type="button"
              onClick={() => openSettingsModal("구독")}
              className="flex items-center justify-center gap-1.5 rounded-md bg-fill-primary px-3 py-2 type-body-medium text-tx-inverse"
            >
              <img src={upgradeArrow} alt="" className="h-6 w-6" />
              Pro 플랜 요금제로 업그레이드하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
