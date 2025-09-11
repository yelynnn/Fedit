import { useCallback, useMemo, useRef, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartData,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type RawRow = {
  category: string;
  count: number;
  ratio?: string | number;
};

const COLORS = ["#60A5FA", "#F87171", "#34D399", "#22D3EE", "#FBBF24"];
const WIDTH = 434;
const HEIGHT = 40;
const RADIUS = 8;

function normalize(rows: RawRow[]) {
  const hasAllRatio = rows.every((r) => r.ratio !== undefined);
  if (hasAllRatio) {
    return rows.map((r) => ({
      ...r,
      ratioNum:
        typeof r.ratio === "string"
          ? parseFloat(r.ratio.replace("%", "")) / 100
          : Number(r.ratio ?? 0),
    }));
  }
  const total = rows.reduce((s, r) => s + (r.count || 0), 0) || 1;
  return rows.map((r) => ({
    ...r,
    ratioNum: (r.count || 0) / total,
  }));
}

function CustomTooltip({
  category,
  count,
  color,
  x,
  y,
}: {
  category: string;
  count: number;
  color: string;
  x: number;
  y: number;
}) {
  return (
    <div
      className="absolute flex justify-between items-center rounded-md bg-[#242628] text-white shadow-md px-5 py-2 text-sm w-39"
      style={{ left: x, top: y, transform: "translate(-50%, -120%)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-medium">{category}</span>
      </div>
      <div className="text-sm font-semibold">{count}</div>
    </div>
  );
}

export default function TypeBarChart({ data }: { data: RawRow[] }) {
  const rows = useMemo(() => normalize(data).slice(0, 5), [data]);
  const lastIdx = rows.length - 1;

  const [tooltip, setTooltip] = useState<{
    category: string;
    count: number;
    color: string;
    x: number;
    y: number;
  } | null>(null);

  const lastTooltipRef = useRef<string>("null");

  const chartData: ChartData<"bar"> = useMemo(
    () => ({
      labels: [""],
      datasets: rows.map((r, i) => ({
        label: r.category,
        data: [r.ratioNum * 100],
        backgroundColor: COLORS[i % COLORS.length],
        borderSkipped: false,
        borderRadius:
          i === 0
            ? { topLeft: RADIUS, bottomLeft: RADIUS }
            : i === lastIdx
            ? { topRight: RADIUS, bottomRight: RADIUS }
            : 0,
      })),
    }),
    [rows, lastIdx]
  );

  const externalTooltip = useCallback(
    (ctx: any) => {
      const t = ctx.tooltip;
      if (!t) return;

      if (t.opacity === 0) {
        if (lastTooltipRef.current !== "null") {
          lastTooltipRef.current = "null";
          setTooltip(null);
        }
        return;
      }

      if (t.dataPoints && t.dataPoints.length > 0) {
        const d = t.dataPoints[0];
        const datasetIndex = d.datasetIndex ?? 0;
        const row = rows[datasetIndex];
        if (!row) return;

        const next = {
          category: row.category,
          count: row.count,
          color: COLORS[datasetIndex % COLORS.length],
          x: d.element.x,
          y: d.element.y,
        };
        const snap = JSON.stringify(next);
        if (snap !== lastTooltipRef.current) {
          lastTooltipRef.current = snap;
          setTooltip(next);
        }
      }
    },
    [rows]
  );

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: false,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: externalTooltip,
        },
      },
      scales: {
        x: { stacked: true, display: false, min: 0, max: 100 },
        y: { stacked: true, display: false },
      },
      animation: false,
    }),
    [externalTooltip]
  );

  return (
    <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
      <Bar data={chartData} options={options} width={WIDTH} height={HEIGHT} />
      {tooltip && (
        <CustomTooltip
          category={tooltip.category}
          count={tooltip.count}
          color={tooltip.color}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
    </div>
  );
}
