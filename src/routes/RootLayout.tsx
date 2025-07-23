import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import { Outlet } from "react-router-dom";

function RootLayout() {
  return (
    <div className="flex w-screen h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default RootLayout;
