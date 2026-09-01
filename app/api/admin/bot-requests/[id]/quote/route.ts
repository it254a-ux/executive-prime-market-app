import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { notifyClientQuoteReady } from '@/lib/notify/twilio-notify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { password, id, amountUsd } = await req.json();
    if (!password || password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
    if (!id || !amountUsd || Number(amountUsd) <= 0) {
      return NextResponse.json({ error: 'A request id and a valid price are required.' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      UPDATE bot_requests
      SET amount_usd = ${amountUsd}, status = 'quoted'
      WHERE id = ${id} AND status = 'pending_quote'
      RETURNING id, name, phone, quote_token
    `) as { id: number; name: string; phone: string; quote_token: string }[];

    const updated = rows[0];
    if (!updated) {
      return NextResponse.json({ error: 'Request not found or already quoted.' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const paymentUrl = `${siteUrl}/bot-request/${updated.id}?token=${updated.quote_token}`;

    await notifyClientQuoteReady(updated.phone, updated.id, paymentUrl, Number(amountUsd));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to set quote:', err);
    return NextResponse.json({ error: 'Failed to save the price. Please try again shortly.' }, { status: 500 });
  }
}
