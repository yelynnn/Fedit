import logo from "@/assets/logo/whiteLogo.png";
import { useNavigate } from "react-router-dom";
import successFrame from "@/assets/landing/successFrame.png";

function AskSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full overflow-auto hide-scrollbar min-h-screen bg-[#151515] flex flex-col pb-46">
      <header className="flex items-center px-12 py-4 mb-16">
        <img
          onClick={() => navigate("/landing")}
          src={logo}
          alt="fedit icon"
          className="h-8"
        />
      </header>
      <section className="relative flex flex-col items-center justify-center">
        <img
          src={successFrame}
          alt="successFrame"
          className="block object-fill"
        />
        <div className="absolute">
          <p className="mb-7 text-center text-white font-semibold leading-[65px] text-[50px]">
            문의가 정상적으로 접수되었습니다.
          </p>
          <p className="text-2xl font-semibold leading-9 text-center text-white">
            FEDIT에 관심 가져주셔서 감사합니다. <br /> 빠른 시일 내에
            연락드리겠습니다.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AskSuccessPage;
