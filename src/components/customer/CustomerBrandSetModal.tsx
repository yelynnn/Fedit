import { useCallback, useEffect, useState } from "react";
import Modal from "react-modal";
import { Icon } from "@iconify/react";
import BrandFilterModal from "@/components/filter/BrandFilterModal";
import { GetAnalysisRequests, GetCustomerAvailableBrands } from "@/apis/CustomerAnalysisAPI";
import { AnalysisRequestDialog } from "./AnalysisRequestDialog";
import { useFilterStore } from "@/stores/FilterStore";
import { useUIStore } from "@/stores/UIStore";
import {
  getEffectivePlan,
  toBillingPlan,
  useSubscriptionStore,
} from "@/stores/SubscriptionStore";

// "+ 브랜드" — 분석 묶음(브랜드 칩)을 고치는 창. 요금제마다 고를 수 있는 범위가 다르다.
//   Enterprise(관리자 포함): 다른 화면과 같은 브랜드 필터 창(BrandFilterModal)으로 아무 브랜드나
//   Basic·Pro(체험 포함): 같은 창에서 이번 달 관심 브랜드 픽 안의 브랜드만
//   무료(체험 미시작·만료): 멤버십 안내
// 어느 쪽이든 리뷰 분석이 가능한(수집된 리뷰가 있는) 브랜드만 고를 수 있다 — 리뷰 없는 브랜드는 골라도 볼 게 없다.
// 분석할 수 없는 브랜드는 "리뷰 분석 신청"으로 수집을 신청한다(이미 신청한 브랜드는 "신청함").
type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** 지금 묶음의 브랜드명 */
  value: string[];
  onConfirm: (names: string[]) => void;
};

// 검색창 아래 안내 한 줄 — 리뷰는 플랫폼(무신사·29CM·W컨셉)에서 모아서 입점 브랜드일수록 인사이트가 많다
const AVAILABLE_NOTICE = "리뷰 분석이 가능한 브랜드만 보여요. 플랫폼 입점 브랜드를 추천해요.";
const PICKS_NOTICE = "리뷰 분석이 가능한 관심 브랜드만 보여요. 플랫폼 입점 브랜드를 추천해요.";
const REQUEST_ANY_LABEL = "찾는 브랜드가 없나요? 리뷰 분석 신청";
/** 분석 묶음은 요금제와 상관없이 한 번에 최대 5개 */
export const CUSTOMER_BRAND_MAX = 5;
const CAP_HINT = `한 번에 최대 ${CUSTOMER_BRAND_MAX}개까지 고를 수 있어요`;

/**
 * 분석 가능 브랜드 이름. 화면에 들어오면 미리 받아 두고 창을 열 때마다 다시 받는다.
 * 못 받으면 undefined — 그때는 좁히지 않는다(서버가 분석 API에서 다시 막는다).
 */
