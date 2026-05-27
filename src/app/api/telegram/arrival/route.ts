import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// ── Parse an SGT ISO string without treating it as UTC ────────────────────────
// e.g. "2026-05-10T19:00:00Z" where the value is already SGT → shows 07:00 PM
function parseSGT(isoString: string): Date {
  const clean = isoString.replace("Z", "").replace("z", "");
  const [datePart, timePart] = clean.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);
  // new Date(year, month-1, day, hour, min, sec) → local time, no UTC conversion
  return new Date(year, month - 1, day, hour, minute, second);
}

// ── Format helpers (no timeZone conversion needed — already local) ─────────────
const fmt = (d: Date) =>
  d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// ── Compute arrival time ─────────────────────────────────────────────────
const now = new Date();
const arrivalTime = new Date(now.getTime());

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      arrivaldate,
      destName,
    }: {
      arrivaldate?: string;
      destName: string;
    } = body;

    // ── Parse submit arrival (SGT) ───────────────────────────────────────────
    const arrivalDate = arrivaldate ? parseSGT(arrivaldate) : new Date();
    let location: string = "";

    // --- NEW: Clean the destName to get only the first 3 parts ---
    if (destName && destName.includes(",")) {
      location = destName.split(",").slice(0, 3).join(",").trim();
    } else {
      location = destName;
    }

    // ── Build the Telegram message ────────────────────────────────────────────
    const message = `
    🎟 *LatePredictor* 
    by JobSeekers Pte Ltd

    📍 *Destination:* \`${location}\`
    🏁 *Arrival Time: ${fmt(new Date(arrivalDate.getTime()))}* 
    `.trim();

    // ── Send to Telegram ──────────────────────────────────────────────────────
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
        }),
      },
    );

    return NextResponse.json({
      ok: true,
      arrivalTime: arrivalTime.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
