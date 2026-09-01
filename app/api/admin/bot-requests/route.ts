import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    if (!password || password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, name, phone, strategy_details, amount_usd, status, created_at
      FROM bot_requests
      WHERE status != 'paid'
      ORDER BY created_at ASC
    `;
    return NextResponse.json({ requests: rows });
  } catch (err) {
    console.error('Failed to list bot requests:', err);
    return NextResponse.json({ error: 'Failed to load requests.' }, { status: 500 });
  }
}
