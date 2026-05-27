import React from "react";

const PredictionHeader = () => {
  // Move state INSIDE the component
  const [rotation, setRotation] = React.useState(0);

  // This updates the rotation every 50ms to keep it "real-time"
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Math: (Seconds + fraction of second) * 6 degrees per second (360/60)
      const seconds = now.getSeconds();
      const ms = now.getMilliseconds();
      setRotation((seconds + ms / 1000) * 6);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ marginBottom: 18, fontFamily: "Nunito" }}>
      {/* Main Title */}
      <h1
        style={{
          margin: "12px 0 4px",
          fontSize: 28,
          letterSpacing: "0.12em",
          fontWeight: 900,
          color: "var(--card-bg)",
          lineHeight: 1.2,
          fontFamily: "Nunito",
        }}
      >
        How Late Will She Be?
      </h1>

      <div
        style={{
          textAlign: "center",
          padding: "24px 0",
          background: "var(--text-primary)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "80vmin",
            height: "80vmin",
            maxWidth: "360px",
            maxHeight: "360px",
            margin: "auto",
          }}
        >

          {/* Rotating Hand/Icon */}
          <img
            src="https://bfcnfizoqiyfpxzfvxya.supabase.co/storage/v1/object/public/latepredictor/img/clock-icon.png"
            alt="clock"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "100%",
              height: "100%",
              // Fixed the template literal and transform
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              transition: "transform 0.1s linear",
              pointerEvents: "none",
              zIndex: 10,
              opacity: 0.9,
            }}
          />
        </div>
      </div>

      {/* Subtitle */}
      <p
        style={{
          margin: 0,
          fontFamily: "Nunito",
          color: "var(--card-bg)",
          letterSpacing: "0.12em",
          fontSize: 14,
        }}
      >
        Fill in the details below and find out
      </p>

      {/* Scoped Style tag moved inside or use a CSS file */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #F4F4F2 !important; }
        .leaflet-popup-content-wrapper {
          background: #FFFFFF !important; color: #1E1E2E !important;
          border: 1px solid rgba(75,74,207,0.3) !important;
          box-shadow: none !important; border-radius: 8px !important;
        }
        .leaflet-popup-tip { background: #FFFFFF !important; }
        .leaflet-popup-content { font-family: Nunito; font-size: 12px; }
        .leaflet-control-zoom a {
          background: #FFFFFF !important; color: #1E1E2E !important;
          border-color: #E3E3E0 !important;
        }
        .leaflet-control-attribution {
          background: rgba(244,244,242,0.8) !important;
          color: #aaa !important; font-size: 9px !important;
        }
      `}</style>
    </div>
  );
};

export default PredictionHeader;
