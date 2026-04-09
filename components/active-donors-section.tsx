"use client";

import { useMemo, useState } from "react";
import { ContentModule } from "@/components/content-page";

export interface ActiveDonor {
  name: string;
  monthlyCents: number;
  startDate?: string;
  status?: string;
}

type Band = "all" | "bronze" | "silver" | "gold";

interface ActiveDonorsSectionProps {
  donors: ActiveDonor[];
  lang: "en" | "bn";
}

const bandOrder: Band[] = ["all", "bronze", "silver", "gold"];

const bandLabel = (band: Band, isBn: boolean) => {
  if (isBn) {
    if (band === "all") return "সব";
    if (band === "bronze") return "ব্রোঞ্জ ($100/mo)";
    if (band === "silver") return "সিলভার ($300/mo)";
    return "গোল্ড ($500/mo)";
  }

  if (band === "all") return "All";
  if (band === "bronze") return "Bronze ($100/mo)";
  if (band === "silver") return "Silver ($300/mo)";
  return "Gold ($500/mo)";
};

const resolveBand = (monthlyCents: number): Exclude<Band, "all"> => {
  if (monthlyCents >= 50_000) return "gold";
  if (monthlyCents >= 30_000) return "silver";
  return "bronze";
};

const formatCurrency = (amountCents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);

export function ActiveDonorsSection({ donors, lang }: ActiveDonorsSectionProps) {
  const isBn = lang === "bn";
  const [selectedBand, setSelectedBand] = useState<Band>("all");

  const hasStartDate = donors.some((donor) => Boolean(donor.startDate));
  const hasStatus = donors.some((donor) => Boolean(donor.status));

  const filteredDonors = useMemo(() => {
    if (selectedBand === "all") return donors;
    return donors.filter((donor) => resolveBand(donor.monthlyCents) === selectedBand);
  }, [donors, selectedBand]);

  const countText = isBn
    ? `দেখানো হচ্ছে ${filteredDonors.length} ${bandLabel(selectedBand, isBn)} দাতা`
    : `Showing ${filteredDonors.length} ${selectedBand === "all" ? "donors" : `${bandLabel(selectedBand, isBn)} donors`}`;

  return (
    <ContentModule title={isBn ? "Active Donors (Monthly Commitments)" : "Active Donors (Monthly Commitments)"}>
      <p>
        {isBn
          ? "Active Donors হলেন সেই কমিউনিটি সদস্যরা যারা মাসিকভাবে নিয়মিত সহায়তা দেন। স্ট্যাটাস বর্তমান মাসিক প্রতিশ্রুতি অনুযায়ী দেখানো হয়।"
          : "Active Donors are community members sustaining monthly support. Status reflects current monthly commitments."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {bandOrder.map((band) => {
          const active = band === selectedBand;
          return (
            <button
              key={band}
              type="button"
              onClick={() => setSelectedBand(band)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "border-[#9b1616] bg-[#9b1616] text-white"
                  : "border-[#3d6148] bg-white text-[#173724] hover:bg-[#eef4ec]"
              }`}
            >
              {bandLabel(band, isBn)}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm font-semibold text-[#35513d]">{countText}</p>

      <div className="mt-3 border-[2px] border-[#3d6148] bg-[#eef4ec] p-3">
        <div
          className={`grid gap-2 border-b border-[#7b9b85] pb-2 text-sm font-bold uppercase tracking-[0.05em] text-[#173724] ${
            hasStartDate && hasStatus
              ? "md:grid-cols-[2fr_1fr_1fr_1fr]"
              : hasStartDate || hasStatus
                ? "md:grid-cols-[2fr_1fr_1fr]"
                : "md:grid-cols-[2fr_1fr]"
          }`}
        >
          <span>{isBn ? "নাম" : "Name"}</span>
          <span>{isBn ? "মাসিক প্রতিশ্রুতি" : "Monthly Commitment"}</span>
          {hasStartDate ? <span>{isBn ? "শুরু" : "Since"}</span> : null}
          {hasStatus ? <span>{isBn ? "স্ট্যাটাস" : "Status"}</span> : null}
        </div>

        {filteredDonors.length === 0 ? (
          <p className="pt-3 text-[#35513d]">{isBn ? "এই ফিল্টারে কোনো দাতা নেই।" : "No donors in this filter."}</p>
        ) : (
          <ul className="divide-y divide-[#c5d4c8]">
            {filteredDonors.map((donor) => (
              <li
                key={`${donor.name}-${donor.monthlyCents}-${donor.startDate ?? ""}`}
                className={`grid gap-2 py-2 text-[15px] text-[#1f2a22] ${
                  hasStartDate && hasStatus
                    ? "md:grid-cols-[2fr_1fr_1fr_1fr]"
                    : hasStartDate || hasStatus
                      ? "md:grid-cols-[2fr_1fr_1fr]"
                      : "md:grid-cols-[2fr_1fr]"
                }`}
              >
                <span className="font-medium">{donor.name}</span>
                <span className="font-semibold text-[#173724]">{formatCurrency(donor.monthlyCents)}/mo</span>
                {hasStartDate ? <span>{donor.startDate ?? "-"}</span> : null}
                {hasStatus ? <span>{donor.status ?? "Active"}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ContentModule>
  );
}
