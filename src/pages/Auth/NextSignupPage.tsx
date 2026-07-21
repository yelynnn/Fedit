import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import LoginHeader from "@/components/common/LoginHeader";
import Footer from "@/components/common/Footer";
import { PostPersonalSignup } from "@/apis/AuthAPI";

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
}

const NextSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prevData = location.state as PrevData | null;

  const [companyName, setCompanyName] = useState(prevData?.companyName ?? "");
  const [job, setJob] = useState(prevData?.job ?? "");
  const [companySize, setCompanySize] = useState(prevData?.companySize ?? "");
  const [isTermsAgreed] = useState(prevData?.agreed ?? false);

  const [customJob, setCustomJob] = useState("");
  const [isJobOpen, setIsJobOpen] = useState(false);
  const [isCompanySizeOpen, setIsCompanySizeOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const effectiveJob = job === "기타" ? customJob : job;

  const isFormValid =
    companyName.trim() !== "" &&
    effectiveJob.trim() !== "" &&
    companySize.trim() !== "" &&
    isTermsAgreed;

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
      });
      localStorage.setItem("isNewSignup", "true");
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
            <p className="text-[13px] font-medium tracking-[-0.03em] text-icon-neutral">
              잠시 후 로그인 페이지로 이동합니다.
            </p>
          </div>
        </div>
      )}

      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[74px]">
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