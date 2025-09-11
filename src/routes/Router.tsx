import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import FilterLayout from "./FilterLayout";
import ProductDetailPage from "@/pages/ProductDetailPage";
import RootNewLayout from "./RootNewLayout";

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
]);

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
