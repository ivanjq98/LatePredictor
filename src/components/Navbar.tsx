"use client";

import { useState } from "react";

const navLinks = [
  { label: "Tracker",  href: "/" },
  { label: "About",    href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Contributors",  href: "/contributor" },
];

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
              Track Now
            </a>
          </div>

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
              🎟 Track Now →
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