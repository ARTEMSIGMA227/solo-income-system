"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [dailyTarget, setDailyTarget] = useState(30);
  const [monthlyTarget, setMonthlyTarget] = useState(150000);
  const [penaltyXP, setPenaltyXP] = useState(100);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { 
        window.location.href = "/auth";
        return; 
      }
      setUser(u);

      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).single();
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name || "");
        setDailyTarget(p.daily_actions_target || 30);
        setMonthlyTarget(p.monthly_income_target || 150000);
        setPenaltyXP(p.penalty_xp || 100);
        setNotificationsEnabled(p.notifications_enabled ?? true);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({
      display_name: displayName.trim() || "Охотник",
      daily_actions_target: dailyTarget,
      monthly_income_target: monthlyTarget,
      penalty_xp: penaltyXP,
      notifications_enabled: notificationsEnabled,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (error) toast.error("Ошибка сохранения");
    else toast.success("Настройки сохранены");
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  async function handleResetProgress() {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("stats").update({
      level: 1, current_xp: 0, total_xp_earned: 0, total_xp_lost: 0,
      total_actions: 0, total_income: 0, total_sales: 0,
      gold: 0, total_gold_earned: 0, total_gold_spent: 0,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);

    await supabase.from("profiles").update({
      streak_current: 0, streak_best: 0, consecutive_misses: 0,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    toast.success("Прогресс сброшен");
    setShowResetConfirm(false);
    window.location.reload();
  }

  async function handleDeleteAccount() {
    if (deleteText !== "УДАЛИТЬ" || !user) return;
    const supabase = createClient();
    
    await supabase.from("completions").delete().eq("user_id", user.id);
    await supabase.from("xp_events").delete().eq("user_id", user.id);
    await supabase.from("gold_events").delete().eq("user_id", user.id);
    await supabase.from("income_events").delete().eq("user_id", user.id);
    await supabase.from("stats").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();

    toast.success("Аккаунт удалён");
    window.location.href = "/auth";
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f", color: "#a78bfa" }}>
        ⚙️ Загрузка...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", backgroundColor: "#16161f",
    border: "1px solid #1e1e2e", borderRadius: "8px", color: "#e2e8f0",
    fontSize: "14px", outline: "none",
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#12121a", border: "1px solid #1e1e2e",
    borderRadius: "12px", padding: "16px", marginBottom: "12px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px", color: "#94a3b8", marginBottom: "6px", display: "block",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", color: "#e2e8f0", padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>⚙️ Настройки</h1>

      {/* Профиль */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>👤 Профиль</div>
        <label style={labelStyle}>Имя охотника</label>
        <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Имя" />
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Email</label>
          <div style={{ ...inputStyle, color: "#64748b", backgroundColor: "#0f0f17" }}>{user?.email || "—"}</div>
        </div>
      </div>

      {/* Цели */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>🎯 Цели</div>
        <label style={labelStyle}>Действий в день</label>
        <input style={inputStyle} type="number" value={dailyTarget} onChange={(e) => setDailyTarget(Number(e.target.value))} min={1} max={500} />
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Цель дохода в месяц (₽)</label>
          <input style={inputStyle} type="number" value={monthlyTarget} onChange={(e) => setMonthlyTarget(Number(e.target.value))} min={1000} />
        </div>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>Штраф XP за пропуск</label>
          <input style={inputStyle} type="number" value={penaltyXP} onChange={(e) => setPenaltyXP(Number(e.target.value))} min={0} max={1000} />
        </div>
      </div>

      {/* Уведомления */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>🔔 Уведомления</div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} style={{ accentColor: "#7c3aed", width: "18px", height: "18px" }} />
          <span style={{ fontSize: "14px" }}>Push-уведомления</span>
        </label>
      </div>

      {/* Telegram */}
      {botUsername && (
        <div style={cardStyle}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>🤖 Telegram бот</div>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Подключи бота для уведомлений</p>
          <a href={`https://t.me/${botUsername}?start=${user?.id || ""}`} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", padding: "10px 20px", backgroundColor: "#2563eb", color: "#fff",
            borderRadius: "10px", fontSize: "14px", fontWeight: 600, textDecoration: "none",
          }}>🤖 Подключить бота</a>
        </div>
      )}

      {/* Сохранить */}
      <button onClick={handleSave} disabled={saving} style={{
        width: "100%", padding: "14px", backgroundColor: "#7c3aed", color: "#fff",
        border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, marginBottom: "24px",
      }}>{saving ? "Сохраняю..." : "💾 Сохранить настройки"}</button>

      {/* Опасная зона */}
      <div style={{ ...cardStyle, borderColor: "#ef444430" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "#ef4444" }}>⚠️ Опасная зона</div>

        {/* Выход - желтая */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#f59e0b20",
            color: "#f59e0b", border: "1px solid #f59e0b50", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "12px",
          }}>🚪 Выйти из аккаунта</button>
        ) : (
          <div style={{ marginBottom: "12px", padding: "16px", backgroundColor: "#f59e0b10", borderRadius: "10px", border: "1px solid #f59e0b40" }}>
            <p style={{ fontSize: "13px", color: "#f59e0b", marginBottom: "12px", fontWeight: 600 }}>Выйти из аккаунта?</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleLogout} style={{ flex: 1, padding: "10px", backgroundColor: "#f59e0b", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Да, выйти</button>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}

        {/* Сброс - красная */}
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#ef444420",
            color: "#ef4444", border: "1px solid #ef444450", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "12px",
          }}>🔄 Сбросить весь прогресс</button>
        ) : (
          <div style={{ marginBottom: "12px", padding: "16px", backgroundColor: "#ef444410", borderRadius: "10px", border: "1px solid #ef444440" }}>
            <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>Уровень, XP, золото, серия — всё обнулится. Ты уверен?</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleResetProgress} style={{ flex: 1, padding: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Да, сбросить</button>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}

        {/* Удаление - темно-красная */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#dc262620",
            color: "#dc2626", border: "1px solid #dc262650", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
          }}>🗑️ Удалить аккаунт навсегда</button>
        ) : (
          <div style={{ padding: "16px", backgroundColor: "#dc262610", borderRadius: "10px", border: "1px solid #dc262640" }}>
            <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "10px", fontWeight: 600 }}>Введи УДАЛИТЬ для подтверждения</p>
            <input style={{ ...inputStyle, borderColor: "#dc262660", marginBottom: "12px" }} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder="Введи УДАЛИТЬ" />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleDeleteAccount} disabled={deleteText !== "УДАЛИТЬ"} style={{
                flex: 1, padding: "10px", backgroundColor: deleteText === "УДАЛИТЬ" ? "#dc2626" : "#1e1e2e",
                color: deleteText === "УДАЛИТЬ" ? "#fff" : "#64748b", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 700, cursor: deleteText === "УДАЛИТЬ" ? "pointer" : "not-allowed",
              }}>Удалить навсегда</button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>Отмена</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "40px" }} />
    </div>
  );
}