import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/payments/deriv-merchant';

export const dynamic = 'force-dynamic';

interface BotOrderRequestBody {
  name: string;
  contact: string;
  strategyDetails: string;
  amountUsd: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BotOrderRequestBody;
    const { name, contact, strategyDetails, amountUsd } = body;

    if (!name?.trim() || !contact?.trim() || !strategyDetails?.trim()) {
      return NextResponse.json({ error: 'Name, contact, and strategy details are required' }, { status: 400 });
    }
    if (!amountUsd || amountUsd <= 0) {
      return NextResponse.json({ error: 'A valid payment amount is required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // The request is stored as "pending_payment" right away — it only counts
    // as a real submission once the webhook confirms payment below.
    const [botRequest] = (await sql`
      INSERT INTO bot_requests (name, contact, strategy_details, amount_usd, status)
      VALUES (${name}, ${contact}, ${strategyDetails}, ${amountUsd}, 'pending_payment')
      RETURNING id
    `) as { id: number }[];

    const [order] = (await sql`
      INSERT INTO orders (bot_request_id, amount_usd, status)
      VALUES (${botRequest.id}, ${amountUsd}, 'pending')
      RETURNING id
    `) as { id: number }[];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const { checkoutUrl, gatewayPaymentId } = await createCheckout({
      amountUsd,
      orderId: order.id,
      successUrl: `${siteUrl}/checkout/success?order=${order.id}`,
      cancelUrl: `${siteUrl}/checkout/cancelled?order=${order.id}`,
    });

    await sql`
      UPDATE orders SET gateway_payment_id = ${gatewayPaymentId}, updated_at = now() WHERE id = ${order.id}
    `;

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error('Failed to submit bot request:', err);
    return NextResponse.json({ error: 'Failed to start checkout. Please try again shortly.' }, { status: 500 });
  }
}
