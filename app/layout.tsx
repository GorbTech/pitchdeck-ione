import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  title: 'iONE | Autonomous Energy Platform',
  description: 'AI-Powered Autonomous Solar Power Platform. Zero emissions. Silent operation. Edge AI intelligence.',
  keywords: ['solar', 'autonomous', 'energy', 'AI', 'cleantech', 'defence', 'iONE'],
  authors: [{ name: 'GT GmbH', url: 'https://gtlab.org' }],
  openGraph: {
    title: 'iONE | Autonomous Energy Platform',
    description: 'AI-Powered Autonomous Solar Power Platform by GT GmbH',
    url: 'https://pitchdeck.gtlab.org',
    siteName: 'iONE Pitch Deck',
    type: 'website',
    images: [{ url: '/RoboPitch.png', width: 512, height: 512, alt: 'iONE Robot' }],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
