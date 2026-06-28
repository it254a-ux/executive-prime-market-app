import HomePage from '../page';

// Catch-all route: any path that doesn't match a real folder (e.g. /charts,
// /dtrader, /analysis, /botbuilder, /freebots, /copytrading, /tutorials)
// renders the SAME homepage component as "/". HomePage reads
// window.location.pathname on load to decide which section to show, so this
// makes direct page loads and refreshes work correctly for every nav item —
// without needing a vercel.json rewrite (which only applies to static HTML
// exports, not this Next.js App Router app).
export default function CatchAll() {
  return <HomePage />;
}