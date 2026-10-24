import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ToastContainer } from '@/components/ToastContainer';

export const metadata: Metadata = {
  title: 'Rally: University Club and Society Operations Platform',
  description: 'Enterprise university society operations platform for managing members, teams, tasks, events, and communications.',
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
