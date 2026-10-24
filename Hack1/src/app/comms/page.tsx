'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CommsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/social');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Redirecting to Social & Broadcast Hub...
      </div>
    </div>
  );
}
