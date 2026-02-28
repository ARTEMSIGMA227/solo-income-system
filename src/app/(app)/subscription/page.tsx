'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n';
import {
  Crown, Check, Zap, ExternalLink,
  Wallet, MessageCircle, Clock, Shield, Star,
  ChevronDown, ChevronUp, Rocket,
} from 'lucide-react';
import { toast } from 'sonner';

type PayMethod = 'crypto' | 'stars' | null;

export default function SubscriptionPage() {
  const { locale } = useT();
  const supabase = createClient();
  const ru = locale === 'ru';

  const [isPro, setIsPro] = useState(false);
  const [proUntil, setProUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState<PayMethod>(null);
  const [showFaq, setShowFaq] = useState<number | null>(null);
  const [tgLinked, setTgLinked] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_pro, pro_until')
        .eq('id', user.id)
        .single();
      if (data) {
        setIsPro(data.is_pro || false);
        setProUntil(data.pro_until);
      }
      const { data: link } = await supabase
        .from('telegram_links')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setTgLinked(!!link);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCryptoPay(asset: string) {
    setCreatingInvoice(true);
    try {
      const res = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset }),
      });
      const data = await res.json();
      if (data.invoice_url) {
        window.open(data.invoice_url, '_blank');
      } else {
        toast.error(ru ? 'Ошибка создания счёта' : 'Failed to create invoice');
      }
    } catch {
      toast.error(ru ? 'Ошибка' : 'Error');
    } finally {
      setCreatingInvoice(false);
    }
  }

  async function handleXRocketPay(currency: string) {
    setCreatingInvoice(true);
    try {
      const res = await fetch('/api/payments/create-invoice-xrocket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency }),
      });
      const data = await res.json();
      if (data.invoice_url) {
        window.open(data.invoice_url, '_blank');
      } else {
        toast.error(ru ? 'Ошибка создания счёта' : 'Failed to create invoice');
      }
    } catch {
      toast.error(ru ? 'Ошибка' : 'Error');
    } finally {
      setCreatingInvoice(false);
    }
  }

  const PRICE_USD = 15;
  const PRICE_STARS = 750;

  const freeFeatures = ru
    ? [
        'До 5 навыков',
        'До 3 целей на навык',
        'До 3 активных квестов',
        '1 босс одновременно',
        '3 фокус-сессии в день',
        'Базовая аналитика (7 дней)',
        'AI советник (3/день)',
        '1 гильдия',
      ]
    : [
        'Up to 5 skills',
        'Up to 3 goals per skill',
        'Up to 3 active quests',
        '1 boss at a time',
        '3 focus sessions/day',
        'Basic analytics (7 days)',
        'AI advisor (3/day)',
        '1 guild',
      ];

  const proFeatures = ru
    ? [
        'Безлимитные навыки',
        'Безлимитные цели',
        'Безлимитные квесты',
        'Безлимитные боссы',
        'Безлимитный фокус',
        'Полная аналитика (365 дней)',
        'AI советник без лимитов',
        'Шаблоны навыков',
        'Группы навыков',
        'Покупка лутбоксов',
        'PDF экспорт',
        'Telegram уведомления',
        'XP множитель x1.5',
        'Gold множитель x1.5',
        'Безлимитные гильдии',
        'Приоритетная поддержка',
      ]
    : [
        'Unlimited skills',
        'Unlimited goals',
        'Unlimited quests',
        'Unlimited bosses',
        'Unlimited focus',
        'Full analytics (365 days)',
        'AI advisor unlimited',
        'Skill templates',
        'Skill groups',
        'Buy lootboxes',
        'PDF export',
        'Telegram notifications',
        'XP multiplier x1.5',
        'Gold multiplier x1.5',
        'Unlimited guilds',
        'Priority support',
      ];

  const faqs = ru
    ? [
        { q: 'Как оплатить?', a: 'Выберите способ оплаты: через CryptoBot, xRocket или Telegram Stars. После оплаты напишите боту @SOLOINCOMESYSTEMBOT — PRO активируется в течение часа.' },
        { q: 'Какие криптовалюты принимаете?', a: 'USDT, TON, BTC и другие — через CryptoBot и xRocket. Выберите удобную валюту при оплате.' },
        { q: 'Можно ли вернуть деньги?', a: 'Да, в течение 3 дней после оплаты, если вы не использовали PRO функции.' },
        { q: 'Что будет когда PRO закончится?', a: 'Ваши данные сохранятся. Навыки сверх лимита станут доступны только для чтения. Продлить подписку можно в любой момент.' },
        { q: 'Как работает оплата Stars?', a: 'Перейдите в бота @SOLOINCOMESYSTEMBOT, нажмите кнопку оплаты. Stars спишутся автоматически.' },
      ]
    : [
        { q: 'How to pay?', a: 'Choose a payment method: CryptoBot, xRocket, or Telegram Stars. After payment, message @SOLOINCOMESYSTEMBOT — PRO activates within an hour.' },
        { q: 'Which cryptocurrencies?', a: 'USDT, TON, BTC and more — via CryptoBot and xRocket. Choose your preferred currency at checkout.' },
        { q: 'Can I get a refund?', a: 'Yes, within 3 days of payment if you haven\'t used PRO features.' },
        { q: 'What happens when PRO expires?', a: 'Your data is preserved. Skills over the limit become read-only. Renew anytime.' },
        { q: 'How does Stars payment work?', a: 'Go to @SOLOINCOMESYSTEMBOT, tap the payment button. Stars are deducted automatically.' },
      ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Crown className="w-7 h-7 text-yellow-400" />
          {ru ? 'Подписка' : 'Subscription'}
        </h1>
        <p className="text-gray-400 mt-2">
          {ru ? 'Разблокируй полную мощь системы' : 'Unlock the full power of the system'}
        </p>
      </div>

      {/* Current Status */}
      {isPro && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-yellow-400 font-bold">
                {ru ? 'PRO активен' : 'PRO Active'} ✅
              </p>
              {proUntil && (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ru ? 'Действует до:' : 'Valid until:'}{' '}
                  {new Date(proUntil).toLocaleDateString(ru ? 'ru-RU' : 'en-US')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-white">Free</h2>
            <div className="text-3xl font-bold text-white mt-2">
              $0
              <span className="text-sm text-gray-400 font-normal">/{ru ? 'мес' : 'mo'}</span>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {freeFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <button
            className="w-full py-2.5 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium cursor-default"
            disabled
          >
            {isPro ? (ru ? 'Базовый план' : 'Basic Plan') : (ru ? 'Текущий план' : 'Current Plan')}
          </button>
        </div>

        {/* PRO */}
        <div className="bg-gray-800/50 border-2 border-yellow-500/30 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">
            PRO
          </div>
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-yellow-400">PRO</h2>
            <div className="text-3xl font-bold text-white mt-2">
              ${PRICE_USD}
              <span className="text-sm text-gray-400 font-normal">/{ru ? 'мес' : 'mo'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ≈ {PRICE_STARS} Telegram Stars
            </p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {proFeatures.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <Zap className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <button className="w-full py-2.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-bold cursor-default">
              {ru ? '✅ Активен' : '✅ Active'}
            </button>
          ) : (
            <button
              onClick={() => setPayMethod(payMethod ? null : 'crypto')}
              className="w-full py-2.5 bg-yellow-500 text-black rounded-lg text-sm font-bold hover:bg-yellow-400 transition-colors"
            >
              {ru ? 'Перейти на PRO' : 'Upgrade to PRO'}
            </button>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      {!isPro && payMethod !== null && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-semibold text-center">
            {ru ? 'Выберите способ оплаты' : 'Choose Payment Method'}
          </h3>

          {/* Method tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setPayMethod('crypto')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                payMethod === 'crypto'
                  ? 'bg-blue-600/20 border-2 border-blue-500/50 text-blue-400'
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Wallet className="w-5 h-5" />
              {ru ? 'Крипто' : 'Crypto'}
            </button>
            <button
              onClick={() => setPayMethod('stars')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                payMethod === 'stars'
                  ? 'bg-purple-600/20 border-2 border-purple-500/50 text-purple-400'
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Star className="w-5 h-5" />
              Telegram Stars
            </button>
          </div>

          {payMethod === 'crypto' && (
            <div className="space-y-4">
              {!tgLinked ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-400 font-medium mb-2">
                    {ru ? '⚠️ Сначала привяжите Telegram' : '⚠️ Link Telegram first'}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    {ru
                      ? 'Для автоматической активации PRO нужна привязка Telegram-аккаунта'
                      : 'Telegram account link is required for automatic PRO activation'}
                  </p>
                  <a
                    href="/settings"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500"
                  >
                    {ru ? 'Перейти в настройки' : 'Go to Settings'}
                  </a>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 text-center">
                    {ru
                      ? `Выберите валюту для оплаты $${PRICE_USD}. PRO активируется автоматически!`
                      : `Choose currency to pay $${PRICE_USD}. PRO activates automatically!`}
                  </p>

                  {/* CryptoBot — USDT */}
                  <button
                    onClick={() => handleCryptoPay('USDT')}
                    disabled={creatingInvoice}
                    className="flex items-center gap-4 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold group-hover:text-blue-400 transition-colors">
                        USDT
                      </p>
                      <p className="text-xs text-gray-500">CryptoBot</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">${PRICE_USD}</p>
                    </div>
                  </button>

                  {/* CryptoBot — TON */}
                  <button
                    onClick={() => handleCryptoPay('TON')}
                    disabled={creatingInvoice}
                    className="flex items-center gap-4 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Rocket className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold group-hover:text-purple-400 transition-colors">
                        TON
                      </p>
                      <p className="text-xs text-gray-500">CryptoBot</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">${PRICE_USD}</p>
                    </div>
                  </button>

                  {/* CryptoBot — BTC */}
                  <button
                    onClick={() => handleCryptoPay('BTC')}
                    disabled={creatingInvoice}
                    className="flex items-center gap-4 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Wallet className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold group-hover:text-yellow-400 transition-colors">
                        BTC
                      </p>
                      <p className="text-xs text-gray-500">CryptoBot</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">${PRICE_USD}</p>
                    </div>
                  </button>

                  {/* xRocket — USDT */}
                  <button
                    onClick={() => handleXRocketPay('USDT')}
                    disabled={creatingInvoice}
                    className="flex items-center gap-4 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 hover:bg-green-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Rocket className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold group-hover:text-green-400 transition-colors">
                        USDT
                      </p>
                      <p className="text-xs text-gray-500">xRocket</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">${PRICE_USD}</p>
                    </div>
                  </button>

                  {/* xRocket — TON */}
                  <button
                    onClick={() => handleXRocketPay('TON')}
                    disabled={creatingInvoice}
                    className="flex items-center gap-4 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 hover:bg-green-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Rocket className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold group-hover:text-green-400 transition-colors">
                        TON
                      </p>
                      <p className="text-xs text-gray-500">xRocket</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">${PRICE_USD}</p>
                    </div>
                  </button>

                  {creatingInvoice && (
                    <p className="text-center text-sm text-gray-400 animate-pulse">
                      {ru ? 'Создаём счёт...' : 'Creating invoice...'}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Telegram Stars */}
          {payMethod === 'stars' && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center">
                <Star className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                <h4 className="text-lg font-bold text-white mb-1">
                  {PRICE_STARS} Stars
                </h4>
                <p className="text-sm text-gray-400 mb-4">
                  {ru
                    ? 'Оплата через Telegram Stars'
                    : 'Pay via Telegram Stars'}
                </p>

                <div className="text-left space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">1</span>
                    <span className="text-sm text-gray-300">
                      {ru ? 'Откройте бота @SOLOINCOMESYSTEMBOT' : 'Open @SOLOINCOMESYSTEMBOT'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">2</span>
                    <span className="text-sm text-gray-300">
                      {ru ? 'Напишите "PRO" или нажмите кнопку оплаты' : 'Write "PRO" or tap the payment button'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-purple-500/20 text-purple-400 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">3</span>
                    <span className="text-sm text-gray-300">
                      {ru ? 'Подтвердите оплату Stars' : 'Confirm Stars payment'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">✓</span>
                    <span className="text-sm text-gray-300">
                      {ru ? 'PRO активируется!' : 'PRO activates!'}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href="https://t.me/SOLOINCOMESYSTEMBOT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-500 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {ru ? 'Открыть бота' : 'Open Bot'}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Guarantee */}
      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-400">
              {ru ? 'Гарантия возврата' : 'Money-back Guarantee'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {ru
                ? 'Если PRO не понравится — вернём деньги в течение 3 дней, без вопросов'
                : "If you don't like PRO — full refund within 3 days, no questions asked"}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold mb-4">
          {ru ? 'Частые вопросы' : 'FAQ'}
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowFaq(showFaq === i ? null : i)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-left text-white hover:bg-gray-800/50 transition-colors"
              >
                <span className="font-medium">{faq.q}</span>
                {showFaq === i
                  ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {showFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-400">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}