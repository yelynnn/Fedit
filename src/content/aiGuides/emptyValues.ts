import type { GuideTopic } from "@/types/guide";

const emptyValues: GuideTopic = {
  id: "empty-values",
  category: "데이터 제대로 이해하기",
  title: "값이 비어 있어요",
  desc: "미입점·빈값 데이터 해석법",
  subtitle: "지수·데이터가 빈값(—)으로 보일 때의 원인과 해석법",
  blocks: [
    {
      type: "quote",
      text: "지수나 데이터가 빈값(—)으로 보일 때, 왜 그런지와 어떻게 읽어야 하는지 안내합니다.",
    },

    { type: "heading", text: "왜 비어 있나요?" },
    {
      type: "list",
      items: [
        "미입점 플랫폼은 데이터가 반영되지 않아 지수가 빈값(또는 낮은 값)으로 표시됩니다",
        "값이 비어 보인다고 반드시 인기가 없는 것은 아닙니다",
        "지수는 여러 플랫폼을 종합 계산한 값이라 일부 플랫폼 누락 시 낮게 나올 수 있습니다",
      ],
    },

    { type: "heading", text: "이렇게 해석하세요" },
    {
      type: "list",
      items: [
        "'미입점 · 데이터 없음' 표시 = 해당 플랫폼 미반영을 의미",
        "여러 화면에서 같은 브랜드가 비어 있으면 입점 범위 자체가 좁을 수 있어요",
        "입점 플랫폼 범위를 함께 고려해 종합적으로 판단하세요",
      ],
    },

    {
      type: "callout",
      title: "⚠️ 데이터 없음 ≠ 인기 없음",
      text: "빈값은 대개 미입점 때문이며, 실제 인기와는 무관할 수 있습니다.",
    },
    {
      type: "callout",
      title: "📍 FEDI로 범위 확인",
      text: "빈값이 잦은 브랜드는 FEDI에게 입점 플랫폼 범위를 물어보면 빠르게 확인할 수 있습니다.",
    },
  ],
};

export default emptyValues;
