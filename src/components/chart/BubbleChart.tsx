"use client";
import React from "react";
import * as d3 from "d3";

const defaultData: Item[] = [
  { name: "모카무스", value: 110, color: "#8d5b4b" },
  { name: "퍼플", value: 75, color: "#6f2dbd" },
  { name: "피스타치오 그린", value: 50, color: "#64c98a" },
];

export type Item = { name: string; value: number; color: string };

type Props = {
  data?: Item[];
  width?: number;
  height?: number;
  padding?: number;
  showLabels?: boolean;
  wrapLabel?: boolean;
};

export default function BubbleChart({
  data = defaultData,
  width = 330,
  height = 280,
  showLabels = true,
  wrapLabel = true,
}: Props) {
  const { nodes, offset } = React.useMemo(() => {
    const root = d3
      .hierarchy<{ children: Item[] }>({ children: data } as any)
      .sum((d: any) => d.value);
    const pack = d3.pack<any>().size([width, height]).padding(0);
    const layout = pack(root);
    let leaves = layout.leaves();

    const main = leaves.reduce((a: any, b: any) => (a.r > b.r ? a : b));

    const cx = width * 0.38;
    const cy = height * 0.68;

    leaves = leaves.map((n: any) => {
      if (n === main) {
        return { ...n, x: cx, y: cy };
      }
      const others = leaves.filter((l) => l !== main).sort((a, b) => b.r - a.r);
      const top = others[0];
      const right = others[1];

      const overlapTop = 0.28;
      const overlapRight = 0.25;

      if (n === top) {
        const dy = main.r + top.r - main.r * overlapTop;
        const dx = main.r * 0.3;
        return { ...n, x: cx + dx, y: cy - dy };
      } else if (n === right) {
        const dx = main.r + right.r - main.r * overlapRight;
        const dy = main.r * 0.05;
        return { ...n, x: cx + dx, y: cy + dy };
      }
      return n;
    });

    const offset = { x: 0, y: 0 };
    return { nodes: leaves, offset };
  }, [data, width, height]);

  const wrap = (text: string, maxLen = 6) => {
    if (!wrapLabel) return [text];
    if (text.length <= maxLen) return [text];
    const spaceIdx = text.indexOf(" ");
    if (spaceIdx > -1 && spaceIdx < text.length - 1) {
      return [text.slice(0, spaceIdx), text.slice(spaceIdx + 1)];
    }
    const mid = Math.ceil(text.length / 2);
    return [text.slice(0, mid), text.slice(mid)];
  };

  return (
    <div style={{ width, height, overflow: "hidden" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{ borderRadius: 16, display: "block" }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter
            id="bubbleShadow"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodOpacity="0.18" />
          </filter>
          <clipPath id="clip">
            <rect x="0" y="0" width={width} height={height} rx="16" />
          </clipPath>
        </defs>

        <g
          transform={`translate(${offset.x}, ${offset.y})`}
          clipPath="url(#clip)"
        >
          <g style={{ mixBlendMode: "multiply", filter: "url(#bubbleShadow)" }}>
            {nodes.map((node: any, i: number) => (
              <circle
                key={`c-${i}`}
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={node.data.color}
                fillOpacity={0.7}
              />
            ))}
          </g>

          {showLabels &&
            nodes.map((node: any, i: number) => {
              const lines = wrap(node.data.name);
              const baseFont = Math.min(24, Math.max(12, node.r / 3.5));
              const lineHeight = baseFont * 1.1;
              const totalH = lineHeight * lines.length;
              const startY = node.y - totalH / 2 + lineHeight / 2;
              return (
                <g key={`t-${i}`} pointerEvents="none">
                  {lines.map((line: string, li: number) => (
                    <text
                      key={li}
                      x={node.x}
                      y={startY + li * lineHeight}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontWeight={800}
                      fontSize={baseFont}
                    >
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
        </g>
      </svg>
    </div>
  );
}
