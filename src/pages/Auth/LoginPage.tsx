import { Building2, User } from "lucide-react";
import Footer from "@/components/common/Footer";
import { useState } from "react";
import LoginHeader from "@/components/common/LoginHeader";
import { useNavigate } from "react-router-dom";
import { PostLogin } from "@/apis/AuthAPI";

type LoginType = "personal" | "company";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<LoginType>("personal");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActivePersonal = loginType === "personal";
  const isActiveCompany = loginType === "company";
  const isFormFilled = id.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormFilled) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await PostLogin(id.trim(), password);
      navigate("/main");
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#222]">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[40px]">
        <section className="w-full max-w-[420px]">
          <div className="mb-[28px] grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLoginType("personal")}
              className={`flex h-[44px] items-center justify-center gap-2 rounded-[6px] border text-[14px] font-semibold transition ${
                isActivePersonal
                  ? "border-[#222222] bg-white text-[#222222]"
                  : "border-[#dddddd] bg-[#f8f9fa] text-[#9a9a9a]"
              }`}
            >
              <User size={16} strokeWidth={2.2} />
              개인 회원 로그인
            </button>

            <button
              type="button"
              onClick={() => setLoginType("company")}
              className={`flex h-[44px] items-center justify-center gap-2 rounded-[6px] border text-[14px] font-semibold transition ${
                isActiveCompany
                  ? "border-[#222222] bg-white text-[#222222]"
                  : "border-[#dddddd] bg-[#f8f9fa] text-[#9a9a9a]"
              }`}
            >
              <Building2 size={16} strokeWidth={2.2} />
              기업 회원 로그인
            </button>
          </div>

          <div className="mb-[26px]">
            <h1 className="mb-2 text-[22px] font-bold tracking-[-0.04em]">
              FEDIT {isActivePersonal ? "개인 회원" : "기업 회원"} 로그인
            </h1>

            <p className="text-[14px] font-normal text-[#666666]">
              환영합니다! 로그인을 진행해주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[22px]">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-id"
                className="text-[13px] font-bold text-[#222222]"
              >
                <span className="mr-[2px] text-[#ff3b30]">*</span>
                이메일
              </label>

              <input
                id="login-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="이메일"
                className="h-[42px] rounded-[6px] border border-[#dddddd] px-3 text-[14px] outline-none transition placeholder:text-[#b5b5b5] focus:border-[#222222]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-password"
                className="text-[13px] font-bold text-[#222222]"
              >
                <span className="mr-[2px] text-[#ff3b30]">*</span>
                비밀번호
              </label>

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="h-[42px] rounded-[6px] border border-[#dddddd] px-3 text-[14px] outline-none transition placeholder:text-[#b5b5b5] focus:border-[#222222]"
              />
            </div>

            {errorMessage && (
              <p className="-mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-[#ff3b30]">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!isFormFilled || isLoading}
              className={`mt-[2px] h-[42px] rounded-[6px] text-[14px] font-semibold transition ${
                isFormFilled && !isLoading
                  ? "bg-[#111111] text-white hover:bg-black"
                  : "cursor-not-allowed bg-[#f1f3f5] text-[#9a9a9a]"
              }`}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="mx-auto mt-4 block bg-transparent text-[13px] text-[#222222] hover:underline"
          >
            회원가입하기
          </button>

          <div className="mt-[34px] text-[12px] leading-[1.8] text-[#555555]">
            <p className="flex items-center">
              <span className="mr-1">☆</span>
              기업 회원 전용 서비스가 궁금하다면?
              <button
                type="button"
                className="ml-2 border-b border-[#222222] text-[#222222]"
              >
                기업제휴 문의
              </button>
            </p>

            <p className="flex items-center">
              <span className="mr-1">☆</span>
              비밀번호 분실 시, 회사 내 운영 담당자에게 문의하세요.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;
