import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import { PostConfirmBilling, type PlanType } from "@/apis/BillingAPI";
import { useUIStore } from "@/stores/UIStore";
import { useSubscriptionStore } from "@/stores/SubscriptionStore";

const PLAN_LABELS: Record<PlanType, string> = { basic: "Basic", pro: "Pro" };

function BillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const openInterestBrandModal = useUIStore((s) => s.openInterestBrandModal);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const authKey = searchParams.get("authKey");
    const customerKey = searchParams.get("customerKey");
    const plan = searchParams.get("plan") as PlanType | null;

    if (!authKey || !customerKey || !plan || !(plan in PLAN_LABELS)) {
      setStatus("error");
      setErrorMessage("잘못된 접근입니다.");
      return;
    }

    PostConfirmBilling({ authKey, customerKey, plan })
      .then((subscription) => {
        setSubscription(subscription);
        if (plan === "basic") {
          openInterestBrandModal();
        } else {
          openSettingsModal("구독");
        }
        navigate("/", { replace: true });
      })
      .catch((error: Error) => {
        setStatus("error");
        setErrorMessage(error.message);
      });
  }, [
    searchParams,
    navigate,
    openSettingsModal,
    openInterestBrandModal,
    setSubscription,
  ]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen gap-4 bg-white">
      {status === "loading" ? (
        <>
          <Icon
            icon="ph:spinner"
            className="text-4xl animate-spin text-tx-alt"
          />
          <p className="text-base font-medium text-tx-default">
            결제를 처리하고 있어요...
          </p>
        </>
      ) : (
        <>
          <Icon icon="ph:x-circle" className="text-4xl text-status-error" />
          <p className="text-base font-medium text-tx-default">
            {errorMessage}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 mt-2 text-sm font-semibold text-white transition-colors bg-fill-primary rounded-xl hover:bg-fill-primary-hover"
          >
            홈으로 돌아가기
          </button>
        </>
      )}
    </div>
  );
}

export default BillingSuccessPage;
