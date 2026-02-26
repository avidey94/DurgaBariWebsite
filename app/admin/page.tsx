import { redirect } from "next/navigation";

import { getCurrentUser, isAdmin } from "@/lib/auth/session";
import { dataProvider } from "@/lib/data";
import { resolveLanguage } from "@/lib/i18n";

interface AdminPageProps {
  searchParams: Promise<{ q?: string; lang?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const lang = resolveLanguage(params.lang);
  const isBn = lang === "bn";

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user)) {
    redirect("/portal");
  }

  const query = params.q?.trim();
  const families = await dataProvider.getAllFamilies({ query });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {isBn ? "অ্যাডমিন ড্যাশবোর্ড" : "Admin Dashboard"}
        </h1>
        <p className="mt-2 text-sm text-slate-700">
          {isBn ? "প্রোভাইডারের সব পরিবার দেখুন ও খুঁজুন।" : "View and search all families in the provider."}
        </p>
      </header>

      <form className="flex gap-3" method="get">
        {lang === "bn" ? <input type="hidden" name="lang" value="bn" /> : null}
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder={isBn ? "পরিবার বা ইমেইল দিয়ে খুঁজুন" : "Search by family or email"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isBn ? "খুঁজুন" : "Search"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">{isBn ? "পরিবার" : "Family"}</th>
              <th className="px-4 py-3 font-semibold">{isBn ? "প্রাথমিক ইমেইল" : "Primary Email"}</th>
              <th className="px-4 py-3 font-semibold">{isBn ? "প্রতিষ্ঠাতা পরিবার" : "Founding Family"}</th>
              <th className="px-4 py-3 font-semibold">{isBn ? "ডোনেশন এন্ট্রি" : "Donation Entries"}</th>
            </tr>
          </thead>
          <tbody>
            {families.map((family) => (
              <tr key={family.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{family.familyName}</td>
                <td className="px-4 py-3 text-slate-700">{family.primaryEmail}</td>
                <td className="px-4 py-3 text-slate-700">
                  {family.foundingFamily ? (isBn ? "হ্যাঁ" : "Yes") : isBn ? "না" : "No"}
                </td>
                <td className="px-4 py-3 text-slate-700">{family.donations.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
