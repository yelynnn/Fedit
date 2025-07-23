import type { KeyWordProps } from "@/types/Filter";

const KeyWordBox: React.FC<KeyWordProps> = ({ fit, material, etc }) => {
  return (
    <section
      className="grid w-full grid-cols-3 gap-3 p-3 break-all bg-gray-100 border-2 border-gray-200 rounded h-fit"
      style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
    >
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-[#6A567E] text-base">핏</span>
        {fit?.map((item, index) => (
          <span key={index}>{`${index + 1}. ${item}`}</span>
        ))}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-[#6A567E] text-base">소재</span>
        {material?.map((item, index) => (
          <span key={index}>{`${index + 1}. ${item}`}</span>
        ))}
      </div>
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-semibold text-[#6A567E] text-base">기타</span>
        {etc?.map((item, index) => (
          <span key={index}>{`${index + 1}. ${item}`}</span>
        ))}
      </div>
    </section>
  );
};

export default KeyWordBox;
