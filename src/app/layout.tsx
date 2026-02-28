import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'CommuteSync | Smart Traffic Notifications',
  description: 'Get notified of the best time to leave to avoid traffic.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-slate-50 min-h-screen`}>{children}</body>
    </html>
  );
}
