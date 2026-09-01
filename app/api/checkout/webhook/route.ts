import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, type WebhookEvent } from '@/lib/payments/deriv-merchant';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  // TODO: confirm the real signature header name in the Deriv Merchant docs.
  const signature = req.headers.get('x-deriv-signature');

  const isValid = await verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const orderId = event.data?.metadata?.order_id;
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id in metadata' }, { status: 400 });
  }

  // TODO: confirm the real "paid" status string the gateway sends.
  const newStatus = event.data.status === 'paid' ? 'paid' : event.data.status === 'failed' ? 'failed' : null;
  if (!newStatus) {
    // Unrecognized status — acknowledge receipt so the gateway doesn't retry forever,
    // but don't change anything.
    return NextResponse.json({ received: true });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const [order] = (await sql`
      UPDATE orders SET status = ${newStatus}, updated_at = now()
      WHERE id = ${Number(orderId)} AND gateway_payment_id = ${event.data.id}
      RETURNING bot_request_id
    `) as { bot_request_id: number }[];

    // Payment success is what turns a stored bot request into a real,
    // actionable submission — this is the one place that happens.
    if (order && newStatus === 'paid') {
      await sql`
        UPDATE bot_requests SET status = 'paid' WHERE id = ${order.bot_request_id}
      `;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Failed to process webhook:', err);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
