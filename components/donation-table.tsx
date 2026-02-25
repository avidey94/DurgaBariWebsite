import type { DonationRecord } from "@/lib/types";

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountCents / 100);

const formatDate = (dateISO: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(dateISO));

interface DonationTableProps {
  donations: DonationRecord[];
}

export function DonationTable({ donations }: DonationTableProps) {
  if (donations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No donation records found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-700">
          <tr>
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Amount</th>
            <th className="px-4 py-3 font-semibold">Method</th>
            <th className="px-4 py-3 font-semibold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {donations.map((donation) => (
            <tr key={donation.id} className="border-t border-slate-100">
              <td className="px-4 py-3 text-slate-800">{formatDate(donation.dateISO)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {formatCurrency(donation.amountCents)}
              </td>
              <td className="px-4 py-3 capitalize text-slate-700">
                {donation.method.replace("_", " ")}
              </td>
              <td className="px-4 py-3 text-slate-600">{donation.notes ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
