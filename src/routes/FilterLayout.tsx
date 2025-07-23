import { Outlet } from "react-router-dom";
import FilterHeader from "../components/filter/FilterHeader";
import FilterBar from "../components/filter/FilterBar";
import FilterTabMenu from "../components/filter/FilterTabMenu";
import { useState } from "react";
import BrandMenu from "../components/filter/BrandMenu";

function FilterLayout() {
  const [isBrandOpen, setIsBrandOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <FilterHeader />
      <div className="flex flex-1 h-full">
        <FilterBar setIsBrandOpen={setIsBrandOpen} />

        <div className="flex flex-col flex-1">
          <div className="relative">
            <FilterTabMenu />
            {isBrandOpen && (
              <div className="absolute z-50 h-screen top-10">
                <BrandMenu onClose={() => setIsBrandOpen(false)} />
              </div>
            )}
          </div>

          <main className="flex-1 p-6 overflow-auto bg-white">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default FilterLayout;
