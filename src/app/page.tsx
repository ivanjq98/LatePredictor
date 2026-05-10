"use client"

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { logger } from '../lib/logger';
import { supabase } from "@/lib/supabaseClient";
import { resendEmail } from '@/lib/resendClient';
import { Resend } from "resend";
import React from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Coords = { lat: number; lng: number };
type PredictionResult = {
  estimatedMinutes: number;
  confidence: string;
  message: string;
  model: string;
  // distance_km: number;
};
type SubmitResult = {
  status: string 
}
type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

// ── Emoji map for known categories ───────────────────────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  "dinner/drinks":   "🍽️",
  "exercise":        "🏃",
  "work/career fair":"💼",
  "breakfast":       "🥞",
  "lunch":           "🥗",
  "apply job":       "📋",
};

// ── Resend email ──────────────────────────────────────────────────────────────
// const resend = new resendEmail();
const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY)

async function sendTelegram(payload: {
  date: string,
  estimatedMinutes: number;
  confidence: string;
  category: string;
  destination: Coords;
  destName: string;
}): Promise<{ ok: boolean; arrivalTime?: string }> {
  const res = await fetch("/api/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
 
// ── Format seconds into mm:ss countdown string ────────────────────────────────
function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";
  const h   = Math.floor(totalSeconds / 3600);
  const m   = Math.floor((totalSeconds % 3600) / 60);
  const s   = totalSeconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Fetch unique categories from Supabase ─────────────────────────────────────
async function fetchCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("clean_data")
    .select("category");
 
  if (error) throw new Error(error.message);
 
  const unique = Array.from(
    new Set((data ?? []).map((row: { category: string }) => row.category))
  ).filter(Boolean) as string[];
 
  return unique.sort();
}

// ── API endpoint ──────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FEEDBACK_URL = process.env.NEXT_PUBLIC_API_FEEDBACK;

// ── Fixed start: Singapore postal code 680007 ────────────────────
const START_COORDS: Coords = { lat: Number(process.env.NEXT_PUBLIC_LAT), lng: Number(process.env.NEXT_PUBLIC_LNG) }; 
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
  category: string,
  date: string,
): Promise<PredictionResult> {
  // JS getDay() → 0=Sun…6=Sat. API expects 0=Mon…6=Sun, so we shift.
  const jsDay      = new Date().getDay();
  const day = jsDay === 0 ? 6 : jsDay - 1;

  const payload = {
    "datetime_val": date,
    "init_latlon": [start.lat, start.lng],
    "dest_latlon": [end.lat, end.lng],
    category,
  }

  console.log("payload:" + payload)

  if (!API_URL) {
    throw new Error("API_URL is not defined in the environment");
  }
 
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
    data.est_min ?? 0 

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
    // distance_km: Math.round(dist * 10) / 10,
  };
}

async function sendLateEmail(friendEmail: string, minutes: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Late Bot <onboarding@resend.dev>', // Use this for testing
      to: friendEmail,
      subject: "CONGRATULATIONS ON A JOB OFFTER! Jk, you are just running late! 🏃‍♂️",
      html: `
        <p>Hey! Yu Ning Model predict ${minutes} minutes</strong> late.</p>
        <p>How does it feel like to be catfished? Please dont make us wait...</p>
      `,
    });

    if (error) {
      return console.error({ error });
    }

    console.log("Email sent successfully!", data?.id);
    
  } catch (err) {
    console.error("Failed to send email:", err);
  }
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


