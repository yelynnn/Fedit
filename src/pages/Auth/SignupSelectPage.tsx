import { useNavigate } from "react-router-dom";
import { Building2, User } from "lucide-react";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";

const SignupSelectPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white text-tx-default">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[110px]">
        <section className="w-full max-w-[520px]">
          <div className="mb-[40px]">
            <h1 className="mb-[10px] text-[26px] font-bold tracking-[-0.04em] text-tx-default">
              어떤 계정으로 시작할까요?
            </h1>
            <p className="text-[16px] font-medium tracking-[-0.03em] text-tx-alt">
              목적에 맞는 계정을 선택해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-[22px]">
            <button
              type="button"
              onClick={() => navigate("/signup/personal")}
              className="flex h-[106px] w-full items-center justify-center gap-[14px] rounded-[10px] bg-surface-base text-[18px] font-bold tracking-[-0.03em] text-tx-default transition hover:bg-surface-base"
            >
              <User size={24} fill="#333333" strokeWidth={2.2} />
              개인 회원으로 가입하기
            </button>

            <button
              type="button"
              onClick={() => navigate("/signup/company")}
              className="flex h-[106px] w-full items-center justify-center gap-[14px] rounded-[10px] bg-surface-base text-[18px] font-bold tracking-[-0.03em] text-tx-default transition hover:bg-surface-base"
            >
              <Building2 size={24} strokeWidth={2.2} />
              기업 회원으로 가입하기
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SignupSelectPage;
