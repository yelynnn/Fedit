import "./App.css";
import Router from "./routes/Router";
import { useEffect } from "react";
import Modal from "react-modal";
import ProductDetailModal from "@/components/product/ProductDetailModal";
import { useDeepLink } from "@/lib/deepLink";

function App() {
  useDeepLink();
  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  return (
    <>
      <Router />
      <ProductDetailModal />
    </>
  );
}

export default App;
