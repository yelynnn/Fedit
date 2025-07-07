"use client";

import { useState } from "react";
import { Pie, PieChart, Sector } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import type { ComponentProps } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// 차트에 사용할 데이터
const chartData = [
  { browser: "상의", styles: 275, fill: "#A02072" },
  { browser: "하의", styles: 200, fill: "#86A7BF" },
  { browser: "잡화", styles: 187, fill: "#A57EE9" },
  { browser: "속옥", styles: 173, fill: "#F2D993" },
  { browser: "드레스", styles: 173, fill: "#91C7BD" },
  { browser: "기타", styles: 90, fill: "#E26AC6" },
];

// 차트 색상 및 항목 설정 (shadcn ChartContainer 용도)
const chartConfig = {
  styles: { label: "Styles" },
  상의: { label: "상의", color: "#A02072" },
  하의: { label: "하의", color: "#86A7BF" },
  잡화: { label: "잡화", color: "#A57EE9" },
  속옥: { label: "속옥", color: "#F2D993" },
  드레스: { label: "드레스", color: "#91C7BD" },
  기타: { label: "기타", color: "#E26AC6" },
};

export default function TypeChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Pie 컴포넌트 props에 타입 안전하게 추가 props 부여
  const pieProps: ComponentProps<typeof Pie> & {
    activeIndex: number | null;
    activeShape: (props: PieSectorDataItem) => React.ReactElement;
  } = {
    data: chartData,
    dataKey: "styles",
    nameKey: "browser",
    innerRadius: 50,
    strokeWidth: 5,
    activeIndex,
    onClick: (_, index) => setActiveIndex(index),
    activeShape: ({ outerRadius = 0, ...props }: PieSectorDataItem) => (
      <Sector {...props} outerRadius={outerRadius + 10} />
    ),
  };

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie {...pieProps} />
      </PieChart>
    </ChartContainer>
  );
}
