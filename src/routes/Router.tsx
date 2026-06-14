import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import FilterLayout from "./FilterLayout";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RootNewLayout from "./RootNewLayout";
import LandingPage from "@/pages/LandingPage";
import AskPage from "@/pages/AskPage";
import AskSuccessPage from "@/pages/AskSuccessPage";
import LoginPage from "@/pages/Auth/LoginPage";
import SignupSelectPage from "@/pages/Auth/SignupSelectPage";
import CompanySignupPage from "@/pages/Auth/CompanySignupPage";
import PersonalSignupPage from "@/pages/Auth/PersonalSignupPage";
import NextSignupPage from "@/pages/Auth/NextSignupPage";
import CorporateVerifyPage from "@/pages/Auth/CorporateVerifyPage";
import TermsOfServicePage from "@/pages/Auth/TermsOfServicePage";
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
    path: "/main",
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <RootNewLayout />,
      },
    ],
  },
  {
    path: "/",
    children: [
      {
        index: true,
        element: <LandingPage />,
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
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
