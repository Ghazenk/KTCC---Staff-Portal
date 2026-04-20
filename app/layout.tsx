import type {Metadata} from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata: Metadata = {
  title: 'KTCC (Kech Thalassemia Care Center)',
  description: 'Data entry portal for KTCC records.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body className="bg-surface-main text-on-surfacemain font-sans antialiased min-h-screen" suppressHydrationWarning>{children}</body>
    </html>
  );
}
