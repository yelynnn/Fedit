import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import {
  GetUpgradeRequests,
  PostApproveUpgradeRequest,
  PostRejectUpgradeRequest,
  type AdminUpgradeRequest,
} from "@/apis/AdminAPI";

const PLAN_LABEL: Record<string, string> = { basic: "Basic", pro: "Pro" };

function formatDate(value?: string) {
  if (!value) return "-";
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY.MM.DD HH:mm") : value;
}

export default function KakaoUpgradeAdminPage() {
  const [requests, setRequests] = useState<AdminUpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 승인/거절 처리 중인 요청 id — 중복 클릭 방지 및 버튼 로딩 표시용
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = () => {
    setLoading(true);
    setError(null);
    GetUpgradeRequests()
      .then(setRequests)
      .catch((e: any) => setError(e?.message || "목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (req: AdminUpgradeRequest) => {
    if (processingId) return;
    const ok = window.confirm(
      `카카오페이 앱에서 아래 입금 내역을 실제로 확인하셨나요?\n\n` +
        `입금자명: ${req.depositorName}\n금액: ${req.amount.toLocaleString("ko-KR")}원\n\n` +
        `확인했다면 승인합니다. 승인 즉시 ${req.customerEmail} 계정의 구독이 반영됩니다.`,
    );
    if (!ok) return;
    setProcessingId(req.id);
    try {
      await PostApproveUpgradeRequest(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e: any) {
      alert(e?.message || "승인 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: AdminUpgradeRequest) => {
    if (processingId) return;
    const ok = window.confirm(
      `${req.customerEmail} 요청을 거절할까요?\n입금 확인이 안 됐거나 금액이 맞지 않는 경우에만 거절해주세요.`,
    );
    if (!ok) return;
    setProcessingId(req.id);
    try {
      await PostRejectUpgradeRequest(req.id);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    } catch (e: any) {
      alert(e?.message || "거절 처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen px-8 py-10 mx-auto max-w-[960px]">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold text-tx-strong">
          카카오페이 입금 승인
        </h1>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border rounded-lg border-line-divider text-tx-neutral hover:bg-surface-base disabled:opacity-50"
        >
          <Icon
            icon="ph:arrow-clockwise"
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          새로고침
        </button>
      </div>
      <p className="mb-6 text-sm text-tx-alt">
        카카오페이 앱에서 실제 입금 내역을 입금자명·금액과 대조한 뒤 승인해주세요.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-tx-assistive">
          불러오는 중...
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <Icon icon="ph:warning-circle" className="w-8 h-8 text-status-error" />
          <p className="text-sm font-medium text-status-error">{error}</p>
          <p className="text-xs text-tx-assistive">
            ADMIN_EMAILS에 등록된 계정으로 로그인했는지 확인해주세요.
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-tx-assistive">
          <Icon icon="ph:tray" className="w-12 h-12 mb-3" />
          <p className="text-base font-medium">대기 중인 요청이 없어요</p>
        </div>
      ) : (
        <div className="overflow-hidden border rounded-xl border-line-divider">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-base text-tx-assistive">
              <tr>
                <th className="px-4 py-3 font-semibold">고객 이메일</th>
                <th className="px-4 py-3 font-semibold">플랜</th>
                <th className="px-4 py-3 font-semibold">금액</th>
                <th className="px-4 py-3 font-semibold">입금자명</th>
                <th className="px-4 py-3 font-semibold">요청일시</th>
                <th className="px-4 py-3 font-semibold text-right">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-divider">
              {requests.map((req) => {
                const isProcessing = processingId === req.id;
                return (
                  <tr key={req.id}>
                    <td className="px-4 py-3 font-medium text-tx-strong">
                      {req.customerEmail}
                    </td>
                    <td className="px-4 py-3 text-tx-neutral">
                      {PLAN_LABEL[req.planCode] ?? req.planCode}
                    </td>
                    <td className="px-4 py-3 text-tx-neutral">
                      {req.amount.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-4 py-3 text-tx-neutral">
                      {req.depositorName}
                    </td>
                    <td className="px-4 py-3 text-tx-assistive">
                      {formatDate(req.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleReject(req)}
                          disabled={processingId !== null}
                          className="px-3 py-1.5 text-xs font-semibold border rounded-lg border-[#FEE4E2] text-status-error hover:bg-rising-bg disabled:opacity-50"
                        >
                          거절
                        </button>
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={processingId !== null}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-lg bg-fill-primary hover:bg-black disabled:opacity-50"
                        >
                          {isProcessing && (
                            <Icon
                              icon="ph:spinner-gap"
                              className="w-3.5 h-3.5 animate-spin"
                            />
                          )}
                          승인
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
