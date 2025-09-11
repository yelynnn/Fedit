import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { GetTrendGraph } from "@/apis/DashBoardAPI";

type TrendRow = { date: string; [series: string]: number | string };
type TrendResp = { crawled_date?: string; data?: TrendRow[] };

const palette = ["#3385FF", "#FF6363", "#88F03E"];

function formatKYM(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.date ?? "";
  return (
    <div
      style={{
        background: "#1F2937",
        color: "#fff",
        padding: 12,
        borderRadius: 8,
      }}
    >
      <div style={{ marginBottom: 8 }}>{formatKYM(date)}</div>
      {payload.map((p: any, i: number) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: palette[i % palette.length],
            }}
          />
          <span>{p.dataKey}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const monthTick = (v: string) =>
  new Date(v).toLocaleString("en-US", { month: "short" });

export default function DoubleChart() {
  const [rows, setRows] = useState<TrendRow[]>([]);
  // const [crawledDate, setCrawledDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res: TrendResp = await GetTrendGraph();
        setRows(Array.isArray(res?.data) ? res.data : []);
        // setCrawledDate(res?.crawled_date ?? null);
        console.log("유형 그래프 API 응답:", res);
      } catch (error) {
        console.error("유형 그래프 불러오기 실패:", error);
        setRows([]);
        // setCrawledDate(null);
      }
    };
    fetchGraph();
  }, []);

  const seriesKeys = useMemo(
    () => (rows[0] ? Object.keys(rows[0]).filter((k) => k !== "date") : []),
    [rows]
  );

  return (
    <div className="w-full h-full min-w-0">
      <div className="w-full min-w-0 h-67">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 16, bottom: 10, left: 0 }}
          >
            <CartesianGrid
              stroke="#eee"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis dataKey="date" tickFormatter={monthTick} />
            <YAxis />
            {seriesKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={palette[i % palette.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            ))}
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center mt-8 ml-4 gap-x-8 gap-y-2">
        {seriesKeys.map((key, i) => (
          <div key={key} className="flex items-center gap-3">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: palette[i % palette.length] }}
            />
            <span>{key}</span>
          </div>
        ))}
      </div>

      {/* {crawledDate && (
        <div className="mt-2 ml-4 text-xs text-gray-500">
          기준: {new Date(crawledDate).toLocaleString()}
        </div>
      )} */}
    </div>
  );
}
