import { Icon } from "@iconify/react";
import logo from "@/assets/logo/feditLogo.svg";

function Footer() {
  return (
    <footer className="w-full border-t border-[#E4E4E4]">
      <div className="max-w-screen-xl pb-10 mx-auto pt-7 px-13">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-6 lg:grid-cols-6">
          <div className="col-span-1 lg:col-span-2">
            <img src={logo} alt="fedit icon" className="h-7" />

            <p className="mt-3 text-sm text-[#666A6E]">
              데이터를 분석하는 패션 트렌드의 새로운 기준
            </p>

            <div className="flex items-center gap-3 mt-5">
              <a
                href="#"
                aria-label="Instagram"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F3F4] hover:bg-[#E7E8EA] transition"
              >
                <Icon icon="mdi:instagram" className="h-4 w-4 text-[#6F7579]" />
              </a>
              <a
                href="#"
                aria-label="Naver"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F3F4] hover:bg-[#E7E8EA] transition"
              >
                <Icon
                  icon="simple-icons:naver"
                  className="h-4 w-4 text-[#6F7579]"
                />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F3F4] hover:bg-[#E7E8EA] transition"
              >
                <Icon icon="mdi:facebook" className="h-4 w-4 text-[#6F7579]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-[#3D3F41]">
              Information
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-[#6B6E71]">
              <li>
                <a href="#" className="hover:text-[#1C1C1C]">
                  서비스 소개
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#1C1C1C]">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-[#3D3F41]">
              Our Services
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-[#6B6E71]">
              <li>
                <a href="#" className="hover:text-[#56585A]">
                  브랜드 리스트
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 md:grid md:grid-cols-2 md:gap-8">
            <div className="mt-8 md:mt-0">
              <h4 className="text-base font-semibold text-[#3D3F41]">
                Business
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B6E71]">
                <li>
                  <a href="#" className="hover:text-[#56585A]">
                    광고 문의
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#56585A]">
                    제휴 문의
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-8 md:mt-0">
              <h4 className="text-base font-semibold text-[#3D3F41]">
                Contact us
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-[#6B6E71]">
                <li>
                  <a href="#" className="hover:text-[#56585A]">
                    고객센터
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#56585A]">
                    오류 신고
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-[#1F2123]">
        <div className="flex flex-col items-center justify-between max-w-screen-xl gap-3 px-6 py-4 mx-auto text-xs text-white/80 md:flex-row">
          <p>© 2025 FEDIT. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">
              개인정보처리방침
            </a>
            <span className="hidden w-px h-3 bg-white/30 md:block" />
            <a href="#" className="hover:text-white">
              이용약관
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
