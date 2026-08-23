import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { HandshakeProvider } from '@/providers/handshake-provider';
import { ToasterProvider } from '@/providers/toaster-provider';
import { PwaProvider } from '@/providers/pwa-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export const metadata: Metadata = {
  title: 'Kumpul Cafe - Digital QR Menu & Ordering',
  description:
    'Sistem pemesanan digital mandiri dan portal operasional kafe modern dengan enkripsi Zero-Trust.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FAF7F2',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased font-sans transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="kumpul-cafe-theme"
          enableSystem
          disableTransitionOnChange={false}
        >
          <QueryProvider>
            <HandshakeProvider>
              <PwaProvider>
                <TooltipProvider delayDuration={400}>
                  {children}
                  <ToasterProvider />
                </TooltipProvider>
              </PwaProvider>
            </HandshakeProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
