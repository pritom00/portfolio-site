import type { Metadata, Viewport } from 'next';
import './globals.css';
import { profile } from '@/data/content';

export const metadata: Metadata = {
  title: `${profile.name}, ${profile.role}`,
  description: profile.pitch,
  icons: { icon: '/icon.svg' },
  openGraph: { title: `${profile.name}, ${profile.role}`, description: profile.pitch, type: 'website' }
};

export const viewport: Viewport = { themeColor: '#0A0E06', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
