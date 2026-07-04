import { useEffect } from "react";
import { Icon } from "@iconify/react";
import Sidebar from "@/components/common/Sidebar";
import { useChatStore } from "@/stores/ChatStore";
import { useUIStore } from "@/stores/UIStore";
import NewHeader from "@/components/common/NewHeader";
import { NewFilterTabPanels } from "@/components/filter/NewFilterTabBar";
import SessionExpiredModal from "@/components/common/SessionExpiredModal";
import AgentChat from "@/components/agent/AgentChat";
import SettingsPage from "@/pages/SettingsPage";
import { CaptureGuard } from "@/capture-guard";

function RootNewLayout() {
  const { isAgentOpen, activeConversationId, openAgent, closeAgent } =
    useChatStore((s) => s);
  const { settingsModalTab } = useUIStore();

  useEffect(() => {
    const guard = new CaptureGuard({
      identity: () => "",
      focusMask: { mode: "blur", blurPx: 20, maskOnWindowBlur: false },
    });
    guard.setWatermark(false);
    guard.setSpeedBumps(false);
    guard.start();

    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    let reloadTimer: number | null = null;
    const scheduleReload = () => {
      if (reloadTimer !== null) return;
      reloadTimer = window.setTimeout(() => window.location.reload(), 2500);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        scheduleReload();
        return;
      }
      if (!isMac && e.metaKey && e.shiftKey && e.code === "KeyS") {
        scheduleReload();
        return;
      }
      if (isMac && e.metaKey && e.shiftKey) scheduleReload();
    };
    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      guard.stop();
      window.removeEventListener("keydown", onKeyDown, true);
      if (reloadTimer !== null) clearTimeout(reloadTimer);
    };
  }, []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      <Sidebar />

      <div className="flex flex-col flex-1 h-full min-w-0">
        <NewHeader />

        <main className="flex-1 overflow-auto bg-white" data-capture-protect>
          <div className="h-full py-8">
            <NewFilterTabPanels />
          </div>
        </main>
      </div>

      {settingsModalTab !== null && <SettingsPage />}

      {/* FEDI Agent 플로팅 버튼 & 채팅창 */}
      <div className="fixed z-50 flex flex-col items-end gap-3 bottom-6 right-6">
        {isAgentOpen && activeConversationId && (
          <AgentChat
            key={activeConversationId}
            conversationId={activeConversationId}
            onClose={closeAgent}
          />
        )}
        <button
          onClick={() => (isAgentOpen ? closeAgent() : openAgent())}
          className="flex items-center justify-center w-12 h-12 transition-colors bg-gray-900 rounded-full shadow-lg hover:bg-gray-700"
        >
          <Icon
            icon={isAgentOpen ? "mdi:close" : "ph:star-four-fill"}
            width={20}
            className="text-white"
          />
        </button>
      </div>

      <div id="modal-root" />

      <SessionExpiredModal />
    </div>
  );
}

export default RootNewLayout;
