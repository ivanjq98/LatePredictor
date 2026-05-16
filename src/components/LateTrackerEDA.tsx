'use client';

import { useEffect, useState } from "react";

const TableauEmbed = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"time" | "day">("time");

  const endpoints = {
    time: "https://public.tableau.com/views/LatePredictorEDA/LatenessbyTimeofDay",
    day: "https://public.tableau.com/views/LatePredictorEDA/LatenessbyDayofWeek"
  };

  useEffect(() => {
    const existingScript = document.querySelector('script[src*="tableau.embedding.3.latest.min.js"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://public.tableau.com/javascripts/api/tableau.embedding.3.latest.min.js";
    script.type = "module";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  const TableauVizElement = 'tableau-viz' as any;

  return (
    <div 
      style={{ 
        width: "100%", 
        maxWidth: "1000px", 
        margin: "0 auto", 
        padding: "16px", // Tightened padding slightly
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" 
      }}
    >
      {/* Toggle Controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "12px", borderBottom: "1px solid #f4f4f5", paddingBottom: "10px" }}>
        <button
          onClick={() => setActiveView("time")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            background: activeView === "time" ? "#4f46e5" : "#f4f4f5",
            color: activeView === "time" ? "#ffffff" : "#71717a",
            transition: "all 0.15s ease"
          }}
        >
          ⏰ Lateness by Time of Day
        </button>
        <button
          onClick={() => setActiveView("day")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            background: activeView === "day" ? "#4f46e5" : "#f4f4f5",
            color: activeView === "day" ? "#ffffff" : "#71717a",
            transition: "all 0.15s ease"
          }}
        >
          📅 Lateness by Day of Week
        </button>
      </div>

      {/* THE COMPACT SINGLE BOX CONTAINER */}
      <div 
        style={{ 
          width: "100%", 
          minHeight: "280px", // 👈 Lowered from 600px to keep it short
          overflow: "hidden",
          borderRadius: "8px",
          background: "#fafafa" 
        }} 
      >
        {scriptLoaded && (
          <TableauVizElement 
            id="combinedTableauContainer"
            src={endpoints[activeView]}
            toolbar="bottom"
            hide-tabs="true"
            device="desktop"
            style={{ width: "100%", height: "280px" }} 
          />
        )}
      </div>
    </div>
  );
};

export default TableauEmbed;