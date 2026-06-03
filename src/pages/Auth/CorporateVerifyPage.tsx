import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import { PostCorporateSignupConfirm } from "@/apis/AuthAPI";

const CorporateVerifyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email: string } | null)?.email ?? "";

  const [code, setCode] = useState("");
  const [isTouched, setIsTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCodeValid = code.trim().length > 0;
  const hasCodeError = isTouched && !isCodeValid;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsTouched(true);

    if (!isCodeValid) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await PostCorporateSignupConfirm(email, code.trim());
      if (res.ok) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message || "인증에 실패했습니다.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "인증에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#222222]">
      <LoginHeader />

      <main className="flex flex-1 items-center justify-center px-5">
        <section className="w-full max-w-[426px]">
          {successMessage ? (
            <div className="flex flex-col items-center gap-[32px] text-center">
              <div className="flex flex-col gap-[12px]">
                <h1 className="text-[24px] font-bold tracking-[-0.04em] text-[#222222]">
                  임시 비밀번호 확인
                </h1>
                <p className="text-[15px] leading-[1.8] tracking-[-0.03em] text-[#666666]">
                  기업 회원가입이 완료되었습니다.
                  <br />
                  이메일로 발송된 임시 비밀번호를 확인해주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="h-[48px] w-full rounded-[6px] bg-[#222426] text-[14px] font-bold tracking-[-0.03em] text-white transition hover:bg-[#111111]"
              >
                로그인 화면으로 이동
              </button>
            </div>
          ) : (
            <>
              <div className="mb-[28px]">
                <h1 className="mb-[10px] text-[24px] font-bold tracking-[-0.04em] text-[#222222]">
                  인증코드 확인
                </h1>
                <p className="text-[15px] leading-[1.6] tracking-[-0.03em] text-[#666666]">
                  {email ? (
                    <>
                      <span className="font-bold text-[#222222]">{email}</span>
                      <br />
                    </>
                  ) : null}
                  으로 발송된 인증코드를 입력해주세요.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-[30px]">
                  <label
                    htmlFor="verify-code"
                    className="mb-[8px] block text-[14px] font-bold tracking-[-0.03em] text-[#222222]"
                  >
                    <span className="mr-[2px] text-[#ff3b30]">*</span>
                    인증코드를 입력해주세요.
                  </label>

                  <input
                    id="verify-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onBlur={() => setIsTouched(true)}
                    placeholder="인증코드 입력"
                    className={`h-[42px] w-full rounded-[6px] border px-[12px] text-[14px] tracking-[-0.03em] outline-none transition placeholder:text-[#b5b5b5] ${
                      hasCodeError
                        ? "border-[#ff3b30] focus:border-[#ff3b30]"
                        : "border-[#dddddd] focus:border-[#222222]"
                    }`}
                  />

                  {hasCodeError && (
                    <p className="mt-[7px] flex items-center gap-[5px] text-[12px] font-medium tracking-[-0.03em] text-[#ff3b30]">
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white">
                        !
                      </span>
                      인증코드를 입력해주세요.
                    </p>
                  )}

                  {errorMessage && (
                    <p className="mt-[7px] flex items-center gap-[5px] text-[12px] font-medium tracking-[-0.03em] text-[#ff3b30]">
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white">
                        !
                      </span>
                      {errorMessage}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isCodeValid || isLoading}
                  className={`h-[42px] w-full rounded-[6px] text-[14px] font-bold tracking-[-0.03em] transition ${
                    isCodeValid && !isLoading
                      ? "bg-[#222426] text-white hover:bg-[#111111]"
                      : "cursor-not-allowed bg-[#f1f3f5] text-[#a9afb8]"
                  }`}
                >
                  {isLoading ? "확인 중..." : "인증 확인"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="mt-[20px] w-full text-center text-[13px] font-medium tracking-[-0.03em] text-[#888888] hover:underline"
              >
                이메일 다시 입력하기
              </button>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CorporateVerifyPage;
