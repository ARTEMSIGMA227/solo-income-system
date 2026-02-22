'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useT();

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      toast.error(t.auth.fillEmailPassword);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error(t.auth.loginError + error.message);
      return;
    }

    toast.success(t.auth.welcomeHunter);
    router.replace('/dashboard');
  }, [email, password, router, t]);

  const handleRegister = useCallback(async () => {
    if (!email || !password || !displayName) {
      toast.error(t.auth.fillAllFields);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(t.auth.registerError + error.message);
      return;
    }

    toast.success(t.auth.accountCreated);
    router.replace('/dashboard');
  }, [email, password, displayName, router, t]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: '#e2e8f0',
        fontFamily: 'Inter, sans-serif',
        padding: '16px',
        position: 'relative',
      }}
    >
      {/* Language toggle in top-right corner */}
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <LanguageToggle />
      </div>

      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#a78bfa' }}>
            {t.auth.title}
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>{t.auth.subtitle}</p>
        </div>

        <div
          style={{
            backgroundColor: '#12121a',
            border: '1px solid #1e1e2e',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              marginBottom: '24px',
              backgroundColor: '#16161f',
              borderRadius: '8px',
              padding: '4px',
            }}
          >
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: isLogin ? '#7c3aed' : 'transparent',
                color: isLogin ? '#fff' : '#94a3b8',
              }}
            >
              {t.auth.login}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: !isLogin ? '#7c3aed' : 'transparent',
                color: !isLogin ? '#fff' : '#94a3b8',
              }}
            >
              {t.auth.register}
            </button>
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                {t.auth.hunterName}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t.auth.hunterNamePlaceholder}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#16161f',
                  border: '1px solid #1e1e2e',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                color: '#94a3b8',
                marginBottom: '4px',
              }}
            >
              {t.auth.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPlaceholder}
              autoComplete="email"
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#16161f',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                color: '#94a3b8',
                marginBottom: '4px',
              }}
            >
              {t.auth.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPlaceholder}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void (isLogin ? handleLogin() : handleRegister());
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#16161f',
                border: '1px solid #1e1e2e',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
          </div>

          <button
            onClick={() => void (isLogin ? handleLogin() : handleRegister())}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#4c1d95' : '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? t.auth.loadingButton
              : isLogin
                ? t.auth.loginButton
                : t.auth.registerButton}
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: '12px',
            marginTop: '24px',
          }}
        >
          {t.auth.footer}
        </p>
      </div>
    </div>
  );
}