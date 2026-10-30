"use client";

import Link from "next/link";
import { useState } from "react";

import { AvailabilityCalendar } from "@/components/availability-calendar";
import { ReservationForm } from "@/components/reservation-form";

export function ReserveEventContent({
  canReserve,
  zeffyUrl,
  initialDate = "",
}: {
  canReserve: boolean;
  zeffyUrl: string;
  initialDate?: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  return (
    <div className="mt-6 space-y-6">
      <AvailabilityCalendar onSelectDate={canReserve ? setSelectedDate : undefined} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="db-card p-5 sm:p-7">
          {canReserve ? (
            <ReservationForm zeffyUrl={zeffyUrl} selectedDate={selectedDate} />
          ) : (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-[var(--db-text)]">
                A member account is required
              </h2>
              <p className="text-[var(--db-text-soft)]">
                Please log in or create an account to request a private event at Durga Bari.
              </p>
              <Link href="/login" className="db-button inline-flex px-5 py-3 font-semibold">
                Log in or create an account
              </Link>
            </div>
          )}
        </div>
        <aside className="db-card h-fit space-y-4 p-5 text-sm text-[var(--db-text-soft)]">
          <h2 className="font-serif text-xl font-bold text-[var(--db-text)]">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Check the calendar and submit the date, time, and event details.</li>
            <li>Use your booking reference when paying through Zeffy.</li>
            <li>Durga Bari checks the payment and availability, then approves the booking.</li>
          </ol>
          <p>
            Bookings may last up to 6 hours. All times are Pacific time. Payment alone does not
            confirm a reservation.
          </p>
        </aside>
      </div>
    </div>
  );
}
