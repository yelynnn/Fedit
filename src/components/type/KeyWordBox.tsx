import type { KeyWordProps } from "@/types/Filter";

const KeyWordBox: React.FC<KeyWordProps> = ({ fit, material, etc }) => {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div>
        <div className="mb-3 font-semibold text-[#2563EB] text-sm">핏</div>
        {(fit ?? []).slice(0, 3).map((v, i) => (
          <div key={i} className="text-[#374151] text-xs mb-3">
            <span className="mr-2 text-[#2563EB]">{i + 1}위</span>
            {v}
          </div>
        ))}
      </div>
      <div>
        <div className="mb-3 font-semibold text-[#2563EB] text-sm ">소재</div>
        {(material ?? []).slice(0, 3).map((v, i) => (
          <div key={i} className="text-[#374151] text-xs mb-3 ">
            <span className="mr-2 text-[#2563EB]">{i + 1}위</span>
            {v}
          </div>
        ))}
      </div>
      <div>
        <div className="mb-2 font-semibold text-[#2563EB] text-sm">기타</div>
        {(etc ?? []).slice(0, 3).map((v, i) => (
          <div key={i} className="text-[#374151] text-xs mb-3 ">
            <span className="mr-2 text-[#2563EB]">{i + 1}위</span>
            {v}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyWordBox;
