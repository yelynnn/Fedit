import type { chartProps } from "@/types/Main";
import React from "react";
import { LineChart, Line } from "recharts";

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
      <Line dataKey="uv" stroke="#8884d8" dot={false} activeDot={false} />
    </LineChart>
  );
}
