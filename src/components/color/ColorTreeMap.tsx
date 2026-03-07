import React from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface ColorTreeMapProps {
  title?: string;
  data?: any[];
  onClose?: () => void;
}

const CustomContent = (props: any) => {
  const { x, y, width, height, name, size, fill, depth } = props;

  if (depth === 0 || !name || width < 45 || height < 60) return null;

  return (
    <g>
      {/* 1. 배경 사각형 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill || "#eee",
          fillOpacity: 0.3,
          stroke: "none",
        }}
      />

      {/* 2. 메인 텍스트 (색상명 % ) - 왼쪽 여백을 조금 줄임 */}
      <text x={x + 10} y={y + 28} fill="#333" fontSize="14px" fontWeight="700">
        {`${name} ${size}%`}
      </text>

      {/* 3. 정보 배지 배경: x 여백을 10으로 줄여서 왼쪽으로 더 밀착 */}
      {/* <rect
        x={x + 10}
        y={y + 44}
        width={92}
        height={38}
        rx={8}
        ry={8}
        fill="#ffffff"
        fillOpacity={0.9}
      />

      {/* 4. 배지 내부 텍스트: 배경에 맞춰 x 위치 조정 */}
      {/* <text
        x={x + 18}
        y={y + 58}
        fill="#555"
        fontSize="10.5px"
        fontWeight="600"
      >
        <tspan x={x + 18} dy="0">
          전 시즌 대비
        </tspan>
        <tspan x={x + 18} dy="15">{`${increase} 증가`}</tspan>
      </text>  */}
    </g>
  );
};

export default function ColorTreeMap({
  title,
  data,
  onClose,
}: ColorTreeMapProps) {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-white border border-gray-100 shadow-sm h-91 rounded-xl">
      <div className="flex items-center justify-between px-6 pt-4 mb-3">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 px-4 pb-6 overflow-hidden rounded-b-xl">
        <div className="w-full h-full overflow-hidden bg-white rounded-xl">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              content={<CustomContent />}
              isAnimationActive={false}
              style={{ backgroundColor: "#fff" }}
            >
              <Tooltip content={() => null} />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
