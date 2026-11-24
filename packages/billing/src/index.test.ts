import { describe, expect, it } from "vitest";
import { BillingNotLive, razorpayProvider } from "./index";

describe("billing interfaces", () => {
  it("returns BillingNotLive for every Razorpay adapter method", async () => {
    expect(razorpayProvider.id).toBe("razorpay");
    await expect(
      razorpayProvider.createCheckout({
        userId: "u1",
        planId: "pro",
        price: { priceInrExGst: 199, gst: "applicable", interval: "month", region: "IN" },
      }),
    ).rejects.toBeInstanceOf(BillingNotLive);
    await expect(razorpayProvider.cancel("sub_x")).rejects.toMatchObject({ code: "BILLING_NOT_LIVE" });
    await expect(razorpayProvider.refund("pay_x")).rejects.toBeInstanceOf(BillingNotLive);
    await expect(
      razorpayProvider.verifyWebhook({ payload: "{}", signature: "sig" }),
    ).rejects.toBeInstanceOf(BillingNotLive);
  });
});
