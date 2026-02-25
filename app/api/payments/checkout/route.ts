import { NextRequest, NextResponse } from "next/server";

import { createDonationCheckoutSession } from "@/lib/payments/stripe";

interface CheckoutPayload {
  amountCents?: number;
  recurring?: boolean;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CheckoutPayload;

  if (!body.amountCents || body.amountCents <= 0) {
    return NextResponse.json({ message: "amountCents must be greater than 0." }, { status: 400 });
  }

  try {
    const session = await createDonationCheckoutSession({
      amountCents: body.amountCents,
      recurring: Boolean(body.recurring),
    });

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Stripe checkout is unavailable.",
      },
      { status: 501 },
    );
  }
}
