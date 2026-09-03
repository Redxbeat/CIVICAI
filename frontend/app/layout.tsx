import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CIVICAI',
  description: 'Citizen Intelligence & Vision for Infrastructure Coordination using AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
