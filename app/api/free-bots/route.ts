import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Force dynamic — this list changes independently of any static build,
// and should always reflect what's currently in the table.
export const dynamic = 'force-dynamic';

interface FreeBotRow {
  id: number;
  name: string;
  description: string;
  market: string;
  risk_level: string;
  xml_content: string;
  created_at: string;
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // xml_content is intentionally excluded from the list response — it can
    // be large, and the list view never needs it. It's fetched separately
    // per-bot only when a user actually clicks Import.
    const rows = (await sql`
      SELECT id, name, description, market, risk_level, created_at
      FROM free_bots
      ORDER BY created_at DESC
    `) as Omit<FreeBotRow, 'xml_content'>[];

    return NextResponse.json({ bots: rows });
  } catch (err) {
    console.error('Failed to fetch free bots:', err);
    return NextResponse.json(
      { error: 'Failed to load bots. Please try again shortly.' },
      { status: 500 }
    );
  }
}
