import { Outlet } from "react-router-dom";
import FilterHeader from "../components/common/filter/FilterHeader";
import FilterBar from "../components/common/filter/FilterBar";
import FilterTabMenu from "../components/common/filter/FilterTabMenu";

function FilterLayout() {
  return (
    <div className="flex flex-col h-full">
      <FilterHeader />
      <div className="flex flex-1 h-full">
        <FilterBar />
        <div className="flex flex-col flex-1">
          <FilterTabMenu />
          <main className="flex-1 p-6 overflow-auto bg-gray-100">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default FilterLayout;
