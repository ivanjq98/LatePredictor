'use client';

import { useEffect, useState } from "react";

const TableauKPIGrid = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
        maxWidth: "800px", // Snug width so a 2x2 grid looks balanced
        margin: "0 auto", 
        padding: "12px",
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)"
      }}
    >
      {/* 2x2 GRID CONTROLLER CONTAINER */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px", // Vertical spacing between the rows
          width: "100%" 
        }}
      >
        
        {/* ================= ROW 1 ================= */}
        <div style={{ display: "flex", flexDirection: "row", gap: "12px", width: "100%" }}>
          
          {/* Card 1: Meet-ups */}
          <div 
            style={{ 
              flex: "1 1 0px", 
              minWidth: 0, 
              background: "#f8fafc", 
              padding: "8px", 
              borderRadius: "8px", 
              border: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
              {scriptLoaded && (
                <TableauVizElement 
                  id="gridMeetUps"
                  instance-id="gridInstMeetUps"
                  src="https://public.tableau.com/views/LatePredictorEDA/Meet-ups"
                  toolbar="hidden"
                  hide-tabs="true"
                  device="phone"   
                  style={{ width: "100%", height: "120px" }}
                />
              )}
            </div>
          </div>

          {/* Card 2: On-time Rate */}
          <div 
            style={{ 
              flex: "1 1 0px", 
              minWidth: 0, 
              background: "#f8fafc", 
              padding: "8px", 
              borderRadius: "8px", 
              border: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
              {scriptLoaded && (
                <TableauVizElement 
                  id="gridOnTimeRate"
                  instance-id="gridInstOnTimeRate"
                  src="https://public.tableau.com/views/LatePredictorEDA/On-timeRate"
                  toolbar="hidden"
                  hide-tabs="true"
                  device="phone"
                  style={{ width: "100%", height: "120px" }}
                />
              )}
            </div>
          </div>

        </div>

        {/* ================= ROW 2 ================= */}
        <div style={{ display: "flex", flexDirection: "row", gap: "12px", width: "100%" }}>
          
          {/* Card 3: Avg Lateness */}
          <div 
            style={{ 
              flex: "1 1 0px", 
              minWidth: 0, 
              background: "#f8fafc", 
              padding: "8px", 
              borderRadius: "8px", 
              border: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div style={{ width: "100%", height: "120px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
              {scriptLoaded && (
                <TableauVizElement 
                  id="gridAvgLateness"
                  instance-id="gridInstAvgLateness"
                  src="https://public.tableau.com/views/LatePredictorEDA/Avg_Lateness"
                  toolbar="hidden"
                  hide-tabs="true"
                  device="phone"
                  style={{ width: "100%", height: "120px" }}
                />
              )}
            </div>
          </div>

          {/* Card 4: Placeholder / Add Your 4th Metric View here */}
          <div 
            style={{ 
              flex: "1 1 0px", 
              minWidth: 0, 
              background: "#f8fafc", 
              padding: "8px", 
              borderRadius: "8px", 
              border: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
          {/* Card 4: 2026 Olympic Gold Medal Milestone */}
          <div 
            style={{ 
              flex: "1 1 0px", 
              minWidth: 0, 
              background: "linear-gradient(135deg, #fef08a 0%, #facc15 50%, #eab308 100%)", // Rich Olympic Gold Gradient
              padding: "8px", 
              borderRadius: "8px", 
              border: "1px solid #ca8a04",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 4px rgba(202,138,4,0.15)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div 
              style={{ 
                width: "100%", 
                height: "120px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "center", 
                alignItems: "center",
                textAlign: "center",
                fontFamily: "system-ui, sans-serif"
              }}
            >
              {/* Medal Icon & Year Asset */}
              <div style={{ fontSize: "28px", lineHeight: "1", marginBottom: "4px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>
                🥇
              </div>
              
              {/* Milestone Title */}
              <span 
                style={{ 
                  color: "#713f12", 
                  fontSize: "11px", 
                  fontWeight: 700, 
                  textTransform: "uppercase", 
                  letterSpacing: "0.05em",
                  opacity: 0.8
                }}
              >
                Paris, France 2024 
                <br/>
                Milano Cortina, Italy 2026
              </span>

              {/* Metric / Achievement Text */}
              <h3 
                style={{ 
                  margin: "2px 0 0 0", 
                  color: "#451a03", 
                  fontSize: "18px", 
                  fontWeight: 800,
                  lineHeight: "1.2"
                }}
              >
                Gold Medalist
              </h3>
            </div>
          </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default TableauKPIGrid;