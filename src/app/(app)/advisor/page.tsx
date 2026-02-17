"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateAdvice } from "@/lib/advisor";
import { AdvisorCard } from "@/components/advisor/AdvisorCard";
import { useRouter } from "next/navigation";

export default function AdvisorPage() {
  const [greeting, setGreeting] = useState("");
  const [advice, setAdvice] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
      });

      setGreeting(result.greeting);
      setAdvice(result.advice);
      setLoading(false);
    }

    load();
  }, [router]);

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
        🤖 Советник анализирует данные...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0f",
        color: "#e2e8f0",
        padding: "16px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🤖</span>
          <h1
            style={{ fontSize: "22px", fontWeight: 800, color: "#a78bfa" }}
          >
            AI-Советник
          </h1>
        </div>
        <p style={{ fontSize: "13px", color: "#94a3b8" }}>
          Персональные рекомендации на основе твоих данных
        </p>
      </div>

      {advice.length > 0 ? (
        <AdvisorCard greeting={greeting} advice={advice} />
      ) : (
        <div
          style={{
            backgroundColor: "#12121a",
            border: "1px solid #1e1e2e",
            borderRadius: "12px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "#94a3b8" }}>
            Недостаточно данных для анализа. Выполни несколько квестов!
          </p>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#12121a",
          border: "1px solid #1e1e2e",
          borderRadius: "12px",
          padding: "16px",
          marginTop: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: "8px",
          }}
        >
          Как работает советник?
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <span>📊 Анализирует streak, действия, доход и прогресс</span>
          <span>🎯 Определяет приоритетную область для роста</span>
          <span>💡 Даёт конкретные советы для текущей ситуации</span>
          <span>⏰ Учитывает время суток и день недели</span>
        </div>
      </div>

      <div style={{ height: "32px" }} />
    </div>
  );
}