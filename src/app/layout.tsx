import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gulshan Club — Member Relationship Tree',
  description: 'Gulshan Club Limited Membership Relationship Tree',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className={inter.className}>{children}</body>
    </html>
  );
} 