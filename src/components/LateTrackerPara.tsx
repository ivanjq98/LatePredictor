'use client';

import { useEffect, useState } from "react";

const TableauKPIRow = () => {
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
        maxWidth: "1000px", 
        margin: "0 auto", 
        padding: "8px",
        background: "#ffffff",
        borderRadius: "10px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
      }}
    >
      {/* Main Row Wrapper */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "row", 
          flexWrap: "nowrap",      
          gap: "8px",           
          width: "100%"
        }}
      >
        
        {/* 1. MEET-UPS CARD */}
        <div 
          style={{ 
            flex: "1 1 0px", 
            minWidth: 0, 
            background: "#f8fafc", 
            padding: "6px", 
            borderRadius: "8px", 
            border: "1px solid #f1f5f9",
            // Center alignments added here:
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ width: "100%", height: "150px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
            {scriptLoaded && (
              <TableauVizElement 
                id="kpiMeetUps"
                instance-id="kpiInstMeetUps"
                src="https://public.tableau.com/views/LatePredictorEDA/Meet-ups"
                toolbar="hidden"
                hide-tabs="true"
                device="phone"   
                style={{ width: "100%", height: "150px" }}
              />
            )}
          </div>
        </div>

        {/* 2. ON-TIME RATE CARD */}
        <div 
          style={{ 
            flex: "1 1 0px", 
            minWidth: 0, 
            background: "#f8fafc", 
            padding: "6px", 
            borderRadius: "8px", 
            border: "1px solid #f1f5f9",
            // Center alignments added here:
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ width: "100%", height: "150px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
            {scriptLoaded && (
              <TableauVizElement 
                id="kpiOnTimeRate"
                instance-id="kpiInstOnTimeRate"
                src="https://public.tableau.com/views/LatePredictorEDA/On-timeRate"
                toolbar="hidden"
                hide-tabs="true"
                device="phone"
                style={{ width: "100%", height: "150px" }}
              />
            )}
          </div>
        </div>

        {/* 3. AVERAGE LATENESS CARD */}
        <div 
          style={{ 
            flex: "1 1 0px", 
            minWidth: 0, 
            background: "#f8fafc", 
            padding: "6px", 
            borderRadius: "8px", 
            border: "1px solid #f1f5f9",
            // Center alignments added here:
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div style={{ width: "100%", height: "150px", overflow: "hidden", display: "flex", justifyContent: "center" }}>
            {scriptLoaded && (
              <TableauVizElement 
                id="kpiAvgLateness"
                instance-id="kpiInstAvgLateness"
                src="https://public.tableau.com/views/LatePredictorEDA/Avg_Lateness"
                toolbar="hidden"
                hide-tabs="true"
                device="phone"
                style={{ width: "100%", height: "150px" }}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TableauKPIRow;