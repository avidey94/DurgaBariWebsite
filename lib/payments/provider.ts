import type { DonationPaymentChannel, DonationType } from "@/lib/portal/types";

export type PaymentIntentStatus = "pending" | "requires_action" | "succeeded" | "failed" | "cancelled";

export interface CreatePaymentIntentInput {
  familyId: string;
  donationType: DonationType;
  amountCents: number;
  projectId?: string;
  anonymous?: boolean;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentRecord {
  id: string;
  provider: DonationPaymentChannel;
  status: PaymentIntentStatus;
  amountCents: number;
  clientToken?: string;
  redirectUrl?: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentRecord>;
  getIntent(intentId: string): Promise<PaymentIntentRecord | null>;
}

class ManualPlaceholderProvider implements PaymentProvider {
  async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentRecord> {
    return {
      id: `manual_${Date.now()}`,
      provider: "manual",
      status: "pending",
      amountCents: input.amountCents,
      metadata: {
        ...input.metadata,
        message: "Manual placeholder intent created. No external rail configured yet.",
      },
    };
  }

  async getIntent(intentId: string): Promise<PaymentIntentRecord | null> {
    if (!intentId.startsWith("manual_")) {
      return null;
    }

    return {
      id: intentId,
      provider: "manual",
      status: "pending",
      amountCents: 0,
      metadata: { message: "Manual placeholder provider does not persist intents yet." },
    };
  }
}

export const paymentProvider: PaymentProvider = new ManualPlaceholderProvider();
