import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/common/Footer";
import LoginHeader from "@/components/common/LoginHeader";
import { PostPasswordResetRequest } from "@/apis/AuthAPI";

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = EMAIL_REGEX.test(email.trim());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await PostPasswordResetRequest(email.trim());
      setSentTo(email.trim());
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#222]">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[40px] pb-[70px]">
        <section className="w-full max-w-[420px]">
          <div className="mb-[26px]">
            <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.04em]">비밀번호 찾기</h1>
            <p className="text-[14px] font-normal text-tx-alt">
              {sentTo
                ? "메일함을 확인해주세요."
                : "가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드려요."}
            </p>
          </div>

          {sentTo ? (
            <div className="flex flex-col gap-[22px]">
              <div className="rounded-[6px] bg-surface-base px-4 py-[14px] text-[13px] leading-[1.7] text-tx-default">
                <b className="font-semibold">{sentTo}</b>(으)로 재설정 링크를 보냈어요.
                <br />
                메일이 안 보이면 스팸함도 확인해주세요.
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="h-[42px] rounded-[6px] bg-[#111111] text-[14px] font-semibold text-white hover:bg-black"
              >
                로그인으로 돌아가기
              </button>
              <button
                type="button"
                onClick={() => setSentTo(null)}
                className="mx-auto -mt-[8px] block bg-transparent text-[13px] text-tx-alt hover:underline"
              >
                다른 이메일로 다시 보내기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="reset-email" className="text-[13px] font-semibold text-tx-default">
                  <span className="mr-[2px] text-rising">*</span>
                  이메일
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="가입한 이메일"
                  className="h-[42px] rounded-[6px] border border-line-alt px-3 text-[14px] outline-none transition placeholder:text-icon-alt focus:border-fill-primary"
                />
              </div>

              {errorMessage && (
                <p className="-mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-rising">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={!isValid || isLoading}
                className={`mt-[2px] h-[42px] rounded-[6px] text-[14px] font-semibold transition ${
                  isValid && !isLoading
                    ? "bg-[#111111] text-white hover:bg-black"
                    : "cursor-not-allowed bg-surface-base text-tx-assistive"
                }`}
              >
                {isLoading ? "보내는 중..." : "재설정 링크 받기"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mx-auto -mt-[8px] block bg-transparent text-[13px] text-tx-default hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </form>
          )}

        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
