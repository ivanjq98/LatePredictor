import { NextResponse } from "next/server";
import { Registry, Counter, Histogram, collectDefaultMetrics } from "prom-client";

// ── Create a registry ──────────────────────────────────────────────────────
const registry = new Registry();
collectDefaultMetrics({ register: registry });  // CPU, memory, etc.

// ── Custom counters ────────────────────────────────────────────────────────
export const predictionsCounter = new Counter({
  name: "nextjs_predictions_total",
  help: "Total predictions triggered from the frontend",
  labelNames: ["category"],
  registers: [registry],
});

export const telegramCounter = new Counter({
  name: "nextjs_telegram_total",
  help: "Telegram notifications sent from Next.js",
  labelNames: ["status"],   // "success" or "failure"
  registers: [registry],
});

export const apiLatency = new Histogram({
  name: "nextjs_api_duration_seconds",
  help: "Time taken for API calls from Next.js",
  labelNames: ["route"],
  registers: [registry],
});

// ── Expose /api/metrics for Prometheus to scrape ───────────────────────────
export async function GET() {
  const metrics = await registry.metrics();
  return new NextResponse(metrics, {
    headers: { "Content-Type": registry.contentType },
  });
}