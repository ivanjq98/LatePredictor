"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

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

  // Apply CSS variables to :root so any component can use them
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.style.setProperty("--bg-primary",    "#0a0a0a");
      root.style.setProperty("--bg-secondary",  "#111111");
      root.style.setProperty("--bg-tertiary",   "#1a1a1a");
      root.style.setProperty("--text-primary",  "#ffffff");
      root.style.setProperty("--text-secondary","#888888");
      root.style.setProperty("--text-muted",    "#444444");
      root.style.setProperty("--border-subtle", "rgba(255,255,255,0.06)");
      root.style.setProperty("--border-orange", "rgba(249,115,22,0.2)");
      root.style.setProperty("--nav-bg",        "rgba(10,10,10,0.85)");
      root.style.setProperty("--card-bg",       "#111111");
      root.style.setProperty("--input-bg",      "#1a1a1a");
      root.style.setProperty("--perf-dot",      "rgba(255,255,255,0.1)");
    } else {
      root.style.setProperty("--bg-primary",    "#f5f4f0");
      root.style.setProperty("--bg-secondary",  "#ffffff");
      root.style.setProperty("--bg-tertiary",   "#f0ede8");
      root.style.setProperty("--text-primary",  "#1a1a1a");
      root.style.setProperty("--text-secondary","#555555");
      root.style.setProperty("--text-muted",    "#999999");
      root.style.setProperty("--border-subtle", "rgba(0,0,0,0.07)");
      root.style.setProperty("--border-orange", "rgba(249,115,22,0.25)");
      root.style.setProperty("--nav-bg",        "rgba(255,255,255,0.88)");
      root.style.setProperty("--card-bg",       "#ffffff");
      root.style.setProperty("--input-bg",      "#f5f4f0");
      root.style.setProperty("--perf-dot",      "rgba(0,0,0,0.12)");
    }
    document.body.style.background = theme === "dark" ? "#0a0a0a" : "#f5f4f0";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);