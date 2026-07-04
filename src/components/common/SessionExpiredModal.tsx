import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/AuthStore";

function SessionExpiredModal() {
  const navigate = useNavigate();
  const isSessionExpired = useAuthStore((s) => s.isSessionExpired);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);

  if (!isSessionExpired) return null;

  const handleConfirm = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setSessionExpired(false);
    navigate("/login");
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative flex flex-col items-center p-6 bg-white shadow-xl outline-none w-100 rounded-xl">
        <h2 className="text-lg font-bold text-tx-default mb-2">
          로그인이 만료되었습니다
        </h2>
        <p className="text-sm text-tx-alt mb-6">
          다시 로그인해주세요.
        </p>

        <button
          onClick={handleConfirm}
          className="w-full h-12 rounded-xl bg-fill-primary text-white text-base font-semibold"
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
