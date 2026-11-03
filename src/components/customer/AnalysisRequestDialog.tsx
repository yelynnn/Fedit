import { useCallback, useEffect, useState } from "react";
import Modal from "react-modal";
import { Icon } from "@iconify/react";
import {
  GetAnalysisRequests,
  GetCustomerAvailableBrands,
  PostAnalysisRequest,
} from "@/apis/CustomerAnalysisAPI";
import { objectParticle } from "./customerFormat";

// 리뷰 분석 신청 확인 창 — 아직 리뷰를 분석할 수 없는 브랜드의 수집·분석을 신청한다(입점 신청과 별개).
// 브랜드 이름만 받으면 어디서든(브랜드 선택 창, 나중엔 교차 구매의 미수집 브랜드 줄 등) 띄울 수 있다.
// 빈 문자열("")로 열면 브랜드명을 직접 적는 칸이 나온다(헤더·브랜드 선택 창의 "리뷰 분석 신청").
type Props = {
  /** 신청할 브랜드. null이면 닫혀 있고, ""이면 고객이 이름을 적는다 */
  brand: string | null;
  onClose: () => void;
  /** 신청이 끝나면(이미 신청한 브랜드였어도) 부른다 — "신청함" 표시를 갱신할 때 */
  onRequested?: (brand: string) => void;
};

// 이름 비교 — 대소문자·띄어쓰기는 무시한다("무신사 스탠다드" = "무신사스탠다드")
const nameKey = (s: string) => s.replace(/\s+/g, "").toLowerCase();

const MODAL_OVERLAY = "fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4";
const PRIMARY_BUTTON =
  "h-[46px] flex-1 rounded-md bg-fill-primary type-title-medium text-tx-inverse hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";
const SECONDARY_BUTTON =
  "h-[46px] flex-1 rounded-md border border-line-alt bg-white type-title-medium text-tx-neutral hover:bg-surface-base";

export function AnalysisRequestDialog({ brand, onClose, onRequested }: Props) {
  const parentSelector = useCallback(() => document.getElementById("modal-root") ?? document.body, []);
  const [step, setStep] = useState<"confirm" | "sending" | "done">("confirm");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const typing = brand === "";
  // 직접 적는 창 — 이미 분석할 수 있거나 이미 신청한 브랜드면 입력칸 아래에 알려 준다
  const [known, setKnown] = useState<{ available: string[]; requested: string[] }>({ available: [], requested: [] });
  useEffect(() => {
    if (!typing) return;
    let ignore = false;
    Promise.allSettled([GetCustomerAvailableBrands(), GetAnalysisRequests()]).then(([a, r]) => {
      if (ignore) return;
      setKnown({
        available: a.status === "fulfilled" ? a.value.names : [],
        requested: r.status === "fulfilled" ? r.value.requests.map((x) => x.brand) : [],
      });
    });
    return () => {
      ignore = true;
    };
  }, [typing]);

  // 다른 브랜드로 다시 열면 처음 단계부터
  useEffect(() => {
    if (brand !== null) {
      setStep("confirm");
      setError(null);
      setName(brand);
    }
  }, [brand]);

  const target = name.trim();
  const key = nameKey(target);
  const existing = typing && key ? known.available.find((b) => nameKey(b) === key) : undefined;
  const alreadyRequested = typing && key && !existing ? known.requested.find((b) => nameKey(b) === key) : undefined;
  const blocked = !!existing || !!alreadyRequested;
  const submit = async () => {
    if (!target || blocked) return;
    setStep("sending");
    setError(null);
    try {
      const res = await PostAnalysisRequest(target);
      onRequested?.(res.brand);
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "리뷰 분석을 신청하지 못했어요.");
      setStep("confirm");
    }
  };

  return (
    <Modal
      isOpen={brand !== null}
      onRequestClose={onClose}
      ariaHideApp={false}
      parentSelector={parentSelector}
      overlayClassName={MODAL_OVERLAY}
      className="box-border flex w-[420px] max-w-full flex-col gap-5 rounded-xl bg-white p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.16)] outline-none"
      shouldCloseOnOverlayClick
    >
      {step === "done" ? (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex items-center justify-center p-2 rounded-md bg-brand-subtle">
              <Icon icon="ph:check-bold" className="w-6 h-6 text-tx-default" aria-hidden />
            </span>
            <p className="text-[16px] font-semibold text-tx-strong">신청했어요.</p>
            <p className="text-[14px] leading-[1.6] text-tx-alt">준비되면 분석할 브랜드에 나타나요.</p>
          </div>
          <button type="button" onClick={onClose} className={PRIMARY_BUTTON}>
            확인
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-[16px] font-semibold leading-[1.5] text-tx-strong break-keep">
              {typing ? "리뷰 분석 신청" : `${brand} 리뷰 분석을 신청할까요?`}
            </h2>
            <p className="text-[14px] leading-[1.6] text-tx-alt">
              {typing && "분석하고 싶은 브랜드를 적어 주세요. "}
              신청하면 1~2일 내로 리뷰를 수집해 고객 분석에 추가해 드려요.
            </p>
            {typing && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) submit();
                }}
                placeholder="브랜드 이름"
                autoFocus
                className="mt-1 h-[42px] w-full rounded-md border border-line-alt px-3 text-[14px] text-tx-default outline-none focus:border-line-neutral"
              />
            )}
            {existing && (
              <p className="text-[13px] text-tx-alt">
                이미 있는 브랜드예요. '+ 브랜드'에서 <b className="font-semibold text-tx-neutral">{existing}</b>
                {objectParticle(existing)} 골라 분석할 수 있어요.
              </p>
            )}
            {alreadyRequested && (
              <p className="text-[13px] text-tx-alt">이미 신청한 브랜드예요. 준비되면 분석할 브랜드에 나타나요.</p>
            )}
            {error && <p className="text-[13px] text-[var(--palette-red-50)]">{error}</p>}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
              취소
            </button>
            <button type="button" onClick={submit} disabled={step === "sending" || !target || blocked} className={PRIMARY_BUTTON}>
              {step === "sending" ? "신청 중…" : "신청하기"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
