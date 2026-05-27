import React from "react";

// ── Perforated tear line ──────────────────────────────────────────────────────
function PerforatedEdge() {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 0",
      }}
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

const PerforatedTear = () => {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderLeft: "1px solid #E3E3E0",
        borderRight: "1px solid #E3E3E0",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#F4F4F2",
          marginLeft: -10,
          flexShrink: 0,
          border: "1px solid #E3E3E0",
        }}
      />
      <div style={{ flex: 1 }}>
        <PerforatedEdge />
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#F4F4F2",
          marginRight: -10,
          flexShrink: 0,
          border: "1px solid #E3E3E0",
        }}
      />
    </div>
  );
};

export default PerforatedTear;
