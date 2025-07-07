import ColorBox from "@/components/color/ColorBox";

function ColorAnalysis() {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
      }}
    >
      <ColorBox />
      <ColorBox />
      <ColorBox />
      <ColorBox />
    </div>
  );
}

export default ColorAnalysis;
