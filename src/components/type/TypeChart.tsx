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
import type { TypeChartProps } from "@/types/Filter";

export default function TypeChart({ chartData }: TypeChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartConfig = {
    styles: { label: "Styles" },
    ...chartData.reduce((acc, item) => {
      acc[item.browser] = {
        label: item.browser,
        color: item.fill,
      };
      return acc;
    }, {} as Record<string, { label: string; color: string }>),
  };

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
