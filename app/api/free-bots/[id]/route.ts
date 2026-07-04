import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid bot id.' }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT name, xml_content
      FROM free_bots
      WHERE id = ${id}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bot not found.' }, { status: 404 });
    }

    return NextResponse.json({ name: rows[0].name, xml_content: rows[0].xml_content });
  } catch (err) {
    console.error('Failed to fetch bot xml:', err);
    return NextResponse.json(
      { error: 'Failed to load bot. Please try again shortly.' },
      { status: 500 }
    );
  }
}
