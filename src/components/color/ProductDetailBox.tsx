const Colors = ["#A02072", "#91C7BD", "#F2D993"];

function ProductDetailBox() {
  return (
    <section className="flex justify-between w-full h-22">
      <div className="h-full bg-blue-200 mr-17 w-21" />
      <div className="flex flex-col justify-between pr-8 text-sm font-bold w-47 ">
        <span className="line-clamp-1">밴딩 트레이닝 쇼츠 블랙</span>
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span>색상</span>
            <div className="flex gap-2">
              {Colors.map((color, idx) => (
                <div
                  key={idx}
                  className="w-4 h-4 border rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span>소재</span>
            <span className="font-normal line-clamp-1">나일론 80%</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProductDetailBox;
