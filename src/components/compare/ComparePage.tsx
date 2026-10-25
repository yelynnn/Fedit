import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@iconify/react";
import { useCompareStore } from "@/stores/CompareStore";
import { useProductStore } from "@/stores/ProductStore";
import { useUIStore } from "@/stores/UIStore";
import {
  GetCompare,
  GetProductByItemCode,
  type CompareResponse,
} from "@/apis/AnalysisAPI";

// 상품 비교 화면 — 상품 분석 안의 페이지로 열린다(헤더: 상품 분석 > 상품 비교).
// 비교함의 상품으로 GET /products/compare를 불러 그린다.
// 맨 위 "담은 아이템" 행은 items 순서대로(썸네일·브랜드·상품명·가격), 그 아래는
// rows를 받은 순서 그대로 한 표에 그린다. "최고"(best)·"차이"(same=false) 판정은
// 백엔드 값을 그대로 쓰고 다시 계산하지 않는다. 모든 칸이 null인 행은 숨긴다.
// 칸 너비: 왼쪽 항목 160px, 상품 칸 최대 292px — 상품이 적어도 늘이지 않고,
// 화면이 좁아지면(사이드바 펼침 등) 상품 칸이 줄어든다.

const thumbBg =
  "bg-[repeating-conic-gradient(#EDEDED_0_25%,#F7F7F7_0_50%)] bg-[length:8px_8px]";

// 숫자(89000)·문자("89000") 모두 "89,000원"으로
const formatWon = (v: number | string | null | undefined): string | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? `${Math.floor(n).toLocaleString("ko-KR")}원` : String(v);
};

const isEmpty = (v: string | null | undefined) => v === null || v === undefined || v === "";

const isBrandAwareness = (row: { key: string; label: string }) =>
  row.key.startsWith("brand_awareness") || row.label === "브랜드 인지도";

