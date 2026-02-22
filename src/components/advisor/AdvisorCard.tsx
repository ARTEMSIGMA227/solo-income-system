"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

interface AdvisorCardProps {
  greeting: string;
  advice: string[];
}

export function AdvisorCard({ greeting, advice }: AdvisorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useT();

  if (advice.length === 0) return null;

  const visibleAdvice = expanded ? advice : advice.slice(0, 2);

  return (
    <div
      style={{
        backgroundColor: "#12121a",
        border: "1px solid #7c3aed30",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span style={{ fontSize: "18px" }}>🤖</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#a78bfa" }}>
          {t.advisor.title}
        </span>
      </div>

      {/* Greeting */}
      <div
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#e2e8f0",
          marginBottom: "10px",
        }}
      >
        {greeting}
      </div>

      {/* Advice items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {visibleAdvice.map((tip, i) => (
          <div
            key={i}
            style={{
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#cbd5e1",
              padding: "8px 10px",
              backgroundColor: "#16161f",
              borderRadius: "8px",
              border: "1px solid #1e1e2e",
            }}
          >
            {tip}
          </div>
        ))}
      </div>

      {/* Expand button */}
      {advice.length > 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#a78bfa",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          {expanded
            ? t.advisor.collapse
            : t.advisor.moreAdvice(advice.length - 2)}
        </button>
      )}
    </div>
  );
}