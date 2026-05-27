"use client";

import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

const { theme } = useTheme();
const isDark = theme === "dark";
const [copied, setCopied] = useState(false);

const handleShare = () => {
  navigator.clipboard?.writeText(window.location.href);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

const CTA = () => {
  return (
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
        Use our predictor to find out how late she'll actually be.
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
  );
};

export default CTA;
