import { NextResponse } from "next/server";
import { getCalendarMonth } from "@/lib/events/hub-server";
import { validMonth } from "@/lib/events/hub";

export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month") ?? "";
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (!validMonth(month))
    return NextResponse.json({ message: "Choose a valid month." }, { status: 400, headers });
  try {
    return NextResponse.json(await getCalendarMonth(month), { headers });
  } catch {
    return NextResponse.json(
      { message: "The calendar couldn’t be loaded. Please try again." },
      { status: 503, headers },
    );
  }
}
