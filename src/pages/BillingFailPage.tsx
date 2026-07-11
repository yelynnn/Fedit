import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { useUIStore } from "@/stores/UIStore";

function BillingFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const message =
    searchParams.get("message") ||
    "결제 등록이 취소되었거나 실패했습니다. 다시 시도해주세요.";

  useEffect(() => {
    openSettingsModal("구독");
  }, [openSettingsModal]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen gap-4 bg-white">
      <Icon icon="ph:x-circle" className="text-4xl text-status-error" />
      <p className="max-w-md text-base font-medium text-center text-tx-default">
        {message}
      </p>
      <button
        onClick={() => navigate("/", { replace: true })}
        className="px-5 py-2 mt-2 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover"
      >
        구독 관리로 돌아가기
      </button>
    </div>
  );
}

export default BillingFailPage;
