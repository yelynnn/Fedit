import { Link } from "react-router-dom";
import logo from "@/assets/logo/feditLogo.svg";

function Footer() {
  return (
    <footer className="w-full border-t border-line-alt">
      <div className="max-w-screen-xl pb-10 mx-auto pt-7 px-13">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-6 lg:grid-cols-6">
          <div className="col-span-1 lg:col-span-2">
            <img src={logo} alt="fedit icon" className="h-7" />

            <p className="mt-3 text-sm text-tx-alt">
              데이터를 분석하는 패션 트렌드의 새로운 기준
            </p>

            <div className="flex flex-col gap-1 mt-5 text-xs leading-relaxed text-tx-assistive">
              <p className="flex flex-wrap items-center gap-x-1.5">
                <span>상호명: 미피(MIFY)</span>
                <span className="text-line-divider">·</span>
                <span>대표자명: 김예린</span>
              </p>
              <p>사업자등록번호: 535-03-03921</p>
              <p>사업장 주소: 경기도 고양시 덕양구 오금로 193</p>
              <p className="flex flex-wrap items-center gap-x-1.5">
                <span>고객센터: 010-7939-1833</span>
                <span className="text-line-divider">·</span>
                <span>이메일: team.mify@gmail.com</span>
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-tx-neutral">
              Information
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-tx-alt">
              <li>
                <a href="#" className="hover:text-tx-strong">
                  서비스 소개
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-tx-strong">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base font-semibold text-tx-neutral">
              Our Services
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-tx-alt">
              <li>
                <a href="#" className="hover:text-tx-alt">
                  브랜드 리스트
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 md:grid md:grid-cols-2 md:gap-8">
            <div className="mt-8 md:mt-0">
              <h4 className="text-base font-semibold text-tx-neutral">
                Business
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-tx-alt">
                <li>
                  <a href="#" className="hover:text-tx-alt">
                    광고 문의
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-tx-alt">
                    제휴 문의
                  </a>
                </li>
              </ul>
            </div>
            <div className="mt-8 md:mt-0">
              <h4 className="text-base font-semibold text-tx-neutral">
                Contact us
              </h4>
              <ul className="mt-4 space-y-2 text-sm text-tx-alt">
                <li>
                  <a href="#" className="hover:text-tx-alt">
                    고객센터
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-tx-alt">
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
            <Link to="/privacy" className="hover:text-white">
              개인정보처리방침
            </Link>
            <span className="hidden w-px h-3 bg-white/30 md:block" />
            <Link to="/terms" className="hover:text-white">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
