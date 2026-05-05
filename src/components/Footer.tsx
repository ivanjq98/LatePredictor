"use client";

export default function Footer() {
    const year = new Date().getFullYear();
  
    return (
      <footer style={{
        background: "#0a0a0a",
        borderTop: "1px solid rgba(249,115,22,0.12)",
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
                background: "#f97316",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="#000"/>
                </svg>
              </div>
              <span style={{
                fontFamily: "'Arial Black', sans-serif",
                fontWeight: 900, fontSize: 13,
                letterSpacing: "0.06em", color: "#fff",
                textTransform: "uppercase" as const,
              }}>
                LatePredictor™
              </span>
            </div>
            <p style={{
              margin: 0, fontSize: 13, color: "#555",
              lineHeight: 1.7, maxWidth: 220,
            }}>
              Predicting how late she'll be, so you can plan accordingly.
            </p>
          </div>
  
          {/* Product links */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "#f97316",
              textTransform: "uppercase" as const,
            }}>
              Product
            </p>
            {["Lateness Predictor", "How It Works", "About", "Contributors"].map((item) => (
              <a key={item} href="#" style={{
                display: "block",
                color: "#555", textDecoration: "none",
                fontSize: 13, lineHeight: "2",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "#555"}>
                {item}
              </a>
            ))}
          </div>
  
          {/* Legal links */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "#f97316",
              textTransform: "uppercase" as const,
            }}>
              Legal
            </p>
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a key={item} href="#" style={{
                display: "block",
                color: "#555", textDecoration: "none",
                fontSize: 13, lineHeight: "2",
                transition: "color 0.15s",
              }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = "#fff"}
              onMouseLeave={e => (e.target as HTMLElement).style.color = "#555"}>
                {item}
              </a>
            ))}
          </div>
  
          {/* Company info */}
          <div>
            <p style={{
              margin: "0 0 14px", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.16em", color: "#f97316",
              textTransform: "uppercase" as const,
            }}>
              Company
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#555", lineHeight: 1.7 }}>
              JobSeekers Pte Limited
            </p>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "#3a3a3a", lineHeight: 1.6 }}>
              Singapore
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "#3a3a3a", lineHeight: 1.6 }}>
              hello@jobseekers.sg
            </p>
          </div>
        </div>
  
        {/* Divider */}
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          paddingTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap" as const,
          gap: 12,
        }}>
          <p style={{
            margin: 0, fontSize: 11, color: "#333",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
          }}>
            © {year} JobSeekers Pte Limited. All rights reserved.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#2a2a2a", letterSpacing: "0.06em" }}>
            Made with ❤ in Singapore
          </p>
        </div>
      </footer>
    );
  }