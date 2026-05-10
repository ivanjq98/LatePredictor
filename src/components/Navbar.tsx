"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

const navLinks = [
//   { label: "Predict",  href: "/" },
  { label: "About",    href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contributors",  href: "/contributor" },
];

// ── Sun icon ──────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
 
// ── Moon icon ─────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Toggle button ─────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
 
  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 52,
        height: 28,
        borderRadius: 14,
        border: "none",
        cursor: "pointer",
        padding: 0,
        background: isDark
          ? "rgba(249,115,22,0.2)"
          : "rgba(249,115,22,0.15)",
        transition: "background 0.3s",
        flexShrink: 0,
      }}
    >
      {/* Track */}
      <div style={{
        position: "absolute",
        inset: 0,
        borderRadius: 14,
        border: "1px solid rgba(249,115,22,0.4)",
        transition: "border-color 0.3s",
      }} />
 
      {/* Icons row */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6px",
      }}>
        {/* Sun */}
        <span style={{
          color: isDark ? "#555" : "#f97316",
          transition: "color 0.3s",
          display: "flex",
          lineHeight: 1,
        }}>
          <SunIcon />
        </span>
        {/* Moon */}
        <span style={{
          color: isDark ? "#f97316" : "#bbb",
          transition: "color 0.3s",
          display: "flex",
          lineHeight: 1,
        }}>
          <MoonIcon />
        </span>
      </div>
 
      {/* Sliding thumb */}
      <div style={{
        position: "absolute",
        top: 3,
        left: isDark ? "calc(100% - 25px)" : 3,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#f97316",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}>
        {isDark ? <MoonIcon /> : <SunIcon />}
      </div>
    </button>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(10,10,10,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(249,115,22,0.15)",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: "#f97316",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="#000"/>
              </svg>
            </div>
            <div>
              <span style={{
                fontFamily: "'Arial Black', sans-serif",
                fontWeight: 900, fontSize: 14,
                letterSpacing: "0.06em",
                color: "#fff",
                textTransform: "uppercase" as const,
              }}>
                LatePredictor
              </span>
              <span style={{
                display: "block",
                fontSize: 9,
                color: "#f97316",
                fontFamily: "sans-serif",
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                marginTop: -2,
              }}>
                by JobSeekers Pte Ltd
              </span>
            </div>
          </a>

          {/* Desktop links */}
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
          }} className="nav-desktop">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} style={{
                color: "#888",
                textDecoration: "none",
                fontSize: 13,
                fontFamily: "sans-serif",
                fontWeight: 500,
                letterSpacing: "0.04em",
                padding: "6px 14px",
                borderRadius: 6,
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = "#fff";
                (e.target as HTMLElement).style.background = "rgba(249,115,22,0.1)";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = "#888";
                (e.target as HTMLElement).style.background = "transparent";
              }}>
                {link.label}
              </a>
            ))}

             {/* Theme toggle
             <div style={{ marginLeft: 8 }}>
              <ThemeToggle />
            </div> */}

            {/* CTA */}
            <a href="/" style={{
              marginLeft: 8,
              padding: "7px 18px",
              background: "#f97316",
              color: "#000",
              fontSize: 12,
              fontFamily: "sans-serif",
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
          </div>

           {/* Mobile: toggle + hamburger */}
           {/* <div style={{ display: "flex", alignItems: "center", gap: 12 }} className="nav-mobile-row">
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 6,
                display: "flex", flexDirection: "column" as const, gap: 5,
              }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: 22, height: 2, borderRadius: 1,
                  background: "#f97316",
                  transition: "all 0.2s",
                  transform:
                    menuOpen && i === 0 ? "translateY(7px) rotate(45deg)"
                    : menuOpen && i === 1 ? "scaleX(0)"
                    : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)"
                    : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>
          </div>
        </div> */}
          <ThemeToggle />

          {/* Mobile hamburger */}
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
                background: menuOpen && i === 1 ? "transparent"
                  : menuOpen && i === 0 ? "#f97316" : "#f97316",
                transition: "all 0.2s",
                transform: menuOpen && i === 0 ? "translateY(7px) rotate(45deg)"
                  : menuOpen && i === 2 ? "translateY(-7px) rotate(-45deg)" : "none",
              }} />
            ))}
          </button>
        </div>

        {/* Mobile dropdown */}
        <div style={{
          maxHeight: menuOpen ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
          borderTop: menuOpen ? "1px solid rgba(249,115,22,0.1)" : "none",
          background: "#0d0d0d",
        }}>
          <div style={{ padding: "12px 24px 20px", display: "flex", flexDirection: "column" as const, gap: 4 }}>
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  color: "#bbb", textDecoration: "none",
                  fontSize: 14, fontFamily: "sans-serif",
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  letterSpacing: "0.04em",
                }}>
                {link.label}
              </a>
            ))}
            <a href="/" style={{
              marginTop: 8,
              padding: "10px 0",
              color: "#f97316",
              fontFamily: "sans-serif",
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

      {/* Global responsive style for nav */}
      <style>{`
        @media (max-width: 640px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
        }
      `}</style>
    </>
  );
}