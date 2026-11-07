import type { Metadata, Viewport } from 'next';
import { Noto_Sans_TC } from 'next/font/google';
import './globals.css';
import { PwaRegister } from './pwa-register';

const notoSansTc = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TOEIC 錯題記憶庫',
  description: '找出你在 TOEIC 閱讀中反覆失分的模式，並安排下一次最有效的複習。',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '錯題本',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={notoSansTc.variable} style={{ fontFamily: 'var(--font-noto), sans-serif' }}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
