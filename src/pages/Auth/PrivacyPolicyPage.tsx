import { useLocation, useNavigate } from "react-router-dom";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import {
  Chapter,
  Article,
  P,
  Ol,
  DashList,
  InfoTable,
} from "@/components/terms/TermsBlocks";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.key === "default") {
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-tx-default">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 py-[56px]">
        <section className="w-full max-w-[720px]">
          <div className="mb-[28px]">
            <h1 className="mb-[10px] text-[24px] font-semibold tracking-[-0.04em] text-tx-default">
              fedit 개인정보처리방침
            </h1>
            <p className="text-[14px] leading-[1.7] tracking-[-0.03em] text-tx-alt">
              FEDIT은 회원의 개인정보를 소중히 다루며, 관련 법령을 준수하여
              안전하게 관리합니다.
            </p>
          </div>

          <InfoTable
            rows={[
              ["서비스명", "fedit (경쟁사 모니터링 및 AI 트렌드 분석 서비스)"],
              ["운영사", "FEDIT (미피)"],
              ["시행일", "2026년 7월 14일"],
              ["최종 개정일", "2026년 7월 14일"],
            ]}
          />

          <Chapter title="개인정보처리방침">
            <Article title="제 1 조 (목적)">
              <P>
                FEDIT(이하 '회사')은 회원의 개인정보를 중요시하며,
                「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에
                관한 법률」 등 관련 법령을 준수하고 있습니다. 회사는 본
                개인정보처리방침을 통해 회원이 제공하는 개인정보가 어떠한
                목적과 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한
                조치가 취해지고 있는지 안내합니다.
              </P>
            </Article>

            <Article title="제 2 조 (수집하는 개인정보 항목 및 수집 방법)">
              <P>① 회사는 다음과 같이 개인정보를 수집합니다.</P>
              <DashList
                items={[
                  "회원가입(개인) 시: 이름, 이메일, 비밀번호, 휴대폰번호, 소속 회사명, 직무, 회사 규모",
                  "회원가입(사업자) 시: 사업자 이메일, 이메일 인증코드",
                  "유료 결제 시: 결제 대행업체(토스페이먼츠)를 통한 결제 승인정보, 구독 요금제, 결제/환불 이력 (카드번호 등 결제수단 정보 자체는 회사가 보관하지 않으며 결제대행업체가 직접 수집·보관합니다)",
                  "서비스 이용 과정: 관심 브랜드, 검색·필터 이력, AI 기획 매니저(FEDI)와의 대화 내용",
                  "자동 수집 항목: 접속 IP, 쿠키, 접속 로그, 브라우저·OS 정보, 서비스 이용기록",
                ]}
              />
              <P>
                ② 회사는 회원가입 양식, 서비스 이용 과정에서의 자동 생성
                정보 수집, 결제대행업체로부터의 결제 승인정보 수신을 통해
                개인정보를 수집합니다.
              </P>
            </Article>

            <Article title="제 3 조 (개인정보의 수집 및 이용 목적)">
              <P>회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.</P>
              <Ol
                items={[
                  "회원관리: 회원제 서비스 이용에 따른 본인확인, 개인 식별, 부정이용 방지, 분쟁 조정을 위한 기록 보존, 민원 처리",
                  "서비스 제공: 경쟁사 모니터링, 키워드·트렌드 분석, AI 기획 매니저(FEDI) 응답 생성 및 서비스 품질·정확도 개선",
                  "결제 및 정산: 정기구독 요금 청구, 결제 승인·취소, 환불 처리",
                  "고객 상담: 문의·불만사항 접수 및 처리, 공지사항 전달",
                  "마케팅(선택 동의 시): 신규 기능·이벤트 안내",
                ]}
              />
            </Article>

            <Article title="제 4 조 (개인정보의 보유 및 이용 기간)">
              <P>
                ① 회사는 원칙적으로 회원탈퇴 시 회원의 개인정보를 지체 없이
                파기합니다.
              </P>
              <P>
                ② 다만 관계 법령의 규정에 의하여 보존할 필요가 있는 경우,
                회사는 아래와 같이 관계 법령에서 정한 일정한 기간 동안 회원
                정보를 보관합니다.
              </P>
              <DashList
                items={[
                  "계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
                  "대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
                  "소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래 등에서의 소비자보호에 관한 법률)",
                  "서비스 방문(접속) 기록: 3개월 (통신비밀보호법)",
                ]}
              />
            </Article>

            <Article title="제 5 조 (개인정보의 파기 절차 및 방법)">
              <P>
                ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
                불필요하게 되었을 때에는 지체 없이 해당 개인정보를
                파기합니다.
              </P>
              <P>
                ② 전자적 파일 형태의 정보는 복구 및 재생이 불가능한 기술적
                방법을 사용하여 영구 삭제하며, 종이에 출력된 개인정보는
                분쇄기로 분쇄하거나 소각하여 파기합니다.
              </P>
            </Article>

            <Article title="제 6 조 (개인정보의 제공 및 위탁)">
              <P>
                ① 회사는 회원의 개인정보를 원칙적으로 외부에 제공하지
                않습니다. 다만 회원이 사전에 동의하였거나 법령의 규정에
                의거한 경우는 예외로 합니다.
              </P>
              <P>
                ② 회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리
                업무를 외부 업체에 위탁하고 있으며, 위탁계약 시 개인정보가
                안전하게 관리될 수 있도록 필요한 사항을 규정하고 있습니다.
              </P>
              <DashList
                items={[
                  "토스페이먼츠(주): 결제 처리 및 정기결제(빌링) 대행",
                  "Amazon Web Services, Inc. (AWS): 서버 운영 및 데이터 저장(클라우드 호스팅)",
                ]}
              />
            </Article>

            <Article title="제 6 조의 2 (개인정보의 국외 이전)">
              <P>
                ① 회사는 안정적인 서버 인프라 운영을 위해 다음과 같이 회원의
                개인정보를 국외로 이전하여 처리하고 있습니다.
              </P>
              <InfoTable
                rows={[
                  ["이전받는 자", "Amazon Web Services, Inc. (AWS)"],
                  [
                    "이전되는 국가",
                    "미국 등 AWS가 서버를 운영하는 국가 (구체적인 리전 정보는 고객센터로 문의 시 안내)",
                  ],
                  ["이전일시 및 방법", "서비스 이용 시 네트워크를 통한 실시간 전송"],
                  [
                    "이전항목",
                    "서비스 이용 과정에서 생성·저장되는 회원의 개인정보 전반(회원가입 정보, 서비스 이용기록 등)",
                  ],
                  ["이전받는 자의 이용목적", "서버 운영 및 데이터 저장(클라우드 호스팅)"],
                  ["보유·이용기간", "위탁계약 종료 시 또는 회원탈퇴 시까지"],
                ]}
              />
              <P>
                ② 회원은 개인정보의 국외 이전을 거부할 권리가 있습니다. 다만
                국외 이전은 서버 인프라 운영을 위한 필수적인 처리에
                해당하므로, 이전을 거부할 경우 서비스 이용이 제한될 수
                있습니다. 국외 이전 관련 문의 및 거부를 원하시는 회원은
                고객센터(team.mify@gmail.com)로 문의해주시기 바랍니다.
              </P>
            </Article>

            <Article title="제 7 조 (이용자 및 법정대리인의 권리와 행사 방법)">
              <P>
                ① 회원은 언제든지 서비스 내 [설정] → [내 정보] 메뉴 또는
                고객센터를 통해 자신의 개인정보를 열람, 정정하거나 처리정지 및
                삭제(회원탈퇴)를 요청할 수 있습니다.
              </P>
              <P>
                ② 회사는 만 14세 미만 아동의 회원가입을 제한하고 있으며, 만
                14세 미만 아동의 개인정보를 수집하지 않습니다.
              </P>
            </Article>

            <Article title="제 8 조 (쿠키의 운영 및 거부)">
              <P>
                ① 회사는 회원에게 최적화된 서비스를 제공하기 위해 로그인 상태
                유지 등의 목적으로 쿠키(Cookie) 및 브라우저 로컬 스토리지를
                사용합니다.
              </P>
              <P>
                ② 회원은 웹 브라우저의 설정을 통해 쿠키 저장을 거부할 수
                있으나, 이 경우 로그인이 필요한 일부 서비스 이용에 어려움이
                있을 수 있습니다.
              </P>
              <P>
                ③ 회원이 서비스 내에서 저장한 '내 보드(스크랩)' 데이터는
                서버가 아닌 회원이 이용 중인 브라우저의 로컬 스토리지에
                저장되며, 브라우저 저장 데이터를 삭제하거나 다른 기기·브라우저로
                접속하는 경우 조회되지 않을 수 있습니다.
              </P>
            </Article>

            <Article title="제 9 조 (개인정보의 안전성 확보 조치)">
              <P>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</P>
              <DashList
                items={[
                  "비밀번호 등 주요 개인정보의 암호화 저장",
                  "결제수단(카드) 정보는 회사 서버에 저장하지 않고 결제대행업체(PG)에 위탁 처리",
                  "개인정보에 대한 접근 권한을 최소한의 인원으로 제한",
                  "접속기록의 보관 및 위변조 방지",
                ]}
              />
            </Article>

            <Article title="제 10 조 (개인정보 보호책임자)">
              <P>
                회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                처리와 관련한 회원의 불만 처리 및 피해 구제 등을 위하여 아래와
                같이 개인정보 보호책임자를 지정하고 있습니다.
              </P>
              <InfoTable
                rows={[
                  ["성명", "김예린 (대표자)"],
                  ["이메일", "team.mify@gmail.com"],
                  ["연락처", "010-7939-1833"],
                ]}
              />
              <P>
                회원은 서비스를 이용하며 발생한 모든 개인정보 보호 관련 문의,
                불만처리, 피해구제 등을 위 연락처로 문의할 수 있으며, 회사는
                이에 대해 지체 없이 답변 및 처리해드립니다.
              </P>
            </Article>

            <Article title="제 11 조 (고지의 의무)">
              <P>
                현 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우
                개정 최소 7일 전에 서비스 내 공지사항을 통해 고지할 것입니다.
                다만, 회원의 권리에 중대한 변경이 발생할 경우에는 최소 30일
                전에 고지합니다.
              </P>
            </Article>
          </Chapter>

          <Chapter title="부칙">
            <Article title="">
              <P>본 방침은 2026년 7월 14일부터 시행됩니다.</P>
            </Article>
          </Chapter>

          <div className="sticky bottom-0 mt-[48px] flex gap-[12px] border-t border-line-divider bg-white py-[16px]">
            <button
              type="button"
              onClick={handleBack}
              className="h-[46px] flex-1 rounded-[7px] border border-line-alt bg-white text-[14px] font-semibold tracking-[-0.03em] text-tx-default transition hover:bg-fill-bg-strong"
            >
              이전으로
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
