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
 * Full-bleed rotating hero background for the logged-out dashboard screen.
 *
 * The random pick happens in useEffect (client-only), not a useState
 * initializer, so it's fresh on every real page load instead of getting
 * baked into the static build once.
 *
 * The image itself fades in via its own onLoad handler (opacity 0 -> 1),
 * so it never pops in abruptly — it settles in smoothly first. The
 * DashboardPage content (logo/text/cards) is timed to fade in slightly
 * after this, via a plain CSS animation-delay, so the background reads as
 * "arriving first" without any cross-component state syncing.
 */
export function HeroBackground() {
  const [image, setImage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
  }, []);

  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {image && (
        <img
          src={`/hero/${image}`}
          alt=""
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 1.1s ease',
            animation: 'heroKenBurns 24s ease-in-out infinite alternate',
          }}
        />
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
