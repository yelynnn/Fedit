function CategoryBox({ category }: { category: string }) {
  return (
    <div className="flex items-center justify-center px-5 py-2 font-semibold text-white bg-transparent border border-white rounded-full md:text-2xl w-fit md:px-7">
      {category}
    </div>
  );
}

export default CategoryBox;