function useAvailableBrands(isOpen: boolean) {
  const [available, setAvailable] = useState<string[] | undefined>(undefined);
  useEffect(() => {
    let ignore = false;
    GetCustomerAvailableBrands()
      .then((res) => {
        if (!ignore) setAvailable(res.names);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [isOpen]);
  return available;
}

/** 내가 신청한 리뷰 분석 브랜드명. 창을 열 때마다 다시 받고, 신청하면 바로 더한다 */
function useRequestedBrands(isOpen: boolean) {
  const [requested, setRequested] = useState<string[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    GetAnalysisRequests()
      .then((res) => {
        if (!ignore) setRequested(res.requests.map((r) => r.brand));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [isOpen]);
  const add = useCallback(
    (brand: string) => setRequested((list) => (list.includes(brand) ? list : [brand, ...list])),
    [],
  );
  return [requested, add] as const;
}

const MODAL_OVERLAY = "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4";
const PRIMARY_BUTTON =
  "h-[46px] w-full rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

export default function CustomerBrandSetModal({ isOpen, onClose, value, onConfirm }: Props) {
  const subscription = useSubscriptionStore((s) => s.subscription);
  const plan = toBillingPlan(getEffectivePlan(subscription));
  const available = useAvailableBrands(isOpen);
  const [requested, addRequested] = useRequestedBrands(isOpen && plan !== "free");
  const [requestBrand, setRequestBrand] = useState<string | null>(null);
  const picks = useFilterStore((s) => s.interestBrandPicks);

  if (plan === "free") return <FreeModal isOpen={isOpen} onClose={onClose} />;

  const dialog = (
    <AnalysisRequestDialog brand={requestBrand} onClose={() => setRequestBrand(null)} onRequested={addRequested} />
  );
  // Enterprise 는 리뷰가 있는 전체 브랜드라 상단 브랜드 필터와 같은 큰 창(검색·탭·인덱스),
  // Basic·Pro 는 관심 브랜드(최대 30개) 중에서만 고르니 같은 모양의 작은 창(칩 + 전체 선택)으로.
  if (plan === "enterprise") {
    return (
      <>
        <BrandFilterModal
          isOpen={isOpen}
          onClose={onClose}
          selection={{
            value,
            onConfirm,
            title: "분석할 브랜드",
            allowed: available,
            notice: AVAILABLE_NOTICE,
            missing: { label: "리뷰 분석 신청", onRequest: setRequestBrand, requested },
            noticeAction: { label: REQUEST_ANY_LABEL, onClick: () => setRequestBrand("") },
            max: CUSTOMER_BRAND_MAX,
          }}
        />
        {dialog}
      </>
    );
  }
  // 리뷰가 있는 관심 브랜드만(목록을 못 받았으면 관심 브랜드 전부)
  const allowed = available ? picks.filter((b) => available.includes(b)) : picks;
  return (
    <>
      <PicksModal
        isOpen={isOpen}
        onClose={onClose}
        value={value}
        onConfirm={onConfirm}
        allowed={allowed}
        hasPicks={picks.length > 0}
        onRequest={() => setRequestBrand("")}
      />
      {dialog}
    </>
  );
}

// 브랜드 필터 창(BrandFilterModal)의 칩과 같은 모양
const chipClass = (on: boolean) =>
  on
    ? "inline-flex items-center justify-center gap-2 rounded-md bg-fill-primary-hover px-4 py-2 type-body-medium text-tx-inverse"
    : "inline-flex items-center justify-center gap-2 rounded-md border border-line-alt bg-fill-bg-strong px-4 py-2 type-body-medium text-tx-neutral hover:bg-fill-hover active:bg-fill-hover";

// Basic·Pro 용 작은 창 — 브랜드 필터 창과 같은 머리말·안내 줄·"N / 5개"·칩·확인 버튼, 검색·탭·인덱스만 뺐다.
// 고를 수 있는 브랜드가 5개 이하일 때만 "전체 선택"을 둔다
function PicksModal({
  isOpen,
  onClose,
  value,
  onConfirm,
  allowed,
  hasPicks,
  onRequest,
}: Props & { allowed: string[]; hasPicks: boolean; onRequest: () => void }) {
  const parentSelector = useModalRoot();
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const [draft, setDraft] = useState<string[]>([]);
  useEffect(() => {
    if (isOpen) setDraft(value);
  }, [isOpen, value]);

  const selected = draft.filter((b) => allowed.includes(b));
  const allSelected = allowed.length > 0 && selected.length === allowed.length;
  const capReached = selected.length >= CUSTOMER_BRAND_MAX;
  const canSelectAll = allowed.length <= CUSTOMER_BRAND_MAX;
  const toggle = (name: string) =>
    setDraft((d) =>
      d.includes(name) ? d.filter((x) => x !== name) : capReached ? d : [...d, name],
    );
  const toggleAll = () =>
    setDraft((d) => (allSelected ? d.filter((x) => !allowed.includes(x)) : [...new Set([...d, ...allowed])]));

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName={MODAL_OVERLAY}
      className="box-border flex max-h-[80vh] w-[560px] max-w-full flex-col gap-4 rounded-xl border border-line-alt bg-white p-6 shadow-[0_0_30px_0_rgba(0,0,0,0.04)] outline-none"
      shouldCloseOnOverlayClick
    >
      <div className="flex items-center justify-between">
        <h2 className="type-title-xlarge text-tx-strong">분석할 브랜드</h2>
        <button type="button" onClick={onClose} aria-label="닫기" className="p-1 rounded hover:bg-gray-100">
          <Icon icon="ph:x" className="w-5 h-5 text-icon-neutral" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[13px] leading-[1.6] text-tx-alt">
        <p>{PICKS_NOTICE}</p>
        <button
          type="button"
          onClick={onRequest}
          className="shrink-0 font-semibold text-tx-neutral underline underline-offset-2"
        >
          {REQUEST_ANY_LABEL}
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="font-semibold text-icon-neutral">
          {selected.length} / {CUSTOMER_BRAND_MAX}개
          <span className="ml-2 font-normal text-tx-alt">{CAP_HINT}</span>
        </div>
        {canSelectAll && (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-tx-neutral"
            checked={allSelected}
            onChange={toggleAll}
            disabled={allowed.length === 0}
          />
          <span className="text-icon-neutral">브랜드 전체 선택하기</span>
        </label>
        )}
      </div>

      <div className="flex-1 min-h-[80px] overflow-y-auto">
        {allowed.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-tx-alt">
            {hasPicks ? "관심 브랜드 중 아직 리뷰를 분석할 수 있는 브랜드가 없어요." : "아직 고른 관심 브랜드가 없어요."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {allowed.map((name) => {
              const on = draft.includes(name);
              const capped = !on && capReached;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name)}
                  aria-pressed={on}
                  disabled={capped}
                  title={capped ? CAP_HINT : undefined}
                  className={`${chipClass(on)} ${capped ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg bg-fill-bg-strong px-3 py-2.5 text-[13px] text-tx-alt">
        <span>관심 브랜드를 더 고르면 여기서도 추가할 수 있어요.</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            openSettingsModal("관심브랜드");
          }}
          className="shrink-0 font-semibold text-tx-neutral underline underline-offset-2"
        >
          관심 브랜드 설정
        </button>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(selected)}
        disabled={selected.length === 0}
        className={
          selected.length === 0
            ? "h-[46px] w-full rounded-md border border-line-alt bg-white type-title-medium text-[#A1A3A5] cursor-not-allowed"
            : "h-[46px] w-full rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90"
        }
      >
        {selected.length}개의 브랜드 확인
      </button>
    </Modal>
  );
}

const useModalRoot = () =>
  useCallback(() => document.getElementById("modal-root") ?? document.body, []);

function FreeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const parentSelector = useModalRoot();
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName={MODAL_OVERLAY}
      className="box-border flex w-[420px] max-w-full flex-col items-center gap-5 rounded-xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)] outline-none"
      shouldCloseOnOverlayClick
    >
      <span className="flex items-center justify-center p-2 rounded-md bg-brand-subtle">
        <Icon icon="ph:lock-simple-fill" className="w-7 h-7 text-tx-default" />
      </span>
      <p className="text-center type-body-small text-tx-neutral">
        멤버십을 시작하면 이용할 수 있는 기능이에요.
      </p>
      <button
        type="button"
        onClick={() => {
          onClose();
          openSettingsModal("구독");
        }}
        className={PRIMARY_BUTTON}
      >
        요금제 보기
      </button>
    </Modal>
  );
}
