import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'One2One Love - Relationship Wellness Platform',
  description: 'Build deeper connections, resolve conflicts, and create lasting love',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

