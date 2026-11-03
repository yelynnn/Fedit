import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GetCustomerReviews } from "@/apis/CustomerAnalysisAPI";
import type {
  CustomerCategory,
  CustomerPeriod,
  CustomerPlatformFilter,
  CustomerReview,
  CustomerSummary,
  ReviewFilter,
  ReviewSort,
} from "@/types/CustomerAnalysis";
import { Card, EmptyText, ErrorBox, LoadingBox, NegTag, ProductThumb, Segmented } from "./CustomerUI";
import { CATEGORIES, fmtNum, fmtPct, pct } from "./customerFormat";

const PAGE_SIZE = 10;
const ALL_PRODUCTS = "__all__";

function Stars({ grade }: { grade: number }) {
  return (
    <span className="inline-flex items-center" aria-label={`${grade}점`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          icon="ph:star-fill"
          className={`h-3.5 w-3.5 ${i <= grade ? "text-[var(--palette-orange-50)]" : "text-fill-inactive"}`}
        />
      ))}
    </span>
  );
}

function ReviewRow({ review }: { review: CustomerReview }) {
  const meta = [
    review.height != null ? `${review.height}cm` : null,
    review.weight != null ? `${review.weight}kg` : null,
    review.likes > 0 ? `도움돼요 ${fmtNum(review.likes)}` : null,
    review.date,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="flex gap-3 py-4 border-b border-line-divider last:border-b-0">
      <ProductThumb src={review.productImage} className="w-12 h-12" />
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <div className="flex items-center min-w-0 gap-2">
          <span className="truncate text-[13px] font-medium text-tx-neutral" title={review.product}>
            {review.product}
          </span>
          {review.grade <= 3 && <NegTag />}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-tx-alt">
          <Stars grade={review.grade} />
          <span className="font-semibold text-tx-neutral">{review.grade}</span>
        </div>
        <p className="text-[14px] leading-[1.6] text-tx-default whitespace-pre-line break-words">
          {review.body}
        </p>
        <p className="text-[12px] text-tx-assistive">{meta}</p>
      </div>
    </li>
  );
}

