"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import TableauDashboard from "@/components/TableauDashboard";

// ── Edit these details to personalise the page ────────────────────────────────
const profile = {
  name: "Jane Doe",
  tagline: "Professional Late Arriver · Chief Excuse Officer",
  location: "Singapore",
  bio: `Jane Doe is a free-spirited soul who lives life on her own timeline — which, 
  statistically speaking, runs approximately 20–25 minutes behind everyone else's. 
  Whether it's brunch, a movie, or a casual meetup, she brings warmth, laughter, 
  and a fresh excuse every single time.`,
};
// ─────────────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "'Georgia', serif",
        paddingBottom: 80,
      }}
    >
      {/* ── Hero banner ────────────────────────────────────────────── */}
      <div
        style={{
          position: "relative",
          background: isDark
            ? "linear-gradient(135deg, #111 0%, #1a0f00 50%, #111 100%)"
            : "linear-gradient(135deg, #F4F4F2 0%, #DDDCF8 50%, #F4F4F2 100%)",
          borderBottom: "1px solid var(--border-accent)",
          padding: "64px 24px 48px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        {[200, 350, 480].map((size, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1px solid var(--border-accent)",
              opacity: 0.4,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Avatar */}
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "var(--text-secondary)",
            margin: "0 auto 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 0 0 4px var(--accent-soft), 0 0 0 8px var(--border-accent)",
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
          }}
        >
          <img
            src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png" // Jane Doe
            alt="Profile"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              fontFamily: "Nunito",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Badge */}
          <div
            style={{
              display: "inline-block",
              background: "var(--accent-soft)",
              border: "1px solid var(--border-accent)",
              borderRadius: 20,
              padding: "3px 14px",
              fontSize: 10,
              fontFamily: "Nunito",
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "var(--text-secondary)",
              textTransform: "uppercase" as const,
              marginBottom: 14,
            }}
          >
            About Me
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "clamp(32px, 6vw, 52px)",
              fontWeight: 900,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              fontFamily: "Nunito",
            }}
          >
            {profile.name}
          </h1>

          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              color: "var(--text-secondary)",
              fontFamily: "Nunito",
              letterSpacing: "0.06em",
            }}
          >
            {profile.tagline}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--text-muted)",
              fontFamily: "Nunito",
            }}
          >
            <span>📍</span>
            <span>{profile.location}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
        {/* Bio card */}
        <div
          style={{
            marginTop: 40,
            padding: "28px 32px",
            background: "var(--card-bg)",
            borderRadius: 16,
            border: "1px solid var(--border-accent)",
            borderLeft: "4px solid var(--text-secondary)",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--text-secondary)",
              fontFamily: "Nunito",
              textTransform: "uppercase" as const,
            }}
          >
            Bio
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: "var(--text-primary)",
              lineHeight: 1.8,
              fontFamily: "Nunito",
            }}
          >
            {profile.bio}
          </p>
        </div>

        {/* Fun facts grid */}
        <div style={{ marginTop: 32 }}>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "var(--text-secondary)",
              fontFamily: "Nunito",
              textTransform: "uppercase" as const,
            }}
          >
            By The Numbers
          </p>
          <TableauDashboard />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
            }}
          ></div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 48,
            padding: "32px",
            background: "var(--card-bg)",
            borderRadius: 16,
            border: "1px solid var(--border-accent)",
            textAlign: "center" as const,
            fontFamily: "Nunito",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "Nunito",
            }}
          >
            Planning to meet her?
          </p>
          <p
            style={{
              margin: "0 0 24px",
              fontSize: 13,
              color: "var(--text-muted)",
              fontFamily: "Nunito",
            }}
          >
            Use our predictor to find out how late he'll actually be.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap" as const,
            }}
          >
            <a
              href="/"
              style={{
                padding: "12px 28px",
                background: "var(--text-secondary)",
                color: isDark ? "#000" : "#fff",
                fontFamily: "Nunito",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                textDecoration: "none",
                borderRadius: 8,
              }}
            >
              🎟 Open Predictor
            </a>
            <button
              onClick={handleShare}
              style={{
                padding: "12px 28px",
                background: "var(--accent-soft)",
                border: "1px solid var(--border-accent)",
                color: "var(--text-secondary)",
                fontFamily: "Nunito",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.08em",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Link copied!" : "Share this page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
