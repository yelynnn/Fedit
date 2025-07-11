import TypeBox from "@/components/type/TypeBox";

function TypeAnalysis() {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
      }}
    >
      <TypeBox />
      <TypeBox />
      <TypeBox />
    </div>
  );
}

export default TypeAnalysis;
