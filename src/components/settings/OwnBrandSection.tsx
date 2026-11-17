import { Icon } from "@iconify/react";
import Modal from "react-modal";
import { useEffect, useMemo, useState } from "react";
import { GetBrandList } from "@/apis/AnalysisAPI";
import { PostOwnBrandApply } from "@/apis/OwnBrandAPI";
import { useOwnBrandStore } from "@/stores/OwnBrandStore";

// 설정 > 관심 브랜드 설정의 '자사 브랜드' (2026-11-17). 서버 /brand/own 에 저장한다.
// - 자사 브랜드를 고르면 유형 분석 등에서 자사 맞춤 분석을 보여 준다(OwnBrandInsights).
// - 고르는 범위: Basic·Pro 는 고른 관심 브랜드 안에서, Enterprise 는 전체 브랜드.
// - 목록에 우리 브랜드가 없으면 '자사 브랜드 분석 신청'(/brand/own/apply) — 영업일 1~2일 내 반영.

const MODAL_OVERLAY = "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]";
const MODAL_BOX =
  "box-border flex flex-col w-[560px] max-h-[720px] rounded-2xl border border-[#E4E4E4] bg-white p-8 shadow-[0_0_30px_0_rgba(0,0,0,0.04)] outline-none";

function OwnBrandSelectModal({
  isOpen,
  onClose,
  candidates,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidates: string[];
  onApply: () => void;
}) {
  const { ownBrand, save } = useOwnBrandStore();
  const [picked, setPicked] = useState<string | null>(ownBrand);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPicked(ownBrand);
      setQuery("");
      setError("");
    }
  }, [isOpen, ownBrand]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await save(picked);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? candidates.filter((b) => b.toLowerCase().includes(q)) : candidates;
  }, [candidates, query]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      overlayClassName={MODAL_OVERLAY}
      className={MODAL_BOX}
      shouldCloseOnOverlayClick
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold leading-[133%] tracking-[-0.44px] text-[#0B0E0F]">
          우리 브랜드를 선택해주세요
        </h1>
        <p className="text-[15px] leading-[150%] text-[#6F7173] [word-break:keep-all]">
          선택한 브랜드를 기준으로 자사 맞춤 분석을 보여드려요.
        </p>
      </div>

      {/* 검색창·칩은 관심 브랜드 모달(InterestBrandModal)과 같은 모양 */}
      <div className="flex items-center gap-2 mt-5 h-10 rounded-lg border border-[#E4E4E4] px-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="브랜드를 검색하세요."
          className="flex-1 text-sm outline-none placeholder:text-[#A1A3A5]"
        />
        <Icon icon="mingcute:search-line" className="h-4 w-4 flex-shrink-0 text-[#A1A3A5]" />
      </div>

      <div className="max-h-[320px] mt-3 overflow-y-auto">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm text-tx-alt">찾는 브랜드가 없어요.</p>
            <button
              type="button"
              onClick={onApply}
              className="px-4 py-2 text-sm font-semibold border rounded-lg border-line-divider text-tx-neutral hover:bg-surface-base"
            >
              자사 브랜드 분석 신청
            </button>
          </div>
        ) : (
          // 브랜드가 많아도(Enterprise 는 전체 브랜드) 한눈에 보이게 글자 길이만큼의 작은 칩으로 줄줄이 놓는다
          <div className="flex flex-wrap gap-1.5">
            {list.map((b) => {
              const on = picked === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setPicked(on ? null : b)}
                  className={[
                    "inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    on
                      ? "bg-[#0B0E0F] text-white"
                      : "border border-line-alt bg-fill-bg-strong text-tx-neutral hover:border-[#0B0E0F]",
                  ].join(" ")}
                >
                  {b}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-[#E5484D]">{error}</p>}

      <div className="flex items-center justify-between gap-3 mt-5">
        <button type="button" onClick={onApply} className="text-sm font-medium underline text-tx-alt underline-offset-2">
          목록에 우리 브랜드가 없나요?
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold border rounded-lg border-line-divider text-tx-neutral"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-fill-primary disabled:opacity-40"
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function OwnBrandApplyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setState("idle");
      setError("");
    }
  }, [isOpen]);

  const submit = async () => {
    const brand = name.trim();
    if (!brand) return;
    setState("sending");
    try {
      // 서버가 입점 신청과 같은 테이블에 [자사] 를 붙여 저장한다(월 신청 한도에는 안 셈)
      await PostOwnBrandApply(brand);
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청에 실패했어요.");
      setState("error");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      overlayClassName={MODAL_OVERLAY}
      className={MODAL_BOX}
      shouldCloseOnOverlayClick
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold leading-[133%] tracking-[-0.44px] text-[#0B0E0F]">
          자사 브랜드 분석 신청
        </h1>
        <p className="text-[15px] leading-[150%] text-[#6F7173] [word-break:keep-all]">
          신청하시면 영업일 기준 1~2일 안에 데이터를 수집해 반영해드려요. 반영되면 자사 브랜드로 선택할 수 있어요.
        </p>
      </div>

      {state === "done" ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Icon icon="ph:check-circle-fill" className="w-10 h-10 text-[#1A75FF]" />
          <p className="text-base font-semibold text-tx-strong">신청이 접수됐어요</p>
          <p className="text-sm text-tx-alt">영업일 기준 1~2일 안에 반영해드릴게요.</p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 mt-2 text-sm font-semibold text-white rounded-lg bg-fill-primary"
          >
            확인
          </button>
        </div>
      ) : (
        <>
          <label className="mt-5 text-sm font-semibold text-tx-neutral">브랜드명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="브랜드명을 입력해주세요."
            className="w-full h-11 px-3 mt-2 text-sm border rounded-lg outline-none border-line-divider focus:border-line-alt"
          />
          {state === "error" && <p className="mt-2 text-sm text-[#E5484D]">{error}</p>}
          <div className="flex justify-end gap-2 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold border rounded-lg border-line-divider text-tx-neutral"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!name.trim() || state === "sending"}
              onClick={submit}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg bg-fill-primary disabled:opacity-40"
            >
              {state === "sending" ? "신청 중…" : "신청하기"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** 설정 화면의 자사 브랜드 카드. picks: Basic·Pro 의 관심 브랜드, allBrands=true 면(Enterprise) 전체 브랜드에서 고른다. */
export default function OwnBrandSection({ picks, allBrands = false }: { picks: string[]; allBrands?: boolean }) {
  const { ownBrand, load } = useOwnBrandStore();
  const [selectOpen, setSelectOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [all, setAll] = useState<string[]>([]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!allBrands) return;
    GetBrandList()
      .then((data) => {
        const cats: { brands: string[] }[] = Array.isArray(data?.categories) ? data.categories : [];
        setAll(Array.from(new Set(cats.flatMap((c) => c.brands))).sort((a, b) => a.localeCompare(b, "ko")));
      })
      .catch(() => setAll([]));
  }, [allBrands]);

  const candidates = allBrands ? all : picks;

  return (
    <div className="p-5 mt-4 border border-line-divider rounded-xl">
      <h3 className="text-[18px] font-semibold text-[#3D3F41]">자사 브랜드</h3>
      <p className="mt-1 mb-4 text-sm font-medium text-tx-alt [word-break:keep-all]">
        {allBrands ? "전체 브랜드" : "관심 브랜드"} 중 우리 브랜드를 골라 주세요. 요즘 뜨는 키워드와 우리 상품 비교,
        종류별 판매가 위치 같은 자사 맞춤 분석과 자사 맞춤 리포트를 받아볼 수 있어요.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectOpen(true)}
          className="flex items-center justify-between flex-1 h-11 px-4 text-sm border rounded-lg border-line-divider hover:bg-surface-base"
        >
          <span className={ownBrand ? "font-semibold text-tx-strong" : "text-tx-alt"}>
            {ownBrand ?? "자사 브랜드를 선택해주세요"}
          </span>
          <span className="text-sm font-semibold text-tx-neutral">{ownBrand ? "변경" : "선택하기"}</span>
        </button>
        <button
          type="button"
          onClick={() => setApplyOpen(true)}
          // 흰 선택 칸과 구분되게 회색으로 채운 버튼
          className="h-11 px-4 text-sm font-semibold border rounded-lg shrink-0 border-line-alt bg-fill-bg-strong text-tx-neutral hover:bg-line-alt transition-colors"
        >
          자사 브랜드 분석 신청
        </button>
      </div>

      <OwnBrandSelectModal
        isOpen={selectOpen}
        onClose={() => setSelectOpen(false)}
        candidates={candidates}
        onApply={() => {
          setSelectOpen(false);
          setApplyOpen(true);
        }}
      />
      <OwnBrandApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} />
    </div>
  );
}
