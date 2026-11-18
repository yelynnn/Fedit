import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/common/Footer";
import LoginHeader from "@/components/common/LoginHeader";
import { GetPasswordResetVerify, PostPasswordResetConfirm } from "@/apis/AuthAPI";

// 회원가입 화면과 같은 규칙
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;

type Status = "checking" | "ready" | "invalid" | "done";

const inputClass =
  "h-[42px] rounded-[6px] border border-line-alt px-3 text-[14px] outline-none transition placeholder:text-icon-alt focus:border-fill-primary";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!token) {
      setStatus("invalid");
      return;
    }
    GetPasswordResetVerify(token).then((ok) => alive && setStatus(ok ? "ready" : "invalid"));
    return () => {
      alive = false;
    };
  }, [token]);

  const ruleOk = PASSWORD_REGEX.test(password);
  const sameOk = password !== "" && password === confirm;
  const ruleError = touched && password !== "" && !ruleOk
    ? "비밀번호는 8~20자, 영문자·숫자·특수문자(@$!%*#?&)를 각 1개 이상 포함해야 해요."
    : null;
  const sameError = confirm !== "" && password !== confirm ? "비밀번호가 일치하지 않아요." : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched(true);
    if (!ruleOk || !sameOk || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await PostPasswordResetConfirm(token, password, confirm);
      setStatus("done");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const title =
    status === "done" ? "비밀번호를 바꿨어요" : status === "invalid" ? "링크를 쓸 수 없어요" : "새 비밀번호 설정";
  const subtitle =
    status === "done"
      ? "새 비밀번호로 다시 로그인해주세요."
      : status === "invalid"
        ? "링크가 만료되었거나 이미 사용되었어요."
        : "앞으로 사용할 새 비밀번호를 입력해주세요.";

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#222]">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[40px] pb-[70px]">
        <section className="w-full max-w-[420px]">
          <div className="mb-[26px]">
            <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.04em]">{title}</h1>
            <p className="text-[14px] font-normal text-tx-alt">{subtitle}</p>
          </div>

          {status === "checking" && <p className="text-[13px] text-tx-alt">링크를 확인하고 있어요...</p>}

          {status === "invalid" && (
            <div className="flex flex-col gap-[14px]">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="h-[42px] rounded-[6px] bg-[#111111] text-[14px] font-semibold text-white hover:bg-black"
              >
                비밀번호 찾기 다시 하기
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mx-auto block bg-transparent text-[13px] text-tx-default hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </div>
          )}

          {status === "done" && (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="h-[42px] w-full rounded-[6px] bg-[#111111] text-[14px] font-semibold text-white hover:bg-black"
            >
              로그인하러 가기
            </button>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
              <div className="flex flex-col gap-2">
                <label htmlFor="new-password" className="text-[13px] font-semibold text-tx-default">
                  <span className="mr-[2px] text-rising">*</span>
                  새 비밀번호
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="8~20자, 영문·숫자·특수문자 포함"
                  className={inputClass}
                />
                {ruleError && <p className="text-[12px] text-rising">{ruleError}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="new-password-confirm" className="text-[13px] font-semibold text-tx-default">
                  <span className="mr-[2px] text-rising">*</span>
                  새 비밀번호 확인
                </label>
                <input
                  id="new-password-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="한 번 더 입력해주세요"
                  className={inputClass}
                />
                {sameError && <p className="text-[12px] text-rising">{sameError}</p>}
              </div>

              {errorMessage && (
                <p className="-mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-rising">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={!ruleOk || !sameOk || isLoading}
                className={`mt-[2px] h-[42px] rounded-[6px] text-[14px] font-semibold transition ${
                  ruleOk && sameOk && !isLoading
                    ? "bg-[#111111] text-white hover:bg-black"
                    : "cursor-not-allowed bg-surface-base text-tx-assistive"
                }`}
              >
                {isLoading ? "저장 중..." : "비밀번호 바꾸기"}
              </button>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