// "1,234개"·"1.2만" 같은 표시 문자열에서 숫자만 꺼낸다(만 단위 포함)
const salesCount = (v: string | null | undefined): number => {
  if (!v) return 0;
  const n = parseFloat(v.replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return /만/.test(v) ? n * 10000 : n;
};

const BestBadge = () => (
  <span className="inline-flex shrink-0 items-center rounded bg-[#FFEDED] px-1.5 py-0.5 text-[12px] font-medium leading-[1.33] text-[#E5484D]">
    최고
  </span>
);

// 왼쪽 항목 칸 — 배경 #F9FAFB, Body(md)/small(14px·500·#3D3F41), 가운데 정렬
const LabelCell = ({ children, tall }: { children: ReactNode; tall?: boolean }) => (
  <div
    className={`flex flex-col items-center justify-center bg-[#F9FAFB] text-center text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-[#3D3F41] ${
      tall ? "min-h-[196px] py-5 pl-5 pr-3" : "min-h-14 px-3 py-2"
    }`}
  >
    {children}
  </div>
);

// 오류 응답에서 문제 상품 코드를 꺼낸다(백엔드가 알려 주는 경우)
const codesFromError = (data: any): string[] => {
  const raw = data?.itemCodes ?? data?.itemcodes ?? data?.itemCode ?? data?.itemcode;
  if (Array.isArray(raw)) return raw.map(String);
  return raw ? [String(raw)] : [];
};

// 오류 응답에 어떤 상품인지 없으면 하나씩 조회해 같은 상태 코드가 나는 상품을 찾는다
const findFailingCodes = async (codes: string[], status: number): Promise<string[]> => {
  const results = await Promise.all(
    codes.map((code) =>
      GetProductByItemCode(code)
        .then(() => null)
        .catch((e: any) => (e?.response?.status === status ? code : null)),
    ),
  );
  return results.filter((c): c is string => c !== null);
};

export default function ComparePage() {
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.remove);
  const removeMany = useCompareStore((s) => s.removeMany);
  const setModalProductId = useProductStore((s) => s.setModalProductId);
  const showNotice = useUIStore((s) => s.showNotice);
  const closePage = useCompareStore((s) => s.closePage);

  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const codes = items.map((i) => i.itemcode);
  const codesKey = codes.join(",");

  // 비교함이 바뀔 때마다(빼기·오류로 빠짐) 남은 상품으로 다시 불러온다
  useEffect(() => {
    const list = codesKey ? codesKey.split(",") : [];
    if (list.length < 2) {
      closePage();
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    GetCompare(list)
      .then((res) => {
        if (requestId === requestIdRef.current) setData(res);
      })
      .catch(async (e: any) => {
        if (requestId !== requestIdRef.current) return;
        const status = e?.response?.status;
        const body = e?.response?.data;
        if (status === 403 && body?.code === "PLATFORM_RESTRICTED") {
          const bad = codesFromError(body);
          const failing = bad.length ? bad : await findFailingCodes(list, 403);
          showNotice("선택한 관심 브랜드 상품만 비교할 수 있어요");
          if (failing.length) return removeMany(failing);
        } else if (status === 404) {
          const bad = codesFromError(body);
          const failing = bad.length ? bad : await findFailingCodes(list, 404);
          showNotice("없어진 상품을 비교함에서 뺐어요");
          if (failing.length) return removeMany(failing);
        } else if (status === 400 && body?.code === "COMPARE_LIMIT_EXCEEDED") {
          showNotice("최대 4개까지 비교할 수 있어요");
        }
        if (requestId === requestIdRef.current) setError(true);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [codesKey, reloadKey, removeMany, showNotice, closePage]);

  // 상품명 → 비교 화면은 그대로 두고 상품 상세 분석 모달을 연다
  const openDetail = (itemcode: string) => {
    setModalProductId(itemcode);
  };

  // 화면에 그릴 행 정리
  // - 가격: 담은 아이템 칸에 이미 있어서 행은 뺀다
  // - 누적 판매: 1 이하(데이터 없을 때 백엔드가 주는 값)는 "-"로
  // - 통합 지수: 모두 "준비 중"이면 행을 뺀다
  // - 모든 칸이 비면 행을 뺀다
  const rows = (data?.rows ?? [])
    .filter((row) => row.key !== "price")
    .map((row) =>
      row.key === "sales"
        ? { ...row, values: row.values.map((v) => (isEmpty(v) || salesCount(v) <= 1 ? null : v)) }
        : row,
    )
    .filter((row) =>
      row.values.some(
        (v) => !isEmpty(v) && !(row.key === "integrated_score" && v === "준비 중"),
      ),
    )
    // 트렌드지수 상세에서 브랜드 인지도만 남으면(상품 단위 지표가 모두 비면) 그것도 뺀다 —
    // 브랜드 단위 값만으로는 상품 비교 의미가 약하다
    .filter((row, _, list) => {
      if (!isBrandAwareness(row)) return true;
      return list.some((r) => r.group === "more" && !isBrandAwareness(r));
    });
  const gridStyle = {
    gridTemplateColumns: `160px repeat(${data?.items.length ?? 0}, minmax(0, 292px))`,
  };
  return (
    <div className="h-full px-16 py-6 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* 제목·뒤로가기·비교 초기화는 상단 헤더(NewHeader)에 있다 */}
        <div className="relative">
          {!data && loading && (
            <div className="flex items-center justify-center gap-2 py-24 text-[14px] text-[#8A8C8E]">
              <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
              비교 정보를 불러오는 중…
            </div>
          )}

          {!data && error && !loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-[14px] text-[#8A8C8E]">
              비교 정보를 불러오지 못했어요.
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="h-[34px] rounded-lg border border-[#E4E4E4] px-3 text-[14px] font-medium text-[#3D3F41] hover:bg-surface-base"
              >
                다시 시도
              </button>
            </div>
          )}

          {data && (
            <div
              className={`w-fit max-w-full overflow-hidden rounded-xl border border-[#E4E4E4] ${
                loading ? "opacity-60" : ""
              }`}
            >
              {/* 담은 아이템 — 썸네일 84px·브랜드·상품명(1줄, 누르면 상세)·가격, 오른쪽 위 X로 빼기 */}
              <div className="grid" style={gridStyle}>
                <LabelCell tall>담은 아이템</LabelCell>
                {data.items.map((item) => {
                  const price = formatWon(item.current_price) ?? formatWon(item.regular_price);
                  return (
                    <div
                      key={item.itemcode}
                      className="relative flex min-h-[196px] min-w-0 flex-col items-start gap-2 border-l border-[#E4E4E4] p-5"
                    >
                      <button
                        type="button"
                        onClick={() => remove(item.itemcode)}
                        aria-label="비교에서 빼기"
                        // 삭제 — 높이 34px, 패딩 8px 12px, 완전 둥근 테두리 #E4E4E4, Body(md)/small #3D3F41
                        className="absolute right-4 top-4 flex h-[34px] items-center justify-center gap-2 rounded-full border border-[#E4E4E4] bg-white px-3 py-2 text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-[#3D3F41] hover:bg-surface-base"
                      >
                        삭제
                      </button>
                      <div className={`h-[84px] w-[84px] shrink-0 overflow-hidden rounded ${thumbBg}`}>
                        {item.thumbnail && <img src={item.thumbnail} alt="" className="object-cover w-full h-full" />}
                      </div>
                      <div className="flex flex-col self-stretch min-w-0 gap-2">
                        <p className="truncate text-[12px] leading-[1.33] text-[#6F7173]">{item.brand || "-"}</p>
                        <button
                          type="button"
                          onClick={() => openDetail(item.itemcode)}
                          title={item.product_name}
                          className="-mt-1 truncate text-left text-[16px] font-semibold leading-[1.5] tracking-[-0.08px] text-[#0B0E0F] hover:underline"
                        >
                          {item.product_name}
                        </button>
                        <p className="text-[14px] font-medium leading-[1.43] tracking-[-0.07px] text-[#3D3F41]">
                          {price ?? "-"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 데이터 행 — 받은 순서 그대로, 칸 높이 56px */}
              {rows.map((row) => (
                <div key={row.key} className="grid border-t border-[#E4E4E4]" style={gridStyle}>
                  <LabelCell>
                    <span className="inline-flex items-center gap-1.5">
                      {row.label}
                      {/* 디자인 행: 상품끼리 값이 다르면 "차이" */}
                      {/* 카테고리는 차이 표시를 하지 않는다 */}
                      {row.same === false && row.key !== "category" && row.label !== "카테고리" && (
                        <span className="rounded bg-[#EEF0FF] px-1.5 py-0.5 text-[11px] font-semibold leading-[1.33] text-[#4F46E5]">
                          차이
                        </span>
                      )}
                    </span>
                  </LabelCell>
                  {data.items.map((item, idx) => {
                    const value = row.values[idx];
                    const isBest = row.best.includes(idx);
                    return (
                      <div
                        key={item.itemcode}
                        // 값은 모두 Title(sb)/medium(16px·600·#0B0E0F) — 같은 값 행도 흐리게 하지 않는다
                        className="flex min-h-14 min-w-0 items-center gap-2 border-l border-[#E4E4E4] px-5 py-2 text-[16px] font-semibold leading-[1.5] tracking-[-0.08px] text-[#0B0E0F]"
                      >
                        <span className="min-w-0 break-keep">
                          {isEmpty(value) ? <span className="font-medium text-[#C4C6C8]">-</span> : value}
                        </span>
                        {isBest && <BestBadge />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
