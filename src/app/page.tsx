"use client"

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { logger } from '../lib/logger';
import { supabase } from "@/lib/supabaseClient";
import { resendEmail } from '@/lib/resendClient';
import { Resend } from "resend";
import React from "react";
import { json } from "stream/consumers";

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


async function submitForm(datetime: string, start: Coords, dest: Coords, category: string, est_min: number, act_min: number): Promise<SubmitResult> {

  const payload = {
    "datetime_val": datetime,
    "init_latlon": [start.lat, start.lng],
    "dest_latlon": [dest.lat, dest.lng],
    category,
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
        background: "2px solid #F4F4F2", // search map bar
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
              border: "2px solid #F4F4F2",
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
            color: "#140202",
            fontSize: 13,
            fontFamily: "Nunito",
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
          background: "#F4F4F2",
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
                <div style={{ fontSize: 13, color: "#090909", fontFamily: "Nunito",
                  fontWeight: 500, marginBottom: 2 }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "#555", fontFamily: "Nunito" }}>
                  {sub}
                </div>
                <div style={{ fontSize: 10, color: "#3a3a3a", fontFamily: "Nunito", marginTop: 3 }}>
                  {parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}
                </div>
              </button>
            );
          })}
          <div style={{ padding: "6px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: 10, color: "#333", fontFamily: "Nunito" }}>
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
          fontSize: 11, fontFamily: "Nunito",
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
      const res = await submitForm(date, START_COORDS, destination, category, result?.estimatedMinutes, minDiff)
      setSubmitResult(res)
      setIsSubmitted(true); // Mark as done to keep button disabled
    } catch (err: any) {
      setApiError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }}

  const canPredict = !!destination && !loading && !!date && !!categories;

  // if (!destination) 
  // sendLateEmail('tan.ivancjq@gmail.com', result?.estimatedMinutes ?? 0)

  return (
    <div style={{
      minHeight: "100vh", background: "#F4F4F2",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "32px 16px", fontFamily: "Nunito",
    }}>
      <div style={{ width: "100%", maxWidth: 540, display: "flex", flexDirection: "column" }}>

        {/* ── Header band ─────────────────────────────────────── */}
        {/* <div style={{
          background: "#1E1E2E", borderRadius: "16px 16px 0 0",
          padding: "14px 24px", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                fill="rgba(255,255,255,0.5)"/>
            </svg>
            <span style={{
              fontFamily: "Nunito", fontWeight: 900,
              fontSize: 13, letterSpacing: "0.08em", color: "#fff",
              textTransform: "uppercase" as const,
            }}>
              LateTracker™
            </span>
          </div>
        </div> */}

        {/* ── Main body ────────────────────────────────────────── */}
        <div style={{
          background: "var(--text-primary)", padding: "24px 24px 20px", borderRadius: "16px 16px 0 0",
          border: "1px solid #E3E3E0", borderTop: "none",
        }}>
          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <p style={{
              margin: 0, fontSize: 11, letterSpacing: "0.18em", color: "var(--card-bg)",
              fontFamily: "Nunito", fontWeight: 700,
              textTransform: "uppercase" as const, // Border Styling
              border: "1px solid var(--text-secondary)", // Solid Indigo line 
              borderRadius: "4px", // Rounded corners like the PDF [cite: 1]
              padding: "4px 10px", // Internal spacing
              display: "inline-block", // Wraps the border tightly around the text
              background: "var(--text-secondary)", // Soft accent background
            }}>
              Live Event Prediction
            </p>
            <h1 style={{
              margin: "4px 0 0", fontSize: 26, fontWeight: 900,
              color: "var(--card-bg)", lineHeight: 1.2, fontFamily: "Nunito"
            }}>
              How Late Will She Be?
            </h1>
          </div>
          <p style={{ fontFamily: "Nunito", color: "var(--card-bg)" }}>
            Fill in the details below and find out
          </p>
        </div>

              {!result && ( 
              <>
              <div style={{background: "var(--card-bg)", border: "1px solid var(--text-secondary)", padding: "24px 24px 20px",}}>
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "var(--text-secondary)", textTransform: "uppercase" as const,
                  fontFamily: "Nunito", marginBottom: 8,
                }}>
                  Destination
                </div>

                <div style={{ marginBottom: 10, background: "#F4F4F2" }}>
                  <PlaceSearch onSelect={handleSearchSelect} />
                </div>
              </div>

              {destination ? (
                <div style={{
                  marginBottom: 14, padding: "10px 14px",
                  background: "#F4F4F2", borderRadius: 8,
                  borderLeft: "3px solid #4B4ACF",
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      color: "#4B4ACF", textTransform: "uppercase" as const,
                      fontFamily: "Nunito",
                    }}>
                      Destination set
                    </div>
                    {destName && (
                      <div style={{
                        fontSize: 13, color: "#1E1E2E", fontFamily: "Nunito",
                        marginTop: 2, fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {destName.split(",").slice(0, 2).join(",")}
                      </div>
                    )}
                    <div style={{
                      fontSize: 11, color: "#6b87ab", fontFamily: "Nunito", marginTop: 2,
                    }}>
                      {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                    </div>
                  </div>
                  
                  <button onClick={handleReset} style={{
                    background: "transparent",
                    border: "1px solid rgba(75,74,207,0.3)",
                    borderRadius: 6, color: "#4B4ACF", fontSize: 11,
                    fontFamily: "Nunito", padding: "4px 10px",
                    cursor: "pointer", flexShrink: 0, marginLeft: 10,
                  }}>
                    Reset
                  </button>
                </div>
              ) : (
                <Fragment/>
              )}
          
              {/* DATE TIME PICKER */}
              <div className="w-full space-y-4">
              <label 
                className="text-xs" 
                style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                  color: "var(--text-secondary)", textTransform: "uppercase" as const,
                  fontFamily: "Nunito", marginBottom: 8,}}
              >
              Date & Time Picker
              </label>         
              <input
                type="datetime-local"
                value={date ? date.slice(0, 16) : ""}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  if (!isNaN(selectedDate.getTime())) {
                    const gmt8Offset = 8 * 60 * 60 * 1000;
                    const gmt8Date = new Date(selectedDate.getTime() + gmt8Offset);
                    const isoZFormat = gmt8Date.toISOString().split('.')[0] + "Z";
                    setDate(isoZFormat);
                  }
                }}
                className="w-full rounded-lg p-3 font-Nunito focus:outline-none transition-colors"
                style={{
                  background: "#F4F4F2",
                  border: "1px solid #E3E3E0",
                  color: "#1E1E2E",
                  colorScheme: 'light', 
                }}
              />
              </div>

            {/* Category */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--text-secondary)", 
                  textTransform: "uppercase" as const, fontFamily: "Nunito", marginBottom: 8, marginTop: 8,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  What's the occasion?
                  {categoriesLoading && (
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
                      color: "var(--text-secondary)", textTransform: "uppercase" as const,
                      fontFamily: "Nunito", marginBottom: 8,
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
                      background: "#F4F4F2",
                      border: "1px solid #E3E3E0",
                      borderRadius: "8px",
                      color: category ? "var(--text-secondary)" : "#888",
                      fontSize: "14px",
                      fontFamily: "Nunito",
                      appearance: "none",
                      cursor: "pointer",
                      outline: "none"
                    }}
                  >
                    <option value="" disabled>Select an occasion...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} style={{ background: "#fff", color: "#1E1E2E" }}>
                        {CATEGORY_EMOJI[cat] ?? "📌"} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
      
                  <div style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#999",
                    fontSize: "10px"
                  }}>
                    ▼
                  </div>
                </div>
              </div>
              </div>
             

          {/* CTA */}
          <button onClick={handlePredict} disabled={!canPredict} style={{
            width: "100%",
            background: canPredict
              ? "linear-gradient(135deg,#4B4ACF,#6C6BE8)" : "#E3E3E0",
            border: canPredict ? "none" : "1px solid #E3E3E0",
            borderRadius: 10, padding: "14px",
            color: canPredict ? "#fff" : "#aaa",
            fontSize: 14, fontWeight: 900, letterSpacing: "0.12em",
            textTransform: "uppercase" as const, fontFamily: "Nunito",
            cursor: canPredict ? "pointer" : "not-allowed", transition: "all 0.2s",
          }}>
            {loading
              ? "⏳  Calculating route..."
              : !destination
              ? "📍  Will she be late again?"
              : "🎟  Estimate arrival time"}
          </button>
          </>
        )}
        

        {/* ── Perforated tear ──────────────────────────────────── */}
        <div style={{
          background: "#FFFFFF",
          borderLeft: "1px solid #E3E3E0",
          borderRight: "1px solid #E3E3E0",
          display: "flex", alignItems: "center",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#F4F4F2",
            marginLeft: -10, flexShrink: 0, border: "1px solid #E3E3E0",
          }} />
          <div style={{ flex: 1 }}><PerforatedEdge /></div>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#F4F4F2",
            marginRight: -10, flexShrink: 0, border: "1px solid #E3E3E0",
          }} />
        </div>

       {/* ── Result stub ──────────────────────────────────────── */}
       <div style={{
          background: "var(--text-primary)", borderRadius: "0 0 16px 16px",
          padding: result ? "24px 24px 28px" : "16px 24px 20px",
          border: "1px solid #E3E3E0", borderTop: "none",
        }}>
          {!result && !loading && !apiError && (
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
                margin: "0 0 4px", fontSize: 13, color: "#dc2626",
                fontFamily: "Nunito", fontWeight: 600,
              }}>
                API Error
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#888", fontFamily: "Nunito" }}>
                {apiError}
              </p>
            </div>
          )}

        {( 
          <div style={{ textAlign: "center" as const, padding: "24px 0", background: "var(--text-primary)"}}>
            <div style={{ 
              position: "relative", 
              width: "80vmin",
              height: "80vmin", 
              maxWidth: "360px",
              maxHeight: "360px",
              margin: "auto",
            }}>
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #E3E3E0",
                backgroundImage: `url('/clock.png')`,
                backgroundSize: "130%",
                backgroundPosition: "64% 6%",
                opacity: 0.6,
              }} />

              <img 
                src="/clock-icon.png"
                alt="clock"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "100%",
                  height: "100%",
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  transition: "transform 0.1s linear",
                  pointerEvents: "none",
                  zIndex: 10,
                  opacity: 0.9
                }}
              />
            </div>
          </div>
        )}

        {(loading && 
          <div style={{ textAlign: "center" as const, padding: "24px 0" }}>
            <p style={{
              margin: 0, 
              fontSize: 11, 
              color: "#888", 
              fontFamily: "Nunito",
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
                alignItems: "center",
                gap: 8,
                marginBottom: 24,
                textAlign: "center"
              }}>
                <div>
                  <p style={{
                    margin: "0 0 2px", fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.16em", color: "#4B4ACF", alignItems: "center",
                    textTransform: "uppercase" as const, fontFamily: "Nunito",
                  }}>
                    Late by (est.)
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                    <span style={{
                      fontSize: 52, fontWeight: 900, color: "#1E1E2E",
                      lineHeight: 1, fontFamily: "Nunito", textAlign: "center"
                    }}>
                      {result.estimatedMinutes}
                    </span>
                    <span style={{ fontSize: 16, color: "#888", fontFamily: "Nunito" }}>min</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <ConfidenceBadge level={result.confidence} />
                  </div>
                </div>
              </div>

              <div style={{
                padding: "12px 14px", background: "rgba(75,74,207,0.06)",
                borderRadius: 8, borderLeft: "3px solid #4B4ACF", marginBottom: 14,
              }}>
                <p style={{
                  margin: 0, fontSize: 14, color: "#1E1E2E",
                  fontFamily: "Nunito", lineHeight: 1.5,
                }}>
                  {result.message}
                </p>
              </div>

              <div className="flex flex-col gap-6 max-w-md mx-auto p-4 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                  <label 
                    className="text-xs uppercase tracking-widest ml-1"
                    style={{ fontFamily: "Nunito", color: "#1E1E2E" }}
                  >
                    Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    value={arrivaldate ? arrivaldate.slice(0, 16) : ""}
                    onChange={(e) => {
                      const selectedArrivalDate = new Date(e.target.value);
                      if (!isNaN(selectedArrivalDate.getTime())) {
                        const gmt8Date = new Date(selectedArrivalDate.getTime() + (8 * 60 * 60 * 1000));
                        const isoZFormat = gmt8Date.toISOString().split('.')[0] + "Z";
                        setArrivalDate(isoZFormat);
                      }
                    }}
                    className="w-full rounded-lg p-4 font-Nunito focus:outline-none transition-all shadow-inner"
                    style={{
                      background: "#F4F4F2",
                      border: "1px solid #E3E3E0",
                      color: "#f5f5fa",
                      colorScheme: 'light',
                    }}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSubmitted}
                  className="w-full py-4 text-white font-Nunito tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                  style={{
                    background: isSubmitting || isSubmitted ? "#DDDCF8" : "#4B4ACF",
                    color: isSubmitting || isSubmitted ? "#4B4ACF" : "#fff",
                    cursor: isSubmitting || isSubmitted ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>

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
                      fontFamily: "Nunito", letterSpacing: "0.06em",
                    }}>
                      {tgSent ? "Telegram notification sent!" : "Telegram failed"}
                    </div>
                    <div style={{
                      fontSize: 11, color: "#555", fontFamily: "Nunito", marginTop: 2,
                    }}>
                      {tgSent
                        ? "Countdown + arrival time delivered to your chat"
                        : tgError}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
  
}
