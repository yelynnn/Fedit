import Footer from "@/components/common/Footer";
import LoginHeader from "@/components/common/LoginHeader";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^01[0-9]-\d{3,4}-\d{4}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;

const formatPhone = (digits: string) => {
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
};

const PersonalSignupPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    phone: false,
  });

  const emailError =
    touched.email && form.email.trim() !== "" && !EMAIL_REGEX.test(form.email)
      ? "올바른 이메일 형식을 입력해주세요."
      : null;

  const passwordError =
    touched.password && form.password.trim() !== "" && !PASSWORD_REGEX.test(form.password)
      ? "비밀번호는 8~20자, 영문자·숫자·특수문자(@$!%*#?&)를 각 1개 이상 포함해야 해요."
      : null;

  const phoneError =
    touched.phone && form.phone.trim() !== "" && !PHONE_REGEX.test(form.phone)
      ? "올바른 연락처 형식을 입력해주세요."
      : null;

  const isFormValid =
    form.name.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.trim() !== "" &&
    form.phone.trim() !== "" &&
    EMAIL_REGEX.test(form.email) &&
    PASSWORD_REGEX.test(form.password) &&
    PHONE_REGEX.test(form.phone);

  const handleChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d-]/g, "");
    const digits = cleaned.replace(/-/g, "");
    const auto = formatPhone(digits);

    // 사용자가 직접 입력한 '-'가 자동 포맷 위치와 맞으면 auto-format 적용,
    // 아니면 직접 입력한 값 그대로 사용
    let compatible = true;
    for (let i = 0; i < Math.min(cleaned.length, auto.length); i++) {
      if (cleaned[i] === "-" && auto[i] !== "-") {
        compatible = false;
        break;
      }
    }

    setForm((prev) => ({ ...prev, phone: compatible ? auto : cleaned.slice(0, 13) }));
  };

  const handleBlur = (key: keyof typeof touched) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handlePrev = () => {
    navigate("/signup");
  };

  const handleNext = () => {
    if (!isFormValid) return;

    navigate("/signup/personal/next", {
      state: {
        name: form.name,
        email: form.email,
        password: form.password,
        phone_number: form.phone,
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-tx-default">
      <LoginHeader />

      <main className="flex flex-1 justify-center px-5 pt-[74px] pb-[60px]">
        <section className="w-full max-w-[458px]">
          <div className="mb-[38px]">
            <h1 className="text-[24px] font-bold leading-[1.35] tracking-[-0.04em] text-tx-default">
              회원님의 정보에 맞춰
              <br />
              트렌드와 리포트를 최적화해드려요.
            </h1>

            <p className="mt-[8px] text-[15px] font-medium tracking-[-0.03em] text-tx-alt">
              수집된 데이터를 기반으로 정확한 분석 결과를 제공해요.
            </p>
          </div>

          <div className="flex flex-col gap-[34px]">
            <InputField
              label="이름을 알려주세요."
              placeholder="서비스 이용 시 표시될 이름이에요."
              value={form.name}
              onChange={handleChange("name")}
            />

            <InputField
              label="이메일 주소를 알려주세요."
              placeholder="알림, 리포트, 계정 관리에 사용돼요."
              value={form.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              error={emailError}
            />

            <InputField
              label="비밀번호를 설정해주세요."
              placeholder="8~20자, 영문·숫자·특수문자(@$!%*#?&) 포함"
              value={form.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              error={passwordError}
              type="password"
            />

            <InputField
              label="연락처를 알려주세요."
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={handlePhoneChange}
              onBlur={handleBlur("phone")}
              error={phoneError}
              type="tel"
            />
          </div>

          <div className="mt-[32px] grid grid-cols-[88px_1fr] gap-[20px]">
            <button
              type="button"
              onClick={handlePrev}
              className="h-[42px] rounded-[7px] border border-line-alt bg-white text-[14px] font-bold tracking-[-0.03em] text-tx-default transition hover:bg-fill-bg-strong"
            >
              이전
            </button>

            <button
              type="button"
              disabled={!isFormValid}
              onClick={handleNext}
              className={`h-[42px] rounded-[7px] text-[14px] font-bold tracking-[-0.03em] transition ${
                isFormValid
                  ? "bg-fill-primary text-white hover:bg-[#111111]"
                  : "cursor-not-allowed bg-surface-base text-icon-alt"
              }`}
            >
              다음
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
  onBlur?: () => void;
  error?: string | null;
  type?: string;
}

const InputField = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
}: InputFieldProps) => {
  return (
    <div>
      <label className="mb-[8px] block text-[14px] font-bold tracking-[-0.03em] text-tx-default">
        <span className="mr-[2px] text-rising">*</span>
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`h-[44px] w-full rounded-[7px] border px-[12px] text-[15px] font-medium tracking-[-0.03em] text-tx-default outline-none transition placeholder:text-tx-assistive ${
          error
            ? "border-rising focus:border-rising"
            : "border-line-alt focus:border-fill-primary"
        }`}
      />

      {error && (
        <p className="mt-[6px] text-[13px] font-medium tracking-[-0.03em] text-rising">
          {error}
        </p>
      )}
    </div>
  );
};

export default PersonalSignupPage;
