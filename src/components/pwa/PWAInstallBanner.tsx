'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
    setIsStandalone(!!standalone);

    if (standalone) return;

    // Check if dismissed recently (use cookie since localStorage not available)
    const cookies = document.cookie.split(';').map(c => c.trim());
    const dismissCookie = cookies.find(c => c.startsWith('pwa_dismissed='));
    if (dismissCookie) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: show banner on mobile after 5s even without event (iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let timeout: ReturnType<typeof setTimeout> | null = null;
    if (isIOS) {
      timeout = setTimeout(() => setShowBanner(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    // Set cookie for 7 days
    document.cookie = 'pwa_dismissed=1; path=/; max-age=604800; SameSite=Lax';
  }

  if (isStandalone || !showBanner || dismissed) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div style={{
      position: 'fixed',
      bottom: '70px',
      left: '12px',
      right: '12px',
      backgroundColor: '#1a1a2e',
      border: '1px solid #7c3aed40',
      borderRadius: '16px',
      padding: '16px',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(124, 58, 237, 0.15)',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          fontSize: '32px',
          flexShrink: 0,
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#7c3aed20',
          borderRadius: '12px',
        }}>
          ⚔️
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0', marginBottom: '4px' }}>
            Установи Solo Income
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
            {isIOS
              ? 'Нажми «Поделиться» → «На экран Домой» для быстрого доступа'
              : 'Работай офлайн, получай уведомления, запускай одним тапом'
            }
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📲 Установить
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #1e1e2e',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Позже
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