function ReviewListCard({
  brandId,
  period,
  platform,
  summary,
}: {
  brandId: string;
  period: CustomerPeriod;
  platform: CustomerPlatformFilter;
  summary: CustomerSummary;
}) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [sort, setSort] = useState<ReviewSort>("new");
  const [product, setProduct] = useState("");
  const [items, setItems] = useState<CustomerReview[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestRef = useRef(0);

  // 기준 브랜드·기간·플랫폼이 바뀌면 상품 필터를 비운다
  const scopeKey = `${brandId}|${period}|${platform}`;
  const [prevScope, setPrevScope] = useState(scopeKey);
  if (prevScope !== scopeKey) {
    setPrevScope(scopeKey);
    setProduct("");
  }

  const load = async (nextPage: number) => {
    const id = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await GetCustomerReviews(brandId, {
        period,
        platform,
        filter,
        sort,
        product: product || undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });
      if (id !== requestRef.current) return;
      setItems((prev) => (nextPage === 0 ? res.items : [...prev, ...res.items]));
      setProducts(res.products);
      setTotal(res.total);
      setPage(nextPage);
    } catch (e: any) {
      if (id !== requestRef.current) return;
      setError(e?.message || "리뷰를 불러오지 못했어요.");
      if (nextPage === 0) setItems([]);
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId, period, platform, filter, sort, product, reloadKey]);

  const hasMore = items.length < total;

  return (
    <Card className="flex flex-col lg:h-0 lg:min-h-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { value: "all", label: `전체 ${fmtNum(summary.reviews)}` },
              { value: "neg", label: `불만 ${fmtNum(summary.neg)}` },
            ] as { value: ReviewFilter; label: string }[]
          ).map((o) => {
            const active = filter === o.value;
            return (
              <button
                key={o.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(o.value)}
                className={`h-8 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "border-fill-primary bg-fill-primary text-tx-inverse"
                    : "border-line-alt bg-white text-tx-neutral hover:bg-surface-base"
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center min-w-0 gap-2">
          <Segmented
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "new", label: "최신순" },
              { value: "like", label: "도움순" },
            ]}
          />
          <Select
            value={product || ALL_PRODUCTS}
            onValueChange={(v) => setProduct(v === ALL_PRODUCTS ? "" : v)}
          >
            <SelectTrigger
              aria-label="상품"
              className="h-8 w-[180px] max-w-full rounded-lg border-line-alt bg-white text-[13px] font-medium text-tx-neutral shadow-none focus:ring-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] max-w-[320px] overflow-y-auto rounded-xl border-line-divider">
              <SelectItem value={ALL_PRODUCTS}>전체 상품</SelectItem>
              {products.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <LoadingBox label="리뷰를 불러오는 중…" />
      ) : error && items.length === 0 ? (
        <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : items.length === 0 ? (
        <EmptyText>표시할 리뷰가 없어요.</EmptyText>
      ) : (
        <>
          {/* 박스 안에서 스크롤하며 전체 리뷰를 본다. 바닥에 가까워지면 다음 페이지를 이어 붙인다. */}
          <div
            className="max-h-[720px] overflow-y-auto pr-1 -mr-1 lg:max-h-none lg:min-h-0 lg:flex-1"
            onScroll={(e) => {
              const el = e.currentTarget;
              if (hasMore && !loading && el.scrollTop + el.clientHeight >= el.scrollHeight - 120) load(page + 1);
            }}
          >
            <ul>
              {items.map((r, i) => (
                <ReviewRow key={`${r.date}-${r.product}-${i}`} review={r} />
              ))}
            </ul>
            {loading && <p className="py-3 text-center text-[12px] text-tx-assistive">불러오는 중…</p>}
          </div>
          {error && items.length > 0 && (
            <p className="mt-2 text-center text-[12px] text-rising">{error}</p>
          )}
        </>
      )}
    </Card>
  );
}

function RatingDistCard({ summary }: { summary: CustomerSummary }) {
  const keys = ["5", "4", "3", "2", "1"] as const;
  const sum = keys.reduce((s, k) => s + (summary.dist[k] ?? 0), 0);
  return (
    <Card title="평점 분포">
      <ul className="flex flex-col gap-2">
        {keys.map((k) => {
          const v = pct(summary.dist[k] ?? 0, sum);
          const warn = k === "1" || k === "2";
          return (
            <li key={k} className="flex items-center gap-3 text-[13px]">
              <span className="w-7 shrink-0 text-tx-neutral">{k}점</span>
              <span className="relative flex-1 h-2 overflow-hidden rounded-full bg-surface-base">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${warn ? "bg-rising" : "bg-fill-primary"}`}
                  style={{ width: `${v}%` }}
                />
              </span>
              <span className={`w-12 shrink-0 text-right ${warn && v > 0 ? "text-rising" : "text-tx-alt"}`}>
                {fmtPct(v)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function KeywordCard({ summary }: { summary: CustomerSummary }) {
  const complaints = summary.complaints.slice(0, 3);
  return (
    <Card title="리뷰 키워드">
      <div className="flex flex-wrap gap-1.5">
        {summary.keywords.map((k) => (
          <span
            key={k.name}
            className="rounded-full px-2.5 py-1 text-[12px] font-medium bg-[var(--palette-green-95)] text-[var(--palette-green-30)]"
          >
            {k.name} {fmtNum(k.count)}
          </span>
        ))}
        {complaints.map((k) => (
          <span
            key={`neg-${k.name}`}
            className="rounded-full px-2.5 py-1 text-[12px] font-medium bg-rising-bg text-rising"
          >
            {k.name} {fmtNum(k.count)}
          </span>
        ))}
      </div>
      {complaints.length > 0 && (
        <p className="mt-3 text-[12px] text-tx-assistive">빨간색은 자주 나온 불만 상위 3개예요.</p>
      )}
    </Card>
  );
}

function SurveyCard({ summary }: { summary: CustomerSummary }) {
  const [category, setCategory] = useState<CustomerCategory>("상의");
  const rows = summary.survey[category] ?? [];
  return (
    <Card
      title="속성별 만족도"
      right={
        <Segmented
          size="sm"
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      }
    >
      {rows.length === 0 ? (
        <EmptyText>응답이 아직 없어요.</EmptyText>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <li key={r.attr} className="flex items-center gap-3 text-[13px]">
              <span className="w-12 shrink-0 text-tx-neutral">{r.attr}</span>
              <span className="relative flex-1 h-2 min-w-[40px] overflow-hidden rounded-full bg-surface-base">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-fill-primary"
                  style={{ width: `${Math.min(100, r.pct)}%` }}
                />
              </span>
              <span className="shrink-0 whitespace-nowrap text-tx-alt">
                {r.top} {fmtPct(r.pct)} · {fmtNum(r.n)}건
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function CustomerReviewSection(props: {
  brandId: string;
  period: CustomerPeriod;
  platform: CustomerPlatformFilter;
  summary: CustomerSummary;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[18px] font-semibold text-tx-default">리뷰</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <ReviewListCard {...props} />
        <div className="flex flex-col min-w-0 gap-4">
          <RatingDistCard summary={props.summary} />
          <KeywordCard summary={props.summary} />
          <SurveyCard summary={props.summary} />
        </div>
      </div>
    </section>
  );
}
