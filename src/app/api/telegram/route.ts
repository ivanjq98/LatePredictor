import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      estimatedMinutes,
      confidence,
      category,
      destination,
      destName
    }: {
      estimatedMinutes: number;
      confidence: string;
      category: string;
      destName: string;
      destination: { lat: number; lng: number };
    } = body;

    // ── Compute arrival time ─────────────────────────────────────────────────
    const now         = new Date();
    const arrivalTime = new Date(now.getTime() + estimatedMinutes * 60 * 1000);

    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-SG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Singapore",
      });

    const fmtDate = (d: Date) =>
      d.toLocaleDateString("en-SG", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Singapore",
      });

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
🎟 *LateTracker™ Prediction*

📅 *${fmtDate(now)}*
🕐 Predicted at: *${fmt(now)}*

${categoryEmoji[category] ?? "📌"} *Occasion:* ${category}
📍 *Destination:* \`${destName}\`

⏱ *Estimated lateness:* *${estimatedMinutes} minutes*
${confidenceEmoji[confidence] ?? "⚪"} *Confidence:* ${confidence}

🏁 *Expected arrival: ${fmt(arrivalTime)}*

_Countdown: She is expected in *${estimatedMinutes} min* from now._
_Start time: ${fmt(now)} → Arrival: ${fmt(arrivalTime)}_
`.trim();

    // ── Send to Telegram ──────────────────────────────────────────────────────
    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id:    CHAT_ID,
          text:       message,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!tgRes.ok) {
      const err = await tgRes.json();
      return NextResponse.json(
        { error: "Telegram API error", detail: err },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, arrivalTime: arrivalTime.toISOString() });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}