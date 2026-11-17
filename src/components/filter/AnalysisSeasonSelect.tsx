import { useEffect, useState } from "react";
import { GetSeasonList } from "@/apis/AnalysisAPI";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 유형 분석·색상 분석 상단의 연도·시즌 선택 (2026-11-17).
// 고르지 않으면 칸에는 '연도', '시즌' 안내 글씨만 보이고, 결과는 최신 시즌(올해 + 지금 계절)으로 나온다.
// 흰 화면에서 잘 보이도록 칸은 회색으로 채운다.
// 시즌은 상품 계절감(봄·여름·가을·겨울, VLM·규칙 판단)을 쓴다. SS/FW 시즌 코드는 플랫폼마다 붙이는 기준이
// 달라 26SS 에 코트·패딩이 섞이는 등 실제 옷과 안 맞아서 쓰지 않는다. 계절감이 여러 개인 상품은 각 시즌에 다 들어간다.
// 연도는 상품 모니터링 필터와 같은 규칙: /menu/season 시즌 코드 연도 중 2020년~올해.
const MIN_YEAR = 2020;
const ALL = "all";

export const SEASON_OPTIONS = ["봄", "여름", "가을", "겨울"] as const;
export type SeasonFeel = (typeof SEASON_OPTIONS)[number];

/** year/season: "all" = 전체를 직접 고름 */
export type AnalysisPeriod = { year: string; season: string };

/** 지금 계절: 3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울 */
export const currentSeason = (d = new Date()): SeasonFeel => {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "봄";
  if (m >= 6 && m <= 8) return "여름";
  if (m >= 9 && m <= 11) return "가을";
  return "겨울";
};

/** 처음 화면: 아무것도 고르지 않은 상태 — 칸에는 '연도', '시즌' 안내 글씨만 보인다 */
export const EMPTY_ANALYSIS_PERIOD: AnalysisPeriod = { year: "", season: "" };

/**
 * API 로 보낼 조건.
 * - 둘 다 안 골랐으면 아무것도 보내지 않는다 → 백엔드가 최신 시즌(올해 + 지금 계절, 한국 시간)으로 준다.
 * - 하나라도 골랐으면 고르지 않은 쪽·'전체'는 "all"(조건 없음)로 보낸다.
 */
export const toPeriodParams = ({
  year,
  season,
}: AnalysisPeriod): { year?: string; season?: string } => {
  if (!year && !season) return {};
  return {
    year: year && year !== ALL ? year : ALL,
    season: season && season !== ALL ? season : ALL,
  };
};

function AnalysisSeasonSelect({
  value,
  onChange,
  strong = false,
}: {
  value: AnalysisPeriod;
  onChange: (v: AnalysisPeriod) => void;
  /** 주변에 회색 요소가 없는 화면(유형 분석)용 — 회색 칸에 얇은 회색 테두리를 둘러 칸이 구분되게 한다 */
  strong?: boolean;
}) {
  const fill = strong
    ? "bg-surface-base shadow-none !border !border-solid !border-line-alt hover:bg-line-alt/60"
    : "bg-surface-base shadow-none hover:bg-line-alt/60";
  const [years, setYears] = useState<string[]>([]);
  useEffect(() => {
    let ignore = false;
    GetSeasonList().then((seasons) => {
      if (ignore) return;
      const thisYear = new Date().getFullYear();
      setYears(
        Array.from(new Set(seasons.map((s) => `20${s.slice(0, 2)}`)))
          .filter((y) => Number(y) >= MIN_YEAR && Number(y) <= thisYear)
          .sort((a, b) => Number(b) - Number(a)),
      );
    });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    // 제목 줄 오른쪽에 붙인다 — 바깥 박스 없이 회색으로 채운 선택 칸 두 개
    <div className="flex gap-2 shrink-0">
      <Select value={value.year || undefined} onValueChange={(v) => onChange({ ...value, year: v })}>
        <SelectTrigger className={`w-32 h-10 gap-2 px-3 ${fill} rounded-lg border-none text-sm font-semibold text-tx-neutral transition-all focus:ring-0 [&>span]:font-semibold`}>
          <span className="flex-1 text-left">
            <SelectValue placeholder="연도" />
          </span>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-line-divider">
          <SelectItem value={ALL}>전체</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}년
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.season || undefined} onValueChange={(v) => onChange({ ...value, season: v })}>
        <SelectTrigger className={`w-32 h-10 gap-2 px-3 ${fill} rounded-lg border-none text-sm font-semibold text-tx-neutral transition-all focus:ring-0 [&>span]:font-semibold`}>
          <span className="flex-1 text-left">
            <SelectValue placeholder="시즌" />
          </span>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-line-divider">
          <SelectItem value={ALL}>전체</SelectItem>
          {SEASON_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default AnalysisSeasonSelect;
