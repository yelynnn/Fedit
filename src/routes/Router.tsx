import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import FilterLayout from "./FilterLayout";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RootNewLayout from "./RootNewLayout";
import LandingPage from "@/pages/LandingPage";
import AskPage from "@/pages/AskPage";
import AskSuccessPage from "@/pages/AskSuccessPage";

const router = createBrowserRouter([
  {
    path: "/main",
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
    element: <RootNewLayout />,
    children: [
      // {
      //   index: true,
      //   element: <FilterLayout />,
      // },
      // {
      //   path: "product/:id",
      //   element: <ProductDetailPage />,
      // },
    ],
  },
  {
    path: "/",
    children: [
      {
        path: "landing",
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
    ],
  },
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
