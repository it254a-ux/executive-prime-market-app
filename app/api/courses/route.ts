import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Force dynamic — this list changes independently of any static build,
// and should always reflect what's currently in the table.
export const dynamic = 'force-dynamic';

interface CourseRow {
  id: number;
  title: string;
  level: string;
  lessons: number;
  description: string;
  url: string;
  created_at: string;
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      SELECT id, title, level, lessons, description, url, created_at
      FROM courses
      ORDER BY
        CASE level
          WHEN 'Beginner' THEN 0
          WHEN 'Intermediate' THEN 1
          WHEN 'Advanced' THEN 2
          ELSE 3
        END,
        created_at ASC
    `) as CourseRow[];
    return NextResponse.json({ courses: rows });
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    return NextResponse.json(
      { error: 'Failed to load courses. Please try again shortly.' },
      { status: 500 }
    );
  }
}
