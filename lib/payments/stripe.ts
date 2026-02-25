import { isStripeConfigured } from "@/lib/env";

export interface CheckoutRequest {
  amountCents: number;
  recurring: boolean;
}

export const createDonationCheckoutSession = async (
  request: CheckoutRequest,
): Promise<{ checkoutUrl: string }> => {
  void request;
  if (!isStripeConfigured) {
    throw new Error(
      "Stripe is not configured yet. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.",
    );
  }

  throw new Error("Stripe checkout integration is scaffolded but not implemented yet.");
};
