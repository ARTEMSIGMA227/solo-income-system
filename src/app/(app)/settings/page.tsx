'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#e2e8f0',
      padding: '16px',
      maxWidth: '600px',
      margin: '0 auto',
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
        ⚙️ Настройки
      </h1>

      <div style={{
        backgroundColor: '#12121a',
        border: '1px solid #1e1e2e',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '12px',
      }}>
        <button
          onClick={() => router.push('/analytics')}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#16161f',
            border: '1px solid #1e1e2e',
            borderRadius: '10px',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
            marginBottom: '8px',
          }}
        >
          📈 Аналитика
        </button>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#16161f',
            border: '1px solid #ef444430',
            borderRadius: '10px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'left',
          }}
        >
          🚪 Выйти из системы
        </button>
      </div>
    </div>
  );
}