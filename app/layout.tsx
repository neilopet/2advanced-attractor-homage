import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Attractor — Six Worlds',
  description:
    'An interactive homage to the immersive worlds of 2Advanced V5 Attractor.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
