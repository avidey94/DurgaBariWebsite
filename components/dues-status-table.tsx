interface DuesMonthStatus {
  month: string;
  paid: boolean;
  rawValue: string;
}

interface DuesStatusTableProps {
  items: DuesMonthStatus[];
}

const monthMap: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const dueDateForMonth = (monthHeader: string) => {
  const match = monthHeader.trim().match(/^([A-Za-z]+)-(\d{4})$/);
  if (!match) {
    return "Due";
  }

  const monthNumber = monthMap[match[1].toLowerCase()];
  if (!monthNumber) {
    return "Due";
  }

  const yearShort = match[2].slice(2);
  return `${monthNumber}/15/${yearShort}`;
};

export function DuesStatusTable({ items }: DuesStatusTableProps) {
  if (items.length === 0) {
    return (
      <p className="border-[2px] border-[var(--db-border)] bg-[var(--db-panel)] px-4 py-3 text-sm text-[var(--db-text)]">
        No month columns found in the sheet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border-[2px] border-[var(--db-border)] bg-[var(--db-panel)]">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-[var(--db-muted)] text-[var(--db-text)]">
            <th className="border-b-[2px] border-[var(--db-border)] px-3 py-2 text-left font-bold">Month</th>
            <th className="border-b-[2px] border-[var(--db-border)] px-3 py-2 text-left font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.month} className="odd:bg-white even:bg-[#f4f4ef]">
              <td className="border-b border-[var(--db-border-soft)] px-3 py-2 font-semibold text-[var(--db-text)]">
                {item.month}
              </td>
              <td className="border-b border-[var(--db-border-soft)] px-3 py-2">
                <span
                  className="inline-block border px-2 py-1 text-xs font-bold uppercase tracking-wide"
                  style={
                    item.paid
                      ? {
                          borderColor: "#176333",
                          backgroundColor: "#27b05a",
                          color: "#ffffff",
                        }
                      : {
                          borderColor: "#6b727a",
                          backgroundColor: "#e6e8eb",
                          color: "#384049",
                        }
                  }
                >
                  {item.paid ? "PAID" : `DUE ${dueDateForMonth(item.month)}`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
