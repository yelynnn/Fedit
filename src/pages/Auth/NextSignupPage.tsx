import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import { GetCheckPromoCode, PostPersonalSignup } from "@/apis/AuthAPI";
import {
  isLandingEntry,
  clearLandingEntry,
  SHOW_PRICING_AFTER_SIGNUP_KEY,
} from "@/lib/secretEntry";
import { track } from "@/lib/analytics";

const jobOptions = ["MD", "디자이너", "마케팅", "대표", "기타"];

const companySizeOptions = [
  "1~5인 기업",
  "5-20인 기업",
  "20인-50인 기업",
  "50인 이상 기업",
];

interface PrevData {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  companyName?: string;
  job?: string;
  companySize?: string;
  agreed?: boolean;
  promoCode?: string;
}

// 혜택 코드 입력값 정리 — 서버와 같은 규칙(공백 제거·대문자).
const normalizePromoCode = (raw: string) => raw.replace(/\s+/g, "").toUpperCase();

type PromoStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; message: string }
  | { state: "invalid"; message: string };

const describePromo = (check: {
  trialPlan?: string;
  trialDays?: number;
  discountPlan?: string;
  discountAmount?: number;
  discountMonths?: number;
}) => {
  const planLabel = (p?: string) => (p === "pro" ? "Pro" : "Basic");
  const parts: string[] = [];
  if (check.trialDays) {
    parts.push(`${planLabel(check.trialPlan)} ${check.trialDays}일 무료 체험`);
  }
  if (check.discountMonths && check.discountAmount) {
    parts.push(
      `첫 ${check.discountMonths}개월 월 ${check.discountAmount.toLocaleString("ko-KR")}원`,
    );
  }
  return parts.length > 0
    ? `혜택 코드가 적용됐어요 · ${parts.join(" + ")}`
    : "혜택 코드가 적용됐어요.";
};

const NextSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevData = location.state as PrevData | null;

  const [companyName, setCompanyName] = useState(prevData?.companyName ?? "");
  const [job, setJob] = useState(prevData?.job ?? "");
  const [companySize, setCompanySize] = useState(prevData?.companySize ?? "");
  const [isTermsAgreed] = useState(prevData?.agreed ?? false);
  const [promoCode, setPromoCode] = useState(prevData?.promoCode ?? "");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>({ state: "idle" });

  const [customJob, setCustomJob] = useState("");
  const [isJobOpen, setIsJobOpen] = useState(false);
  const [isCompanySizeOpen, setIsCompanySizeOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const effectiveJob = job === "기타" ? customJob : job;
  const normalizedPromoCode = normalizePromoCode(promoCode);

  // 혜택 코드는 선택 입력 — 입력 후 "적용" 버튼을 눌러야 서버에 확인한다.
  const applyPromoCode = async (raw: string) => {
    const code = normalizePromoCode(raw);
    if (code === "") return;
    setPromoStatus({ state: "checking" });
    try {
      const result = await GetCheckPromoCode(code);
      setPromoStatus(
        result.valid
          ? { state: "valid", message: describePromo(result) }
          : {
              state: "invalid",
              message: result.message || "유효하지 않은 혜택 코드예요.",
            },
      );
    } catch (error: any) {
      setPromoStatus({ state: "invalid", message: error.message });
    }
  };

  // 약관 화면에 다녀오면 입력해둔 코드가 되살아나므로, 그때는 한 번 다시 적용해둔다.
  useEffect(() => {
    if (prevData?.promoCode) applyPromoCode(prevData.promoCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePromoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value.toUpperCase());
    // 코드를 고치면 다시 적용 버튼을 눌러야 한다.
    setPromoStatus({ state: "idle" });
  };

  // 코드를 입력했다면 적용까지 끝나고 유효할 때만 가입을 진행한다(비워두면 상관없음).
  const isPromoOk =
    normalizedPromoCode === "" || promoStatus.state === "valid";

  const isFormValid =
    companyName.trim() !== "" &&
    effectiveJob.trim() !== "" &&
    companySize.trim() !== "" &&
    isTermsAgreed &&
    isPromoOk;

  const handlePrev = () => {
    navigate(-1);
  };

  const handleNext = async () => {
    if (!isFormValid || !prevData) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await PostPersonalSignup({
        name: prevData.name,
        email: prevData.email,
        password: prevData.password,
        phone_number: prevData.phone_number,
        company_name: companyName,
        company_size: companySize,
        job_title: effectiveJob,
        ...(normalizedPromoCode ? { promo_code: normalizedPromoCode } : {}),
      });
      if (isLandingEntry()) {
        clearLandingEntry();
        localStorage.setItem(SHOW_PRICING_AFTER_SIGNUP_KEY, "true");
      }
      // 개인 회원가입 완료 — GA4/메타 전환 이벤트. 가입만 한 상태라 요금제는
      // 없다(체험 시작은 trial_started가 체험이 실제로 열릴 때 따로 나간다).
      track("sign_up", {
        signup_method: "email",
        account_type: "personal",
        ...(normalizedPromoCode ? { promo_code: normalizedPromoCode } : {}),
      });
      setShowSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-tx-default">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-[14px] rounded-[16px] bg-white px-[40px] py-[36px] shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-fill-primary">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-semibold tracking-[-0.04em] text-tx-default">
              회원가입이 완료되었어요!
            </p>
            {normalizedPromoCode && (
              <p className="text-center text-[13px] font-medium leading-[1.5] tracking-[-0.03em] text-tx-alt">
                혜택 코드가 적용됐어요.
                <br />
                로그인 후 설정 &gt; 요금제에서 무료 체험을 시작해보세요.
              </p>
            )}
            <p className="text-[13px] font-medium tracking-[-0.03em] text-icon-neutral">
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        </div>
      )}

      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[74px] pb-[60px]">
        <section className="w-full max-w-[392px]">
          <div className="mb-[34px]">
            <h1 className="text-[24px] font-semibold leading-[1.35] tracking-[-0.04em] text-tx-default">
              회원님의 정보에 맞춰
              <br />
              트렌드와 리포트를 최적화해드려요.
            </h1>

            <p className="mt-[8px] text-[14px] font-medium tracking-[-0.03em] text-tx-alt">
              수집된 데이터를 기반으로 정확한 분석 결과를 제공해요.
            </p>
          </div>

          <div className="flex flex-col gap-[30px]">
            <InputField
              label="회사명을 알려주세요."
              placeholder="회사명"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <SelectField
              label="직업 또는 직무를 알려주세요."
              placeholder="기업 규모에 맞는 인사이트를 제공해요."
              value={job}
              options={jobOptions}
              isOpen={isJobOpen}
              onToggle={() => {
                setIsJobOpen((prev) => !prev);
                setIsCompanySizeOpen(false);
              }}
              onSelect={(value) => {
                setJob(value);
                setIsJobOpen(false);
                if (value !== "기타") setCustomJob("");
              }}
            />
            {job === "기타" && (
              <InputField
                label="기타 선택 시 직접 입력해주세요."
                placeholder="직업 또는 직무를 입력해주세요."
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
              />
            )}

            <SelectField
              label="회사 규모를 알려주세요."
              placeholder="기업 규모에 맞는 인사이트를 제공해요."
              value={companySize}
              options={companySizeOptions}
              isOpen={isCompanySizeOpen}
              onToggle={() => {
                setIsCompanySizeOpen((prev) => !prev);
                setIsJobOpen(false);
              }}
              onSelect={(value) => {
                setCompanySize(value);
                setIsCompanySizeOpen(false);
              }}
            />

            <PromoCodeField
              value={promoCode}
              onChange={handlePromoChange}
              onApply={() => applyPromoCode(promoCode)}
              status={promoStatus}
            />
          </div>

          {errorMessage && (
            <p className="mt-[16px] whitespace-pre-line text-[13px] font-medium tracking-[-0.03em] text-rising">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              navigate("/terms", {
                state: {
                  from: "/signup/personal/next",
                  returnState: {
                    ...prevData,
                    companyName,
                    job: effectiveJob,
                    companySize,
                    promoCode,
                    agreed: isTermsAgreed,
                  },
                },
              })
            }
            className="mt-[28px] flex h-[42px] w-full items-center justify-between rounded-[6px] border border-line-alt bg-fill-bg-strong px-[14px] text-[13px] font-semibold tracking-[-0.03em] text-tx-default transition hover:bg-surface-base"
          >
            <span className="flex items-center gap-[10px]">
              <CheckCircle
                size={18}
                strokeWidth={2}
                className={
                  isTermsAgreed ? "fill-fill-primary text-white" : "text-tx-assistive"
                }
              />
              약관 동의
            </span>

            <ChevronRight size={18} strokeWidth={2} className="text-tx-alt" />
          </button>

          <div className="mt-[16px] grid grid-cols-[76px_1fr] gap-[16px]">
            <button
              type="button"
              onClick={handlePrev}
              className="h-[42px] rounded-[7px] border border-line-alt bg-white text-[14px] font-semibold tracking-[-0.03em] text-tx-default transition hover:bg-fill-bg-strong"
            >
              이전
            </button>

            <button
              type="button"
              disabled={!isFormValid || isLoading}
              onClick={handleNext}
              className={`h-[42px] rounded-[7px] text-[14px] font-semibold tracking-[-0.03em] transition ${
                isFormValid && !isLoading
                  ? "bg-fill-primary text-white hover:bg-[#111111]"
                  : "cursor-not-allowed bg-surface-base text-icon-alt"
              }`}
            >
              {isLoading ? "처리 중..." : "다음"}
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

interface PromoCodeFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onApply: () => void;
  status: PromoStatus;
}

// 혜택 코드(선택) — 블로그 등에서 받은 코드를 입력하고 "적용"을 누르면
// 바로 아래에 적용 결과(적용됨 / 틀림 / 만료 / 마감)가 나온다.
const PromoCodeField = ({ value, onChange, onApply, status }: PromoCodeFieldProps) => {
  const hasValue = value.trim() !== "";
  const isChecking = status.state === "checking";
  const borderClass =
    status.state === "invalid"
      ? "border-rising focus:border-rising"
      : status.state === "valid"
        ? "border-[#1A75FF] focus:border-[#1A75FF]"
        : "border-line-alt focus:border-fill-primary";
  return (
    <div>
      <label className="mb-[8px] block text-[14px] font-semibold tracking-[-0.03em] text-tx-default">
        혜택 코드가 있다면 입력해주세요.
        <span className="ml-[4px] text-[13px] font-medium text-tx-assistive">
          (선택)
        </span>
      </label>

      <div className="flex gap-[8px]">
        <input
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hasValue && !isChecking) {
              e.preventDefault();
              onApply();
            }
          }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={50}
          className={`h-[44px] min-w-0 flex-1 rounded-[7px] border px-[12px] text-[14px] font-medium tracking-[-0.03em] text-tx-default outline-none transition placeholder:text-tx-assistive ${borderClass}`}
        />
        <button
          type="button"
          onClick={onApply}
          disabled={!hasValue || isChecking}
          className={`h-[44px] w-[76px] shrink-0 rounded-[7px] text-[14px] font-semibold tracking-[-0.03em] transition ${
            hasValue && !isChecking
              ? "bg-fill-primary text-white hover:bg-[#111111]"
              : "cursor-not-allowed bg-surface-base text-icon-alt"
          }`}
        >
          {isChecking ? "확인 중" : "적용"}
        </button>
      </div>

      {status.state === "idle" && hasValue && (
        <p className="mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-tx-assistive">
          적용 버튼을 눌러 코드를 확인해주세요.
        </p>
      )}
      {status.state === "valid" && (
        <p className="mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-[#1A75FF]">
          {status.message}
        </p>
      )}
      {status.state === "invalid" && (
        <p className="mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-rising">
          {status.message}
        </p>
      )}
    </div>
  );
};

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField = ({
  label,
  placeholder,
  value,
  onChange,
}: InputFieldProps) => {
  return (
    <div>
      <label className="mb-[8px] block text-[14px] font-semibold tracking-[-0.03em] text-tx-default">
        <span className="mr-[2px] text-rising">*</span>
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-[44px] w-full rounded-[7px] border border-line-alt px-[12px] text-[14px] font-medium tracking-[-0.03em] text-tx-default outline-none transition placeholder:text-tx-assistive focus:border-fill-primary"
      />
    </div>
  );
};

interface SelectFieldProps {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}

const SelectField = ({
  label,
  placeholder,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: SelectFieldProps) => {
  return (
    <div className="relative">
      <label className="mb-[8px] block text-[14px] font-semibold tracking-[-0.03em] text-tx-default">
        <span className="mr-[2px] text-rising">*</span>
        {label}
      </label>

      <button
        type="button"
        onClick={onToggle}
        className={`flex h-[44px] w-full items-center justify-between rounded-[7px] border border-line-alt bg-white px-[12px] text-left text-[14px] font-medium tracking-[-0.03em] outline-none transition ${
          value ? "text-tx-default" : "text-tx-assistive"
        } ${isOpen ? "border-line-alt shadow-[0_6px_18px_rgba(0,0,0,0.08)]" : ""}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-tx-alt transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[74px] z-20 w-full rounded-[10px] border border-line-divider bg-white p-[6px] shadow-[0_12px_30px_rgba(0,0,0,0.13)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`block h-[40px] w-full rounded-[7px] px-[12px] text-left text-[14px] font-semibold tracking-[-0.03em] transition hover:bg-surface-base ${
                value === option ? "bg-surface-base text-tx-default" : "text-tx-default"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NextSignupPage;