async function submitForm(datetime: string, dest: Coords, category: string, est_min: number, act_min: number): Promise<SubmitResult> {
    const payload = {
      "datetime_val": datetime,
      "init_latlon": [START_COORDS],
      "dest_latlon": [dest],
      "category": category,
      "est_min": est_min,
      "act_min": act_min
    }

    if (!FEEDBACK_URL) {
      throw new Error("FEEDBACK_URL is not defined in the environment");
    }
    
    const response = await fetch(FEEDBACK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const res: string = data.status ?? "Response did not go through"

    return {
      status: res
    } 
};

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
                <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "sans-serif", marginTop: 3 }}>
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
  const [date, setDate] = useState<string>("")
  const [arrivaldate, setArrivalDate] = useState<string>("")
  const [rotation, setRotation] = React.useState(0);
  const [category, setCategory]         = useState("dinner/drinks");
  const [categories, setCategories]     = useState<string[]>([
    // Fallback list from your Supabase data — used while loading or if fetch fails
  ]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [destination, setDestination]   = useState<Coords | null>(null);
  const [destName, setDestName]         = useState<string>("");
  const [result, setResult]             = useState<PredictionResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading]           = useState(false);
  const [apiError, setApiError]         = useState<string | null>(null);
  const [flyTo, setFlyTo]               = useState<Coords | null>(null);

  // ── Telegram + countdown state ─────────────────────────────────────────────
  const [tgSent, setTgSent]             = useState(false);
  const [tgError, setTgError]           = useState<string | null>(null);
  const [arrivalTime, setArrivalTime]   = useState<Date | null>(null);
  const [countdown, setCountdown]       = useState<number>(0); // seconds remaining
  const countdownRef                    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live countdown ticker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!arrivalTime) return;
    const tick = () => {
      const remaining = Math.round((arrivalTime.getTime() - Date.now()) / 1000);
      setCountdown(Math.max(0, remaining));
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [arrivalTime]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const getDurationInMinutes = () => {
    if (!arrivaldate || !date) return 0;

  const start = new Date(date);
  const arrival = new Date(arrivaldate);

  // Difference in milliseconds
  const diffInMs = arrival.getTime() - start.getTime();

  // Convert to minutes (1 minute = 60,000 ms)
  return Math.floor(diffInMs / (1000 * 60));
  }
 
    // Fetch categories from Supabase on mount
    useEffect(() => {
      fetchCategories()
        .then((cats) => {
          if (cats.length > 0) {
            setCategories(cats);
            setCategory(cats[0]);
          }
        })
        .catch((err) => console.warn("Could not load categories from Supabase:", err))
        .finally(() => setCategoriesLoading(false));
    }, []);
   
    const now       = new Date();
    const timeLabel = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const dateLabel = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

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

    // This updates the rotation every 50ms to keep it "real-time"
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // Math: (Seconds + fraction of second) * 6 degrees per second
      const seconds = now.getSeconds();
      const ms = now.getMilliseconds();
      setRotation((seconds + ms / 1000) * 6);
    }, 50);

  return () => clearInterval(interval);
}, []);

  const handlePredict = async () => {
    if (!destination) return;
    setLoading(true);
    setResult(null);
    setApiError(null);
    setTgSent(false);
    setTgError(null);
    setArrivalTime(null);

    try {
      const res = await fetchPrediction(START_COORDS, destination, category, date);
      setResult(res);

      // ── Compute arrival time and start countdown ──────────────────────────
      const arrival = new Date(Date.now() + res.estimatedMinutes * 60 * 1000);
      setArrivalTime(arrival);
      // ── Fire Telegram notification ────────────────────────────────────────
      try {
        const tg = await sendTelegram({
          date,
          estimatedMinutes: res.estimatedMinutes,
          confidence:       res.confidence,
          category,
          destination,
          destName,
        });
        if (tg.ok) {
          setTgSent(true);
        } else {
          setTgError("Telegram send failed");
        }
      } catch {
        setTgError("Could not reach Telegram");
      }
      
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
    setApiError(null);
    setTgSent(false);
    setTgError(null);
    setArrivalTime(null);
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;    
    if (!destination) return;
    if (!result) return;

    const minDiff = getDurationInMinutes();
    try {
      alert("Your request has been submitted!");
      setIsSubmitting(true);    
      const res = await submitForm(date, destination, category, result?.estimatedMinutes, minDiff)
      setSubmitResult(res)
      setIsSubmitted(true); // Mark as done to keep button disabled
    } catch (err: any) {
      setApiError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }}

  const canPredict = !!destination && !loading;

  // if (!destination) 
  // sendLateEmail('tan.ivancjq@gmail.com', result?.estimatedMinutes ?? 0)

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "sans-serif",
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
              fontFamily: "sans-serif", fontWeight: 900,
              fontSize: 13, letterSpacing: "0.08em", color: "#000",
              textTransform: "uppercase" as const,
            }}>
              LateTracker™
            </span>
          </div>
          {/* <div style={{ textAlign: "right" as const }}>
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
          </div> */}
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
          {/* <div style={{
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
          </div> */}

          {/* TO — search */}
          {!result && (
          <>
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
            {/* <div style={{
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
            </div> */}

            {/* ── Map ── */}
            {/* <LeafletMap
              onSelect={handleMapSelect}
              selected={destination}
              flyTo={flyTo}
            /> */}
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
                  fontSize: 11, color: "#6b87ab", fontFamily: "sans-serif", marginTop: 2,
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
            // <div style={{
            //   marginBottom: 14, padding: "8px 14px",
            //   background: "rgba(255,255,255,0.03)", borderRadius: 8,
            //   border: "1px dashed rgba(255,255,255,0.08)",
            //   textAlign: "center" as const,
            // }}>
            //   {/* <span style={{
            //     fontSize: 12, color: "#444", fontFamily: "sans-serif",
            //     letterSpacing: "0.06em",
            //   }}>
            //     No destination selected
            //   </span> */}
            // </div>
            <Fragment/>
          )}
      
          {/* DATE TIME PICKER */}
          <div className="w-full space-y-4">
          <label 
            className="text-white text-xs tracking-widest ml-1" 
            style={{ fontFamily: "sans-serif" }}
          >
          Date & Time Picker
          </label>         
          <input
            type="datetime-local"
            // The input needs 'YYYY-MM-DDTHH:mm', so we slice off the seconds and 'Z' for display
            value={date ? date.slice(0, 16) : ""}
            onChange={(e) => {
              const selectedDate = new Date(e.target.value);
              if (!isNaN(selectedDate.getTime())) {
                // 8 hours in milliseconds: 8 * 60 * 60 * 1000 = 28,800,000
                const gmt8Offset = 8 * 60 * 60 * 1000;
                const gmt8Date = new Date(selectedDate.getTime() + gmt8Offset);

                // Format to ISO, remove milliseconds, and add 'Z' back
                const isoZFormat = gmt8Date.toISOString().split('.')[0] + "Z";
                setDate(isoZFormat);
              }
            }}
            className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white font-sans-serif focus:outline-none focus:border-orange-500 transition-colors"
            style={{
              colorScheme: 'dark', 
            }}
          />
          </div>

         {/* Category */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "#f97316", 
              textTransform: "uppercase" as const, fontFamily: "sans-serif", marginBottom: 8, marginTop: 8,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              What's the occasion?
              {categoriesLoading && (
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  border: "2px solid rgba(249,115,22,0.2)",
                  borderTop: "2px solid #f97316",
                  animation: "spin 0.7s linear infinite",
                }} />
              )}
            </div>
            <div style={{ position: "relative", width: "100%" }}>
  <select
    value={category || ""}
    onChange={(e) => setCategory(e.target.value)}
    style={{
      width: "100%",
      padding: "12px 14px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "8px",
      color: category ? "#f97316" : "#888",
      fontSize: "14px",
      fontFamily: "sans-serif",
      appearance: "none", // Removes default browser arrow
      cursor: "pointer",
      outline: "none"
    }}
  >
    <option value="" disabled>Select an occasion...</option>
    {categories.map((cat) => (
      <option key={cat} value={cat} style={{ background: "#111", color: "#fff" }}>
        {CATEGORY_EMOJI[cat] ?? "📌"} {cat.charAt(0).toUpperCase() + cat.slice(1)}
      </option>
    ))}
  </select>
  
  {/* Custom Arrow Icon */}
  <div style={{
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
    color: "#555",
    fontSize: "10px"
  }}>
    ▼
  </div>
