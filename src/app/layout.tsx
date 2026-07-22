import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prime Air — Cargo Dashboard',
  description: 'AWB status voice agent + call and discrepancy visibility (MIA → SJU).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
