import { useState, useCallback, useMemo } from "react";
import Modal from "react-modal";

type PasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (password: string) => void;
  status?: "default" | "invalid" | "expired";
  isSubmitting?: boolean;
  invalidText?: string;
  hintText?: string;
};

export default function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  status = "default",
  isSubmitting = false,
  invalidText = "비밀번호가 올바르지 않습니다. 다시 확인해주세요.",
  hintText = "제공받은 비밀번호를 입력해주세요.",
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const parentSelector = useCallback(
    () => document.getElementById("modal-root") as HTMLElement,
    []
  );

  const emptyError = touched && password.trim().length === 0;
  const isError = status === "invalid" || emptyError;

  const inputClass = useMemo(
    () =>
      [
        "w-full h-12 px-4 rounded-xl bg-white text-[#1C1C1C] placeholder:text-[#B8BBBE] outline-none",
        isError
          ? "border border-[#FF6B6B] focus:border-[#FF6B6B]"
          : "border border-[#ECEEF0] focus:border-[#C8CDD2]",
      ].join(" "),
    [isError]
  );

  const helperText = useMemo(() => {
    if (status === "invalid") return invalidText;
    if (emptyError) return "비밀번호를 입력해주세요.";
    return hintText;
  }, [status, invalidText, emptyError, hintText]);

  const helperClass = useMemo(
    () =>
      ["mt-1 text-sm", isError ? "text-[#FF6B6B]" : "text-[#888A8C]"].join(" "),
    [isError]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    if (!password.trim() || status === "expired" || isSubmitting) return;
    onSubmit?.(password);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
      className="flex flex-col bg-white shadow-xl outline-none w-125 rounded-xl h-[420px]"
      shouldCloseOnOverlayClick
    >
      <form onSubmit={handleSubmit} className="flex-1 p-6">
        <h2 className="text-xl font-bold text-[#3D3F41] mb-6">로그인</h2>

        <label className="flex items-center gap-1 text-base font-semibold text-[#3D3F41] mb-1">
          <span className={isError ? "text-[#FF4D4F]" : "text-[#FF4D4F]"}>
            •
          </span>
          비밀번호
        </label>

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched(true)}
          className={inputClass}
          disabled={status === "expired" || isSubmitting}
        />

        <p className={helperClass}>{helperText}</p>
      </form>

      <div className="p-6 pt-0">
        {status === "expired" ? (
          <div className="w-full h-12 rounded-xl bg-[#F3F5F7] text-[#98A2B3] text-base font-semibold flex items-center justify-center">
            데모 이용 기간이 만료되었습니다.
          </div>
        ) : (
          <button
            type="submit"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !password.trim()}
            className="w-full h-12 rounded-xl bg-[#242628] text-white text-base font-semibold disabled:cursor-not-allowed"
          >
            {isSubmitting ? "로그인 중..." : "로그인"}
          </button>
        )}
      </div>
    </Modal>
  );
}
