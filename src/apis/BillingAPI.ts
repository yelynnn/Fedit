import { axiosInstance } from "./AxiosInstance";

// basic_secret은 비밀 링크로 유입된 Basic — 가격만 19,000원으로 다를 뿐
// 기능은 Basic과 완전히 동일하다. 화면 표시/기능 게이팅은 SubscriptionStore의
// toBillingPlan/isBasicPlan을 거쳐 항상 "basic"으로 취급해야 한다.
// PlanType은 자체 결제(PostChangePlan 등)로 실제 전환을 요청할 수 있는
// plan_code만 담는다 — "enterprise"는 영업을 통해서만 얻는 플랜이라 여기
// 포함하지 않는다(전환 시도 시 서버가 400 ENTERPRISE_MANAGED를 낸다).
export type PlanType = "basic" | "pro" | "basic_secret";
// 구독 조회 응답에서 실제로 내려올 수 있는 plan 값. PlanType + "free"(무료
// 체험 등) + "enterprise"(영업을 통해 수동으로 배정되는, 자체 결제 불가한
// 최상위 플랜 — 브랜드 선택·엑셀 다운로드 한도가 없다).
export type SubscriptionPlan = "free" | PlanType | "enterprise";
export type SubscriptionStatus =
  | "not_started"
  // "trial": Basic 기능을 5일간 무료로 쓰는 체험 기간. plan은 "basic"으로
  // 내려오고, 결제로 전환하면 "active"가 된다.
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  amount: number;
  hasBillingKey: boolean;
  nextBillingDate: string | null;
  // status === "trial"일 때 무료 체험이 끝나는 날(ISO). 백엔드가 아직
  // 안 내려주면 nextBillingDate로 폴백한다.
  trialEndsAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  downgradePending?: boolean;
}

const handleError = (error: any, fallbackMessage: string): never => {
  if (error.response) {
    const { data } = error.response;
    throw new Error(data?.message || fallbackMessage);
  }
  throw new Error("서버에 연결할 수 없습니다.");
};

const GetCustomerKey = async (): Promise<string> => {
  try {
    const res = await axiosInstance.get("/billing/customer-key");
    return res.data.customerKey;
  } catch (error: any) {
    return handleError(error, "결제 정보를 불러오지 못했습니다.");
  }
};

const GetSubscription = async (): Promise<Subscription | null> => {
  try {
    const res = await axiosInstance.get("/billing/subscription");
    return res.data ?? null;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    return handleError(error, "구독 정보를 불러오지 못했습니다.");
  }
};

const PostConfirmBilling = async (payload: {
  authKey: string;
  customerKey: string;
  plan: PlanType;
}): Promise<Subscription> => {
  try {
    const res = await axiosInstance.post("/billing/confirm", payload);
    return res.data;
  } catch (error: any) {
    return handleError(error, "결제 등록에 실패했습니다.");
  }
};

const PostChangePlan = async (plan: PlanType): Promise<Subscription> => {
  try {
    const res = await axiosInstance.post("/billing/change-plan", { plan });
    return res.data;
  } catch (error: any) {
    return handleError(error, "요금제 변경에 실패했습니다.");
  }
};

const PostCancelSubscription = async (): Promise<Subscription> => {
  try {
    const res = await axiosInstance.post("/billing/cancel");
    return res.data;
  } catch (error: any) {
    return handleError(error, "구독 해지에 실패했습니다.");
  }
};

// 204 No Content로 응답 — 성공 여부만 확인하고, 실제 상태는 이후
// GetSubscription을 다시 호출해서 반영한다.
const PostStartTrial = async (): Promise<void> => {
  try {
    await axiosInstance.post("/my/subscription/trial");
  } catch (error: any) {
    return handleError(error, "무료체험 시작에 실패했습니다.");
  }
};

export {
  GetCustomerKey,
  GetSubscription,
  PostConfirmBilling,
  PostChangePlan,
  PostCancelSubscription,
  PostStartTrial,
};
