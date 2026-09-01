import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

interface BotRequestBody {
  name: string;
  phone: string;
  strategyDetails: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BotRequestBody;
    const { name, phone, strategyDetails } = body;

    if (!name?.trim() || !phone?.trim() || !strategyDetails?.trim()) {
      return NextResponse.json({ error: 'Name, phone, and strategy details are required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const quoteToken = randomUUID();

    await sql`
      INSERT INTO bot_requests (name, phone, strategy_details, quote_token, status)
      VALUES (${name}, ${phone}, ${strategyDetails}, ${quoteToken}, 'pending_quote')
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to submit bot request:', err);
    return NextResponse.json({ error: 'Failed to submit. Please try again shortly.' }, { status: 500 });
  }
}
