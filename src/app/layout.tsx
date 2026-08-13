import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { HandshakeProvider } from '@/providers/handshake-provider';
import { ToasterProvider } from '@/providers/toaster-provider';
import { PwaProvider } from '@/providers/pwa-provider';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Kumpul Cafe - Digital QR Menu & Ordering',
  description: 'Pesan menu favorit Anda langsung dari meja dengan mudah dan cepat.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kumpul Cafe',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#D97706',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="font-sans antialiased min-h-[100dvh] flex flex-col selection:bg-amber-100 selection:text-amber-900">
        <QueryProvider>
          <HandshakeProvider>
            <PwaProvider>
              {children}
              <ToasterProvider />
            </PwaProvider>
          </HandshakeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
