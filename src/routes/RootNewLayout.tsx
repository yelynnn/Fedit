import Sidebar from "@/components/common/Sidebar";
import NewHeader from "@/components/common/NewHeader";
import { NewFilterTabPanels } from "@/components/filter/NewFilterTabBar";

function RootNewLayout() {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-col flex-1 h-full min-w-0">
        <NewHeader />

        <main className="flex-1 overflow-auto bg-white">
          <div className="h-full py-8">
            <NewFilterTabPanels />
          </div>
        </main>
      </div>

      <div id="modal-root" />
    </div>
  );
}

export default RootNewLayout;
