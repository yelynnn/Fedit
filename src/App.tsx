import "./App.css";
import Router from "./routes/Router";
import { useEffect } from "react";
import Modal from "react-modal";
import ProductDetailModal from "@/components/product/ProductDetailModal";

function App() {
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
