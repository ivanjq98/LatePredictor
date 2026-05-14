"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Persist preference in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lt-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("lt-theme", next);
      return next;
    });
  };
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--bg-primary",    "#0a0a0a");
      root.style.setProperty("--bg-secondary",  "#111111");
      root.style.setProperty("--bg-tertiary",   "#1a1a1a");
      root.style.setProperty("--text-primary",  "#ffffff");
      root.style.setProperty("--text-secondary","#f85801");
      root.style.setProperty("--text-muted",    "#f4eeee");
      root.style.setProperty("--border-subtle", "rgba(255,255,255,0.06)");
      root.style.setProperty("--border-accent", "rgba(249,115,22,0.2)");   // was --border-orange
      root.style.setProperty("--accent-soft",   "rgba(249,115,22,0.08)");  // tinted panels
      root.style.setProperty("--nav-bg",        "rgba(10,10,10,0.85)");
      root.style.setProperty("--card-bg",       "#111111");
      root.style.setProperty("--input-bg",      "#1a1a1a");
      root.style.setProperty("--perf-dot",      "rgba(241, 235, 235, 0.1)");
    } else {  
      root.style.setProperty("--bg-primary",    "#F4F4F2");
      root.style.setProperty("--bg-secondary",  "#FFFFFF");
      root.style.setProperty("--bg-tertiary",   "#E3E3E0");
      root.style.setProperty("--text-primary",  "#1E1E2E");
      root.style.setProperty("--text-secondary","#4B4ACF");
      root.style.setProperty("--text-muted",    "#6D6D80");
      root.style.setProperty("--border-subtle", "#E3E3E0");
      root.style.setProperty("--border-accent", "#E3E3E0");                // same as dividers in light
      root.style.setProperty("--accent-soft",   "#DDDCF8");
      root.style.setProperty("--nav-bg",        "#f3f3f6");
      root.style.setProperty("--card-bg",       "#FFFFFF");
      root.style.setProperty("--input-bg",      "#FFFFFF");
      root.style.setProperty("--perf-dot",      "rgba(230, 230, 239, 0.1)");
    }
    document.body.style.background = theme === "dark" ? "#0a0a0a" : "#F4F4F2";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);