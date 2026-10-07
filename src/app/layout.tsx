import type { Metadata } from 'next';
import { Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

// Two voices: Instrument Sans for everything read, JetBrains Mono for everything scanned.
// Both verified in next/font's google font-data.json; latin subset only.
const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Prime Air Cargo Dashboard',
  description: 'Air cargo operations for the Miami to San Juan lane: milestone tracking, bookings, calls and discrepancies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-base text-ink-2 antialiased">{children}</body>
    </html>
  );
}
