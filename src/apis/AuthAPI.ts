import { axiosInstance } from "./AxiosInstance";

const PostLogin = async (password: string) => {
  try {
    const res = await axiosInstance.post("/api/v1/auth/login", { password });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        throw new Error("비밀번호가 올바르지 않습니다. 다시 확인해주세요.");
      } else if (status === 403) {
        throw new Error("데모 기간이 종료되었습니다.");
      } else {
        throw new Error(data?.message || "알 수 없는 오류가 발생했습니다.");
      }
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

export { PostLogin };
