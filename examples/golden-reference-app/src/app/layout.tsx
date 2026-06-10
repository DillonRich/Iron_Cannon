import type { ReactNode } from 'react';

export const metadata = {
  title: 'Iron Cannon Demo SaaS',
  description: 'Golden reference app for SD-01 starter scope validation',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
