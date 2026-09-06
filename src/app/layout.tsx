import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { CTF_CONFIG } from '@/lib/config';
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: CTF_CONFIG.name,
  description: CTF_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080d0b] text-[#e6f7ef] selection:bg-[#00ff41]/30 selection:text-[#00ff41]">
        <AuthProvider>
          <Navbar ctfName={CTF_CONFIG.name} />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer ctfName={CTF_CONFIG.name} ctfDescription={CTF_CONFIG.description} />
        </AuthProvider>
      </body>
    </html>
  );
}
