import { axiosInstance } from "./AxiosInstance";

export type UpgradeStatus = "pending" | "completed" | "expired" | "rejected";

export interface RequestUpgradeResponse {
  request_id: number;
}

export interface UpgradeStatusResponse {
  status: UpgradeStatus;
}

const handleError = (error: any, fallbackMessage: string): never => {
  if (error.response) {
    const { data } = error.response;
    throw new Error(data?.message || fallbackMessage);
  }
  throw new Error("서버에 연결할 수 없습니다.");
};

// 카카오페이 코드송금 링크는 백엔드가 동적 발급하지 않는 고정 링크라
// 프론트에서 상수로 들고 있는다 (KAKAO_PAY_LINK_URL, SettingsPage 참고).
// 이 요청은 입금 대사를 위한 요청 건 등록이며, 승인은 관리자가 수동으로 한다.
const RequestUpgrade = async (
  planCode: "basic" | "pro",
  amount: number,
  depositorName: string,
): Promise<RequestUpgradeResponse> => {
  try {
    const res = await axiosInstance.post("/api/upgrade/request", {
      plan_code: planCode,
      amount,
      depositor_name: depositorName,
    });
    return res.data;
  } catch (error: any) {
    return handleError(error, "결제 요청에 실패했습니다.");
  }
};

const GetUpgradeStatus = async (
  requestId: number,
): Promise<UpgradeStatusResponse> => {
  try {
    const res = await axiosInstance.get("/api/upgrade/status", {
      params: { request_id: requestId },
    });
    return res.data;
  } catch (error: any) {
    return handleError(error, "결제 상태 확인에 실패했습니다.");
  }
};

export { RequestUpgrade, GetUpgradeStatus };
