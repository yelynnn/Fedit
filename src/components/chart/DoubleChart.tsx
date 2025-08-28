import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import React from "react";

const data = [
  { date: "2024-08-01", 레이스치마: 61, "플레어 팬츠": 46, 도트스커트: 31 },
  { date: "2024-09-01", 레이스치마: 48, "플레어 팬츠": 51, 도트스커트: 37 },
  { date: "2024-10-01", 레이스치마: 39, "플레어 팬츠": 49, 도트스커트: 26 },
  { date: "2024-11-01", 레이스치마: 24, "플레어 팬츠": 41, 도트스커트: 15 },
  { date: "2024-12-01", 레이스치마: 29, "플레어 팬츠": 40, 도트스커트: 13 },
  { date: "2025-01-01", 레이스치마: 34, "플레어 팬츠": 44, 도트스커트: 17 },
  { date: "2025-02-01", 레이스치마: 49, "플레어 팬츠": 80, 도트스커트: 28 },
  { date: "2025-03-01", 레이스치마: 100, "플레어 팬츠": 100, 도트스커트: 53 },
  { date: "2025-04-01", 레이스치마: 93, "플레어 팬츠": 72, 도트스커트: 61 },
  { date: "2025-05-01", 레이스치마: 76, "플레어 팬츠": 58, 도트스커트: 76 },
  { date: "2025-06-01", 레이스치마: 68, "플레어 팬츠": 57, 도트스커트: 100 },
  { date: "2025-07-01", 레이스치마: 55, "플레어 팬츠": 50, 도트스커트: 93 },
];

const palette = ["#6f6be7", "#00C73C", "#f2994a"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 6,
        padding: "8px 12px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        fontSize: "12px",
      }}
    >
      <div style={{ fontWeight: 500, marginBottom: 4 }}>
        {(() => {
          const raw = (payload?.[0]?.payload as any)?.date ?? label;
          if (!raw) return "";
          const d = new Date(raw);
          return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
        })()}
      </div>
      <div style={{ display: "flex", gap: 5, flexDirection: "column" }}>
        {payload.map((p: any) => (
          <div
            key={p.dataKey}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: p.color,
              }}
            />
            <span style={{ fontSize: "12px" }}>{p.date ?? p.dataKey}</span>
            <span
              style={{ marginLeft: "auto", fontWeight: 300, fontSize: "12px" }}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderCustomLegend = ({ payload }: any) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: entry.color,
            }}
          />
          <span style={{ fontSize: 13 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DoubleChart() {
  const seriesKeys = React.useMemo(
    () => (data?.[0] ? Object.keys(data[0]).filter((k) => k !== "date") : []),
    []
  );

  return (
    <ResponsiveContainer width="100%" height={245}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 43, bottom: 0, left: 0 }}
      >
        <XAxis
          dataKey="date"
          axisLine
          tick={false}
          tickLine={false}
          height={10}
        />
        <YAxis axisLine tick={false} tickLine={false} />

        {seriesKeys.map((key, i) => (
          <Line
            key={key}
            dataKey={key}
            name={key}
            stroke={palette[i % palette.length]}
            dot={false}
            isAnimationActive={false}
          />
        ))}

        <Tooltip content={<CustomTooltip />} />
        <Legend verticalAlign="bottom" content={renderCustomLegend} />
      </LineChart>
    </ResponsiveContainer>
  );
}
