import { useEffect, useRef, useState } from "react";
import { GetCustomerCross } from "@/apis/CustomerAnalysisAPI";
import type {
  CustomerCategory,
  CrossTopRow,
  CustomerCross,
  CustomerGenderFilter,
  CustomerPeriod,
  CustomerPlatformFilter,
} from "@/types/CustomerAnalysis";
import { Card, EmptyText, ErrorBox, LoadingBox, ProductThumb, Segmented } from "./CustomerUI";
import {
  CATEGORIES,
  PLATFORM_LABELS,
  fmtNum,
  fmtPct,
  genderPrefix,
  objectParticle,
  pct,
} from "./customerFormat";

/** 구매 브랜드 막대 한 줄 — 값 칸은 내용만큼 넓어지고 줄바꿈하지 않아 막대와 겹치지 않는다 */
function BrandBarRow({
  label,
  n,
  total,
  accent = false,
  tag,
}: {
  label: string;
  n: number;
  total: number;
  accent?: boolean;
  /** 이름 뒤 작은 회색 글자(묶음에서 고른 브랜드면 "선택") */
  tag?: string;
}) {
  const v = pct(n, total);
  return (
    <li className="contents">
      <span
        className={`truncate text-[13px] ${accent ? "font-semibold text-[var(--palette-violet-50)]" : "text-tx-neutral"}`}
        title={label}
      >
        {label}
        {tag && <span className="ml-1 text-[11px] font-normal text-tx-assistive">{tag}</span>}
      </span>
      <span className="relative h-2.5 min-w-[40px] overflow-hidden rounded-full bg-surface-base">
        {n > 0 && (
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${accent ? "bg-[var(--palette-violet-50)]" : "bg-fill-primary"}`}
            style={{ width: `${v}%` }}
          />
        )}
      </span>
      <span className="flex items-center justify-end gap-1.5 whitespace-nowrap text-[13px] text-tx-alt">
        {n === 0 ? (
          <>
            <b className="font-semibold text-tx-neutral">0%</b> · 미포착
          </>
        ) : (
          <>
            <b className="font-semibold text-tx-strong">{fmtPct(v)}</b> · {fmtNum(n)}명
          </>
        )}
      </span>
    </li>
  );
}

function CrossBody({
  brandName,
  cross,
  gender,
  category,
}: {
  brandName: string;
  cross: CustomerCross;
  gender: CustomerGenderFilter;
  category: CustomerCategory;
}) {
  const gp = genderPrefix(gender);
  const platformLabel = PLATFORM_LABELS[cross.platform];

  if (cross.cross === 0) {
    return (
      <div className="rounded-xl border border-[var(--palette-orange-90)] bg-[var(--palette-orange-95)] p-5">
        <p className="text-[14px] font-semibold text-[var(--palette-orange-30)]">
          {platformLabel}에서 다른 브랜드도 산 {gp}고객이 아직 없어요.
        </p>
        <p className="mt-1 text-[13px] leading-[1.6] text-[var(--palette-orange-30)]">
          {brandName} {gp}고객 {fmtNum(cross.reviewers)}명의 리뷰 이력에서 다른 브랜드 구매가 잡히지 않았어요.
          기간을 늘리면 결과가 나올 수 있어요.
        </p>
      </div>
    );
  }

  const topItems = cross.top.slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card
          title={
            <>
              {category} 구매 브랜드{" "}
              <span className="text-[12px] font-medium text-tx-assistive">구매 고객 비율</span>
            </>
          }
        >
          <p className="-mt-2 mb-4 text-[13px] leading-[1.6] text-tx-alt">
            {brandName} {gp}고객 {fmtNum(cross.reviewers)}명 중 {platformLabel}의 각 브랜드에서 {category}
            {objectParticle(category)} 산 고객 비율이에요.
          </p>
          <ul className="grid grid-cols-[minmax(0,max-content)_minmax(40px,1fr)_max-content] items-center gap-x-3 gap-y-2.5">
            {cross.brands.map((b) => (
              <BrandBarRow
                key={b.brand}
                label={b.brand}
                n={b.n}
                total={cross.reviewers}
                tag={b.pinned ? "선택" : undefined}
              />
            ))}
            <BrandBarRow
              label={`${brandName} ${category}`}
              n={cross.self}
              total={cross.reviewers}
              accent
            />
          </ul>
          <p className="mt-4 text-[12px] text-tx-assistive">
            보라색은 비교용으로, {brandName} {category}
            {objectParticle(category)} 산 고객이에요.
          </p>
        </Card>

        <Card title={`${category} 종류별 구매율 · 선호 키워드`}>
          <p className="-mt-2 mb-4 text-[13px] leading-[1.6] text-tx-alt">
            다른 브랜드에서 산 {category}를 종류별로 나눴어요. 오른쪽은 상품명에 자주 나온 단어예요.
          </p>
          {cross.kinds.length === 0 ? (
            <EmptyText>아직 잡힌 구매가 없어요.</EmptyText>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line-divider text-[12px] text-tx-alt">
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">종류</th>
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">구매자</th>
                    <th className="py-2 font-medium">상품명에 많이 나온 특징</th>
                  </tr>
                </thead>
                <tbody>
                  {cross.kinds.map((k) => (
                    <tr key={k.kind} className="border-b border-line-divider last:border-b-0">
                      <td className="py-2.5 pr-3 font-medium text-tx-neutral whitespace-nowrap">{k.kind}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-tx-alt">
                        <span className="inline-flex items-center gap-1.5">
                          <b className="font-semibold text-tx-strong">{fmtPct(pct(k.n, cross.reviewers))}</b>
                          · {fmtNum(k.n)}명
                        </span>
                      </td>
                      <td className="py-2.5 text-tx-alt break-keep">{k.keywords.join(" · ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card
        title={
          <>
            많이 산 {category} TOP 6{" "}
            <span className="text-[12px] font-medium text-tx-assistive">
              구매 고객 수 기준 · 누르면 상품 페이지로 이동
            </span>
          </>
        }
      >
        {topItems.length === 0 ? (
          <EmptyText>
            아직 {brandName} {gp}고객이 다른 브랜드에서 산 {category}가 없어요.
          </EmptyText>
        ) : (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {topItems.map((t, i) => (
              <li key={`${t.brand}-${t.name}`} className="min-w-0">
                <TopItemCard item={t} rank={i + 1} />
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

/** TOP 6 카드 — 누르면 플랫폼 상품 페이지(새 탭). 주소가 없으면 누를 수 없는 카드 */
function TopItemCard({ item, rank }: { item: CrossTopRow; rank: number }) {
  const meta = [item.kind, item.price != null ? `₩${fmtNum(item.price)}` : null].filter(Boolean).join(" · ");
  const body = (
    <>
      <div className="relative mb-2">
        {/* 5:6 칸에 큰 이미지(무신사 500px)를 object-cover 로 채운다 — 작은 썸네일을 늘리지 않는다 */}
        <div className="aspect-[5/6] w-full overflow-hidden rounded-lg border border-line-divider bg-surface-base">
          <ProductThumb src={item.productImage} className="w-full h-full" />
        </div>
        <span className="absolute left-1.5 top-1.5 rounded-[5px] bg-fill-primary px-1.5 text-[11px] font-bold leading-[18px] text-tx-inverse">
          {rank}
        </span>
      </div>
      <p className="truncate text-[12px] font-semibold text-tx-strong">{item.brand}</p>
      <p className="line-clamp-2 text-[12px] leading-[1.4] text-tx-neutral" title={item.name}>
        {item.name}
      </p>
      {meta && <p className="truncate text-[11px] text-tx-assistive">{meta}</p>}
      <p className="mt-0.5 text-[12px] font-semibold text-[var(--palette-violet-50)]">구매 {fmtNum(item.n)}명</p>
    </>
  );
  if (!item.url) return <div className="block">{body}</div>;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {body}
    </a>
  );
}

export function CustomerCrossSection({
  brandId,
  brandName,
  period,
  platform,
  include,
}: {
  brandId: string;
  brandName: string;
  period: CustomerPeriod;
  platform: CustomerPlatformFilter;
  /** 묶음에서 기준 브랜드를 뺀 brandId — 구매 브랜드 상위 5개에 없으면 그 뒤에 붙는다 */
  include: string[];
}) {
  const includeKey = include.join(",");
  // null = 아직 안 고름 → 응답의 majorGender(리뷰 고객 다수 성별)로 맞춘다
  const [gender, setGender] = useState<CustomerGenderFilter | null>(null);
  const [category, setCategory] = useState<CustomerCategory>("상의");
  const [data, setData] = useState<CustomerCross | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestRef = useRef(0);

  const scopeKey = `${brandId}|${period}|${platform}`;
  const [prevScope, setPrevScope] = useState(scopeKey);
  if (prevScope !== scopeKey) {
    setPrevScope(scopeKey);
    setGender(null);
  }

  // 다수 성별로 맞춘 직후(setGender)엔 이미 그 값으로 불러왔으므로 다시 부르지 않는다
  const loadedKeyRef = useRef("");

  useEffect(() => {
    const keyOf = (g: CustomerGenderFilter) =>
      `${brandId}|${period}|${platform}|${g}|${category}|${includeKey}|${reloadKey}`;
    if (gender !== null && loadedKeyRef.current === keyOf(gender)) return;
    const id = ++requestRef.current;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const params = { period, platform, category, include: includeKey ? includeKey.split(",") : [] };
        let res = await GetCustomerCross(brandId, { ...params, gender: gender ?? "all" });
        let resolved: CustomerGenderFilter = gender ?? "all";
        // 처음 들어오면 다수 성별로 한 번 더 불러온다(화면엔 그 결과만 보인다)
        if (gender === null && res.majorGender) {
          resolved = res.majorGender;
          res = await GetCustomerCross(brandId, { ...params, gender: resolved });
        }
        if (id !== requestRef.current) return;
        loadedKeyRef.current = keyOf(resolved);
        setData(res);
        if (gender === null) setGender(resolved);
      } catch (e: any) {
        if (id !== requestRef.current) return;
        setError(e?.message || "교차 구매를 불러오지 못했어요.");
        setData(null);
      } finally {
        if (id === requestRef.current) setLoading(false);
      }
    })();
  }, [brandId, period, platform, gender, category, includeKey, reloadKey]);

  const g = gender ?? "all";
  const gp = genderPrefix(g);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col min-w-0 gap-1">
          <h3 className="text-[18px] font-semibold text-tx-default">교차 구매</h3>
          {data && (
            <p className="text-[14px] text-tx-alt">
              {brandName} {gp}고객 {fmtNum(data.reviewers)}명이 다른 브랜드에서 무엇을 샀는지 보여줘요.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data && (
            <Segmented
              value={g}
              onChange={(v) => setGender(v)}
              options={[
                { value: "all", label: `전체 ${fmtNum(data.genders.all)}` },
                { value: "여성", label: `여성 ${fmtNum(data.genders["여성"])}` },
                { value: "남성", label: `남성 ${fmtNum(data.genders["남성"])}` },
              ]}
            />
          )}
          <Segmented
            value={category}
            onChange={setCategory}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {loading && !data ? (
        <LoadingBox label="교차 구매를 불러오는 중…" />
      ) : error && !data ? (
        <ErrorBox message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : data ? (
        <div className={`flex flex-col gap-3 ${loading ? "opacity-60" : ""}`}>
          <CrossBody brandName={brandName} cross={data} gender={g} category={category} />
        </div>
      ) : null}
    </section>
  );
}
