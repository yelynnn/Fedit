import type { chartProps } from "@/types/Main";
import React from "react";
import { LineChart, Line, Area } from "recharts";

export default function SingleChart({ charList }: chartProps) {
  const data = React.useMemo(
    () => charList.map((v) => ({ uv: v })),
    [charList]
  );
  return (
    <LineChart
      width={100}
      height={50}
      data={data}
      tabIndex={-1}
      style={{ display: "block", margin: "0 auto", pointerEvents: "none" }}
    >
      <Area type="monotone" dataKey="uv" stroke="none" fill="url(#colorUv)" />
      <Line dataKey="uv" stroke="#1A75FF" dot={false} activeDot={false} />
    </LineChart>
  );
}
