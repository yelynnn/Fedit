import { Icon } from "@iconify/react";
import { useUIStore } from "@/stores/UIStore";

export default function ProUpgradeOverlay({ featureName }: { featureName: string }) {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[3px]" />

      <div className="relative flex w-[360px] flex-col items-center gap-4 rounded-2xl border border-[#E4E4E4] bg-white px-8 py-9 text-center shadow-[0_8px_30px_0_rgba(0,0,0,0.10)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0E0F]">
          <Icon icon="ph:crown-simple-fill" className="h-6 w-6 text-white" />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[18px] font-semibold text-[#0B0E0F]">
            PRO 플랜 전용 기능이에요
          </h2>
          <p className="text-[14px] leading-[150%] text-[#6F7173]">
            {featureName}은 PRO 요금제에서만 이용할 수 있어요.
            <br />
            업그레이드하고 모든 분석 기능을 확인해보세요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openSettingsModal("구독")}
          className="mt-1 w-full rounded-xl bg-[#0B0E0F] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-black"
        >
          PRO로 업그레이드
        </button>
      </div>
    </div>
  );
}
