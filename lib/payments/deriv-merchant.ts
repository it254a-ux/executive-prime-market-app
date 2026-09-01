// Generic client for the "Deriv Merchant" crypto payment gateway.
//
// IMPORTANT: The exact endpoint paths, request/response field names, and
// webhook signature scheme below are PLACEHOLDERS based on how Stripe-style
// merchant gateways (publishable/secret key, redirect URLs, webhooks) work.
// Once you have the real API docs from your Deriv Merchant dashboard, only
// this file needs to change — every route that imports it stays the same.
// Every spot that needs a real value is marked with TODO.

const API_BASE = process.env.DERIV_MERCHANT_API_BASE || 'https://merchant.deriv.com/api'; // TODO: confirm base URL
const SECRET_KEY = process.env.DERIV_MERCHANT_SECRET_KEY!; // server-side only, never expose to the client

export interface CreateCheckoutParams {
  amountUsd: number;
  currency?: string; // e.g. 'USD' — gateway converts to crypto at checkout
  orderId: number; // your internal order id, sent as metadata so the webhook can match it back
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  gatewayPaymentId: string;
}

export async function createCheckout(params: CreateCheckoutParams): Promise<CreateCheckoutResult> {
  const res = await fetch(`${API_BASE}/payments`, { // TODO: confirm real path (e.g. /v1/invoices, /v1/payments)
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SECRET_KEY}`, // TODO: confirm auth scheme (Bearer vs custom header)
    },
    body: JSON.stringify({
      amount: params.amountUsd,
      currency: params.currency || 'USD',
      metadata: { order_id: params.orderId }, // TODO: confirm metadata field name
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Deriv Merchant createCheckout failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    checkoutUrl: data.checkout_url || data.url, // TODO: confirm real field name
    gatewayPaymentId: data.id || data.payment_id, // TODO: confirm real field name
  };
}

// TODO: confirm the webhook signature scheme (HMAC header name + algorithm).
// This assumes an HMAC-SHA256 signature in an `X-Deriv-Signature` header,
// which is the common pattern for this style of gateway.
export async function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false;
  const webhookSecret = process.env.DERIV_MERCHANT_WEBHOOK_SECRET!;
  const crypto = await import('crypto');
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

// TODO: confirm the real webhook event shape and the "paid" status value.
export interface WebhookEvent {
  type: string; // e.g. 'payment.completed'
  data: {
    id: string;
    status: string; // e.g. 'paid' | 'failed'
    metadata?: { order_id?: string };
  };
}
