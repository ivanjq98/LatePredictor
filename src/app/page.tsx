"use client";

import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Coords = { lat: number; lng: number };
type PredictionResult = {
  estimatedMinutes: number;
  confidence: string;
  message: string;
  distance_km: number;
};

// ── Fixed start: Singapore postal code 680007 (Toa Payoh) ────────────────────
const START_COORDS: Coords = { lat: 1.3321, lng: 103.8474 };
const START_LABEL = "Her House (S680007)";

// ── Haversine distance ────────────────────────────────────────────────────────
function haversine(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// ── Mock prediction — swap body with real API call when ready ─────────────────
async function fetchPrediction(
  start: Coords,
  end: Coords,
  transport: string
): Promise<PredictionResult> {
  const dist = haversine(start, end);
  await new Promise((r) => setTimeout(r, 1400));

  // TODO: replace with real call:
  // const res = await fetch("/api/lateness", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({
  //     start_lat: start.lat, start_lng: start.lng,
  //     end_lat: end.lat,   end_lng: end.lng,
  //     transport,
  //   }),
  // });
  // return res.json();

  const speedKmh: Record<string, number> = {
    walking: 5, cycling: 15, transit: 25, driving: 40,
  };
  const travelMin = (dist / (speedKmh[transport] ?? 25)) * 60;
  const extra = Math.floor(Math.random() * 22);
  const total = Math.round(travelMin + extra);
  const confidence = extra < 8 ? "High" : extra < 15 ? "Medium" : "Low";
  const messages: Record<string, string[]> = {
    High:   ["She might actually be on time 👀", "Rare achievement unlocked."],
    Medium: ["Running fashionably late ✨", "Classic 15-min buffer in action."],
    Low:    ["Classic. Absolutely classic. 😂", "Her alarm said 'not today'."],
  };
  const pool = messages[confidence];
  return {
    estimatedMinutes: total,
    confidence,
    message: pool[Math.floor(Math.random() * pool.length)],
    distance_km: Math.round(dist * 10) / 10,
  };
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ level }: { level: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    High:   { bg: "#22c55e", color: "#000" },
    Medium: { bg: "#f59e0b", color: "#000" },
    Low:    { bg: "#ef4444", color: "#fff" },
  };
  const s = map[level] ?? { bg: "#888", color: "#fff" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase" as const, color: s.color, background: s.bg,
    }}>
      {level} confidence
    </span>
  );
}

// ── Perforated tear line ──────────────────────────────────────────────────────
function PerforatedEdge() {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center",
      justifyContent: "center", padding: "4px 0" }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{ width: 5, height: 6, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
      ))}
    </div>
  );
}

