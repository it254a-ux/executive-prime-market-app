'use client';
import { useState, useEffect } from 'react';

const HERO_IMAGES = [
  '01_singapore_skyline.jpg',
  '02_dubai_skyline.jpg',
  '03_hongkong_skyline.jpg',
  '09_sportscar_night.jpg',
  '10_dubai_supercar.jpg',
  '12_luxurycar_alley_night.jpg',
  '14_yacht_marina_night.jpg',
  '15_monaco_harbor.jpg',
  '16_dubai_marina_night.jpg',
  '17_dubai_marina_sunset.jpg',
  '18_newyork_starry_night.jpg',
  '19_newyork_reflections.jpg',
  '20_hongkong_aerial.jpg',
  '22_yachts_marina.jpg',
  '23_monaco_yachts_wide.jpg',
  '24_highway_lighttrails2.jpg',
  '25_monaco_skyline.jpg',
];

/**
 * Hero background: "breathes" in on load (soft scale + fade, no onLoad
 * dependency, so it's identical every time regardless of cache), then
 * settles into a slow, continuous zoom in/out. The zoom uses
 * `alternate` direction so it reverses smoothly at each end instead of
 * snapping back to the start — no visible reset, ever.
 */
export function HeroBackground() {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    setImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
  }, []);

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {image && (
        <div className="hero-img-wrap">
          <img src={`/hero/${image}`} alt="" className="hero-img" />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(24,28,37,0.55) 0%, rgba(24,28,37,0.78) 55%, rgba(24,28,37,0.94) 100%)',
        }}
      />
      <style jsx>{`
        .hero-img-wrap {
          position: absolute;
          inset: 0;
          opacity: 0;
          animation: heroBreatheIn 1.3s ease-out forwards;
        }
        .hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.08);
          animation: heroZoom 22s ease-in-out 1.3s infinite alternate;
        }
        @keyframes heroBreatheIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes heroZoom {
          0% { transform: scale(1.02) translate(0, 0); }
          100% { transform: scale(1.12) translate(-1.5%, -1.5%); }
        }
      `}</style>
    </div>
  );
}
