"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { logger } from "../lib/logger";
import { supabase } from "@/lib/supabaseClient";
import React from "react";
import PredictionHeader from "@/components/PredictionHeader";

type PollResult = {
  ok: boolean;
  correctOption: string;
  totalVotes: number;
  winners: { username: string; points: number; option: string }[];
};

// Define a type for the category object
interface CategoryItem {
  category_id: string;
  category: string;
}
// ── Types ─────────────────────────────────────────────────────────────────────
type Coords = { lat: number; lng: number };
type PredictionResult = {
  estimatedMinutes: number;
  message: string;
  model: string;
  // distance_km: number;
};
type SubmitResult = {
  status: string;
};
type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
};

async function sendTelegram(payload: {
  date: string;
  estimatedMinutes: number;
  category: string;
  destination: Coords;
  destName: string;
}): Promise<{ ok: boolean; arrivalTime?: string }> {
  const res = await fetch("/api/telegram/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Fetch unique categories from Supabase ─────────────────────────────────────
async function fetchCategories(): Promise<CategoryItem[]> {
  const { data, error } = await supabase
    .from("Category")
    .select("category_id, category");

  if (error) {
    console.error("Supabase Error:", error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryItem[];
}

// ── API endpoint ──────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FEEDBACK_URL = process.env.NEXT_PUBLIC_API_FEEDBACK;

const START_COORDS: Coords = {
  lat: Number(process.env.NEXT_PUBLIC_LAT),
  lng: Number(process.env.NEXT_PUBLIC_LNG),
};
const START_LABEL = "Jane Doe House";

// ── Real API call ─────────────────────────────────────────────────────────────
async function fetchPrediction(
  start: Coords,
  end: Coords,
  category: string,
  date: string,
): Promise<PredictionResult> {
  // JS getDay() → 0=Sun…6=Sat. API expects 0=Mon…6=Sun, so we shift.
  const jsDay = new Date().getDay();
  const day = jsDay === 0 ? 6 : jsDay - 1;

  const payload = {
    datetime_val: date,
    init_latlon: [start.lat, start.lng],
    dest_latlon: [end.lat, end.lng],
    category_id: category,
  };

  console.log("payload:" + payload);

  if (!API_URL) {
    throw new Error("API_URL is not defined in the environment");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  logger.info("Payload: " + JSON.stringify(res));

  const data = await res.json();

  // Normalise whatever shape the API returns into our local type.
  // Adjust field names below if your Flask response uses different keys.
  const minutes: number = data.pred_min ?? 0;

  const model: string = data.models_used;

  const messages: Record<string, string> = {
    High: "She might actually be on time 👀",
    Medium: "Running fashionably late ✨",
    Low: "Classic. Absolutely classic. 😂",
  };

  const confidence: string =
    data.confidence ??
    (minutes < 10 ? "High" : minutes < 20 ? "Medium" : "Low");

  return {
    estimatedMinutes: Math.round(minutes),
    model,
    message: data.message ?? messages[confidence] ?? "Prediction complete.",
  };
}

async function submitForm(
  meeting_location: string,
  datetime: string,
  start: Coords,
  dest: Coords,
  category: string,
  est_min: number,
  act_min: number,
  arrived_datedtime: string,
): Promise<SubmitResult> {
  const payload = {
    meeting_location: meeting_location,
    meeting_datetime: datetime,
    init_latlon: [start.lat, start.lng],
    meeting_latlon: [dest.lat, dest.lng],
    category_id: category,
    pred_min: est_min,
    arrived_datetime: arrived_datedtime,
  };

  if (!FEEDBACK_URL) {
    throw new Error("FEEDBACK_URL is not defined in the environment");
  }

  const response = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  const res: string = data.status ?? "Response did not go through";

  return {
    status: res,
  };
}

// ── Place search bar (Nominatim) ──────────────────────────────────────────────
function PlaceSearch({
  onSelect,
}: {
  onSelect: (c: Coords, name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border:
            open || query
              ? "1px solid rgba(96,165,250,0.6)"
              : "1px solid rgba(255,255,255,0.1)",
          borderRadius: open && results.length > 0 ? "8px 8px 0 0" : 8,
          transition: "border-color 0.2s",
          overflow: "hidden",
        }}
      >
        {/* Search icon */}
        <div style={{ padding: "0 12px", color: "#555", flexShrink: 0 }}>
          {searching ? (
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                borderTop: "2px solid #60a5fa",
                animation: "spin 0.7s linear infinite",
              }}
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="#60a5fa" strokeWidth="2" />
              <path
                d="M21 21l-4.35-4.35"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeLinecap="round"
              />
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
          <button
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "none",
              padding: "0 12px",
              cursor: "pointer",
              color: "#555",
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "#F4F4F2",
            border: "1px solid rgba(96,165,250,0.4)",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            zIndex: 1000,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {results.map((r, i) => {
            const parts = r.display_name.split(",");
            const name = parts[0];
            const sub = parts.slice(1, 3).join(",").trim();
            return (
              <button
                key={r.place_id}
                onClick={() => handleSelect(r)}
                style={{
                  display: "block",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop:
                    i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  padding: "10px 14px",
                  textAlign: "left" as const,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(96,165,250,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#090909",
                    fontFamily: "Nunito",
                    fontWeight: 500,
                    marginBottom: 2,
                  }}
                >
                  {name}
                </div>
                <div
                  style={{ fontSize: 11, color: "#555", fontFamily: "Nunito" }}
                >
                  {sub}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#3a3a3a",
                    fontFamily: "Nunito",
                    marginTop: 3,
                  }}
                >
                  {parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}
                </div>
              </button>
            );
          })}
          <div
            style={{
              padding: "6px 14px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <span style={{ fontSize: 10, color: "#333", fontFamily: "Nunito" }}>
              📡 Results via OpenStreetMap Nominatim
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [date, setDate] = useState<string>("");
  const [arrivaldate, setArrivalDate] = useState<string>("");
  const [categoryId, setCategory] = useState<string>(""); // Assuming your state looks something like this:
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [destination, setDestination] = useState<Coords | null>(null);
  const [destName, setDestName] = useState<string>("");
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [flyTo, setFlyTo] = useState<Coords | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // ── Telegram + countdown state ─────────────────────────────────────────────
  const [tgSent, setTgSent] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Add after your existing telegram states
  const [pollResult, setPollResult] = useState<PollResult | null>(null);

  const BRACKETS = [
    { label: "🟢 Early", sub: "0 – 5 min", value: 3 },
    { label: "🟡 A bit", sub: "5 – 10 min", value: 7 },
    { label: "🟠 Late", sub: "10 – 20 min", value: 15 },
    { label: "🔴 Very late", sub: "20 – 30 min", value: 25 },
  ];

  // ── Live countdown ticker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!arrivalTime) return;
    const tick = () => {
      const remaining = Math.round((arrivalTime.getTime() - Date.now()) / 1000);
      setCountdown(Math.max(0, remaining));
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
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
  };

  // Fetch categories from Supabase on mount
  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        console.log("Fetched Categories:", cats); // Check your browser console!
        if (cats && cats.length > 0) {
          setCategories(cats);
          setCategory(cats[0].category_id);
        }
      })
      .catch((err) => console.error("UI Load Error:", err))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

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
    setTgSent(false);
    setTgError(null);
    setArrivalTime(null);

    try {
      const res = await fetchPrediction(
        START_COORDS,
        destination,
        categoryId,
        date,
      );
      setResult(res);

      // ── Compute arrival time and start countdown ──────────────────────────
      const arrival = new Date(Date.now() + res.estimatedMinutes * 60 * 1000);
      setArrivalTime(arrival);
      // ── Fire Telegram notification ────────────────────────────────────────
      try {
        const category = getCategoryNameById(categoryId);
        const tg = await sendTelegram({
          date,
          estimatedMinutes: res.estimatedMinutes,
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
    setPollResult(null);
    setIsSubmitted(false);
    setIsSubmitting(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
    if (!destination || !result) return;

    const minDiff = getDurationInMinutes();

    try {
      alert("Your request has been submitted!");
      setIsSubmitting(true);
      setTgSent(false);

      // ── 1. Submit form to FastAPI (your existing call) ──────────────────────
      const res = await submitForm(
        destName,
        date,
        START_COORDS,
        destination,
        categoryId,
        result.estimatedMinutes,
        minDiff,
        arrivaldate,
      );
      setSubmitResult(res);
      setIsSubmitted(true);
    } catch (err: any) {
      setApiError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const canPredict = !!destination && !loading && !!date && !!categories;
  const canSubmit = !!arrivaldate;

  // Pass in the ID, get back the string name
  const getCategoryNameById = (id: string): string => {
    const match = categories.find((item) => item.category_id === id);
    return match ? match.category : "Unknown Category";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F4F4F2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "Nunito",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Main body ────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--text-primary)",
            padding: "24px 24px 20px",
            borderRadius: "16px 16px 0 0",
            border: "1px solid #E3E3E0",
            borderTop: "none",
          }}
        >
          {/* Title */}
          <PredictionHeader />
        </div>
        {!result && (
          <>
            <div
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--text-secondary)",
                padding: "24px 24px 20px",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase" as const,
                    fontFamily: "Nunito",
                    marginBottom: 8,
                  }}
                >
                  Destination
                </div>

                <div style={{ marginBottom: 10, background: "#F4F4F2" }}>
                  <PlaceSearch onSelect={handleSearchSelect} />
                </div>
              </div>

              {destination ? (
                <div
                  style={{
                    marginBottom: 14,
                    padding: "10px 14px",
                    background: "#F4F4F2",
                    borderRadius: 8,
                    borderLeft: "3px solid var(--text-secondary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase" as const,
                        fontFamily: "Nunito",
                      }}
                    >
                      Destination set
                    </div>
                    {destName && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#1E1E2E",
                          fontFamily: "Nunito",
                          marginTop: 2,
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {destName.split(",").slice(0, 2).join(",")}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b87ab",
                        fontFamily: "Nunito",
                        marginTop: 2,
                      }}
                    >
                      {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(75,74,207,0.3)",
                      borderRadius: 6,
                      color: "var(--text-secondary)",
                      fontSize: 11,
                      fontFamily: "Nunito",
                      padding: "4px 10px",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginLeft: 10,
                    }}
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <Fragment />
              )}

              {/* DATE TIME PICKER */}
              <div className="w-full space-y-4">
                <label
                  className="text-xs"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase" as const,
                    fontFamily: "Nunito",
                    marginBottom: 8,
                  }}
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
                      const gmt8Date = new Date(
                        selectedDate.getTime() + gmt8Offset,
                      );
                      const isoZFormat =
                        gmt8Date.toISOString().split(".")[0] + "Z";
                      setDate(isoZFormat);
                    }
                  }}
                  className="w-full rounded-lg p-3 font-Nunito focus:outline-none transition-colors"
                  style={{
                    background: "#F4F4F2",
                    border: "1px solid #E3E3E0",
                    color: "#1E1E2E",
                    colorScheme: "light",
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    color: "var(--text-secondary)",
                    textTransform: "uppercase" as const,
                    fontFamily: "Nunito",
                    marginBottom: 8,
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  What's the occasion?
                  {categoriesLoading && (
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        color: "var(--text-secondary)",
                        textTransform: "uppercase" as const,
                        fontFamily: "Nunito",
                        marginBottom: 8,
                      }}
                    />
                  )}
                </div>
                <div style={{ position: "relative", width: "100%" }}>
                  <select
                    value={categoryId || ""}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: "#F4F4F2",
                      border: "1px solid #E3E3E0",
                      borderRadius: "8px",
                      color: categoryId ? "var(--text-secondary)" : "#888",
                      fontSize: "14px",
                      fontFamily: "Nunito",
                      appearance: "none",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="" disabled>
                      -- Select a Category --
                    </option>
                    {categories.length > 0 ? (
                      categories.map((item) => (
                        <option key={item.category_id} value={item.category_id}>
                          {item.category}
                        </option>
                      ))
                    ) : (
                      <option disabled>No categories found</option>
                    )}
                  </select>

                  <div
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "#999",
                      fontSize: "10px",
                    }}
                  >
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--text-secondary)",
                padding: "24px 24px 20px",
              }}
            >
              <button
                onClick={handlePredict}
                disabled={!canPredict}
                style={{
                  width: "100%",
                  background: canPredict
                    ? "linear-gradient(135deg,#4B4ACF,#6C6BE8)"
                    : "#E3E3E0",
                  border: canPredict ? "none" : "1px solid #E3E3E0",
                  borderRadius: 10,
                  padding: "14px",
                  color: canPredict ? "#fff" : "#aaa",
                  fontSize: 14,
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase" as const,
                  fontFamily: "Nunito",
                  cursor: canPredict ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {loading
                  ? "⏳ Calculating route..."
                  : "📍 Will she be late again?"}
              </button>
            </div>
          </>
        )}

        {/* ── Result stub ──────────────────────────────────────── */}
        <div
          style={{
            background: "var(--text-primary)",
            borderRadius: "0 0 16px 16px",
            padding: result ? "24px 24px 28px" : "16px 24px 20px",
            border: "1px solid #E3E3E0",
            borderTop: "none",
          }}
        >
          {!result && !loading && !apiError && <Fragment />}

          {apiError && (
            <div
              style={{
                padding: "16px 14px",
                background: "rgba(239,68,68,0.08)",
                borderRadius: 8,
                borderLeft: "3px solid #ef4444",
                textAlign: "center" as const,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 8 }}>⚠️</div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 13,
                  color: "#dc2626",
                  fontFamily: "Nunito",
                  fontWeight: 600,
                }}
              >
                API Error
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#888",
                  fontFamily: "Nunito",
                }}
              >
                {apiError}
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: "center" as const, padding: "24px 0" }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: "var(--card-bg)",
                  fontFamily: "Nunito",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                }}
              >
                Plotting route · factoring in excuses...
              </p>
            </div>
          )}
          {result && (
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      color: "var(--bg-primary)",
                      alignItems: "center",
                      textTransform: "uppercase" as const,
                      fontFamily: "Nunito",
                    }}
                  >
                    Late by (est.)
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 52,
                        fontWeight: 900,
                        color: "var(--bg-primary)",
                        lineHeight: 1,
                        fontFamily: "Nunito",
                        textAlign: "center",
                      }}
                    >
                      {result.estimatedMinutes}
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        color: "#888",
                        fontFamily: "Nunito",
                      }}
                    >
                      min
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(75,74,207,0.06)",
                  borderRadius: 8,
                  borderLeft: "3px solid #4B4ACF",
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "var(--bg-primary)",
                    fontFamily: "Nunito",
                    lineHeight: 1.5,
                  }}
                >
                  {result.message}
                </p>
              </div>

              <div className="flex flex-col gap-6 max-w-md mx-auto p-4 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs uppercase tracking-widest ml-1 flex items-start justify-between gap-3 focus:outline-none transition-colors duration-200 text-left w-full"
                    style={{
                      fontFamily: "Nunito",
                      backgroundColor: "var(--text-secondary)",
                      color: "var(--bg-primary)",
                      borderRadius: "10px",
                      padding: "12px 18px",
                      marginBottom: "10px",
                    }}
                  >
                    <span className="flex-1 leading-relaxed">
                      Has she arrived? Click here to input her actual arrival
                      time
                    </span>
                    {/* Dynamic Arrow Indicator */}
                    <span
                      className={`transform transition-transform duration-200 mt-0.5 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Conditionally render the input based on isOpen state */}
                  {isOpen && (
                    <input
                      type="datetime-local"
                      value={arrivaldate ? arrivaldate.slice(0, 16) : ""}
                      onChange={(e) => {
                        const selectedArrivalDate = new Date(e.target.value);
                        if (!isNaN(selectedArrivalDate.getTime())) {
                          const gmt8Date = new Date(
                            selectedArrivalDate.getTime() + 8 * 60 * 60 * 1000,
                          );
                          const isoZFormat =
                            gmt8Date.toISOString().split(".")[0] + "Z";
                          setArrivalDate(isoZFormat);
                        }
                      }}
                      className="w-full rounded-lg p-4 font-Nunito focus:outline-none transition-all shadow-inner animate-in fade-in slide-in-from-top-2 duration-200"
                      style={{
                        background: "#F4F4F2",
                        border: "1px solid #E3E3E0",
                        color: "var(--text-secondary)",
                        colorScheme: "light",
                      }}
                    />
                  )}
                </div>

                {isOpen && (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isSubmitted || !canSubmit}
                    className="w-full py-4 text-white font-Nunito tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                    style={{
                      background:
                        isSubmitting || isSubmitted ? "#DDDCF8" : "#4B4ACF",
                      color: isSubmitting || isSubmitted ? "#4B4ACF" : "#fff",
                      cursor:
                        isSubmitting || isSubmitted ? "not-allowed" : "pointer",
                    }}
                  >
                    {isSubmitted
                      ? "Submitted"
                      : isSubmitting
                        ? "Submitting..."
                        : "Submit"}
                  </button>
                )}
              </div>

              {(tgSent || tgError) && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 14px",
                    background: tgSent
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(239,68,68,0.08)",
                    borderRadius: 8,
                    border: `1px solid ${
                      tgSent ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"
                    }`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>
                    {tgSent ? "✈️" : "⚠️"}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tgSent ? "#22c55e" : "#f87171",
                        fontFamily: "Nunito",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {tgSent
                        ? "Telegram notification sent!"
                        : "Telegram failed"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--bg-primary)",
                        fontFamily: "Nunito",
                        marginTop: 2,
                      }}
                    >
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
    </div>
  );
}