// ── Leaflet map (loaded client-side to avoid SSR issues) ─────────────────────
function LeafletMap({ onSelect, selected }: {
  onSelect: (c: Coords) => void;
  selected: Coords | null;
}) {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const routeLine  = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || mapInst.current) return;

    // Inject Leaflet CSS once
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInst.current) return;

      const map = L.map(mapRef.current, { zoomControl: true })
        .setView([START_COORDS.lat, START_COORDS.lng], 13);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19 }
      ).addTo(map);

      // Orange dot for fixed start
      const startIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#f97316;
                border:3px solid #fff;box-shadow:0 0 0 2px #f97316;"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker([START_COORDS.lat, START_COORDS.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#f97316">📍 ${START_LABEL}</b>`, { closeButton: false });

      // Click → place destination marker
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;

        const destIcon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#60a5fa;
                  border:3px solid #fff;box-shadow:0 0 0 2px #60a5fa;"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7],
        });

        if (destMarker.current) map.removeLayer(destMarker.current);
        if (routeLine.current)  map.removeLayer(routeLine.current);

        destMarker.current = L.marker([lat, lng], { icon: destIcon })
          .addTo(map)
          .bindPopup(
            `<b style="color:#60a5fa">📍 Meeting point</b><br/>${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            { closeButton: false }
          )
          .openPopup();

        routeLine.current = L.polyline(
          [[START_COORDS.lat, START_COORDS.lng], [lat, lng]],
          { color: "#f97316", weight: 2, dashArray: "6 6", opacity: 0.65 }
        ).addTo(map);

        onSelect({ lat, lng });
      });

      mapInst.current = map;
    };
    document.head.appendChild(script);
  }, []);

  // Clear marker when parent resets selection
  useEffect(() => {
    if (!selected && mapInst.current) {
      if (destMarker.current) { mapInst.current.removeLayer(destMarker.current); destMarker.current = null; }
      if (routeLine.current)  { mapInst.current.removeLayer(routeLine.current);  routeLine.current = null; }
    }
  }, [selected]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
      border: "1px solid rgba(249,115,22,0.3)" }}>
      <div ref={mapRef} style={{ height: 260, width: "100%" }} />
      {!selected && (
        <div style={{ position: "absolute", bottom: 10, left: "50%",
          transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)",
          color: "#fff", fontSize: 11, fontFamily: "sans-serif",
          padding: "5px 14px", borderRadius: 20, pointerEvents: "none",
          letterSpacing: "0.06em", whiteSpace: "nowrap" as const }}>
          👆 Click map to set meeting point
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [transport, setTransport]     = useState("transit");
  const [destination, setDestination] = useState<Coords | null>(null);
  const [result, setResult]           = useState<PredictionResult | null>(null);
  const [loading, setLoading]         = useState(false);

  const now       = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const handlePredict = async () => {
    if (!destination) return;
    setLoading(true);
    setResult(null);
    const res = await fetchPrediction(START_COORDS, destination, transport);
    setResult(res);
    setLoading(false);
  };

  const handleReset = () => { setDestination(null); setResult(null); };

  const canPredict = !!destination && !loading;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "32px 16px",
      fontFamily: "'Georgia', serif" }}>

      <div style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column" }}>

        {/* ── Header band ────────────────────────────────────── */}
        <div style={{ background: "#f97316", borderRadius: "16px 16px 0 0",
          padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="rgba(0,0,0,0.6)"/>
            </svg>
            <span style={{ fontFamily: "'Arial Black', sans-serif", fontWeight: 900,
              fontSize: 13, letterSpacing: "0.08em", color: "#000", textTransform: "uppercase" as const }}>
              LateTracker™
            </span>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.5)",
              letterSpacing: "0.1em", textTransform: "uppercase" as const, fontFamily: "sans-serif" }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#000", fontFamily: "monospace" }}>
              {timeLabel}
            </div>
          </div>
        </div>

        {/* ── Main body ───────────────────────────────────────── */}
        <div style={{ background: "#111", padding: "24px 24px 20px",
          border: "1px solid rgba(249,115,22,0.2)", borderTop: "none" }}>

          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: "0.18em", color: "#f97316",
              fontFamily: "sans-serif", fontWeight: 700, textTransform: "uppercase" as const }}>
              Live Event Prediction
            </p>
            <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
              How Late Will Yu Ning Be?
            </h1>
          </div>

          {/* FROM — fixed */}
          <div style={{ marginBottom: 10, padding: "10px 14px",
            background: "rgba(249,115,22,0.08)", borderRadius: 8, borderLeft: "3px solid #f97316",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#f97316",
                textTransform: "uppercase" as const, fontFamily: "sans-serif" }}>
                From (fixed start)
              </div>
              <div style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "monospace", marginTop: 2 }}>
                {START_LABEL} · {START_COORDS.lat.toFixed(4)}, {START_COORDS.lng.toFixed(4)}
              </div>
            </div>
          </div>

          {/* TO — map */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#60a5fa",
              textTransform: "uppercase" as const, fontFamily: "sans-serif", marginBottom: 6 }}>
              To — click the map to set destination
            </div>
            <LeafletMap onSelect={setDestination} selected={destination} />
          </div>

          {/* Selected coords */}
          {destination ? (
            <div style={{ marginBottom: 14, padding: "8px 14px",
              background: "rgba(96,165,250,0.08)", borderRadius: 8,
              borderLeft: "3px solid #60a5fa", display: "flex",
              justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "#60a5fa", textTransform: "uppercase" as const, fontFamily: "sans-serif" }}>
                  Destination set
                </div>
                <div style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "monospace", marginTop: 2 }}>
                  {destination.lat.toFixed(5)},&nbsp;{destination.lng.toFixed(5)}
                </div>
              </div>
              <button onClick={handleReset}
                style={{ background: "transparent", border: "1px solid rgba(96,165,250,0.3)",
                  borderRadius: 6, color: "#60a5fa", fontSize: 11, fontFamily: "sans-serif",
                  padding: "4px 10px", cursor: "pointer" }}>
                Reset
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 14, padding: "8px 14px",
              background: "rgba(255,255,255,0.03)", borderRadius: 8,
              border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" as const }}>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "sans-serif", letterSpacing: "0.06em" }}>
                No destination selected
              </span>
            </div>
          )}

          {/* Transport */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#f97316",
              textTransform: "uppercase" as const, fontFamily: "sans-serif", marginBottom: 8 }}>
              Getting there by
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { value: "walking", emoji: "🚶", label: "Walk" },
                { value: "cycling", emoji: "🚴", label: "Cycle" },
                { value: "transit", emoji: "🚌", label: "Bus/MRT" },
                { value: "driving", emoji: "🚗", label: "Drive" },
              ].map((o) => (
                <button key={o.value} onClick={() => setTransport(o.value)} style={{
                  background: transport === o.value ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
                  border: transport === o.value ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "10px 4px", cursor: "pointer",
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4,
                }}>
                  <span style={{ fontSize: 18 }}>{o.emoji}</span>
                  <span style={{ fontSize: 10, fontFamily: "sans-serif", fontWeight: 600,
                    letterSpacing: "0.06em", color: transport === o.value ? "#f97316" : "#888" }}>
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button onClick={handlePredict} disabled={!canPredict} style={{
            width: "100%",
            background: canPredict ? "linear-gradient(135deg,#f97316,#fbbf24)" : "#222",
            border: canPredict ? "none" : "1px solid #333",
            borderRadius: 10, padding: "14px",
            color: canPredict ? "#000" : "#555",
            fontSize: 14, fontWeight: 900, letterSpacing: "0.12em",
            textTransform: "uppercase" as const, fontFamily: "sans-serif",
            cursor: canPredict ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>
            {loading ? "⏳  Calculating route..."
              : !destination ? "📍  Select a destination on the map"
              : "🎟  Scan & Predict"}
          </button>
        </div>

        {/* ── Perforated tear ────────────────────────────────── */}
        <div style={{ background: "#111", borderLeft: "1px solid rgba(249,115,22,0.2)",
          borderRight: "1px solid rgba(249,115,22,0.2)", display: "flex", alignItems: "center" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a",
            marginLeft: -10, flexShrink: 0, border: "1px solid rgba(249,115,22,0.15)" }} />
          <div style={{ flex: 1 }}><PerforatedEdge /></div>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a",
            marginRight: -10, flexShrink: 0, border: "1px solid rgba(249,115,22,0.15)" }} />
        </div>

        {/* ── Result stub ─────────────────────────────────────── */}
        <div style={{ background: "#111", borderRadius: "0 0 16px 16px",
          padding: result ? "24px 24px 28px" : "16px 24px 20px",
          border: "1px solid rgba(249,115,22,0.2)", borderTop: "none" }}>

          {!result && !loading && (
            <div style={{ textAlign: "center" as const, padding: "12px 0" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎫</div>
              <p style={{ margin: 0, fontSize: 12, color: "#444", fontFamily: "sans-serif",
                letterSpacing: "0.08em" }}>
                SCAN TICKET TO REVEAL ARRIVAL TIME
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%",
                border: "3px solid rgba(249,115,22,0.2)", borderTop: "3px solid #f97316",
                margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
              <p style={{ margin: 0, fontSize: 11, color: "#888", fontFamily: "sans-serif",
                letterSpacing: "0.1em", textTransform: "uppercase" as const }}>
                Plotting route · factoring in excuses...
              </p>
            </div>
          )}

          {result && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                    color: "#f97316", textTransform: "uppercase" as const, fontFamily: "sans-serif" }}>
                    Late by (est.)
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: "#fff",
                      lineHeight: 1, fontFamily: "monospace" }}>
                      {result.estimatedMinutes}
                    </span>
                    <span style={{ fontSize: 16, color: "#888", fontFamily: "sans-serif" }}>min</span>
                  </div>
                  <div style={{ marginTop: 6 }}><ConfidenceBadge level={result.confidence} /></div>
                </div>
                <div>
                  {/* <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                    color: "#60a5fa", textTransform: "uppercase" as const, fontFamily: "sans-serif" }}>
                    Route distance
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 52, fontWeight: 900, color: "#fff",
                      lineHeight: 1, fontFamily: "monospace" }}>
                      {result.distance_km}
                    </span>
                    <span style={{ fontSize: 16, color: "#888", fontFamily: "sans-serif" }}>km</span>
                  </div> */}
                  {/* <div style={{ marginTop: 6, fontSize: 11, color: "#555",
                    fontFamily: "sans-serif", letterSpacing: "0.04em" }}>
                    straight-line
                  </div> */}
                </div>
              </div>

              <div style={{ padding: "12px 14px", background: "rgba(249,115,22,0.08)",
                borderRadius: 8, borderLeft: "3px solid #f97316", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, color: "#e5e5e5",
                  fontFamily: "sans-serif", lineHeight: 1.5 }}>
                  {result.message}
                </p>
              </div>

              {/* <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, padding: "8px 12px", background: "rgba(249,115,22,0.06)",
                  borderRadius: 6, border: "1px solid rgba(249,115,22,0.15)" }}>
                  <div style={{ fontSize: 9, color: "#f97316", fontFamily: "sans-serif",
                    fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Start</div>
                  <div style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace", marginTop: 2 }}>
                    {START_COORDS.lat.toFixed(4)}, {START_COORDS.lng.toFixed(4)}
                  </div>
                </div>
                {destination && (
                  <div style={{ flex: 1, padding: "8px 12px", background: "rgba(96,165,250,0.06)",
                    borderRadius: 6, border: "1px solid rgba(96,165,250,0.15)" }}>
                    <div style={{ fontSize: 9, color: "#60a5fa", fontFamily: "sans-serif",
                      fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const }}>End</div>
                    <div style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace", marginTop: 2 }}>
                      {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div> */}

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace", letterSpacing: "0.1em" }}>
                  SEAT: COUCH · SECTION: WAITING
                </span>
                <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>
                  #{Math.floor(Math.random() * 90000 + 10000)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #1a1a1a !important; }
        .leaflet-popup-content-wrapper {
          background: #1a1a1a !important; color: #e5e5e5 !important;
          border: 1px solid rgba(249,115,22,0.3) !important;
          box-shadow: none !important; border-radius: 8px !important;
        }
        .leaflet-popup-tip { background: #1a1a1a !important; }
        .leaflet-popup-content { font-family: sans-serif; font-size: 12px; }
        .leaflet-control-zoom a {
          background: #1a1a1a !important; color: #e5e5e5 !important;
          border-color: rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important; color: #444 !important; font-size: 9px !important;
        }
      `}</style>
    </div>
  );
}