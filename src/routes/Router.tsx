import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import FilterLayout from "./FilterLayout";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RootNewLayout from "./RootNewLayout";
import AskPage from "@/pages/AskPage";
import AskSuccessPage from "@/pages/AskSuccessPage";
import LoginPage from "@/pages/Auth/LoginPage";
import SignupSelectPage from "@/pages/Auth/SignupSelectPage";
import CompanySignupPage from "@/pages/Auth/CompanySignupPage";
import PersonalSignupPage from "@/pages/Auth/PersonalSignupPage";
import NextSignupPage from "@/pages/Auth/NextSignupPage";
import CorporateVerifyPage from "@/pages/Auth/CorporateVerifyPage";
import TermsOfServicePage from "@/pages/Auth/TermsOfServicePage";
import CancellationTermsPage from "@/pages/Auth/CancellationTermsPage";
import PrivacyPolicyPage from "@/pages/Auth/PrivacyPolicyPage";
import PrivacyPolicy20260714Page from "@/pages/Auth/PrivacyPolicy20260714Page";
import BillingSuccessPage from "@/pages/BillingSuccessPage";
import BillingFailPage from "@/pages/BillingFailPage";
import KakaoUpgradeAdminPage from "@/pages/admin/KakaoUpgradeAdminPage";
import ProtectedRoute from "./ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/beta",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FilterLayout />,
      },
      {
        path: "product/:id",
        element: <ProductDetailPage />,
      },
    ],
  },
  {
    path: "/",
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <RootNewLayout />,
          },
        ],
      },
      {
        path: "ask",
        element: <AskPage />,
      },
      {
        path: "success",
        element: <AskSuccessPage />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "signup",
        element: <SignupSelectPage />,
      },
      {
        path: "/signup/personal",
        element: <PersonalSignupPage />,
      },
      {
        path: "/signup/personal/next",
        element: <NextSignupPage />,
      },

      {
        path: "/signup/company",
        element: <CompanySignupPage />,
      },
      {
        path: "/signup/company/verify",
        element: <CorporateVerifyPage />,
      },
      {
        path: "/terms",
        element: <TermsOfServicePage />,
      },
      {
        path: "/terms/cancellation",
        element: <CancellationTermsPage />,
      },
      {
        path: "/privacy",
        element: <PrivacyPolicyPage />,
      },
      {
        // 이전 버전 개인정보처리방침(개정 이력)
        path: "/privacy/2026-07-14",
        element: <PrivacyPolicy20260714Page />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "billing/success",
            element: <BillingSuccessPage />,
          },
          {
            path: "billing/fail",
            element: <BillingFailPage />,
          },
          {
            path: "admin/kakao-upgrades",
            element: <KakaoUpgradeAdminPage />,
          },
        ],
      },
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
