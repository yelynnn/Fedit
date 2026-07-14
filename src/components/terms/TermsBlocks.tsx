export const Chapter = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="mt-[44px]">
    <h2 className="mb-[20px] border-b border-line-divider pb-[10px] text-[18px] font-semibold tracking-[-0.03em] text-tx-default">
      {title}
    </h2>
    <div className="flex flex-col gap-[28px]">{children}</div>
  </section>
);

export const Article = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <article>
    {title && (
      <h3 className="mb-[10px] text-[15px] font-semibold tracking-[-0.03em] text-tx-default">
        {title}
      </h3>
    )}
    <div className="flex flex-col gap-[8px] text-[13px] leading-[1.7] tracking-[-0.02em] text-tx-alt">
      {children}
    </div>
  </article>
);

export const P = ({ children }: { children: React.ReactNode }) => (
  <p>{children}</p>
);

export const Ol = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="ml-[20px] flex list-decimal flex-col gap-[4px]">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ol>
);

export const DashList = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="ml-[20px] flex list-disc flex-col gap-[4px]">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

export const Quote = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[8px] bg-surface-base px-[16px] py-[12px] text-[12px] leading-[1.7] text-icon-neutral">
    {title && <p className="mb-[4px] font-semibold text-tx-alt">{title}</p>}
    {children}
  </div>
);

export const InfoTable = ({ rows }: { rows: string[][] }) => (
  <div className="mb-[28px] overflow-hidden rounded-[8px] border border-line-divider">
    <table className="w-full border-collapse text-[13px]">
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className={i !== rows.length - 1 ? "border-b border-surface-base" : ""}
          >
            <th className="w-[120px] bg-surface-base px-[14px] py-[10px] text-left font-semibold text-tx-default">
              {row[0]}
            </th>
            <td className="px-[14px] py-[10px] text-tx-alt">{row[1]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
