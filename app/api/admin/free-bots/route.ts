import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, name, description, market, risk_level, xml_content } = body;

    // The password is only ever compared here, server-side. It's never
    // shipped to the browser bundle, so there's nothing to inspect client-side.
    if (!password || password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    if (!name || !description || !market || !risk_level || !xml_content) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO free_bots (name, description, market, risk_level, xml_content)
      VALUES (${name}, ${description}, ${market}, ${risk_level}, ${xml_content})
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to add bot:', err);
    return NextResponse.json(
      { error: 'Failed to save bot. Please try again shortly.' },
      { status: 500 }
    );
  }
}
