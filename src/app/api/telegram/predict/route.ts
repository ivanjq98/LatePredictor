import { NextRequest, NextResponse } from "next/server";
import { telegramCounter } from "@/app/api/metrics/route";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID!;

const supabase = createClient(process.env.GAME_SUPABASE_URL!, process.env.GAME_SUPBASE_ANON_KEY!);

// ── Parse an SGT ISO string without treating it as UTC ────────────────────────
// e.g. "2026-05-10T19:00:00Z" where the value is already SGT → shows 07:00 PM
function parseSGT(isoString: string): Date {
  const clean = isoString.replace("Z", "").replace("z", "");
  const [datePart, timePart] = clean.split("T");
  const [year, month, day]   = datePart.split("-").map(Number);
  const [hour, minute, second = 0] = timePart.split(":").map(Number);
  // new Date(year, month-1, day, hour, min, sec) → local time, no UTC conversion
  return new Date(year, month - 1, day, hour, minute, second);
}

// ── Poll options ──────────────────────────────────────────────────────────────
const POLL_OPTIONS = [
  "🟢 Early (0 – 5 min)",
  "🟡 5 – 10 min",
  "🟠 10 – 20 min",
  "🔴 20 – 30 min",
];
 
// ── Format helpers (no timeZone conversion needed — already local) ─────────────
const fmt = (d: Date) =>
  d.toLocaleTimeString("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
 
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  // ── Send a message to Telegram ────────────────────────────────────────────────
async function tgPost(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      estimatedMinutes,
      category,
      destination,
      destName
    }: {
      date?: string,
      estimatedMinutes: number;
      category: string;
      destName: string;
      destination: { lat: number; lng: number };
    } = body;

    // ── Parse prediction date (SGT) ───────────────────────────────────────────
    const predictionDate = date ? parseSGT(date) : new Date();

    // ── Compute arrival time ─────────────────────────────────────────────────
    const now         = new Date();
    const arrivalTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);

    const confidenceEmoji: Record<string, string> = {
      High: "🟢", Medium: "🟡", Low: "🔴",
    };

    const categoryEmoji: Record<string, string> = {
      "dinner/drinks":   "🍽️",
      "exercise":        "🏃",
      "work/career fair":"💼",
      "breakfast":       "🥞",
      "lunch":           "🥗",
      "apply job":       "📋",
    };
    

    // ── Build the Telegram message ────────────────────────────────────────────
    const message = `
🎟 *LatePredictor* 
by JobSeekers Pte Ltd

📅 *${fmtDate(predictionDate)}*
🕐 Predicted at: *${fmt(predictionDate)}*

${categoryEmoji[category] ?? "📌"} *Occasion:* ${category}
📍 *Destination:* \`${destName}\`

⏱ *Estimated lateness:* *${estimatedMinutes} minutes*

🏁 *Expected arrival: ${fmt(new Date(predictionDate.getTime() +  estimatedMinutes* 60 * 1000))}* 

_Countdown: She is expected in *${estimatedMinutes} min* from now._
_Start time: ${fmt(predictionDate)} → Arrival: ${fmt(new Date(predictionDate.getTime() +  estimatedMinutes* 60 * 1000))}_
`.trim();

const tgResponse = await tgPost("sendMessage", {
         chat_id:    CHAT_ID,
         text:       message,
         parse_mode: "Markdown",
       });
  
       return NextResponse.json({
         ok:          true,
         arrivalTime: arrivalTime.toISOString(),
       });
   
     } catch (err: any) {
       return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
     }
   }