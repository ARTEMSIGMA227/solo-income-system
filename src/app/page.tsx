'use client';

export default function Home() {
  // Middleware handles redirect to /auth or /dashboard
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      color: '#a78bfa',
      fontSize: '24px',
    }}>
      ⚔️ Загрузка...
    </div>
  );
}