import { axiosInstance } from "./AxiosInstance";

export interface AdminUpgradeRequest {
  id: number;
  customerEmail: string;
  planCode: "basic" | "pro";
  amount: number;
  depositorName: string;
  requestedAt?: string;
  status?: string;
}

const handleError = (error: any, fallbackMessage: string): never => {
  if (error.response) {
    const { data, status } = error.response;
    if (status === 403) {
      throw new Error(
        data?.message || "관리자 권한이 없는 계정입니다. (NOT_ADMIN)",
      );
    }
    throw new Error(data?.message || fallbackMessage);
  }
  throw new Error("서버에 연결할 수 없습니다.");
};

const GetUpgradeRequests = async (): Promise<AdminUpgradeRequest[]> => {
  try {
    const res = await axiosInstance.get("/admin/upgrade-requests");
    return Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
  } catch (error: any) {
    return handleError(error, "승인 대기 목록을 불러오지 못했습니다.");
  }
};

const PostApproveUpgradeRequest = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/admin/upgrade-requests/${id}/approve`);
  } catch (error: any) {
    return handleError(error, "승인 처리에 실패했습니다.");
  }
};

const PostRejectUpgradeRequest = async (id: number): Promise<void> => {
  try {
    await axiosInstance.post(`/admin/upgrade-requests/${id}/reject`);
  } catch (error: any) {
    return handleError(error, "거절 처리에 실패했습니다.");
  }
};

export { GetUpgradeRequests, PostApproveUpgradeRequest, PostRejectUpgradeRequest };
