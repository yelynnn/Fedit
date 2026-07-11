import { loadTossPayments, type TossPaymentsSDK } from "@tosspayments/tosspayments-sdk";

const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string;

let tossPaymentsPromise: Promise<TossPaymentsSDK> | null = null;

const getTossPayments = () => {
  if (!tossPaymentsPromise) {
    tossPaymentsPromise = loadTossPayments(clientKey);
  }
  return tossPaymentsPromise;
};

export { getTossPayments };
