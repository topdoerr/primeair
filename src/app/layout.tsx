import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const interSans = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Prime Air — Cargo Dashboard',
  description: 'AWB status voice agent + call and discrepancy visibility (MIA → SJU).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interSans.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
