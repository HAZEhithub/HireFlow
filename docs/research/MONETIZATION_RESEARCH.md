# Monetization research

**Project:** HireFlow  
**Access date:** 2026-11-21  
**Billing:** architecture only — no accounts, no checkout.

**Legend:** **Fact** = official page on 2026-11-21. **Estimate** = arithmetic from an official rate. **Hypothesis** = not a legal determination. **Unknown** = not on the page read.

Approved list price: **₹199/month + applicable GST**. Indicative 18% GST hypothesis: **₹234.82/month**.

## Recommendation

Prepare a **Razorpay Subscriptions adapter first** (HireFlow remains seller of record). Cashfree second. Paddle is merchant-of-record (high lock-in on a ₹199 ticket). Stripe India is **invite-only** and Stripe Tax does **not** collect domestic GST for an India-located business.

## Provider facts (official)

| Provider | Model | Public domestic fee | GST on provider fee | Notes |
|----------|-------|---------------------|---------------------|-------|
| Razorpay | Aggregator | **2%** + cards subscription **0.9% + platform** ([pricing](https://razorpay.com/pricing/), last updated May 2026) | **18% on Razorpay’s fee, not GMV** | UPI/NACH subscription pricing **on request** → Unknown. GST customer invoices: Dashboard GST invoices are **not** APIs and **not** post-payment receipts ([Invoices FAQs](https://razorpay.com/docs/payments/invoices/faqs)). |
| Cashfree | Aggregator | Standard PG **1.95%** ([charges](https://www.cashfree.com/payment-gateway-charges/)) | **18%** or prevailing on platform fees | Subscription lines are **flat ₹**; festive 0% **excludes subscriptions**. No webhook replay for subscription events. |
| Paddle | Merchant of record | **5% + 50¢** per Checkout ([pricing](https://www.paddle.com/pricing)) | Buyer India GST **18% B2C** on Paddle tax table last updated **2025-08-01** | Paddle is the seller. India not on unsupported *seller* country list. |
| Stripe | Processor | India cards **2%** + Billing **0.7%** ([in/pricing](https://stripe.com/in/pricing), [Billing](https://stripe.com/in/billing/pricing)) | Rate on Stripe’s own fees **unknown** on the pricing page | **Invite-only**. Stripe Tax India = remote OIDAR IGST only — **not** domestic GST for an India business ([Stripe Tax APAC](https://docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax?tax-jurisdiction-asia-pacific=india)). |

Webhooks: Razorpay `subscription.authenticated|activated|charged|pending|halted` + `refund.processed` ([docs](https://razorpay.com/docs/webhooks/subscriptions)). Cashfree `SUBSCRIPTION_*` on a **separate** subscriptions webhook tab.

Refunds: Razorpay regular refunds **₹0** processing; original fees **not reversed**.

## Competitor prices

Copied from HireFlow [SOURCE_REGISTER.md](SOURCE_REGISTER.md) **2026-11-20** (not re-fetched): Careerflow ~$23.99/mo (C-07), Huntr Pro $40/mo (C-12), Rezi Pro $29/mo (C-17). ₹199 sits well below those USD lists — positioning fact, not conversion proof.

## Gross margin

**Unknown.** Illustrative Razorpay card estimate at ₹199 and 2.9% + 18% GST on fee ≈ ₹6.81 provider take — **not a quote**. UPI AutoPay cost is unpublished.

## Sources (2026-11-21)

Razorpay: https://razorpay.com/docs/payments/subscriptions , https://razorpay.com/pricing/ , https://razorpay.com/docs/webhooks/subscriptions , https://razorpay.com/docs/payments/invoices/faqs  
Cashfree: https://www.cashfree.com/docs/payments/subscription/introduction , https://www.cashfree.com/payment-gateway-charges/  
Paddle: https://www.paddle.com/pricing , https://developer.paddle.com/get-started/how-paddle-works  
Stripe: https://docs.stripe.com/india-accept-international-payments , https://stripe.com/in/pricing , https://docs.stripe.com/tax/supported-countries/asia-pacific/collect-tax?tax-jurisdiction-asia-pacific=india
