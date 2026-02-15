import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import QueryProvider from '@/components/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solo Income System',
  description: 'Жёсткая система прокачки дохода в стиле Solo Leveling',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <QueryProvider>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            toastOptions={{
              style: {
                background: '#12121a',
                border: '1px solid #1e1e2e',
                color: '#e2e8f0',
              },
            }}
          />
        </QueryProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}