</div>

            {/* Day indicator */}
            {/* <div style={{
              marginTop: 8, fontSize: 11, color: "#444",
              fontFamily: "sans-serif", letterSpacing: "0.06em",
            }}>
              📅 Today is{" "}
              <span style={{ color: "#f97316" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              {" "}— day_of_week sent automatically
            </div> */}
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
              ? "📍  Will she be late again?"
              : "🎟  Scan & Predict"}
          </button>
          </>
)}
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
      {/* )} */}
 
        {( 
          <div style={{ textAlign: "center" as const, padding: "24px 0" }}>
            
            {/* CONTAINER FOR IMAGE + SPINNER */}
            <div style={{ 
              position: "relative", 
              width: "80vmin",  // 80% of the smaller screen dimension
              height: "80vmin", 
              maxWidth: "360px", // Won't get bigger than 360px on desktop
              maxHeight: "360px",
              margin: "auto" 
            }}>
              
              {/* 1. THE IMAGE (Circle Frame) */}
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #333", // Subtle border for the frame
                backgroundImage: `url('/clock.png')`,
                backgroundSize: "130%", // Zoomed in to 150%
                backgroundPosition: "64% 6%",
                opacity: 0.6, // Dimmed so the loader stands out
              }} />

              <img 
                      src="/clock-icon.png" // Path to your clock PNG in public folder
                      alt="clock"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "100%", // Matches the frame size
                        height: "100%",
                        // translate centers it, rotate(deg) makes it real-time
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transition: "transform 0.1s linear",
                        pointerEvents: "none", // Clicks pass through to background
                        zIndex: 10,
                        opacity: 0.9
                      }}
                    />
              </div>
          </div>
        )}
    

        {(loading && 
          <div style={{ textAlign: "center" as const, padding: "24px 0" }}>
            {/* TEXT */}
            <p style={{
              margin: 0, 
              fontSize: 11, 
              color: "#888", 
              fontFamily: "sans-serif", // Matches your tech theme
              letterSpacing: "0.1em", 
              textTransform: "uppercase" as const,
            }}>
              Plotting route · factoring in excuses...
            </p>
          </div>
        )}
          {result && (
            <div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center", // Centers children horizontally
                gap: 8,
                marginBottom: 24,
                textAlign: "center"
              }}>
                <div>
                  <p style={{
                    margin: "0 0 2px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.16em", color: "#f97316", alignItems: "center",
                    textTransform: "uppercase" as const, fontFamily: "sans-serif",
                  }}>
                    Late by (est.)
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>                    <span style={{
                      fontSize: 52, fontWeight: 900, color: "#fff",
                      lineHeight: 1, fontFamily: "sans-serif", textAlign: "center"
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
              <div className="flex flex-col gap-6 max-w-md mx-auto p-4 animate-in fade-in duration-500">
    
              {/* 1. LABEL */}
              <div className="flex flex-col gap-2">
                <label 
                  className="text-white text-xs font-sans-serif uppercase tracking-widest ml-1"
                >
                  Arrival Time
                </label>

                {/* 2. TEXTBOX (Datetime Input) */}
                
                <input
                  type="datetime-local"
                  // The input needs 'YYYY-MM-DDTHH:mm', so we slice off the seconds and 'Z' for display
                  value={arrivaldate ? date.slice(0, 16) : ""}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    if (!isNaN(selectedDate.getTime())) {
                      // 8 hours in milliseconds: 8 * 60 * 60 * 1000 = 28,800,000
                      const gmt8Offset = 8 * 60 * 60 * 1000;
                      const gmt8Date = new Date(selectedDate.getTime() + (8 * 60 * 60 * 1000));

                      // Format to ISO, remove milliseconds, and add 'Z' back
                      const isoZFormat = gmt8Date.toISOString().split('.')[0] + "Z";
                      setArrivalDate(isoZFormat);
                    }
                  }}
                  className="w-full bg-black/40 border border-white/20 rounded-lg p-4 text-white font-sans-serif focus:outline-none focus:border-orange-500 transition-all shadow-inner"
                  style={{
                    colorScheme: 'dark', 
                  }}
                />
              </div>

              {/* 3. SUBMIT BUTTON */}
              <button
                onClick={handleSubmit} // Function defined below
                disabled={!arrivaldate || isSubmitting || isSubmitted}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed text-white font-sans-serif tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
              >
                {isSubmitting ? "Submitting..." : isSubmitted ? "Submitted" : "Submit"}
              </button>
            </div>

            ({ isSubmitting && <>
               {/* ── Live countdown ──────────────────────────────────────────── */}
               {arrivalTime && (
                <div style={{
                  marginTop: 14,
                  padding: "16px",
                  background: countdown === 0
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(249,115,22,0.06)",
                  borderRadius: 12,
                  border: `1px solid ${countdown === 0
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(249,115,22,0.2)"}`,
                  textAlign: "center" as const,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: "0.16em",
                    color: countdown === 0 ? "#22c55e" : "#f97316",
                    fontFamily: "sans-serif",
                    textTransform: "uppercase" as const,
                    marginBottom: 6,
                  }}>
                    {countdown === 0 ? "✅ She should be here!" : "⏳ Arrival countdown"}
                  </div>
                  <div style={{
                    fontSize: 38,
                    fontWeight: 900,
                    fontFamily: "monospace",
                    color: countdown === 0 ? "#22c55e" : "#fff",
                    letterSpacing: "0.04em",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}>
                    {countdown === 0 ? "🎉 Arrived!" : formatCountdown(countdown)}
                  </div>
                  <div style={{
                    fontSize: 11, color: "#555", fontFamily: "sans-serif",
                  }}>
                    Expected at{" "}
                    <span style={{ color: "#f97316", fontWeight: 600 }}>
                      {arrivalTime.toLocaleTimeString("en-SG", {
                        hour: "2-digit", minute: "2-digit",
                        hour12: true, timeZone: "Asia/Singapore",
                      })}
                    </span>
                  </div>
                </div>
              )}
 
              {/* ── Telegram status ─────────────────────────────────────────── */}
              {(tgSent || tgError) && (
                <div style={{
                  marginTop: 10,
                  padding: "10px 14px",
                  background: tgSent
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(239,68,68,0.08)",
                  borderRadius: 8,
                  border: `1px solid ${tgSent
                    ? "rgba(34,197,94,0.25)"
                    : "rgba(239,68,68,0.25)"}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {tgSent ? "✈️" : "⚠️"}
                  </span>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700,
                      color: tgSent ? "#22c55e" : "#f87171",
                      fontFamily: "sans-serif", letterSpacing: "0.06em",
                    }}>
                      {tgSent ? "Telegram notification sent!" : "Telegram failed"}
                    </div>
                    <div style={{
                      fontSize: 11, color: "#555", fontFamily: "sans-serif", marginTop: 2,
                    }}>
                      {tgSent
                        ? "Countdown + arrival time delivered to your chat"
                        : tgError}
                    </div>
                  </div>
                </div>
              )}
            </>})


              {/* <div style={{ display: "flex", gap: 8 }}>
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
              </div> */}

              {/* <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: 10, color: "#333", fontFamily: "monospace",
                  letterSpacing: "0.1em",
                }}>
                  SEAT: COUCH · SECTION: WAITING
                </span>
                <span style={{ fontSize: 10, color: "#333", fontFamily: "monospace" }}>
                  #{Math.floor(Math.random() * 90000 + 10000)}
                </span>
              </div> */}
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
