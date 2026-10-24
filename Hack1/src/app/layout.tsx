import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ToastContainer } from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'ClubOps: University Club and Society Operations Platform',
  description: 'Manage members, user-defined roles, events, tasks, availability, and communications with built-in AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
