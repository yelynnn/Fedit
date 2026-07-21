import { axiosInstance } from "./AxiosInstance";

// const PostLogin = async (password: string) => {
//   try {
//     const res = await axiosInstance.post("/api/v1/auth/login", { password });
//     return res.data;
//   } catch (error: any) {
//     if (error.response) {
//       const { status, data } = error.response;
//       if (status === 401) {
//         throw new Error("비밀번호가 올바르지 않습니다. 다시 확인해주세요.");
//       } else if (status === 403) {
//         throw new Error("데모 기간이 종료되었습니다.");
//       } else {
//         throw new Error(data?.message || "알 수 없는 오류가 발생했습니다.");
//       }
//     }
//     throw new Error("서버에 연결할 수 없습니다.");
//   }
// };

export interface PersonalSignupBody {
  email: string;
  password: string;
  name: string;
  phone_number: string;
  company_name: string;
  company_size: string;
  job_title: string;
}

const PostPersonalSignup = async (body: PersonalSignupBody) => {
  try {
    const res = await axiosInstance.post("/auth/signup/personal", body);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 400 && data.errors?.length > 0) {
        const messages = (
          data.errors as { field: string; defaultMessage: string }[]
        )
          .map((e) => e.defaultMessage)
          .join("\n");
        throw new Error(messages);
      }
      throw new Error(data?.message || "알 수 없는 오류가 발생했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PostCorporateAuthRequest = async (email: string) => {
  try {
    const res = await axiosInstance.post(
      "/auth/signup/corporate/auth-request",
      { email },
    );
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "알 수 없는 오류가 발생했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PostLogin = async (email: string, password: string) => {
  try {
    const res = await axiosInstance.post("/auth/login", { email, password });
    const { accessToken, refreshToken } = res.data;
    if (accessToken) localStorage.setItem("accessToken", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "로그인에 실패했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PostCorporateSignupConfirm = async (email: string, auth_code: string) => {
  try {
    const res = await axiosInstance.post("/auth/signup/corporate/confirm", {
      email,
      auth_code,
    });
    return res.data as { message: string; ok: boolean };
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "인증에 실패했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PatchChangePassword = async (
  currentPassword: string,
  newPassword: string,
  newPasswordConfirm: string,
) => {
  try {
    const res = await axiosInstance.patch("/my/password", {
      currentPassword,
      newPassword,
      newPasswordConfirm,
    });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "비밀번호 변경에 실패했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const PostLogout = async () => {
  try {
    const res = await axiosInstance.post("/auth/logout");
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "로그아웃에 실패했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

export interface Me {
  name: string;
  email: string;
}

const GetMe = async (): Promise<Me> => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "회원 정보를 불러오지 못했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

const DeleteWithdraw = async (feedback: string[]) => {
  try {
    const res = await axiosInstance.delete("/my/withdraw", {
      data: { feedback },
    });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      const { data } = error.response;
      throw new Error(data?.message || "회원 탈퇴에 실패했습니다.");
    }
    throw new Error("서버에 연결할 수 없습니다.");
  }
};

export {
  PostPersonalSignup,
  PostCorporateAuthRequest,
  PostCorporateSignupConfirm,
  PostLogin,
  PatchChangePassword,
  PostLogout,
  DeleteWithdraw,
  GetMe,
};
