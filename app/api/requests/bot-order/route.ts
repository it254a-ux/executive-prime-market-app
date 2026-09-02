import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface BotOrderRequestBody {
  name: string;
  phone: string;
  strategyDetails: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BotOrderRequestBody;
    const { name, phone, strategyDetails } = body;

    if (!name?.trim() || !phone?.trim() || !strategyDetails?.trim()) {
      return NextResponse.json(
        { error: 'Name, phone, and strategy details are required' },
        { status: 400 }
      );
    }

    const sql = neon(process.env.DATABASE_URL!);

    // No amount and no checkout here. The request is stored as
    // "pending_review" — admin/customercare/moderator reviews it, sets a
    // price, and the client gets a WhatsApp/SMS notice with a tokenized
    // payment link at that point (handled elsewhere, not on submission).
    const [botRequest] = (await sql`
      INSERT INTO bot_requests (name, contact, strategy_details, status)
      VALUES (${name}, ${phone}, ${strategyDetails}, 'pending_review')
      RETURNING id
    `) as { id: number }[];

    return NextResponse.json({ id: botRequest.id });
  } catch (err) {
    console.error('Failed to submit bot request:', err);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again shortly.' },
      { status: 500 }
    );
  }
}
