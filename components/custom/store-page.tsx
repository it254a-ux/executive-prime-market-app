import { neon } from '@neondatabase/serverless';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AccountManagementBody {
  name: string;
  contact: string;
  details: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AccountManagementBody;
    const { name, contact, details } = body;

    if (!name?.trim() || !contact?.trim() || !details?.trim()) {
      return NextResponse.json({ error: 'Name, contact, and details are required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    await sql`
      INSERT INTO service_requests (service_type, name, contact, details, status)
      VALUES ('account_management', ${name}, ${contact}, ${details}, 'new')
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to submit account management request:', err);
    return NextResponse.json({ error: 'Failed to submit. Please try again shortly.' }, { status: 500 });
  }
}
