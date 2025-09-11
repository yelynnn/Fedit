import "./App.css";
import Router from "./routes/Router";
import { useEffect } from "react";
import Modal from "react-modal";

function App() {
  useEffect(() => {
    Modal.setAppElement("#root");
  }, []);

  return (
    <>
      <Router />
    </>
  );
}

export default App;
