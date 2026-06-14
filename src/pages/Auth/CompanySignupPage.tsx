import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, ChevronRight } from "lucide-react";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import { PostCorporateAuthRequest } from "@/apis/AuthAPI";

interface CompanySignupNavState {
  email?: string;
  agreed?: boolean;
}

const CompanySignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as CompanySignupNavState | null;

  const [email, setEmail] = useState(navState?.email ?? "");
  const [isTermsAgreed] = useState(navState?.agreed ?? false);
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }, [email]);

  const hasEmail = email.trim().length > 0;
  const hasEmailError = isTouched && (!hasEmail || !isEmailValid);
  const canSubmit = hasEmail && isEmailValid && isTermsAgreed;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsTouched(true);

    if (!canSubmit) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await PostCorporateAuthRequest(email.trim());
      navigate("/signup/company/verify", { state: { email: email.trim() } });
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#222222]">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[92px]">
        <section className="w-full max-w-[426px]">
          <div className="mb-[28px]">
            <h1 className="mb-[10px] text-[24px] font-bold tracking-[-0.04em] text-[#222222]">
              FEDIT 기업회원 인증
            </h1>
            <p className="text-[15px] leading-[1.6] tracking-[-0.03em] text-[#666666]">
              회원 인증이 필요해요.
              <br />
              인증번호를 받을 이메일 주소를 입력해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-[30px]">
              <label
                htmlFor="company-email"
                className="mb-[8px] block text-[14px] font-bold tracking-[-0.03em] text-[#222222]"
              >
                <span className="mr-[2px] text-[#ff3b30]">*</span>
                기업 이메일을 입력해주세요.
              </label>

              <input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setIsTouched(true)}
                placeholder="이메일 입력"
                className={`h-[42px] w-full rounded-[6px] border px-[12px] text-[14px] tracking-[-0.03em] outline-none transition placeholder:text-[#b5b5b5] ${
                  hasEmailError
                    ? "border-[#ff3b30] focus:border-[#ff3b30]"
                    : "border-[#dddddd] focus:border-[#222222]"
                }`}
              />

              {hasEmailError && (
                <p className="mt-[7px] flex items-center gap-[5px] text-[12px] font-medium tracking-[-0.03em] text-[#ff3b30]">
                  <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white">
                    !
                  </span>
                  올바른 이메일 주소를 입력해주세요.
                </p>
              )}

              {isTouched && hasEmail && isEmailValid && (
                <p className="mt-[7px] text-[12px] font-medium tracking-[-0.03em] text-[#222222]">
                  사용 가능합니다.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/terms", {
                  state: {
                    from: "/signup/company",
                    returnState: { email, agreed: isTermsAgreed },
                  },
                })
              }
              className="mb-[30px] flex h-[42px] w-full items-center justify-between rounded-[6px] border border-[#dddddd] bg-[#fbfbfc] px-[14px] text-[13px] font-bold tracking-[-0.03em] text-[#222222] transition hover:bg-[#f7f7f8]"
            >
              <span className="flex items-center gap-[10px]">
                <CheckCircle
                  size={18}
                  strokeWidth={2}
                  className={
                    isTermsAgreed
                      ? "fill-[#222222] text-white"
                      : "text-[#8d949e]"
                  }
                />
                약관 동의
              </span>

              <ChevronRight
                size={18}
                strokeWidth={2}
                className="text-[#777777]"
              />
            </button>

            {errorMessage && (
              <p className="mb-[12px] text-[13px] font-medium tracking-[-0.03em] text-[#ff3b30]">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className={`h-[42px] w-full rounded-[6px] text-[14px] font-bold tracking-[-0.03em] transition ${
                canSubmit && !isLoading
                  ? "bg-[#222426] text-white hover:bg-[#111111]"
                  : "cursor-not-allowed bg-[#f1f3f5] text-[#a9afb8]"
              }`}
            >
              {isLoading ? "처리 중..." : "회원가입하기"}
            </button>
          </form>

          <nav className="mt-[30px] flex items-center justify-center text-[13px] font-medium tracking-[-0.03em] text-[#222222]">
            <button
              type="button"
              onClick={() => navigate("/signup/personal")}
              className="px-[28px] hover:underline"
            >
              개인회원 가입
            </button>

            <span className="h-[20px] w-px bg-[#e5e5e5]" />

            <button
              type="button"
              onClick={() => navigate("/find-account")}
              className="px-[28px] hover:underline"
            >
              ID&PW 찾기
            </button>

            <span className="h-[20px] w-px bg-[#e5e5e5]" />

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="px-[28px] hover:underline"
            >
              로그인하기
            </button>
          </nav>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CompanySignupPage;
