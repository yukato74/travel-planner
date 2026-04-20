import type { Metadata } from 'next';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppProviders } from '@/components/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'Travel Planner',
  description: 'Travel Planner built with Next.js App Router and MUI',
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
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
