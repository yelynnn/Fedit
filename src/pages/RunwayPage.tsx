import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import RunwayContainer from "@/components/runway/RunwayContainer";
import RunwayBox from "@/components/runway/RunwayBox";
import { Icon } from "@iconify/react";
import { GetFashionShow } from "@/apis/RunwayAPI";
import { isAxiosError } from "axios";
import PasswordModal from "@/components/main/PasswordModal";

const SEASONS = [
  { label: "2026 Fall/Winter", value: "2026FW" },
  { label: "2025 Spring/Summer", value: "2025SS" },
];

function RunwayPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seasonValue = searchParams.get("season") ?? SEASONS[0].value;
  const selectedSeason = SEASONS.find((s) => s.value === seasonValue) ?? SEASONS[0];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [overall, setOverall] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await GetFashionShow(seasonValue);
        const results = data.results;

        const overallResult = results.find((r) => r.brand === "all");
        const brandResults = results.filter((r) => r.brand !== "all");

        setOverall(overallResult ?? null);
        setBrands(
          brandResults.map((b) => ({
            ...b,
            id: b.brand.toLowerCase(),
            name: b.brand,
            description: b.insight,
          }))
        );
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 401) {
          setPasswordModalOpen(true);
        } else {
          setError("데이터를 불러오는 데 실패했습니다.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [seasonValue]);

  return (
    <div className="min-h-screen px-16 mx-auto">
      <div className="mb-2">
        <h1 className="text-[28px] font-semibold text-[#111] tracking-tight">
          Fashion Week Runway Analysis
        </h1>
        <p className="text-[#6F7173] text-base font-semibold mt-2">
          주요 브랜드 런웨이 비교 분석 & 시즌 트렌드 인사이트
        </p>
      </div>

      <div className="relative mt-5" ref={dropdownRef}>
        <div
          className="w-full bg-[#242628] rounded-lg px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-9">
            <span className="text-white text-[14px] font-medium">Season Select</span>
            <span className="text-base font-semibold text-white">
              {selectedSeason.label}
            </span>
          </div>
          <Icon
            icon="ph:caret-down-bold"
            className={`w-5 h-5 text-white transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
          />
        </div>

        {dropdownOpen && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-[#E4E4E4] rounded-lg shadow-lg overflow-hidden">
            {SEASONS.map((season) => (
              <button
                key={season.value}
                className={`w-full text-left px-6 py-3 text-sm hover:bg-[#F6F8FA] transition-colors ${
                  selectedSeason.value === season.value
                    ? "font-semibold text-black"
                    : "font-medium text-[#6F7173]"
                }`}
                onClick={() => {
                  setSearchParams({ season: season.value });
                  setDropdownOpen(false);
                }}
              >
                {season.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full h-[1px] bg-[#E4E4E4] my-6" />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <span className="text-[#6F7173] text-sm">불러오는 중...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-20">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {overall && (
            <section className="mb-20">
              <RunwayContainer data={overall} />
            </section>
          )}
          {brands.length > 0 && (
            <section className="mb-20">
              <RunwayBox brands={brands} />
            </section>
          )}
        </>
      )}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </div>
  );
}

export default RunwayPage;
