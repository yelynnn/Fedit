import { useState } from "react";
import { Icon } from "@iconify/react";
import { PatchChangePassword } from "@/apis/AuthAPI";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type FieldErrors = {
  current?: string;
  new?: string;
  confirm?: string;
};

function inputClass(hasError: boolean) {
  return [
    "flex h-[46px] min-h-[46px] max-h-[180px] items-center gap-3 self-stretch rounded-md border bg-fill-bg px-3 outline-none type-body-medium text-tx-strong placeholder:text-tx-assistive placeholder:truncate",
    hasError ? "border-status-error" : "border-line-alt",
  ].join(" ");
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col w-full gap-1.5">
      <label className="type-title-small text-tx-alt">{label}</label>
      <input
        type="password"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass(!!error)}
        disabled={disabled}
      />
      {error && (
        <p className="flex items-center gap-1 type-label-xsmall text-status-error">
          <Icon icon="material-symbols:error-rounded" className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextErrors: FieldErrors = {};
    if (!currentPassword) {
      nextErrors.current = "기존 비밀번호를 입력해주세요.";
    }
    if (!newPassword) {
      nextErrors.new = "새 비밀번호를 입력해주세요.";
    } else if (newPassword.length < 8) {
      nextErrors.new = "영문, 숫자를 포함해 8자 이상 입력해주세요.";
    }
    if (!confirmPassword) {
      nextErrors.confirm = "새 비밀번호를 다시 입력해주세요.";
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirm = "새 비밀번호가 일치하지 않습니다.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await PatchChangePassword(currentPassword, newPassword, confirmPassword);
      handleClose();
    } catch (err: any) {
      setErrors({
        current: err?.message || "비밀번호 변경에 실패했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        className="relative flex w-[420px] flex-col items-center gap-4 rounded-xl bg-surface-modal p-6"
        style={{ boxShadow: "0 12px 32px 0 rgba(0, 0, 0, 0.18)" }}
      >
        <button
          onClick={handleClose}
          className="absolute flex items-center justify-center w-7 h-7 p-1 transition-colors border rounded-pill top-5 right-5 border-line-alt bg-fill-bg hover:bg-surface-base text-tx-alt hover:text-tx-strong"
        >
          <Icon icon="material-symbols:close" className="w-5 h-5" />
        </button>

        <Icon icon="ph:key" className="mt-10 text-3xl text-tx-strong" />

        <h2 className="type-title-large text-tx-strong text-center">
          비밀번호 변경
        </h2>
        <p className="type-body-small text-tx-alt text-center -mt-2">
          새로 사용할 비밀번호를 입력하세요.
          <br />
          영문·숫자·특수문자를 포함해 8자 이상을 권장합니다.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
          <Field
            label="기존 비밀번호"
            placeholder="기존 비밀번호 입력"
            value={currentPassword}
            onChange={(v) => {
              setCurrentPassword(v);
              if (errors.current) setErrors((prev) => ({ ...prev, current: undefined }));
            }}
            error={errors.current}
            disabled={isSubmitting}
          />

          <Field
            label="새 비밀번호"
            placeholder="새 비밀번호 입력"
            value={newPassword}
            onChange={(v) => {
              setNewPassword(v);
              if (errors.new) setErrors((prev) => ({ ...prev, new: undefined }));
            }}
            error={errors.new}
            disabled={isSubmitting}
          />

          <Field
            label="새 비밀번호 확인"
            placeholder="새 비밀번호 다시 한번 입력"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            error={errors.confirm}
            disabled={isSubmitting}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-[46px] items-center justify-center gap-1 self-stretch rounded-md bg-fill-primary px-3 py-2 type-title-medium text-tx-inverse disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "변경 중..." : "비밀번호 설정"}
          </button>
        </form>
      </div>
    </div>
  );
}
