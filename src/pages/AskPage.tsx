import logo from "@/assets/logo/whiteLogo.png";
import { useNavigate } from "react-router-dom";
import askFrame from "@/assets/landing/askFrame.svg";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

function AskPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [brandSector, setBrandSector] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("https://formspree.io/f/mnngopnk", {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });
    if (res.ok) navigate("/success");
    else alert("제출에 실패했어요. 다시 시도해주세요.");
  }

  return (
    <div className="w-full overflow-auto hide-scrollbar min-h-screen bg-[#151515] flex flex-col pb-46">
      <header className="flex items-center px-12 py-4 mb-16">
        <img
          onClick={() => navigate("/")}
          src={logo}
          alt="fedit icon"
          className="h-8"
        />
      </header>
      <section className="relative flex flex-col items-center justify-center">
        <img
          src={askFrame}
          alt="askFrame"
          className="hidden object-fill xl:block"
        />
        <div className="absolute top-0 xl:top-10">
          <p className="mb-7 text-center text-white font-semibold leading-[65px] text-[50px]">
            문의하기
          </p>
          <p className="text-2xl font-semibold leading-9 text-center text-white mb-13">
            함께 성장할 준비가 되셨나요?
            <br /> FEDIT 팀이 빠르게 연락드릴게요.
          </p>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-13 gap-y-9">
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 성함(Name)
                </label>
                <input
                  name="name"
                  required
                  className="w-full h-12 px-3 py-4 text-sm font-semibold text-black bg-white rounded-lg"
                  placeholder="성함"
                  autoComplete="name"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 연락 받으실
                  메일(E-mail)
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full h-12 px-3 py-4 text-sm font-semibold text-black bg-white rounded-lg"
                  placeholder="example@company.com"
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 직무(Role)
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-full h-12 px-3 py-4 font-semibold text-black bg-white rounded-lg">
                    <SelectValue placeholder="직무를 선택해주세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MD">MD</SelectItem>
                    <SelectItem value="디자이너">디자이너</SelectItem>
                    <SelectItem value="마케팅">마케팅</SelectItem>
                    <SelectItem value="대표">대표</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                <input type="hidden" name="role" value={role} required />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 재직 중인 회사
                  규모(Company-size)
                </label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="w-full h-12 px-3 py-4 font-semibold text-black bg-white rounded-lg">
                    <SelectValue placeholder="회사 규모를 선택해주세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5인 기업">1-5인 기업</SelectItem>
                    <SelectItem value="5-20인 기업">5-20인 기업</SelectItem>
                    <SelectItem value="20-50인 기업">20-50인 기업</SelectItem>
                    <SelectItem value="50인 이상 기업">
                      50인 이상 기업
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  name="companySize"
                  value={companySize}
                  required
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 재직 중인 회사의
                  브랜드 유형(Brand Sector)
                </label>
                <Select value={brandSector} onValueChange={setBrandSector}>
                  <SelectTrigger className="h-12 px-3 py-4 font-semibold text-black bg-white rounded-lg">
                    <SelectValue placeholder="브랜드 유형을 선택해주세요." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="플랫폼">플랫폼</SelectItem>
                    <SelectItem value="명품">명품</SelectItem>
                    <SelectItem value="준명품">준명품</SelectItem>
                    <SelectItem value="개인쇼핑몰 (사입)">
                      개인쇼핑몰 (사입)
                    </SelectItem>
                    <SelectItem value="개인쇼핑몰 (제작)">
                      개인쇼핑몰 (제작)
                    </SelectItem>
                    <SelectItem value="도매택">도매택</SelectItem>
                    <SelectItem value="SPA">SPA</SelectItem>
                    <SelectItem value="해외 컨템 브랜드">
                      해외 컨템 브랜드
                    </SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  name="brandSector"
                  value={brandSector}
                  required
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="font-semibold text-white">
                  <span className="text-[#FF4242]">•</span> 문의 내용(Inquiry
                  Details)
                </label>
                <textarea
                  name="details"
                  required
                  className="px-3 py-4 text-sm font-semibold text-black bg-white rounded-lg h-36"
                  placeholder="어떤 부분이 궁금하신가요? 구체적으로 적어주시면 더 빠르게 도와드릴 수 있어요."
                />
              </div>
            </div>

            <button
              type="submit"
              className="my-22 w-full flex items-center justify-center h-10 text-base text-[#242628] bg-white rounded-lg font-semibold"
            >
              문의 보내기
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default AskPage;
