// Define interfaces for type safety
export interface Coords {
  lat: number;
  lng: number;
}

export interface PredictionResult {
  estimatedMinutes: number;
  confidence: "High" | "Medium" | "Low";
  message: string;
  distance_km: number;
}

/**
 * Calculates distance between two points in KM
 */
export const haversine = (start: Coords, end: Coords): number => {
  const R = 6371; // Earth radius
  const dLat = (end.lat - start.lat) * (Math.PI / 180);
  const dLon = (end.lng - start.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(start.lat * (Math.PI / 180)) *
      Math.cos(end.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Core Prediction Logic
 */
export async function fetchPrediction(
  start: Coords,
  end: Coords,
  transport: string,
  category: string
): Promise<PredictionResult> {
  const dist = haversine(start, end);
  
  // Artificial delay for UI "calculating" feel
  await new Promise((r) => setTimeout(r, 1400));

  const speedKmh: Record<string, number> = {
    walking: 5,
    cycling: 15,
    transit: 25,
    driving: 40,
  };

  const travelMin = (dist / (speedKmh[transport] ?? 25)) * 60;
  const extra = Math.floor(Math.random() * 22);
  const total = Math.round(travelMin + extra);
  
  const confidence = extra < 8 ? "High" : extra < 15 ? "Medium" : "Low";
  
  const messages: Record<string, string[]> = {
    High: ["She might actually be on time 👀", "Almost on time. Make a wish."],
    Medium: ["Running fashionably late ✨", "The usual buffer is in full effect."],
    Low: ["Classic. Absolutely classic. 😂", "She's on 'her' time now. ⏳"],
  };

  const pool = messages[confidence];

  return {
    estimatedMinutes: total,
    confidence,
    message: pool[Math.floor(Math.random() * pool.length)],
    distance_km: Math.round(dist * 10) / 10,
  };
}