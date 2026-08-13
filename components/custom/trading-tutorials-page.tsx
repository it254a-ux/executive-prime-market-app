'use client';

import { useEffect, useState } from 'react';
import { HeroBackground } from '@/components/custom/hero-background';

interface Course {
  id: number;
  title: string;
  level: string;
  lessons: number;
  description: string;
  url: string;
  created_at: string;
}

const levelColors: Record<string, string> = {
  Beginner: '#4cc978',
  Intermediate: '#c9a84c',
  Advanced: '#e57373',
};

export function TradingTutorialsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setCourses(data.courses);
        }
      })
      .catch(() => setError('Failed to load courses. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-fade-in" style={{
      flex: 1, position: 'relative', overflowX: 'hidden',
      background: 'rgb(var(--background))', width: '100%',
    }}>
      <HeroBackground />

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', color: 'rgb(var(--foreground))', gap: '24px',
        padding: '40px 24px', overflowY: 'auto', width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{ textAlign: 'center', maxWidth: '640px' }}>
          <h1 style={{ color: '#c9a84c', fontSize: '28px', margin: 0 }}>Trading Tutorials</h1>
          <p style={{ color: 'rgb(var(--foreground) / 0.6)', fontSize: '14px', marginTop: '10px' }}>
            Structured courses to help you learn at your own pace, from the basics through advanced strategy.
          </p>
        </div>

        {loading && (
          <p style={{ color: 'rgb(var(--foreground) / 0.5)' }}>Loading courses…</p>
        )}

        {error && (
          <p style={{ color: '#e57373' }}>{error}</p>
        )}

        {!loading && !error && courses.length === 0 && (
          <p style={{ color: 'rgb(var(--foreground) / 0.5)' }}>No courses available yet — check back soon.</p>
        )}

        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '16px',
          justifyContent: 'center', maxWidth: '900px', width: '100%',
        }}>
          {courses.map(course => (
            <div
              key={course.id}
              style={{
                background: 'rgba(201,168,76,0.06)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '12px', padding: '20px',
                width: '260px', display: 'flex', flexDirection: 'column', gap: '10px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <h3 style={{ color: 'rgb(var(--foreground))', margin: 0, fontSize: '16px' }}>{course.title}</h3>
              <p style={{ color: 'rgb(var(--foreground) / 0.6)', fontSize: '13px', margin: 0, flex: 1 }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(201,168,76,0.15)', color: '#c9a84c',
                }}>
                  {course.lessons} lessons
                </span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px',
                  background: `${levelColors[course.level] ?? '#c9a84c'}26`,
                  color: levelColors[course.level] ?? '#c9a84c',
                }}>
                  {course.level}
                </span>
              </div>
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: '8px', padding: '9px', borderRadius: '7px',
                  border: 'none', background: 'linear-gradient(135deg, #b8962e, #e8c840)',
                  color: '#0a0a0a', fontWeight: 700, fontSize: '13px',
                  textAlign: 'center', textDecoration: 'none', display: 'block',
                }}
              >
                View Course
              </a>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page-fade-in {
          opacity: 0;
          animation: pageFadeIn 0.4s ease forwards;
        }
        @keyframes pageFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
