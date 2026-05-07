"use client"

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { logger } from '../lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────
type Coords = { lat: number; lng: number };
type PredictionResult = {
  estimatedMinutes: number;
  confidence: string;
  message: string;
  model: string;
  distance_km: number;
};
type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

// ── Event categories (must match what the model was trained on) ───────────────
const CATEGORIES = [
  { value: "dinner/drinks",   label: "🍽️  Dinner / Drinks" },
  { value: "brunch",          label: "🥞  Brunch" },
  { value: "movies",          label: "🎬  Movies" },
  { value: "shopping",        label: "🛍️  Shopping" },
  { value: "exercise/sports", label: "🏃  Exercise / Sports" },
  { value: "gathering",       label: "🎉  Gathering" },
];
// ── API endpoint ──────────────────────────────────────────────────────────────
const API_URL = "https://late-predictor.onrender.com/predict";

// ── Fixed start: Singapore postal code 680007 () ────────────────────
const START_COORDS: Coords = { lat: 1.3824797878551964, lng: 103.75444675699774 }; 
const START_LABEL = "Turtle House";

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

// ── Real API call ─────────────────────────────────────────────────────────────
async function fetchPrediction(
  start: Coords,
  end: Coords,
  category: string
): Promise<PredictionResult> {
  const dist       = haversine(start, end);
  // JS getDay() → 0=Sun…6=Sat. API expects 0=Mon…6=Sun, so we shift.
  const jsDay      = new Date().getDay();
  const day = jsDay === 0 ? 6 : jsDay - 1;

  const payload = {
    day_of_week: day,
    distance_km: (Math.round(dist * 100) / 100),
    category,
  }

  console.log("payload:" + payload)
 
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { 'Content-Type': "application/json" },
    body: JSON.stringify(payload),
    });

  logger.info("Payload: " + JSON.stringify(res))
 
  // if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
 
  // Normalise whatever shape the API returns into our local type.
  // Adjust field names below if your Flask response uses different keys.
  const minutes: number =
    data.prediction ?? 0 

  const model: string = data.models_used
 
  const confidence: string =
    data.confidence ??
    (minutes < 10 ? "High" : minutes < 20 ? "Medium" : "Low");
 
  const messages: Record<string, string> = {
    High:   "She might actually be on time 👀",
    Medium: "Running fashionably late ✨",
    Low:    "Classic. Absolutely classic. 😂",
  };
 
  return {
    estimatedMinutes: Math.round(minutes),
    confidence,
    model,
    message: data.message ?? messages[confidence] ?? "Prediction complete.",
    distance_km: Math.round(dist * 10) / 10,
  };
}

// // ── Mock prediction ───────────────────────────────────────────────────────────
// async function fetchPrediction(
//   start: Coords,
//   end: Coords,
//   transport: string
// ): Promise<PredictionResult> {
//   const dist = haversine(start, end);
//   await new Promise((r) => setTimeout(r, 1400));

//   // TODO: replace with real call:
//   // const res = await fetch("/api/lateness", {
//   //   method: "POST",
//   //   headers: { "Content-Type": "application/json" },
//   //   body: JSON.stringify({
//   //     start_lat: start.lat, start_lng: start.lng,
//   //     end_lat: end.lat, end_lng: end.lng, transport,
//   //   }),
//   // });
//   // return res.json();

//   const speedKmh: Record<string, number> = {
//     walking: 5, cycling: 15, transit: 25, driving: 40,
//   };
//   const travelMin = (dist / (speedKmh[transport] ?? 25)) * 60;
//   const extra = Math.floor(Math.random() * 22);
//   const total = Math.round(travelMin + extra);
//   const confidence = extra < 8 ? "High" : extra < 15 ? "Medium" : "Low";
//   const messages: Record<string, string[]> = {
//     High:   ["She might actually be on time 👀", "Rare achievement unlocked."],
//     Medium: ["Running fashionably late ✨", "Classic 15-min buffer in action."],
//     Low:    ["Classic. Absolutely classic. 😂", "Her alarm said 'not today'."],
//   };
//   const pool = messages[confidence];
//   return {
//     estimatedMinutes: total,
//     confidence,
//     message: pool[Math.floor(Math.random() * pool.length)],
//     distance_km: Math.round(dist * 10) / 10,
//   };
// }

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

