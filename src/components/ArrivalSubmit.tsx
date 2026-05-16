"use client";

import { useState } from "react";

type PollResult = {
  ok:            boolean;
  correctOption: string;
  totalVotes:    number;
  winners:       { username: string; points: number; option: string }[];
};

export default function ArrivalSubmitter({
  predictedMinutes,
  onSubmit,
}: {
  predictedMinutes: number;
  onSubmit: (actualMinutes: number) => Promise<PollResult>;
}) {
  const [actual, setActual]       = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [pollResult, setPollResult] = useState<PollResult | null>(null);

  const BRACKETS = [
    { label: "🟢 Early",    sub: "0 – 5 min",   value: 3  },
    { label: "🟡 A bit",    sub: "5 – 10 min",  value: 7  },
    { label: "🟠 Late",     sub: "10 – 20 min", value: 15 },
    { label: "🔴 Very late", sub: "20 – 30 min", value: 25 },
  ];

  const handleSubmit = async () => {
    if (actual === null) return;
    setLoading(true);
    try {
      const result = await onSubmit(actual);
      setPollResult(result);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (submitted && pollResult) {
    return (
      <div style={{
        marginTop: 14, padding: "16px",
        background: "rgba(34,197,94,0.08)",
        borderRadius: 12,
        border: "1px solid rgba(34,197,94,0.25)",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          color: "#22c55e", fontFamily: "sans-serif",
          textTransform: "uppercase" as const, marginBottom: 10,
        }}>
          ✅ Poll closed · Results sent to Telegram
        </div>
        <div style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "sans-serif", marginBottom: 8 }}>
          Correct answer: <strong style={{ color: "#f97316" }}>{pollResult.correctOption}</strong>
        </div>
        <div style={{ fontSize: 12, color: "#888", fontFamily: "sans-serif", marginBottom: 8 }}>
          {pollResult.totalVotes} vote{pollResult.totalVotes !== 1 ? "s" : ""} cast
        </div>
        {pollResult.winners.slice(0, 3).map((w, i) => (
          <div key={i} style={{
            fontSize: 12, fontFamily: "sans-serif",
            color: "#ccc", marginBottom: 4,
          }}>
            {["🥇","🥈","🥉"][i]} <strong>{w.username}</strong> +{w.points} pts
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 14, padding: "16px",
      background: "rgba(249,115,22,0.06)",
      borderRadius: 12,
      border: "1px solid rgba(249,115,22,0.2)",
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
        color: "#f97316", fontFamily: "sans-serif",
        textTransform: "uppercase" as const, marginBottom: 4,
      }}>
        She arrived? Submit actual lateness
      </div>
      <div style={{
        fontSize: 11, color: "#555", fontFamily: "sans-serif", marginBottom: 12,
      }}>
        This will close the Telegram poll and award points
      </div>

      {/* Quick select brackets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {BRACKETS.map((b) => (
          <button key={b.value} onClick={() => setActual(b.value)} style={{
            padding: "10px 8px",
            background: actual === b.value
              ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
            border: actual === b.value
              ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, cursor: "pointer",
            textAlign: "left" as const,
          }}>
            <div style={{
              fontSize: 12, fontFamily: "sans-serif", fontWeight: 600,
              color: actual === b.value ? "#f97316" : "#bbb",
            }}>{b.label}</div>
            <div style={{ fontSize: 10, color: "#555", fontFamily: "sans-serif" }}>
              {b.sub}
            </div>
          </button>
        ))}
      </div>

      {/* Or type exact minutes */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "sans-serif", flexShrink: 0 }}>
          Or exact:
        </span>
        <input
          type="number"
          min={0} max={120}
          placeholder="e.g. 13"
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v)) setActual(v);
          }}
          style={{
            flex: 1, background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, padding: "8px 10px",
            color: "#fff", fontSize: 13,
            fontFamily: "monospace", outline: "none",
          }}
        />
        <span style={{ fontSize: 11, color: "#555", fontFamily: "sans-serif" }}>min</span>
      </div>

      <button onClick={handleSubmit} disabled={actual === null || loading} style={{
        width: "100%",
        background: actual !== null && !loading
          ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#222",
        border: "none", borderRadius: 8, padding: "12px",
        color: actual !== null ? "#fff" : "#555",
        fontSize: 13, fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        fontFamily: "sans-serif", cursor: actual !== null ? "pointer" : "not-allowed",
        transition: "all 0.2s",
      }}>
        {loading
          ? "⏳ Closing poll..."
          : actual === null
          ? "Select how late she was"
          : `✅ She was ${actual} min late — close poll`}
      </button>
    </div>
  );
}