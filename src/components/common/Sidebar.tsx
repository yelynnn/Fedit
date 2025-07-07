import { Icon } from "@iconify/react/dist/iconify.js";

function Sidebar() {
  return (
    <nav className="w-14 h-full bg-[#313036] pt-6 flex flex-col items-center gap-3">
      <Icon
        icon="ion:person-circle-outline"
        color="white"
        className="w-7 h-7"
      />
      <Icon icon="ix:alarm-bell" color="white" className="w-7 h-7" />
    </nav>
  );
}

export default Sidebar;
