"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateAdvice } from "@/lib/advisor";
import { generateChatResponse } from "@/lib/advisor-chat";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useProfile } from "@/hooks/use-profile";
import { canUseAI, PRO_LIMITS } from "@/lib/pro";
import { ProLimitBadge } from "@/components/ui/pro-gate";
import { Crown, Send, Bot, User } from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
  tips?: string[];
  time: string;
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [requestsToday, setRequestsToday] = useState(0);
  const [chatContext, setChatContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t, locale } = useT();
  const { data: proProfile } = useProfile();

  const isPro = proProfile?.is_pro === true;
  const canAsk = canUseAI(requestsToday, isPro);

  function getTimeStr() {
    return new Date().toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: stats } = await supabase
        .from("stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile || !stats) {
        setLoading(false);
        return;
      }

      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Europe/Berlin",
      });

      const { data: advisorEvents } = await supabase
        .from("xp_events")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_type", "advisor")
        .eq("event_date", today);
      setRequestsToday(advisorEvents?.length || 0);

      const { data: completions } = await supabase
        .from("completions")
        .select("count_done")
        .eq("user_id", user.id)
        .eq("completion_date", today);

      const todayActions =
        completions?.reduce(
          (sum: number, c: { count_done: number }) => sum + c.count_done,
          0
        ) ?? 0;

      const { data: incomeToday } = await supabase
        .from("income_events")
        .select("amount")
        .eq("user_id", user.id)
        .eq("event_date", today);

      const todayIncome =
        incomeToday?.reduce(
          (sum: number, i: { amount: number }) => sum + Number(i.amount),
          0
        ) ?? 0;

      const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

      const { data: incomeMonth } = await supabase
        .from("income_events")
        .select("amount")
        .eq("user_id", user.id)
        .gte("event_date", monthStart);

      const monthIncome =
        incomeMonth?.reduce(
          (sum: number, i: { amount: number }) => sum + Number(i.amount),
          0
        ) ?? 0;

      const ctx = {
        stats,
        profile,
        todayActions,
        todayIncome,
        monthIncome,
        t,
        locale,
      };
      setChatContext(ctx);

      const now = new Date();
      const result = generateAdvice({
        stats,
        profile,
        todayActions,
        todayIncome,
        monthIncome,
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        dayOfMonth: now.getDate(),
        daysInMonth: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        ).getDate(),
        t,
      });

      const welcomeMsg: ChatMessage = {
        role: "bot",
        text: result.greeting,
        tips: result.advice,
        time: getTimeStr(),
      };
      setMessages([welcomeMsg]);
      setLoading(false);
    }

    load();
  }, [router, t, locale]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !chatContext || sending) return;

    if (!canAsk) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: input.trim(),
      time: getTimeStr(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const response = generateChatResponse(input.trim(), chatContext);

    const botMsg: ChatMessage = {
      role: "bot",
      text: response.text,
      tips: response.tips,
      time: getTimeStr(),
    };
    setMessages((prev) => [...prev, botMsg]);

    const newCount = requestsToday + 1;
    setRequestsToday(newCount);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Europe/Berlin",
      });
      await supabase.from("xp_events").insert({
        user_id: user.id,
        event_type: "advisor",
        xp_amount: 0,
        description: `Chat: ${input.trim().slice(0, 50)}`,
        event_date: today,
      });
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const quickQuestions = locale === "ru"
    ? ["Как увеличить доход?", "Нет мотивации", "Какая стратегия лучше?", "Как быть продуктивнее?"]
    : ["How to increase income?", "No motivation", "Best strategy?", "How to be productive?"];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          color: "#a78bfa",
          fontSize: "18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "24px",
            height: "24px",
            border: "3px solid #7c3aed30",
            borderTopColor: "#a78bfa",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
          {locale === "ru" ? "Советник анализирует..." : "Advisor analyzing..."}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0f",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #1e1e2e",
          backgroundColor: "#0a0a0f",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 700, lineHeight: 1.2 }}>
                {t.advisor.title}
              </h1>
              <div style={{ fontSize: "11px", color: "#22c55e" }}>
                {locale === "ru" ? "онлайн" : "online"}
              </div>
            </div>
          </div>
          <ProLimitBadge
            current={requestsToday}
            max={PRO_LIMITS.FREE_AI_PER_DAY}
            isPro={isPro}
          />
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "8px",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                maxWidth: "85%",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: msg.role === "bot" ? "#7c3aed" : "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {msg.role === "bot" ? <Bot size={14} color="#fff" /> : <User size={14} color="#fff" />}
              </div>

              {/* Bubble */}
              <div
                style={{
                  backgroundColor: msg.role === "user" ? "#7c3aed" : "#12121a",
                  border: msg.role === "user" ? "none" : "1px solid #1e1e2e",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                  maxWidth: "100%",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: msg.role === "user" ? "#fff" : "#e2e8f0",
                    fontWeight: msg.tips ? 600 : 400,
                  }}
                >
                  {msg.text}
                </div>

                {msg.tips && msg.tips.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                    {msg.tips.map((tip, j) => (
                      <div
                        key={j}
                        style={{
                          fontSize: "12px",
                          lineHeight: 1.5,
                          color: "#cbd5e1",
                          padding: "8px 10px",
                          backgroundColor: "#16161f",
                          borderRadius: "8px",
                          borderLeft: "3px solid #7c3aed40",
                        }}
                      >
                        {tip}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Time */}
            <div
              style={{
                fontSize: "10px",
                color: "#475569",
                marginTop: "4px",
                paddingLeft: msg.role === "user" ? "0" : "36px",
                paddingRight: msg.role === "user" ? "36px" : "0",
              }}
            >
              {msg.time}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Bot size={14} color="#fff" />
            </div>
            <div
              style={{
                backgroundColor: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: "16px 16px 16px 4px",
                padding: "12px 16px",
                display: "flex",
                gap: "4px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#a78bfa",
                    animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && canAsk && (
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            flexShrink: 0,
          }}
        >
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(q);
                setTimeout(() => handleSend(), 50);
              }}
              style={{
                padding: "6px 12px",
                backgroundColor: "#16161f",
                border: "1px solid #7c3aed30",
                borderRadius: "20px",
                color: "#a78bfa",
                cursor: "pointer",
                fontSize: "12px",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #1e1e2e",
          backgroundColor: "#0a0a0f",
          position: "sticky",
          bottom: 0,
        }}
      >
        {canAsk ? (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === "ru" ? "Задайте вопрос советнику..." : "Ask your advisor..."}
              disabled={sending}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: "#12121a",
                border: "1px solid #1e1e2e",
                borderRadius: "24px",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "none",
                backgroundColor: input.trim() && !sending ? "#7c3aed" : "#1e1e2e",
                color: input.trim() && !sending ? "#fff" : "#475569",
                cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "12px",
              backgroundColor: "#7c3aed10",
              border: "1px solid #7c3aed30",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "4px" }}>
              {locale === "ru"
                ? `Лимит ${PRO_LIMITS.FREE_AI_PER_DAY} сообщений/день исчерпан`
                : `${PRO_LIMITS.FREE_AI_PER_DAY} messages/day limit reached`}
            </div>
            <Link
              href="/subscription"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#c084fc",
              }}
            >
              <Crown size={12} />
              {locale === "ru" ? "Безлимит с PRO" : "Unlimited with PRO"}
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}