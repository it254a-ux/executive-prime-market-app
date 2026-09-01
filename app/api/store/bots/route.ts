import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface BotProductRow {
  id: number;
  name: string;
  description: string;
  market: string;
  risk_level: string;
  price_usd: string;
  created_at: string;
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    // xml_content is excluded here for the same reason as free-bots: it's
    // only needed after purchase, not for the listing view.
    const rows = (await sql`
      SELECT id, name, description, market, risk_level, price_usd, created_at
      FROM bot_products
      ORDER BY created_at DESC
    `) as Omit<BotProductRow, 'xml_content'>[];
    return NextResponse.json({ bots: rows });
  } catch (err) {
    console.error('Failed to fetch bot store products:', err);
    return NextResponse.json(
      { error: 'Failed to load bots. Please try again shortly.' },
      { status: 500 }
    );
  }
}
