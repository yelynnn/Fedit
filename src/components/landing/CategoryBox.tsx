function CategoryBox({ category }: { category: string }) {
  return (
    <div className="flex items-center justify-center py-2 text-2xl font-semibold text-white bg-transparent border border-white rounded-full w-fit px-7">
      {category}
    </div>
  );
}

export default CategoryBox;
