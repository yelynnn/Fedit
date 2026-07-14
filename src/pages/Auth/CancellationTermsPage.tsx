import { useLocation, useNavigate } from "react-router-dom";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import { Chapter, Article, P, Ol, DashList, Quote } from "@/components/terms/TermsBlocks";

const CancellationTermsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    // 직접 URL로 진입했거나 새 탭으로 열린 경우 돌아갈 히스토리가 없어
    // navigate(-1)이 아무 동작도 하지 않으므로, 그 경우엔 홈으로 보낸다.
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
              fedit 정기구독 해지 및 환불 안내
            </h1>
            <p className="text-[14px] leading-[1.7] tracking-[-0.03em] text-tx-alt">
              정기구독 결제 전 반드시 확인해주세요. 회원탈퇴·정기구독 해지·환불에
              관한 세부 조항을 안내합니다.
            </p>
          </div>

          <Chapter title="정기구독 해지 및 환불 조항">
            <Article title="제 1 조 (회원의 계약 해제·해지 및 회원탈퇴)">
              <P>
                ① 회원은 언제든지 서비스 내 설정 메뉴 또는 고객센터를 통해
                이용계약 해지(이하 "회원탈퇴")를 신청할 수 있으며, 회사는
                관련 법령이 정하는 바에 따라 이를 즉시 처리하여야 합니다.
              </P>
              <P>
                ② 회원이 회원탈퇴를 신청할 경우, 회사가 제공하는 플랫폼별
                경쟁사 모니터링 정보 조회, 보드 저장(스크랩) 기능, 프리미엄
                AI 챗봇 등 모든 서비스의 이용이 즉시 중단됩니다.
              </P>
            </Article>

            <Article title="제 2 조 (탈퇴의 효과 및 데이터 처리)">
              <P>
                ① 회원탈퇴가 완료되면 관련 법령 및 개인정보처리방침에 따라
                회사가 보유하는 회원의 계정 정보 및 개인정보는 즉시
                삭제(파기)됩니다.
              </P>
              <P>
                ② 탈퇴와 동시에 회원이 플랫폼별 정보를 수집하여 구성한
                '보드(스크랩)' 데이터 및 개인화 설정 값 등 서비스 이용
                과정에서 축적된 모든 데이터는 복구가 불가능하도록 즉시 영구
                삭제됩니다. 회원의 소홀이나 변심으로 인한 데이터 삭제에 대한
                책임은 회원 본인에게 있습니다.
              </P>
              <P>
                ③ 전자상거래 등에서의 소비자보호에 관한 법률 등 관계 법령의
                규정에 의하여 보존할 필요가 있는 경우(예: 이용 대금 결제 및
                정산 기록), 회사는 관련 법령이 정한 일정 기간 동안 회원
                데이터를 분리 보관하며, 해당 기간이 경과한 후에는 완전히
                파기합니다.
              </P>
            </Article>

            <Article title="제 3 조 (정기구독 요금제 운영 및 중도 해지 원칙)">
              <P>
                ① 본 서비스의 프리미엄 요금제(AI 챗봇 기능 포함)는
                정기구독형으로 운영되며, 회원은 언제든지 정기결제
                해지(구독 취소)를 신청할 수 있습니다.
              </P>
              <P>
                ② 본 서비스는 결제 즉시 AI 기능 이용 권한이 부여되고 데이터
                모니터링 시스템이 가동되는 디지털 콘텐츠의 특성을 가집니다.
                이에 따라, 이용 도중 회원의 단순 변심으로 인한 중도 계약
                해지 및 일할 환불은 원칙적으로 불가능합니다.
              </P>
              <P>
                ③ 회원이 정기구독 해지를 신청할 경우, 회원은 이미 결제한
                당해 이용 기간의 만료일까지 프리미엄 서비스를 정상적으로
                이용할 수 있으며, 다음 결제 예정일에 자동 결제가 차단되는
                '당월 말 해지' 방식으로 처리됩니다.
              </P>
            </Article>

            <Article title="제 4 조 (예외적 청약철회 및 제한 기준)">
              <P>
                ① 회원은 유료 결제 후 다음 각 호의 요건을 동시에 모두
                충족하는 경우에 한하여, 전자상거래법에 의거 결제일로부터
                7일 이내에 청약철회(환불)를 요청할 수 있습니다.
              </P>
              <Ol
                items={[
                  "결제 후 프리미엄 전용 AI 챗봇 기능을 단 1회도 이용(쿼리 입력 등)하지 않은 경우",
                  "결제 후 제공되는 프리미엄 전용 모니터링 데이터를 활용한 '보드 저장(스크랩)' 행위를 단 1회도 하지 않은 경우",
                  "결제 후 제공되는 프리미엄 요금제 전용 플랫폼 정보 및 데이터를 조회·열람하지 않은 경우",
                ]}
              />
              <P>
                ② 제1항의 요건을 충족하여 환불이 진행될 경우, 결제 대행
                수수료 및 행정 비용 등을 차감한 해지 위약금(결제 금액의
                10%)을 공제한 잔액이 환불됩니다. 단, 회사의 귀책사유로 인해
                서비스를 전혀 이용하지 못한 경우는 위약금이 면제됩니다.
              </P>
            </Article>

            <Article title="제 5 조 (연간 정기구독의 중도 해지 산식)">
              <P>
                회사가 부득이하게 연간 정기구독 회원의 중도 해지 및 환불을
                승인하는 경우, 장기 이용을 조건으로 제공된 할인 혜택은
                실효되며 아래와 같이 가장 보수적인 산식을 적용하여 환불
                금액을 계산합니다.
              </P>
              <Quote title="환불 금액 산식">
                환불 금액 = 연간 결제 총액 - (이용 개월 수 × 할인이 적용되지
                않은 정상 월 구독료) - 해지 위약금(연간 결제 총액의 10%)
              </Quote>
              <DashList
                items={[
                  "이용 개월 수 계산: 단 1일이라도 서비스 이용 기간에 속한 달은 1개월을 완전히 이용한 것으로 간주하여 올림 계산합니다.",
                  "위 산식의 결과 환불 금액이 0원 이하(마이너스)가 되는 경우 환불 요금은 존재하지 않는 것으로 하며, 당초 약정된 연간 이용 기간 만료 시까지 프리미엄 서비스가 유지된 후 종료됩니다.",
                ]}
              />
            </Article>

            <Article title="제 6 조 (회사의 계약해제·해지 및 이용제한)">
              <P>
                ① 회사는 회원이 다음 각 호의 사유에 해당하는 경우, 사전 통지
                후 회원 자격을 제한, 정지하거나 강제 탈퇴(이용계약
                해지)시킬 수 있습니다. 단, 시스템 마비 등 긴급을 요하는
                사유가 있는 경우 선조치 후 통지할 수 있습니다.
              </P>
              <DashList
                items={[
                  "타인의 명의, 계정 정보 또는 결제 수단을 도용하여 가입하거나 결제한 경우",
                  "회사가 제공하는 플랫폼 모니터링 정보 및 데이터를 크롤링, 매크로 등을 이용하여 비정상적으로 다량 수집·유출하거나 시스템에 부하를 주는 행위를 한 경우",
                  "AI 챗봇 서비스를 악용하여 무차별적인 쿼리(Query) 공격을 보내거나 우회적인 방법으로 회사의 시스템 운영을 방해한 경우",
                  "기타 본 약관 및 관련 법령을 위반하여 서비스 제공을 지속하기 어려운 중대한 사유가 발생한 경우",
                ]}
              />
              <P>
                ② 회사가 제1항에 따라 회원 자격을 상실시키는 경우 유료 결제
                요금에 대한 환불은 청구할 수 없습니다.
              </P>
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

export default CancellationTermsPage;
