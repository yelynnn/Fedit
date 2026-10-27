import { axiosInstance } from "./AxiosInstance";

// 1:1 문의 — 백엔드(POST /inquiry)가 회원에 연결해 저장하고 슬랙(#6-고객관리)으로 알린다.
// email 을 비우면 서버가 계정 이메일을 회신 주소로 쓴다. 접수 시각은 서버 시각.
const PostInquiry = async (body: {
  type: string;
  content: string;
  email?: string;
}): Promise<void> => {
  try {
    await axiosInstance.post("/inquiry", body);
  } catch (error: any) {
    if (error?.response) {
      throw new Error(
        error.response?.data?.message || "문의 접수에 실패했습니다.",
      );
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

export { PostInquiry };
