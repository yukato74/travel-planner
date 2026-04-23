import type { Metadata, Viewport } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: 'Travel Planner built with Next.js App Router and MUI',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <AppHeader />
            <main
              style={{
                flex: 1,
                paddingTop: 'var(--app-header-height)',
              }}
            >
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
