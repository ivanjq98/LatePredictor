"use client";

import { useState } from "react";

// ── Edit these details to personalise the page ────────────────────────────────
const profile = {
  name: "Yu Ning",
  tagline: "Professional Late Arriver · Chief Excuse Officer",
  location: "Tech Whye, Singapore (S680007)",
  bio: `Yu Ning is a free-spirited soul who lives life on her own timeline — which, 
  statistically speaking, runs approximately 15–25 minutes behind everyone else's. 
  Whether it's brunch, a movie, or a casual meetup, she brings warmth, laughter, 
  and a fresh excuse every single time.`,
  funFacts: [
    { emoji: "⏰", label: "Average lateness",   value: "18 min" },
    { emoji: "🎭", label: "Excuses invented",   value: "∞" },
    { emoji: "💛", label: "Forgiven every time", value: "100%" },
    { emoji: "📍", label: "Home base",           value: "S680007" },
  ],
  traits: ["Always smiling", "Chronically late", "Great hugs", "Infectious laughter", "Zero concept of time", "Worth the wait"],
  timeline: [
    { year: "Always", event: "Said she's '5 minutes away'" },
    { year: "Usually", event: "Still getting ready" },
    { year: "Eventually", event: "Arrives with snacks as a peace offering" },
    { year: "Always", event: "Makes it worth the wait" },
  ],
};
// ─────────────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      fontFamily: "'Georgia', serif",
      paddingBottom: 80,
    }}>

      {/* ── Hero banner ────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #111 0%, #1a0f00 50%, #111 100%)",
        borderBottom: "1px solid rgba(249,115,22,0.2)",
        padding: "64px 24px 48px",
        textAlign: "center",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        {[200, 350, 480].map((size, i) => (
          <div key={i} style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: size, height: size,
            borderRadius: "50%",
            border: "1px solid rgba(249,115,22,0.07)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
        ))}

        {/* Avatar placeholder */}
        <div style={{
          width: 100, height: 100, borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #fbbf24)",
          margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
          boxShadow: "0 0 0 4px rgba(249,115,22,0.2), 0 0 0 8px rgba(249,115,22,0.08)",
          position: "relative",
          zIndex: 1,
        }}>
          🙋‍♀️
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-block",
            background: "rgba(249,115,22,0.12)",
            border: "1px solid rgba(249,115,22,0.3)",
            borderRadius: 20,
            padding: "3px 14px",
            fontSize: 10,
            fontFamily: "sans-serif",
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: "#f97316",
            textTransform: "uppercase" as const,
            marginBottom: 14,
          }}>
            About Her
          </div>

          <h1 style={{
            margin: "0 0 10px",
            fontSize: "clamp(32px, 6vw, 52px)",
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            {profile.name}
          </h1>

          <p style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "#f97316",
            fontFamily: "sans-serif",
            letterSpacing: "0.06em",
          }}>
            {profile.tagline}
          </p>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 12,
            color: "#555",
            fontFamily: "sans-serif",
          }}>
            <span>📍</span>
            <span>{profile.location}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "0 24px",
      }}>

        {/* Bio card */}
        <div style={{
          marginTop: 40,
          padding: "28px 32px",
          background: "#111",
          borderRadius: 16,
          border: "1px solid rgba(249,115,22,0.15)",
          borderLeft: "4px solid #f97316",
        }}>
          <p style={{
            margin: "0 0 6px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#f97316",
            fontFamily: "sans-serif",
            textTransform: "uppercase" as const,
          }}>
            Bio
          </p>
          <p style={{
            margin: 0,
            fontSize: 15,
            color: "#ccc",
            lineHeight: 1.8,
          }}>
            {profile.bio}
          </p>
        </div>

        {/* Fun facts grid */}
        <div style={{ marginTop: 32 }}>
          <p style={{
            margin: "0 0 16px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#f97316",
            fontFamily: "sans-serif",
            textTransform: "uppercase" as const,
          }}>
            By The Numbers
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}>
            {profile.funFacts.map((fact) => (
              <div key={fact.label} style={{
                padding: "20px 16px",
                background: "#111",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center" as const,
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.3)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{fact.emoji}</div>
                <div style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#fff",
                  fontFamily: "monospace",
                  marginBottom: 4,
                }}>
                  {fact.value}
                </div>
                <div style={{
                  fontSize: 11,
                  color: "#555",
                  fontFamily: "sans-serif",
                  letterSpacing: "0.06em",
                }}>
                  {fact.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traits / tags */}
        <div style={{ marginTop: 32 }}>
          <p style={{
            margin: "0 0 16px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#f97316",
            fontFamily: "sans-serif",
            textTransform: "uppercase" as const,
          }}>
            Known For
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {profile.traits.map((trait) => (
              <span key={trait} style={{
                padding: "6px 16px",
                background: "rgba(249,115,22,0.08)",
                border: "1px solid rgba(249,115,22,0.2)",
                borderRadius: 20,
                fontSize: 13,
                color: "#e5e5e5",
                fontFamily: "sans-serif",
              }}>
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 40 }}>
          <p style={{
            margin: "0 0 20px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#f97316",
            fontFamily: "sans-serif",
            textTransform: "uppercase" as const,
          }}>
            A Typical Day With Her
          </p>
          <div style={{ position: "relative", paddingLeft: 28 }}>
            {/* Vertical line */}
            <div style={{
              position: "absolute",
              left: 6,
              top: 8,
              bottom: 8,
              width: 1,
              background: "rgba(249,115,22,0.2)",
            }} />

            {profile.timeline.map((item, i) => (
              <div key={i} style={{
                position: "relative",
                marginBottom: i < profile.timeline.length - 1 ? 28 : 0,
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute",
                  left: -24,
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#f97316",
                  border: "2px solid #0a0a0a",
                  boxShadow: "0 0 0 2px rgba(249,115,22,0.3)",
                }} />
                <div style={{
                  fontSize: 10,
                  fontFamily: "sans-serif",
                  fontWeight: 700,
                  color: "#f97316",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  marginBottom: 4,
                }}>
                  {item.year}
                </div>
                <div style={{
                  fontSize: 14,
                  color: "#bbb",
                  fontFamily: "sans-serif",
                  lineHeight: 1.5,
                }}>
                  {item.event}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 48,
          padding: "32px",
          background: "#111",
          borderRadius: 16,
          border: "1px solid rgba(249,115,22,0.15)",
          textAlign: "center" as const,
        }}>
          <p style={{
            margin: "0 0 6px",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
          }}>
            Planning to meet her?
          </p>
          <p style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#666",
            fontFamily: "sans-serif",
          }}>
            Use our tracker to find out how late she'll actually be.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/" style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, #f97316, #fbbf24)",
              color: "#000",
              fontFamily: "sans-serif",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              textDecoration: "none",
              borderRadius: 8,
            }}>
              🎟 Open Tracker
            </a>
            <button onClick={handleShare} style={{
              padding: "12px 28px",
              background: "transparent",
              border: "1px solid rgba(249,115,22,0.3)",
              color: "#f97316",
              fontFamily: "sans-serif",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.08em",
              borderRadius: 8,
              cursor: "pointer",
            }}>
              {copied ? "✓ Link copied!" : "Share this page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}