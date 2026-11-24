import type { PlanId, SubscriptionStatus } from "@hireflow/entitlements";

export type { PlanId, SubscriptionStatus };

export class BillingNotLive extends Error {
  readonly code = "BILLING_NOT_LIVE" as const;

  constructor(action: string) {
    super(`Billing is not live. ${action} is an interface only.`);
    this.name = "BillingNotLive";
  }
}

export type GstReadyPrice = {
  priceInrExGst: number;
  gst: "applicable";
  interval: "month";
  region: "IN";
};

export type CheckoutRequest = {
  userId: string;
  planId: PlanId;
  price: GstReadyPrice;
};

export type PaymentProvider = {
  id: "razorpay";
  createCheckout: (request: CheckoutRequest) => Promise<never>;
  cancel: (subscriptionRef: string) => Promise<never>;
  refund: (paymentRef: string) => Promise<never>;
  verifyWebhook: (input: { payload: string; signature: string }) => Promise<never>;
};

function notLive(action: string): never {
  throw new BillingNotLive(action);
}

/** Razorpay adapter with no SDK and no HTTP. Checkout stays disabled. */
export const razorpayProvider: PaymentProvider = {
  id: "razorpay",
  createCheckout: async () => notLive("createCheckout"),
  cancel: async () => notLive("cancel"),
  refund: async () => notLive("refund"),
  verifyWebhook: async () => notLive("verifyWebhook"),
};
