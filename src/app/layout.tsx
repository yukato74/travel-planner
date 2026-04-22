import type { Metadata, Viewport } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: 'Travel Planner built with Next.js App Router and MUI',
  manifest: '/manifest.webmanifest',
  themeColor: '#F5F7FA',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5F7FA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif' }}>
        <AppProviders>
          <div style={{ backgroundColor: '#F5F7FA', minHeight: '100vh' }}>
            <AppHeader />
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
