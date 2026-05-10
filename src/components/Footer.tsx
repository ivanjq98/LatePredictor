"use client";

import Link from 'next/link';
import { useTheme } from "@/context/ThemeContext";

export default function Footer() {
    const year = new Date().getFullYear();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const productLinks = [
        { label: "Lateness Predictor", href: "/" },
        { label: "How It Works",       href: "/how-it-works" },
        { label: "About",              href: "/about" },
        { label: "Contributors",       href: "/contributor" },
    ];

    const legalLinks = [
        { label: "Privacy Policy",   href: "/legal/privacy" },
        { label: "Terms of Service", href: "/legal/terms" },
        { label: "Cookie Policy",    href: "/legal/cookies" },
    ];
  
    return (
      <footer style={{
        background: "var(--bg-primary)",
        borderTop: "1px solid var(--border-accent)",
        padding: "48px 24px 32px",
        fontFamily: "sans-serif",
      }}>
        <div style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 40,
          marginBottom: 40,
        }}>
  
          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: "var(--text-secondary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill={isDark ? "#000" : "#fff"}/>
                </svg>
              </div>
              <span style={{
                fontFamily: "'Arial Black', sans-serif",
                fontWeight: 900, fontSize: 13,
                letterSpacing: "0.06em",
                color: "var(--text-primary)",
                textTransform: "uppercase",
              }}>
                LatePredictor™
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.7, maxWidth: 220,
            }}>
              Predicting how late she'll be, so you can plan accordingly.
            </p>
          </div>
  
          {/* Product links */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}>
              Product
            </p>
            {productLinks.map((link) => (
              <Link key={link.label} href={link.href} style={{
                display: "block",
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: 13, lineHeight: "2",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                {link.label}
              </Link>
            ))}
          </div>
  
          {/* Legal links */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}>
              Legal
            </p>
            {legalLinks.map((link) => (
              <Link key={link.label} href={link.href} style={{
                display: "block",
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: 13, lineHeight: "2",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
                {link.label}
              </Link>
            ))}
          </div>
  
          {/* Company info */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "var(--text-secondary)",
              textTransform: "uppercase",
            }}>
              Company
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              JobSeekers Pte Limited
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              Singapore
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              hello@jobseekers.sg
            </p>
          </div>
        </div>
  
        {/* Divider */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <p style={{
            margin: 0, fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            © {year} JobSeekers Pte Limited. All rights reserved.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            Made with ❤ in Singapore
          </p>
        </div>
      </footer>
    );
}