// ── Place search bar (Nominatim) ──────────────────────────────────────────────
function PlaceSearch({ onSelect }: { onSelect: (c: Coords, name: string) => void }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]         = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef              = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setSearching(true);
    try {
      // Bias results toward Singapore
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=sg&accept-language=en`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });
      const data: SearchResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 450);
  };

  const handleSelect = (r: SearchResult) => {
    const coords: Coords = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
    // Trim the display name to first two parts for brevity
    const shortName = r.display_name.split(",").slice(0, 2).join(",").trim();
    setQuery(shortName);
    setResults([]);
    setOpen(false);
    onSelect(coords, r.display_name);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Input row */}
      <div style={{
        display: "flex", alignItems: "center",
        background: "#1a1a1a",
        border: open || query
          ? "1px solid rgba(96,165,250,0.6)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: open && results.length > 0 ? "8px 8px 0 0" : 8,
        transition: "border-color 0.2s",
        overflow: "hidden",
      }}>
        {/* Search icon */}
        <div style={{ padding: "0 12px", color: "#555", flexShrink: 0 }}>
          {searching ? (
            <div style={{
              width: 14, height: 14, borderRadius: "50%",
              border: "2px solid rgba(96,165,250,0.3)",
              borderTop: "2px solid #60a5fa",
              animation: "spin 0.7s linear infinite",
            }} />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#60a5fa" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a place in Singapore..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#e5e5e5",
            fontSize: 13,
            fontFamily: "sans-serif",
            padding: "11px 0",
          }}
        />

        {/* Clear button */}
        {query && (
          <button onClick={handleClear} style={{
            background: "transparent", border: "none",
            padding: "0 12px", cursor: "pointer",
            color: "#555", fontSize: 16, lineHeight: 1,
            flexShrink: 0,
          }}>
            ×
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0, right: 0,
          background: "#1a1a1a",
          border: "1px solid rgba(96,165,250,0.4)",
          borderTop: "none",
          borderRadius: "0 0 8px 8px",
          zIndex: 1000,
          maxHeight: 240,
          overflowY: "auto",
        }}>
          {results.map((r, i) => {
            const parts = r.display_name.split(",");
            const name  = parts[0];
            const sub   = parts.slice(1, 3).join(",").trim();
            return (
              <button
                key={r.place_id}
                onClick={() => handleSelect(r)}
                style={{
                  display: "block",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  padding: "10px 14px",
                  textAlign: "left" as const,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(96,165,250,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 13, color: "#e5e5e5", fontFamily: "sans-serif",
                  fontWeight: 500, marginBottom: 2 }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "#555", fontFamily: "sans-serif" }}>
                  {sub}
                </div>
                <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "monospace", marginTop: 3 }}>
                  {parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}
                </div>
              </button>
            );
          })}
          <div style={{ padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 10, color: "#333", fontFamily: "sans-serif" }}>
              📡 Results via OpenStreetMap Nominatim
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaflet map ───────────────────────────────────────────────────────────────
function LeafletMap({ onSelect, selected, flyTo }: {
  onSelect: (c: Coords) => void;
  selected: Coords | null;
  flyTo: Coords | null;
}) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const routeLine  = useRef<any>(null);

  const placeDestMarker = useCallback((L: any, map: any, lat: number, lng: number) => {
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
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || mapInst.current) return;

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

      const startIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#f97316;
                border:3px solid #fff;box-shadow:0 0 0 2px #f97316;"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker([START_COORDS.lat, START_COORDS.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup(`<b style="color:#f97316">📍 ${START_LABEL}</b>`, { closeButton: false });

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        placeDestMarker(L, map, lat, lng);
        onSelect({ lat, lng });
      });

      mapInst.current = map;
    };
    document.head.appendChild(script);
  }, []);

  // Fly to + place marker when search result chosen
  useEffect(() => {
    if (!flyTo || !mapInst.current) return;
    const L = (window as any).L;
    if (!L) return;
    mapInst.current.flyTo([flyTo.lat, flyTo.lng], 15, { duration: 1.2 });
    placeDestMarker(L, mapInst.current, flyTo.lat, flyTo.lng);
  }, [flyTo]);

  // Clear marker on reset
  useEffect(() => {
    if (!selected && mapInst.current) {
      if (destMarker.current) { mapInst.current.removeLayer(destMarker.current); destMarker.current = null; }
      if (routeLine.current)  { mapInst.current.removeLayer(routeLine.current);  routeLine.current = null; }
    }
  }, [selected]);

  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
      border: "1px solid rgba(249,115,22,0.3)" }}>
      <div ref={mapRef} style={{ height: 240, width: "100%" }} />
      {!selected && (
        <div style={{
          position: "absolute", bottom: 10, left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)", color: "#fff",
          fontSize: 11, fontFamily: "sans-serif",
          padding: "5px 14px", borderRadius: 20,
          pointerEvents: "none", letterSpacing: "0.06em",
          whiteSpace: "nowrap" as const,
        }}>
          🔍 Search above or click map to set destination
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [category, setCategory]         = useState("dinner/drinks");
  const [destination, setDestination]   = useState<Coords | null>(null);
  const [destName, setDestName]         = useState<string>("");
  const [result, setResult]             = useState<PredictionResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const [flyTo, setFlyTo]               = useState<Coords | null>(null);
  
  const now       = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  // Called when user picks a search result
  const handleSearchSelect = (coords: Coords, name: string) => {
    setDestination(coords);
    setDestName(name);
    setFlyTo(coords);
    setResult(null);
  };

  // Called when user clicks the map directly
  const handleMapSelect = (coords: Coords) => {
    setDestination(coords);
    setDestName("");
    setResult(null);
  };

  const handlePredict = async () => {
    if (!destination) return;
    setLoading(true);
    setResult(null);
    setApiError(null);
    try {
      const res = await fetchPrediction(START_COORDS, destination, category);
      setResult(res);
    } catch (err: any) {
      setApiError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDestination(null);
    setDestName("");
    setFlyTo(null);
    setResult(null);
  };

  const canPredict = !!destination && !loading;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "'Georgia', serif",
    }}>
      <div style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column" }}>

        {/* ── Header band ─────────────────────────────────────── */}
        <div style={{
          background: "#f97316", borderRadius: "16px 16px 0 0",
          padding: "14px 24px", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="rgba(0,0,0,0.6)"/>
            </svg>
            <span style={{
              fontFamily: "'Arial Black', sans-serif", fontWeight: 900,
              fontSize: 13, letterSpacing: "0.08em", color: "#000",
              textTransform: "uppercase" as const,
            }}>
              LateTracker™
            </span>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.5)",
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              fontFamily: "sans-serif",
            }}>
              {dateLabel}
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#000", fontFamily: "monospace" }}>
              {timeLabel}
            </div>
          </div>
        </div>

        {/* ── Main body ────────────────────────────────────────── */}
        <div style={{
          background: "#111", padding: "24px 24px 20px",
          border: "1px solid rgba(249,115,22,0.2)", borderTop: "none",
        }}>
          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <p style={{
              margin: 0, fontSize: 11, letterSpacing: "0.18em", color: "#f97316",
              fontFamily: "sans-serif", fontWeight: 700,
              textTransform: "uppercase" as const,
            }}>
              Live Event Prediction
            </p>
            <h1 style={{
              margin: "4px 0 0", fontSize: 26, fontWeight: 900,
              color: "#fff", lineHeight: 1.2,
            }}>
              How Late Will She Be?
            </h1>
          </div>

          {/* FROM — fixed */}
          <div style={{
            marginBottom: 14, padding: "10px 14px",
            background: "rgba(249,115,22,0.08)", borderRadius: 8,
            borderLeft: "3px solid #f97316",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>📍</span>
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                color: "#f97316", textTransform: "uppercase" as const,
                fontFamily: "sans-serif",
              }}>
                From (fixed start)
              </div>
              <div style={{
                fontSize: 13, color: "#e5e5e5", fontFamily: "monospace", marginTop: 2,
              }}>
                {START_LABEL} 
              </div>
            </div>
          </div>

          {/* TO — search */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              color: "#60a5fa", textTransform: "uppercase" as const,
              fontFamily: "sans-serif", marginBottom: 8,
            }}>
              To — search or click the map
            </div>

            {/* ── Place search bar ── */}
            <div style={{ marginBottom: 10 }}>
              <PlaceSearch onSelect={handleSearchSelect} />
            </div>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{
                fontSize: 10, color: "#444", fontFamily: "sans-serif",
                letterSpacing: "0.1em",
              }}>
                OR CLICK MAP
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* ── Map ── */}
            <LeafletMap
              onSelect={handleMapSelect}
              selected={destination}
              flyTo={flyTo}
            />
          </div>

          {/* Destination display */}
          {destination ? (
            <div style={{
              marginBottom: 14, padding: "10px 14px",
              background: "rgba(96,165,250,0.08)", borderRadius: 8,
              borderLeft: "3px solid #60a5fa",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "#60a5fa", textTransform: "uppercase" as const,
                  fontFamily: "sans-serif",
                }}>
                  Destination set
                </div>
                {destName && (
                  <div style={{
                    fontSize: 13, color: "#e5e5e5", fontFamily: "sans-serif",
                    marginTop: 2, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {destName.split(",").slice(0, 2).join(",")}
                  </div>
                )}
                <div style={{
                  fontSize: 11, color: "#6b87ab", fontFamily: "monospace", marginTop: 2,
                }}>
                  {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </div>
              </div>
              <button onClick={handleReset} style={{
                background: "transparent",
                border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: 6, color: "#60a5fa", fontSize: 11,
                fontFamily: "sans-serif", padding: "4px 10px",
                cursor: "pointer", flexShrink: 0, marginLeft: 10,
              }}>
                Reset
              </button>
            </div>
          ) : (
            <div style={{
              marginBottom: 14, padding: "8px 14px",
              background: "rgba(255,255,255,0.03)", borderRadius: 8,
              border: "1px dashed rgba(255,255,255,0.08)",
              textAlign: "center" as const,
            }}>
              <span style={{
                fontSize: 12, color: "#444", fontFamily: "sans-serif",
                letterSpacing: "0.06em",
              }}>
                No destination selected
              </span>
            </div>
          )}

           {/* Category */}
           <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#f97316",
              textTransform: "uppercase" as const, fontFamily: "sans-serif", marginBottom: 8,
            }}>
              What's the occasion?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setCategory(c.value)} style={{
                  background: category === c.value
                    ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
                  border: category === c.value
                    ? "1px solid rgba(249,115,22,0.6)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                  textAlign: "left" as const,
                }}>
                  <span style={{
                    fontSize: 12, fontFamily: "sans-serif", fontWeight: 600,
                    color: category === c.value ? "#f97316" : "#888",
                    letterSpacing: "0.02em",
                  }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Day indicator */}
            <div style={{
              marginTop: 8, fontSize: 11, color: "#444",
              fontFamily: "sans-serif", letterSpacing: "0.06em",
            }}>
              📅 Today is{" "}
              <span style={{ color: "#f97316" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              {" "}— day_of_week sent automatically
            </div>
          </div>
 

          {/* CTA */}
          <button onClick={handlePredict} disabled={!canPredict} style={{
            width: "100%",
            background: canPredict
              ? "linear-gradient(135deg,#f97316,#fbbf24)" : "#222",
            border: canPredict ? "none" : "1px solid #333",
            borderRadius: 10, padding: "14px",
            color: canPredict ? "#000" : "#555",
            fontSize: 14, fontWeight: 900, letterSpacing: "0.12em",
            textTransform: "uppercase" as const, fontFamily: "sans-serif",
            cursor: canPredict ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>
            {loading
              ? "⏳  Calculating route..."
              : !destination
              ? "📍  Search or select a destination"
              : "🎟  Scan & Predict"}
          </button>
        </div>

        {/* ── Perforated tear ──────────────────────────────────── */}
        <div style={{
          background: "#111",
          borderLeft: "1px solid rgba(249,115,22,0.2)",
          borderRight: "1px solid rgba(249,115,22,0.2)",
          display: "flex", alignItems: "center",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a",
            marginLeft: -10, flexShrink: 0, border: "1px solid rgba(249,115,22,0.15)",
          }} />
          <div style={{ flex: 1 }}><PerforatedEdge /></div>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#0a0a0a",
            marginRight: -10, flexShrink: 0, border: "1px solid rgba(249,115,22,0.15)",
          }} />
        </div>

       {/* ── Result stub ──────────────────────────────────────── */}
       <div style={{
          background: "#111", borderRadius: "0 0 16px 16px",
          padding: result ? "24px 24px 28px" : "16px 24px 20px",
          border: "1px solid rgba(249,115,22,0.2)", borderTop: "none",
        }}>
          {!result && !loading && !apiError && (
            // <div style={{ textAlign: "center" as const, padding: "12px 0" }}>
            //   <div style={{ fontSize: 28, marginBottom: 8 }}>🎫</div>
            //   <p style={{
            //     margin: 0, fontSize: 12, color: "#444",
            //     fontFamily: "sans-serif", letterSpacing: "0.08em",
            //   }}>
            //     SCAN TICKET TO REVEAL ARRIVAL TIME
            //   </p>
            // </div>
            <Fragment/>
          )}
 
          {apiError && (
            <div style={{
              padding: "16px 14px",
              background: "rgba(239,68,68,0.08)",
              borderRadius: 8, borderLeft: "3px solid #ef4444",
              textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
              <p style={{
                margin: "0 0 4px", fontSize: 13, color: "#fca5a5",
                fontFamily: "sans-serif", fontWeight: 600,
              }}>
                API Error
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#888", fontFamily: "sans-serif" }}>
                {apiError}
              </p>
            </div>
          )}
 
          {loading && (
            <div style={{ textAlign: "center" as const, padding: "16px 0" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "3px solid rgba(249,115,22,0.2)",
                borderTop: "3px solid #f97316",
                margin: "0 auto 12px",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{
                margin: 0, fontSize: 11, color: "#888", fontFamily: "sans-serif",
                letterSpacing: "0.1em", textTransform: "uppercase" as const,
              }}>
                Plotting route · factoring in excuses...
              </p>
            </div>
          )}
 
          {result && (
            <div>
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: 16, marginBottom: 16,
              }}>
                <div>
                  <p style={{
                    margin: "0 0 2px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.16em", color: "#f97316",
                    textTransform: "uppercase" as const, fontFamily: "sans-serif",
                  }}>
                    Late by (est.)
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{
                      fontSize: 52, fontWeight: 900, color: "#fff",
                      lineHeight: 1, fontFamily: "monospace",
                    }}>
                      {result.estimatedMinutes}
                    </span>
                    <span style={{ fontSize: 16, color: "#888", fontFamily: "sans-serif" }}>min</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <ConfidenceBadge level={result.confidence} />
                  </div>
                </div>
                <div>
                  {/* <p style={{
                    margin: "0 0 2px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.16em", color: "#60a5fa",
                    textTransform: "uppercase" as const, fontFamily: "sans-serif",
                  }}>
                    Route distance
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{
                      fontSize: 52, fontWeight: 900, color: "#fff",
                      lineHeight: 1, fontFamily: "monospace",
                    }}>
                      {result.distance_km}
                    </span>
                    <span style={{ fontSize: 16, color: "#888", fontFamily: "sans-serif" }}>km</span>
                  </div> */}
                  {/* <div style={{
                    marginTop: 6, fontSize: 11, color: "#555",
                    fontFamily: "sans-serif", letterSpacing: "0.04em",
                  }}>
                    straight-line
                  </div> */}
                </div>
              </div>

              <div style={{
                padding: "12px 14px", background: "rgba(249,115,22,0.08)",
                borderRadius: 8, borderLeft: "3px solid #f97316", marginBottom: 14,
              }}>
                <p style={{
                  margin: 0, fontSize: 14, color: "#e5e5e5",
                  fontFamily: "sans-serif", lineHeight: 1.5,
                }}>
                  {result.message}
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  flex: 1, padding: "8px 12px",
                  background: "rgba(249,115,22,0.06)",
                  borderRadius: 6, border: "1px solid rgba(249,115,22,0.15)",
                }}>
                  <div style={{
                    fontSize: 9, color: "#f97316", fontFamily: "sans-serif",
                    fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase" as const,
                  }}>Start</div>
                  <div style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace", marginTop: 2 }}>
                    {START_COORDS.lat.toFixed(4)}, {START_COORDS.lng.toFixed(4)}
                  </div>
                </div>
                {destination && (
                  <div style={{
                    flex: 1, padding: "8px 12px",
                    background: "rgba(96,165,250,0.06)",
                    borderRadius: 6, border: "1px solid rgba(96,165,250,0.15)",
                  }}>
                    <div style={{
                      fontSize: 9, color: "#60a5fa", fontFamily: "sans-serif",
                      fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                    }}>End</div>
                    <div style={{ fontSize: 11, color: "#bbb", fontFamily: "monospace", marginTop: 2 }}>
                      {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 10, color: "#333", fontFamily: "monospace",
                  letterSpacing: "0.1em",
                }}>
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
          background: rgba(0,0,0,0.5) !important;
          color: #444 !important; font-size: 9px !important;
        }
      `}</style>
    </div>
  );
}
