
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { profile } from '@/data/content';

export const metadata: Metadata = {
  title: `${profile.name}, ${profile.role}`,
  description: profile.pitch,
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: `${profile.name}, ${profile.role}`,
    description: profile.pitch,
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
