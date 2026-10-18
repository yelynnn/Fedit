import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  GetExtensionItem,
  GetExtensionSimilar,
  type ExtensionItem,
  type ExtensionSimilarItem,
} from "@/apis/ExtensionAPI";

// 크롬 확장으로 저장한 외부 상품(EXT…) 상세. 일반 상품 상세(ProductDetailContent)와 달리
// 트렌드 지수·판매 정보가 없으므로 원본 정보 + VLM 분석 결과 + FEDIT DB 속 비슷한 상품만 보여준다.

const POLL_MS = 4000;

const won = (n?: number | null) => (n ? `${n.toLocaleString("ko-KR")}원` : null);

function Attr({ title, value }: { title: string; value?: string | null }) {
  if (!value || !value.trim()) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-tx-assistive">{title}</div>
      <div className="text-sm font-medium text-tx-default">{value}</div>
    </div>
  );
}

interface Props {
  itemcode: string;
  onClose: () => void;
  onItemClick?: (itemcode: string) => void;
}

export default function ExtensionItemDetail({ itemcode, onClose, onItemClick }: Props) {
  const [item, setItem] = useState<ExtensionItem | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [similar, setSimilar] = useState<ExtensionSimilarItem[]>([]);

  const pending = item?.status === "queued" || item?.status === "ai_done";

  // 상세 — 분석이 아직 끝나지 않았으면 몇 초마다 다시 조회
  useEffect(() => {
    let canceled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      GetExtensionItem(itemcode)
        .then((res) => {
          if (canceled) return;
          setItem(res);
          setLoadError(false);
          if (res.status === "queued" || res.status === "ai_done") {
            timer = setTimeout(load, POLL_MS);
          }
        })
        .catch(() => {
          if (!canceled) setLoadError(true);
        });
    };
    setItem(null);
    setSimilar([]);
    load();
    return () => {
      canceled = true;
      if (timer) clearTimeout(timer);
    };
  }, [itemcode]);

  // 비슷한 상품 — 분석이 끝난 뒤에만
  const analyzed = item?.status === "indexed" || (item?.status === "ai_done" && !!item.analysis);
  useEffect(() => {
    if (!analyzed) return;
    let canceled = false;
    GetExtensionSimilar(itemcode, 8)
      .then((rows) => {
        if (!canceled) setSimilar(rows);
      })
      .catch(() => {
        if (!canceled) setSimilar([]);
      });
    return () => {
      canceled = true;
    };
  }, [itemcode, analyzed]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-tx-assistive">
        <Icon icon="ph:warning-circle" className="w-10 h-10 mb-3" />
        <p className="text-base font-medium">상품 정보를 불러오지 못했습니다</p>
        <button onClick={onClose} className="mt-4 text-sm underline">
          닫기
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center py-24 text-tx-assistive">불러오는 중...</div>
    );
  }

  const a = item.analysis ?? null;
  const salePrice = won(item.currentPrice);
  const regular = item.regularPrice && item.regularPrice !== item.currentPrice ? won(item.regularPrice) : null;

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={onClose} aria-label="닫기">
          <Icon
            icon="material-symbols:close"
            className="w-6 h-6 transition-colors text-tx-assistive hover:text-black"
          />
        </button>
      </div>

      <section className="flex gap-8">
        <div className="w-[320px] shrink-0 aspect-[3/4] rounded-xl overflow-hidden bg-surface-base">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full bg-line-divider" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {item.brand && (
              <span className="text-sm font-semibold text-tx-neutral">{item.brand}</span>
            )}
            <span className="px-2 py-0.5 rounded bg-line-divider text-[11px] font-semibold text-tx-alt">
              크롬 확장으로 저장
            </span>
          </div>

          <h1 className="mb-4 text-2xl font-semibold leading-tight break-all text-tx-strong">
            {item.productName || "상품명 없음"}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            {regular && (
              <span className="text-sm font-semibold line-through text-tx-assistive">{regular}</span>
            )}
            <span className="text-base font-semibold text-tx-default">{salePrice || "-"}</span>
            {item.productUrl && (
              <>
                <div className="w-[1px] h-4 bg-line-alt" />
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-tx-neutral hover:text-tx-default"
                >
                  {item.platform || "원본"}에서 보기
                  <Icon icon="lucide:external-link" className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>

          {item.status === "failed" ? (
            <div className="px-4 py-3 text-sm rounded-xl bg-rising-bg text-status-error">
              {item.error || "분석에 실패했습니다."} 크롬 확장에서 다시 분석할 수 있어요.
            </div>
          ) : pending && !a ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm rounded-xl bg-surface-base text-tx-neutral">
              <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
              AI가 분석하고 있어요. 잠시 후 자동으로 표시됩니다.
            </div>
          ) : a ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <Attr title="카테고리" value={[a.mainCategory, a.category].filter(Boolean).join(" > ")} />
              <Attr title="색상" value={a.color} />
              <Attr title="소재" value={a.material} />
              <Attr title="기장" value={a.length} />
              <Attr title="소매 길이" value={a.sleeve} />
              <Attr title="넥라인" value={a.neckline} />
              <Attr title="핏" value={a.fit} />
              <Attr title="디테일" value={a.detail} />
              <Attr title="패턴" value={a.pattern} />
              <Attr title="무드" value={a.mood} />
              <Attr title="계절감" value={a.seasonFeel} />
            </div>
          ) : null}
        </div>
      </section>

      {a?.aiDescription && (
        <div className="p-5 mt-6 rounded-xl bg-surface-base">
          <div className="flex items-center gap-1 mb-2 text-sm font-semibold text-tx-default">
            <Icon icon="ph:sparkle" className="w-4 h-4" />
            AI 분석
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-tx-neutral">
            {a.aiDescription}
          </p>
        </div>
      )}

      {similar.length > 0 && (
        <>
          <div className="h-[1px] w-full bg-line-alt my-6" />
          <h2 className="mb-4 text-lg font-semibold text-tx-strong">FEDIT DB 속 비슷한 상품</h2>
          <div className="grid grid-cols-4 gap-4">
            {similar.map((s) => (
              <button
                key={s.itemCode}
                onClick={() => onItemClick?.(s.itemCode)}
                className="text-left group"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface-base mb-2">
                  {s.thumbnail ? (
                    <img
                      src={s.thumbnail}
                      alt=""
                      className="object-cover w-full h-full transition-all group-hover:brightness-90"
                    />
                  ) : (
                    <div className="w-full h-full bg-line-divider" />
                  )}
                </div>
                {s.brand && <div className="text-xs font-semibold text-tx-neutral">{s.brand}</div>}
                {s.product_name && (
                  <div className="text-xs truncate text-tx-default">{s.product_name}</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
