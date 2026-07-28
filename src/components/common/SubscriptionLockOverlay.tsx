import { useUIStore } from "@/stores/UIStore";

// 무료체험 미시작(not_started)·만료(expired) 상태에서 블러 처리된 콘텐츠
// 위에 띄우는 잠금 카드. 배경 자체는 opacity+blur로 콘텐츠 쪽에서 처리하므로
// 여기서는 딤 처리 없이 카드만 중앙에 띄운다. 부모 요소에 relative를 지정하고
// 그 안에 형제로 렌더링해서 써야 한다.
export default function SubscriptionLockOverlay() {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="flex w-[420px] flex-col items-end gap-6 rounded-xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]">
        <div className="flex flex-col items-center w-full gap-3">
          <div className="flex items-center justify-center gap-2.5 rounded-md bg-brand-subtle p-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.35904 25.125C6.77901 25.125 6.2825 24.9185 5.8695 24.5055C5.4565 24.0925 5.25 23.596 5.25 23.016V12.0674C5.25 11.4873 5.4565 10.9908 5.8695 10.5778C6.2825 10.1648 6.77901 9.95833 7.35904 9.95833H8.75V7.625C8.75 6.16822 9.26081 4.92903 10.2824 3.90742C11.304 2.8858 12.5432 2.375 14 2.375C15.4568 2.375 16.696 2.8858 17.7176 3.90742C18.7392 4.92903 19.25 6.16822 19.25 7.625V9.95833H20.641C21.221 9.95833 21.7175 10.1648 22.1305 10.5778C22.5435 10.9908 22.75 11.4873 22.75 12.0674V23.016C22.75 23.596 22.5435 24.0925 22.1305 24.5055C21.7175 24.9185 21.221 25.125 20.641 25.125H7.35904ZM14 19.5833C14.5668 19.5833 15.0488 19.3848 15.4461 18.9877C15.8431 18.5905 16.0417 18.1085 16.0417 17.5417C16.0417 16.9749 15.8431 16.4928 15.4461 16.0956C15.0488 15.6985 14.5668 15.5 14 15.5C13.4332 15.5 12.9512 15.6985 12.5539 16.0956C12.1569 16.4928 11.9583 16.9749 11.9583 17.5417C11.9583 18.1085 12.1569 18.5905 12.5539 18.9877C12.9512 19.3848 13.4332 19.5833 14 19.5833ZM10.5 9.95833H17.5V7.625C17.5 6.65278 17.1597 5.82639 16.4792 5.14583C15.7986 4.46528 14.9722 4.125 14 4.125C13.0278 4.125 12.2014 4.46528 11.5208 5.14583C10.8403 5.82639 10.5 6.65278 10.5 7.625V9.95833Z"
                fill="#242628"
              />
            </svg>
          </div>

          <h2 className="text-center type-title-xlarge text-tx-strong">
            전체 분석이 잠겼어요
          </h2>

          <div className="flex flex-col justify-center w-full h-10">
            <p className="text-center type-body-small text-tx-neutral">
              멤버십을 시작하면 브랜드 지수 · AI 상품 분석 · 전체 랭킹을 <br />
              다시 볼 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end w-full gap-1">
          <button
            type="button"
            onClick={() => openSettingsModal("구독")}
            className="type-title-medium flex h-[46px] w-full items-center justify-center gap-1 rounded-md bg-fill-primary text-tx-inverse"
          >
            플랜 업그레이드하기
          </button>

          <button
            type="button"
            onClick={() => openSettingsModal("구독")}
            className="type-title-medium flex h-[46px] w-full items-center justify-center gap-1 text-center text-[#56585A]"
          >
            자세히 알아보기
          </button>
        </div>
      </div>
    </div>
  );
}
