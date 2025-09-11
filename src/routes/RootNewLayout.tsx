import Footer from "@/components/common/Footer";
import NewHeader from "@/components/common/NewHeader";
import { NewFilterTabPanels } from "@/components/filter/NewFilterTabBar";

function RootNewLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <NewHeader />
      <div className="flex flex-col flex-1 min-h-0">
        <main className="flex-1 min-h-0 overflow-auto">
          <div className="w-full max-w-full px-12 pt-6 pb-30">
            <NewFilterTabPanels />
          </div>
        </main>
        <Footer />
      </div>

      <div id="modal-root" />
    </div>
  );
}
export default RootNewLayout;
