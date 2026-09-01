import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/payments/deriv-merchant';

export const dynamic = 'force-dynamic';

interface CheckoutRequestBody {
  productType: 'bot' | 'service';
  productId: number;
  customerEmail?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const { productType, productId, customerEmail } = body;

    if (!productType || !productId) {
      return NextResponse.json({ error: 'productType and productId are required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Look up the price server-side — never trust a price sent from the client.
    const table = productType === 'bot' ? 'bot_products' : 'services';
    const rows = (await sql`
      SELECT id, price_usd FROM ${sql(table)} WHERE id = ${productId}
    `) as { id: number; price_usd: string | null }[];

    const product = rows[0];
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (product.price_usd === null) {
      return NextResponse.json({ error: 'This item has no fixed price — contact us directly' }, { status: 400 });
    }

    const amountUsd = Number(product.price_usd);

    const [order] = (await sql`
      INSERT INTO orders (product_type, product_id, customer_email, amount_usd, status)
      VALUES (${productType}, ${productId}, ${customerEmail || null}, ${amountUsd}, 'pending')
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
    console.error('Failed to create checkout:', err);
    return NextResponse.json({ error: 'Failed to start checkout. Please try again shortly.' }, { status: 500 });
  }
}
