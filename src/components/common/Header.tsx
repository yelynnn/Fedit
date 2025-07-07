import { Icon } from "@iconify/react/dist/iconify.js";
import React from "react";

function Header() {
  return (
    <header className="w-full h-20 bg-[#313036] pl-5 flex items-center gap-2">
      <Icon
        icon="streamline-logos:icq-logo-1"
        color="white"
        className="w-6 h-6"
      />
      <div className="text-base font-bold text-white">FEDIT</div>
    </header>
  );
}

export default Header;
