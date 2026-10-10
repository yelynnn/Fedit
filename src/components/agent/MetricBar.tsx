// 지표 게이지 한 줄: 라벨 + 바 + 숫자 (0~100 실값 기준)
export default function MetricBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-gray-500 w-[46px] flex-shrink-0">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[9.5px] font-semibold w-[22px] text-right" style={{ color }}>
        {Math.round(value)}
      </span>
    </div>
  );
}
