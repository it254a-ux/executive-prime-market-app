import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import '@/app/globals.css';
import './globals.css';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';
import './custom.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ExecutivePrimeMarkets',
  description: 'Your all-in-one trading platform powered by Deriv',
};

const fontClass =
  FONT_CLASS_MAP[process.env.NEXT_PUBLIC_FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }} suppressHydrationWarning>
      <body
        className={`${fontClass} ${ibmPlexSans.variable}`}
        style={{ margin: 0, padding: 0, height: '100%', overflow: 'hidden', background: '#0a0a0a' }}
      >
        {children}
      </body>
    </html>
  );
}
