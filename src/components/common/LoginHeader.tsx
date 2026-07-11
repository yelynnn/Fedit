import { Link } from "react-router-dom";
import feditLogo from "../../assets/logo/feditLogo.svg";
const LoginHeader = () => {
  return (
    <header className="flex h-[48px] items-center border-b border-line-divider px-[56px]">
      <Link
        to="/"
        className="flex items-center text-[20px] font-semibold tracking-[-0.04em]"
      >
        <img src={feditLogo} alt="FEDIT" className="h-[22px] w-auto" />
      </Link>
    </header>
  );
};

export default LoginHeader;
