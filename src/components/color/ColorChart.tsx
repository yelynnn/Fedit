"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { SunburstData } from "@/types/Filter";
import { SunburstCategories } from "@/data/SunburstCategories";

export default function ColorChart() {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const width = 250;
    const radius = width / 2;

    const root = d3
      .hierarchy<SunburstData>(SunburstCategories)
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

    const svg = d3
      .select(ref.current)
      .attr("width", width)
      .attr("height", width)
      .attr("viewBox", `0 0 ${width} ${width}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);

    svg
      .selectAll<SVGPathElement, d3.HierarchyRectangularNode<SunburstData>>(
        "path"
      )
      .data(rootPartitioned.descendants().filter((d) => d.depth > 0))
      .join("path")
      .attr("d", arcGenerator)
      .attr("fill", (d) => d.data.color || "#ccc");

    svg
      .selectAll<SVGTextElement, d3.HierarchyRectangularNode<SunburstData>>(
        "text"
      )
      .data(rootPartitioned.descendants().filter((d) => d.depth > 1))
      .join("text")
      .attr("transform", (d) => {
        const angle = ((d.x0 + d.x1) / 2) * (180 / Math.PI);
        const r = (d.y0 + d.y1) / 2;
        return `rotate(${angle - 90}) translate(${r},0) rotate(${
          angle < 180 ? 0 : 180
        })`;
      })
      .attr("dy", "0.35em")
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("fill", "#000")
      .text((d) => {
        const name = d.data.name;
        return /^#[0-9a-fA-F]{6}$/.test(name) ? "" : name;
      });
    return () => {
      d3.select(ref.current).selectAll("*").remove();
    };
  }, []);

  return (
    <div className="flex items-center justify-center mt-7 mb-13">
      <svg ref={ref}></svg>
    </div>
  );
}
