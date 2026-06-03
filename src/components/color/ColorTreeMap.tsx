import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

interface ColorTreeMapProps {
  title?: string;
  data?: any[];
  onClose?: () => void;
}

const CustomContent = (props: any) => {
  const { x, y, width, height, name, size, fill, depth } = props;

  if (depth === 0 || !name) return null;

  const clipId = `treemap-clip-${Math.round(x)}-${Math.round(y)}`;

  // 셀 크기에 따라 텍스트 레이아웃 결정
  const isLarge = width >= 90 && height >= 65;
  const isMedium = width >= 50 && height >= 42;
  const isSmall = width >= 28 && height >= 22;

  const pad = 7;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} />
        </clipPath>
      </defs>

      {/* 배경 사각형 — 항상 렌더 */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: fill || "#eee", fillOpacity: 0.4, stroke: "none" }}
      />

      {/* 텍스트: clipPath로 셀 밖으로 절대 안 넘침 */}
      <g clipPath={`url(#${clipId})`}>
        {isLarge && (
          /* 충분히 크면: 이름 + % 한 줄 */
          <text
            x={x + pad}
            y={y + 24}
            fill="#333"
            fontSize="13"
            fontWeight="700"
          >
            {name}
            <tspan fontSize="12" fontWeight="600">
              {" "}
              {size}%
            </tspan>
          </text>
        )}

        {!isLarge && isMedium && (
          /* 중간 크기: 이름 / % 두 줄 */
          <>
            <text
              x={x + pad}
              y={y + 16}
              fill="#333"
              fontSize="11"
              fontWeight="700"
            >
              {name}
            </text>
            <text
              x={x + pad}
              y={y + 30}
              fill="#555"
              fontSize="11"
              fontWeight="600"
            >
              {size}%
            </text>
          </>
        )}

        {!isMedium && isSmall && (
          /* 작은 셀: % 숫자만 */
          <text
            x={x + 4}
            y={y + 14}
            fill="#444"
            fontSize="9"
            fontWeight="700"
          >
            {size}%
          </text>
        )}

        {/* 아주 작은 셀은 색상만 보여줌 (텍스트 없음) */}
      </g>
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
