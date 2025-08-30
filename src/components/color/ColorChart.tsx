"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SunburstData } from "@/types/Filter";

function propagateAll(data: SunburstData): SunburstData {
  const newNode = { ...data };
  if (data.children && data.value) {
    const perChild = data.value / data.children.length;
    newNode.children = data.children.map((child) =>
      propagateAll({ ...child, value: perChild })
    );
    newNode.value = undefined;
  } else if (data.children) {
    newNode.children = data.children.map(propagateAll);
  }
  return newNode;
}

interface ColorChartProps {
  data: SunburstData;
  onSelectColor?: (color: string) => void;
}

export default function ColorChart({ data, onSelectColor }: ColorChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const width = 250;
    const radius = width / 2;

    const rootData = propagateAll(data);
    const root = d3
      .hierarchy<SunburstData>(rootData)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const partitionLayout = d3
      .partition<SunburstData>()
      .size([2 * Math.PI, radius]);
    const rootPartitioned = partitionLayout(root);

    const arcGenerator = d3
      .arc<d3.HierarchyRectangularNode<SunburstData>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1);

    const svgSel = d3.select(el);
    svgSel.selectAll("*").remove();

    const g = svgSel
      .attr("width", width)
      .attr("height", width)
      .attr("viewBox", `0 0 ${width} ${width}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);

    g.append("circle")
      .attr("r", radius * 0.33)
      .attr("fill", "none")
      .attr("stroke", "#d1d1d1")
      .attr("stroke-width", 1);

    g.selectAll("path")
      .data(rootPartitioned.descendants().filter((d) => d.depth > 0))
      .join("path")
      .attr("d", arcGenerator)
      .attr("fill", (d) => d.data.color || "#ccc")
      .style("cursor", (d) => (d.depth === 1 ? "pointer" : "default"))
      .on("click", (_, d) => {
        if (d.depth === 1 && onSelectColor) onSelectColor(d.data.name);
      });

    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, [data, onSelectColor]);

  return (
    <div className="flex items-center justify-center my-7">
      <svg ref={ref} />
    </div>
  );
}
