"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { Copy } from "lucide-react";
import { useT } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

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

  const [tgLinked, setTgLinked] = useState(false);
  const [tgUsername, setTgUsername] = useState<string | null>(null);
  const [tgToken, setTgToken] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState("");
  const [tgLoading, setTgLoading] = useState(false);

  const { t, locale, setLocale } = useT();

  // Delete confirmation word depends on locale
  const deleteWord = locale === 'ru' ? 'УДАЛИТЬ' : 'DELETE';

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

      try {
        const res = await fetch("/api/telegram/link");
        const data = await res.json();
        setTgLinked(data.linked);
        setTgUsername(data.username);
      } catch (err) {
        console.error("Failed to check TG status", err);
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
      display_name: displayName.trim() || t.common.hunter,
      daily_actions_target: dailyTarget,
      monthly_income_target: monthlyTarget,
      penalty_xp: penaltyXP,
      notifications_enabled: notificationsEnabled,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);

    if (error) toast.error(t.settings.saveError);
    else toast.success(t.settings.saved);
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

    toast.success(t.settings.danger.resetDone);
    setShowResetConfirm(false);
    window.location.reload();
  }

  async function handleDeleteAccount() {
    if (deleteText !== deleteWord || !user) return;
    const supabase = createClient();

    await supabase.from("completions").delete().eq("user_id", user.id);
    await supabase.from("xp_events").delete().eq("user_id", user.id);
    await supabase.from("gold_events").delete().eq("user_id", user.id);
    await supabase.from("income_events").delete().eq("user_id", user.id);
    await supabase.from("stats").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();

    toast.success(t.settings.danger.deleted);
    window.location.href = "/auth";
  }

  async function generateTgToken() {
    setTgLoading(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const data = await res.json();
      if (data.token) {
        setTgToken(data.token);
        setBotUsername(data.botUsername);
      } else {
        toast.error(t.settings.telegram.errorCode);
      }
    } catch {
      toast.error(t.settings.telegram.errorConnection);
    } finally {
      setTgLoading(false);
    }
  }

  async function unlinkTelegram() {
    if (!confirm(t.settings.telegram.unlinkConfirm)) return;
    try {
      await fetch("/api/telegram/link", { method: "DELETE" });
      setTgLinked(false);
      setTgUsername(null);
      toast.success(t.settings.telegram.unlinked);
    } catch {
      toast.error(t.settings.telegram.errorUnlink);
    }
  }

  const copyToken = () => {
    if (tgToken) {
      navigator.clipboard.writeText(`/start ${tgToken}`);
      toast.success(t.settings.telegram.copied);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f", color: "#a78bfa" }}>
        ⚙️ {t.common.loading}
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
      <h1 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>{t.settings.title}</h1>

      {/* Profile */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{t.settings.profile.title}</div>
        <label style={labelStyle}>{t.settings.profile.name}</label>
        <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.settings.profile.namePlaceholder} />
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>{t.settings.profile.email}</label>
          <div style={{ ...inputStyle, color: "#64748b", backgroundColor: "#0f0f17" }}>{user?.email || "—"}</div>
        </div>
      </div>

      {/* Language */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{t.settings.language.title}</div>
        <label style={labelStyle}>{t.settings.language.label}</label>
        <div style={{ display: "flex", gap: "8px" }}>
          {([
            { value: 'en' as Locale, label: t.settings.language.en, flag: '🇬🇧' },
            { value: 'ru' as Locale, label: t.settings.language.ru, flag: '🇷🇺' },
          ]).map((lang) => {
            const isSelected = locale === lang.value;
            return (
              <button
                key={lang.value}
                type="button"
                onClick={() => setLocale(lang.value)}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #7c3aed" : "1px solid #1e1e2e",
                  backgroundColor: isSelected ? "#7c3aed15" : "#16161f",
                  color: isSelected ? "#a78bfa" : "#94a3b8",
                  fontSize: "14px",
                  fontWeight: isSelected ? 700 : 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <span style={{ fontSize: "18px" }}>{lang.flag}</span>
                {lang.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Goals */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{t.settings.goals.title}</div>
        <label style={labelStyle}>{t.settings.goals.dailyActions}</label>
        <input style={inputStyle} type="number" value={dailyTarget} onChange={(e) => setDailyTarget(Number(e.target.value))} min={1} max={500} />
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>{t.settings.goals.monthlyIncome}</label>
          <input style={inputStyle} type="number" value={monthlyTarget} onChange={(e) => setMonthlyTarget(Number(e.target.value))} min={1000} />
        </div>
        <div style={{ marginTop: "12px" }}>
          <label style={labelStyle}>{t.settings.goals.penaltyXP}</label>
          <input style={inputStyle} type="number" value={penaltyXP} onChange={(e) => setPenaltyXP(Number(e.target.value))} min={0} max={1000} />
        </div>
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>{t.settings.notifications.title}</div>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} style={{ accentColor: "#7c3aed", width: "18px", height: "18px" }} />
          <span style={{ fontSize: "14px" }}>{t.settings.notifications.push}</span>
        </label>
      </div>

      {/* Telegram */}
      <div style={cardStyle}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          {t.settings.telegram.title}
          {tgLinked && <span style={{ fontSize: "10px", backgroundColor: "#22c55e20", color: "#22c55e", padding: "2px 6px", borderRadius: "4px" }}>{t.settings.telegram.connected}</span>}
        </div>

        {tgLinked ? (
          <div>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "8px" }}>
              {t.settings.telegram.linkedTo} <span style={{ color: "#fff" }}>@{tgUsername || "?"}</span>
            </p>
            <button
              onClick={unlinkTelegram}
              style={{ padding: "8px 12px", backgroundColor: "#ef444420", color: "#ef4444", border: "1px solid #ef444450", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              {t.settings.telegram.unlink}
            </button>
          </div>
        ) : (
          <div>
            {!tgToken ? (
              <div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
                  {t.settings.telegram.step1}
                </p>
                <button
                  onClick={generateTgToken}
                  disabled={tgLoading}
                  style={{ width: "100%", padding: "10px", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: tgLoading ? 0.7 : 1 }}
                >
                  {tgLoading ? t.settings.telegram.generating : t.settings.telegram.getCode}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px" }}>
                  {t.settings.telegram.step1}<br/>
                  {t.settings.telegram.step2}
                </p>
                <div
                  onClick={copyToken}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backgroundColor: "#000", padding: "12px", borderRadius: "8px",
                    border: "1px dashed #4b5563", cursor: "pointer", marginBottom: "12px"
                  }}
                >
                  <code style={{ fontSize: "16px", color: "#a78bfa", fontWeight: "bold" }}>/start {tgToken}</code>
                  <Copy size={16} style={{ color: "#9ca3af" }} />
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <a
                    href={`https://t.me/${botUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flex: 1, padding: "10px", backgroundColor: "#2563eb", color: "#fff", textAlign: "center", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
                  >
                    {t.settings.telegram.goToBot}
                  </a>
                  <button
                    onClick={() => setTgToken(null)}
                    style={{ padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}
                  >
                    {t.common.back}
                  </button>
                </div>
                <p style={{ fontSize: "10px", color: "#64748b", marginTop: "8px", textAlign: "center" }}>
                  {t.settings.telegram.codeExpiry}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving} style={{
        width: "100%", padding: "14px", backgroundColor: "#7c3aed", color: "#fff",
        border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
        cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, marginBottom: "24px",
      }}>{saving ? t.common.saving : t.settings.saveBtn}</button>

      {/* Danger Zone */}
      <div style={{ ...cardStyle, borderColor: "#ef444430" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "16px", color: "#ef4444" }}>{t.settings.danger.title}</div>

        {/* Logout */}
        {!showLogoutConfirm ? (
          <button onClick={() => setShowLogoutConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#f59e0b20",
            color: "#f59e0b", border: "1px solid #f59e0b50", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "12px",
          }}>{t.settings.danger.logout}</button>
        ) : (
          <div style={{ marginBottom: "12px", padding: "16px", backgroundColor: "#f59e0b10", borderRadius: "10px", border: "1px solid #f59e0b40" }}>
            <p style={{ fontSize: "13px", color: "#f59e0b", marginBottom: "12px", fontWeight: 600 }}>{t.settings.danger.logoutConfirm}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleLogout} style={{ flex: 1, padding: "10px", backgroundColor: "#f59e0b", color: "#000", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{t.settings.danger.logoutYes}</button>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>{t.common.cancel}</button>
            </div>
          </div>
        )}

        {/* Reset */}
        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#ef444420",
            color: "#ef4444", border: "1px solid #ef444450", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "12px",
          }}>{t.settings.danger.reset}</button>
        ) : (
          <div style={{ marginBottom: "12px", padding: "16px", backgroundColor: "#ef444410", borderRadius: "10px", border: "1px solid #ef444440" }}>
            <p style={{ fontSize: "13px", color: "#ef4444", marginBottom: "12px" }}>{t.settings.danger.resetConfirm}</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleResetProgress} style={{ flex: 1, padding: "10px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>{t.settings.danger.resetYes}</button>
              <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>{t.common.cancel}</button>
            </div>
          </div>
        )}

        {/* Delete */}
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width: "100%", padding: "12px", backgroundColor: "#dc262620",
            color: "#dc2626", border: "1px solid #dc262650", borderRadius: "10px",
            fontSize: "14px", fontWeight: 700, cursor: "pointer",
          }}>{t.settings.danger.delete}</button>
        ) : (
          <div style={{ padding: "16px", backgroundColor: "#dc262610", borderRadius: "10px", border: "1px solid #dc262640" }}>
            <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "10px", fontWeight: 600 }}>{t.settings.danger.deleteConfirm}</p>
            <input style={{ ...inputStyle, borderColor: "#dc262660", marginBottom: "12px" }} value={deleteText} onChange={(e) => setDeleteText(e.target.value)} placeholder={t.settings.danger.deleteTyping} />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleDeleteAccount} disabled={deleteText !== deleteWord} style={{
                flex: 1, padding: "10px", backgroundColor: deleteText === deleteWord ? "#dc2626" : "#1e1e2e",
                color: deleteText === deleteWord ? "#fff" : "#64748b", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 700, cursor: deleteText === deleteWord ? "pointer" : "not-allowed",
              }}>{t.settings.danger.deleteForever}</button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText(""); }} style={{ flex: 1, padding: "10px", backgroundColor: "#1e1e2e", color: "#94a3b8", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer" }}>{t.common.cancel}</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "40px" }} />
    </div>
  );
}
