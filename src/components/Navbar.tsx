"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
  { label: "About",        href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contributors", href: "/contributor" },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 52, height: 28,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        padding: 0,
        background: "var(--accent-soft)",
        transition: "background 0.3s",
        flexShrink: 0,
      }}
    >
      {/* Track border */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 14,
        border: "1px solid var(--border-accent)",
        transition: "border-color 0.3s",
      }} />

      {/* Icons row */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6px",
      }}>
        <span style={{
          color: isDark ? "#555" : "var(--text-secondary)",
          transition: "color 0.3s", display: "flex", lineHeight: 1,
        }}>
          <SunIcon />
        </span>
        <span style={{
          color: isDark ? "var(--text-secondary)" : "#bbb",
          transition: "color 0.3s", display: "flex", lineHeight: 1,
        }}>
          <MoonIcon />
        </span>
      </div>

      {/* Sliding thumb */}
      <div style={{
        position: "absolute",
        top: 3,
        left: isDark ? "calc(100% - 25px)" : 3,
        width: 22, height: 22,
        borderRadius: "50%",
        background: "var(--text-secondary)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff",
      }}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        background: "var(--nav-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-accent)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 24px", height: 60,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: "var(--text-secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill={isDark ? "#000" : "#fff"}/>
              </svg>
            </div>
            <div>
              <span style={{
                fontFamily: "'Arial Black', Nunito",
                fontWeight: 900, fontSize: 14,
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                textTransform: "uppercase" as const,
              }}>
                LatePredictor
              </span>
              <span style={{
                display: "block",
                fontSize: 9,
                color: "var(--text-secondary)",
                fontFamily: "Nunito",
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                marginTop: -2,
              }}>
                by JobSeekers Pte Ltd
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} className="nav-desktop">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: 13,
                fontFamily: "Nunito",
                fontWeight: 500,
                letterSpacing: "0.04em",
                padding: "6px 14px",
                borderRadius: 6,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = "var(--text-primary)";
                (e.target as HTMLElement).style.background = "var(--accent-soft)";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = "var(--text-muted)";
                (e.target as HTMLElement).style.background = "transparent";
              }}>
                {link.label}
              </a>
            ))}

            {/* CTA */}
            <a href="/" style={{
              marginLeft: 8,
              padding: "7px 18px",
              background: "var(--text-secondary)",
              color: isDark ? "#000" : "#fff",
              fontSize: 12,
              fontFamily: "Nunito",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              textDecoration: "none",
              borderRadius: 6,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.target as HTMLElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.target as HTMLElement).style.opacity = "1"}>
              Predict Now
            </a>

            <div style={{ marginLeft: 8 }}>
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: toggle + hamburger */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="nav-mobile-row">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="nav-mobile"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 6, display: "none",
                flexDirection: "column" as const, gap: 5,
              }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 22, height: 2, borderRadius: 1,
                  background: menuOpen && i === 1 ? "transparent" : "var(--text-secondary)",
                  transition: "all 0.2s",
                  transform: menuOpen && i === 0 ? "translateY(7px) rotate(45deg)"
                    : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" : "none",
                }} />
              ))}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <div style={{
          maxHeight: menuOpen ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
          borderTop: menuOpen ? "1px solid var(--border-accent)" : "none",
          background: "var(--bg-secondary)",
        }}>
          <div style={{ padding: "12px 24px 20px", display: "flex", flexDirection: "column" as const, gap: 4 }}>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  fontSize: 14, fontFamily: "Nunito",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border-subtle)",
                  letterSpacing: "0.04em",
                }}>
                {link.label}
              </a>
            ))}
            <a href="/" style={{
              marginTop: 8,
              padding: "10px 0",
              color: "var(--text-secondary)",
              fontFamily: "Nunito",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              textDecoration: "none",
            }}>
              🎟 Predict Now →
            </a>
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop     { display: none !important; }
          .nav-mobile      { display: flex !important; }
          .nav-mobile-row  { display: flex !important; }
        }
        @media (min-width: 641px) {
          .nav-mobile-row  { display: none !important; }
        }
      `}</style>
    </>
  );
}