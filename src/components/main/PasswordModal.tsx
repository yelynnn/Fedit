import { useMemo, useState } from "react";
import { PostLogin } from "@/apis/AuthAPI";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function PasswordModal({ isOpen, onClose }: Props) {
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [expired, setExpired] = useState(false);

  const emptyError = touched && password.trim().length === 0;
  const isError = emptyError || (!!message && !expired);

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
    if (message) return message;
    if (emptyError) return "비밀번호를 입력해주세요.";
    return "제공받은 비밀번호를 입력해주세요.";
  }, [message, emptyError]);

  const helperClass = useMemo(
    () =>
      ["mt-1 text-sm", isError ? "text-[#FF6B6B]" : "text-[#888A8C]"].join(" "),
    [isError]
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);
    setMessage("");
    if (isSubmitting || !password.trim()) return;

    setIsSubmitting(true);
    try {
      await PostLogin(password);

      onClose();

      setPassword("");
      setTouched(false);
      setExpired(false);
      setMessage("");
    } catch (err: any) {
      const msg = String(err?.message || "오류가 발생했습니다.");
      setMessage(msg);
      if (msg.includes("종료")) setExpired(true);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative flex flex-col p-6 bg-white shadow-xl outline-none h-96 w-125 rounded-xl">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
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
            onChange={(e) => {
              setPassword(e.target.value);
              if (message) setMessage("");
            }}
            onBlur={() => setTouched(true)}
            className={inputClass}
            disabled={expired || isSubmitting}
          />

          <p className={helperClass}>{helperText}</p>

          <div className="mt-auto">
            {expired ? (
              <div className="w-full h-12 rounded-xl bg-[#F3F5F7] text-[#98A2B3] text-base font-semibold flex items-center justify-center">
                데모 이용 기간이 만료되었습니다.
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="w-full h-12 rounded-xl bg-[#242628] text-white text-base font-semibold disabled:cursor-not-allowed"
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
