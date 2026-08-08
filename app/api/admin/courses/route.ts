import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, title, level, lessons, description, url } = body;

    // The password is only ever compared here, server-side. It's never
    // shipped to the browser bundle, so there's nothing to inspect client-side.
    if (!password || password !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
    if (!title || !level || !lessons || !description || !url) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const lessonsNum = Number(lessons);
    if (!Number.isInteger(lessonsNum) || lessonsNum <= 0) {
      return NextResponse.json({ error: 'Lessons must be a positive whole number.' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO courses (title, level, lessons, description, url)
      VALUES (${title}, ${level}, ${lessonsNum}, ${description}, ${url})
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to add course:', err);
    return NextResponse.json(
      { error: 'Failed to save course. Please try again shortly.' },
      { status: 500 }
    );
  }
}
