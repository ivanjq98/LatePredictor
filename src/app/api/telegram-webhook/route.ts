import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const supabase = createClient(
  process.env.GAME_SUPABASE_URL!,
  process.env.GAME_SUPBASE_ANON_KEY!,
);

// ── Poll option ranges (minutes) ──────────────────────────────────────────────
const OPTION_RANGES = [
  { label: "🟢 Early (0–5 min)", min: 0, max: 5 },
  { label: "🟡 5–10 min", min: 5, max: 10 },
  { label: "🟠 10–20 min", min: 10, max: 20 },
  { label: "🔴 20–30 min", min: 20, max: 30 },
];

// ── Points: 100 for correct bracket, less for adjacent ───────────────────────
const POINTS_TABLE = [100, 50, 25, 10];

function calcPoints(votedIndex: number, correctIndex: number): number {
  const diff = Math.abs(votedIndex - correctIndex);
  return POINTS_TABLE[diff] ?? 0;
}

function getCorrectIndex(actualMinutes: number): number {
  for (let i = 0; i < OPTION_RANGES.length; i++) {
    if (
      actualMinutes >= OPTION_RANGES[i].min &&
      actualMinutes < OPTION_RANGES[i].max
    ) {
      return i;
    }
  }
  return OPTION_RANGES.length - 1; // 20-30+ bucket
}

async function tgPost(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Leaderboard formatter ─────────────────────────────────────────────────────
async function sendLeaderboard(chatId: string | number) {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("username, total_points, correct_votes, total_votes")
    .order("total_points", { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    await tgPost("sendMessage", {
      chat_id: chatId,
      text: "📊 No leaderboard data yet. Make some predictions first!",
      parse_mode: "Markdown",
    });
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const rows = data.map((row, i) => {
    const medal = medals[i] ?? `${i + 1}.`;
    const accuracy =
      row.total_votes > 0
        ? Math.round((row.correct_votes / row.total_votes) * 100)
        : 0;
    return `${medal} *${row.username ?? "Anonymous"}*\n    🏆 ${row.total_points} pts · ✅ ${accuracy}% accuracy`;
  });

  const text = `
🏆 *LateTracker Leaderboard*
_Top predictors of Yu Ning's lateness_

${rows.join("\n\n")}

_Cast your vote next time she's late!_
`.trim();

  await tgPost("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  });
}

// ── Main webhook handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ── Handle /leaderboard command ───────────────────────────────────────────
    if (update.message?.text?.startsWith("/leaderboard")) {
      await sendLeaderboard(update.message.chat.id);
      return NextResponse.json({ ok: true });
    }

    // ── Handle poll_answer (someone voted) ────────────────────────────────────
    if (update.poll_answer) {
      const { poll_id, user, option_ids } = update.poll_answer;
      const optionIndex = option_ids[0]; // single choice poll
      const username = user.username ?? user.first_name ?? "Anonymous";

      // Find the poll in Supabase
      const { data: poll } = await supabase
        .from("polls")
        .select("id, is_closed")
        .eq("telegram_poll_id", poll_id)
        .single();

      if (!poll || poll.is_closed) {
        return NextResponse.json({ ok: true }); // poll already closed, ignore
      }

      // Upsert vote (user can change their vote while poll is open)
      await supabase.from("poll_votes").upsert(
        {
          poll_id: poll.id,
          telegram_user_id: user.id,
          username,
          option_index: optionIndex,
          points_earned: 0, // calculated when poll closes
        },
        { onConflict: "poll_id,telegram_user_id" },
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
