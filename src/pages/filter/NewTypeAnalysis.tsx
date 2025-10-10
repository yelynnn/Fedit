import TitleHeader from "@/components/common/TitleHeader";
import NewTypeBox from "@/components/type/NewTypeBox";
import { MockNewTypeData } from "@/data/mock/MockNewTypeData";
import { useEffect, useState } from "react";
import { GetCategoryGraph } from "@/apis/AnalysisAPI";
import PasswordModal from "@/components/main/PasswordModal";
import { isAxiosError } from "axios";

type TypeBlock = (typeof MockNewTypeData)[number];

function NewTypeAnalysis() {
  const [blocks, setBlocks] = useState<TypeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await GetCategoryGraph();
        console.log("유형 그래프 응답:", res);

        const list = (
          Array.isArray(res)
            ? res
            : res?.brands ?? res?.items ?? res?.data ?? []
        ) as TypeBlock[];

        setBlocks(list);
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 401) {
          setPasswordModalOpen(true);
          return;
        }
        console.error("유형 그래프 불러오기 실패:", e);
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="mt-14">
      <TitleHeader
        title="유형 분석"
        sub_title="최근 주목받는 상품 유형과 연관 키워드를 탐색해보세요."
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
      <div
        className="grid justify-start gap-6 mt-8"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(430px, max-content))",
        }}
      >
        {loading && (
          <div className="px-1 text-sm text-gray-500">불러오는 중…</div>
        )}
        {!loading && blocks.length === 0 && (
          <div className="px-1 text-sm text-gray-500">
            표시할 데이터가 없어요.
          </div>
        )}
        {!loading &&
          blocks.map((block) => <NewTypeBox key={block.brand} block={block} />)}
      </div>
    </div>
  );
}

export default NewTypeAnalysis;
