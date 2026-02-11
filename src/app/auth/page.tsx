'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Проверяем — может уже залогинен
  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/dashboard');
      } else {
        setChecking(false);
      }
    }
    check();
  }, [router, supabase.auth]);

  // Слушаем изменения авторизации
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  async function handleLogin() {
    if (!email || !password) {
      toast.error('Заполни email и пароль');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      toast.error('Ошибка входа: ' + error.message);
      return;
    }

    toast.success('Добро пожаловать, Охотник!');
  }

  async function handleRegister() {
    if (!email || !password || !displayName) {
      toast.error('Заполни все поля');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    setLoading(false);

    if (error) {
      toast.error('Ошибка: ' + error.message);
      return;
    }

    toast.success('Аккаунт создан! Входим...');
  }

  // Пока проверяем сессию — показываем загрузку
  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#0a0a0f', color: '#a78bfa',
        fontSize: '24px',
      }}>
        ⚔️ Проверка сессии...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0f',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
      padding: '16px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚔️</div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#a78bfa' }}>
            Solo Income System
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>
            Система прокачки дохода
          </p>
        </div>

        <div style={{
          backgroundColor: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '12px',
          padding: '24px',
        }}>

          <div style={{
            display: 'flex',
            marginBottom: '24px',
            backgroundColor: '#16161f',
            borderRadius: '8px',
            padding: '4px',
          }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                backgroundColor: isLogin ? '#7c3aed' : 'transparent',
                color: isLogin ? '#fff' : '#94a3b8',
              }}
            >
              Вход
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1, padding: '8px', borderRadius: '6px',
                border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                backgroundColor: !isLogin ? '#7c3aed' : 'transparent',
                color: !isLogin ? '#fff' : '#94a3b8',
              }}
            >
              Регистрация
            </button>
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
                Имя охотника
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Твоё имя"
                style={{
                  width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
                  border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hunter@example.com"
              autoComplete="email"
              style={{
                width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
                border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '4px' }}>
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  isLogin ? handleLogin() : handleRegister();
                }
              }}
              style={{
                width: '100%', padding: '12px 16px', backgroundColor: '#16161f',
                border: '1px solid #1e1e2e', borderRadius: '8px', color: '#e2e8f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
              }}
            />
          </div>

          <button
            onClick={isLogin ? handleLogin : handleRegister}
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: loading ? '#4c1d95' : '#7c3aed',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '⏳ Загрузка...' : isLogin ? '⚔️ Войти в систему' : '🏹 Начать охоту'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '24px' }}>
          Цель: 150 000 ₽/мес. Без оправданий.
        </p>
      </div>
    </div>
  );
}