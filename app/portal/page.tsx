import { redirect } from "next/navigation";

import { DuesStatusTable } from "@/components/dues-status-table";
import { getCurrentUser } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";
import { resolveLanguage } from "@/lib/i18n";

interface PortalPageProps {
  searchParams: Promise<{ lang?: string }>;
}

export default async function PortalPage({ searchParams }: PortalPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";

  if (!user) {
    redirect("/login");
  }

  const family = await dataProvider.getFamilyByEmail(user.email);

  if (!family) {
    return (
      <section className="mx-auto max-w-6xl space-y-4 px-6 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {isBn ? "আপনার পোর্টাল" : "Your Portal"}
        </h1>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {isBn ? "বর্তমান ডেটা প্রোভাইডারে" : "No family record found for"} <strong>{user.email}</strong>{" "}
          {isBn ? "এর জন্য কোনো ফ্যামিলি রেকর্ড পাওয়া যায়নি।" : "in the current data provider."}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {isBn ? "আপনার পোর্টাল" : "Your Portal"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isBn ? "লগইন করেছেন" : "Signed in as"} {user.email}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{isBn ? "পরিবারের নাম" : "Family Name"}</p>
            <p className="text-lg font-semibold text-slate-900">{family.familyName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{isBn ? "প্রতিষ্ঠাতা পরিবার" : "Founding Family"}</p>
            <p className="text-lg font-semibold text-slate-900">
              {family.foundingFamily ? (isBn ? "হ্যাঁ" : "Yes") : isBn ? "না" : "No"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{isBn ? "মোট পরিশোধিত" : "Total Dues Paid"}</p>
            <p className="text-lg font-semibold text-slate-900">{family.totalDuesPaid || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{isBn ? "অ্যাডমিন" : "Is Admin"}</p>
            <p className="text-lg font-semibold text-slate-900">
              {user.isAdmin ? (isBn ? "হ্যাঁ" : "Yes") : isBn ? "না" : "No"}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">{isBn ? "মাসিক চাঁদার অবস্থা" : "Monthly Dues Status"}</h2>
        <p className="text-sm text-slate-600">
          {isBn
            ? "শিটে যে মাসে"
            : "Each month marked"}{" "}
          <strong>{isBn ? "পরিশোধিত" : "Paid"}</strong>{" "}
          {isBn
            ? "লেখা আছে, তার মানে ওই মাসের চাঁদা ইতোমধ্যে গ্রহণ করা হয়েছে।"
            : "in the sheet means your dues for that month are already received."}
        </p>
        <DuesStatusTable items={family.duesMonths ?? []} language={lang} />
      </section>
    </section>
  );
}
