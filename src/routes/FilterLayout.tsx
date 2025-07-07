import { Outlet } from "react-router-dom";
import FilterHeader from "../components/common/filter/FilterHeader";
import FilterBar from "../components/common/filter/FilterBar";
import FilterTabMenu from "../components/common/filter/FilterTabMenu";

function FilterLayout() {
  return (
    <div className="flex flex-col h-full">
      {/* 상단 헤더 */}
      <FilterHeader />

      {/* 좌측 FilterBar + 우측 콘텐츠 */}
      <div className="flex flex-1 h-full">
        {/* 좌측 필터 바 */}
        <FilterBar />

        {/* 우측: 탭 + 콘텐츠 */}
        <div className="flex flex-col flex-1">
          <FilterTabMenu /> {/* ← 탭 메뉴 */}
          <main className="flex-1 bg-gray-100 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default FilterLayout;
