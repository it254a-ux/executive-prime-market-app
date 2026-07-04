'use client';

import { useState } from 'react';

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

export function HeroBackground() {
  const [image] = useState(() => HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(/hero/${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: 'heroKenBurns 24s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(24,28,37,0.55) 0%, rgba(24,28,37,0.78) 55%, rgba(24,28,37,0.94) 100%)',
        }}
      />
      <style jsx>{`
        @keyframes heroKenBurns {
          0% {
            transform: scale(1) translate(0, 0);
          }
          100% {
            transform: scale(1.12) translate(-1.5%, -1.5%);
          }
        }
      `}</style>
    </div>
  );
}
