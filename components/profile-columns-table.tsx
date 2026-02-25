interface ProfileColumn {
  header: string;
  value: string;
}

interface ProfileColumnsTableProps {
  columns: ProfileColumn[];
}

export function ProfileColumnsTable({ columns }: ProfileColumnsTableProps) {
  if (columns.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="whitespace-nowrap px-4 py-3 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            {columns.map((column) => (
              <td key={column.header} className="whitespace-pre-line px-4 py-3 text-slate-800">
                {column.value || "-"}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
