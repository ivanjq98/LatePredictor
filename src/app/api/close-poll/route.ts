import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID!;
const supabase  = createClient(process.env.GAME_SUPABASE_URL!, process.env.GAME_SUPBASE_ANON_KEY!);

const OPTION_RANGES = [
  { label: "🟢 Early (0–5 min)",  min: 0,  max: 5  },
  { label: "🟡 5–10 min",         min: 5,  max: 10 },
  { label: "🟠 10–20 min",        min: 10, max: 20 },
  { label: "🔴 20–30 min",        min: 20, max: 30 },
];

const POINTS_TABLE = [100, 50, 25, 10];

function calcPoints(votedIndex: number, correctIndex: number): number {
  const diff = Math.abs(votedIndex - correctIndex);
  return POINTS_TABLE[diff] ?? 0;
}

function getCorrectIndex(actualMinutes: number): number {
  for (let i = 0; i < OPTION_RANGES.length; i++) {
    if (actualMinutes >= OPTION_RANGES[i].min && actualMinutes < OPTION_RANGES[i].max) {
      return i;
    }
  }
  return OPTION_RANGES.length - 1;
}

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
    const { actualMinutes }: { actualMinutes: number } = await req.json();

    // 1. Get the latest open poll
    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .select("id, telegram_poll_id, message_id")
      .eq("is_closed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pollErr || !poll) {
      return NextResponse.json({ error: "No open poll found" }, { status: 404 });
    }

    const correctIndex = getCorrectIndex(actualMinutes);
    const correctOption = OPTION_RANGES[correctIndex];

    // 2. Stop the Telegram poll
    await tgPost("stopPoll", { chat_id: CHAT_ID, message_id: poll.message_id });

    // 3. Retrieve all votes already stored by your Webhook
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", poll.id);

    const winners: { username: string; points: number; option: string }[] = [];

    // 4. Process points
    if (votes && votes.length > 0) {
      for (const vote of votes) {
        const points = calcPoints(vote.option_index, correctIndex);
        const isExact = vote.option_index === correctIndex;

        // Save points to the individual vote
        await supabase.from("poll_votes").update({ points_earned: points }).eq("id", vote.id);

        // Update the Leaderboard
        const { data: entry } = await supabase
          .from("pointboard") // Using your specific table name from the previous code
          .select("*")
          .eq("telegram_user_id", vote.telegram_user_id)
          .maybeSingle();

        await supabase.from("pointboard").upsert({
          telegram_user_id: vote.telegram_user_id,
          username:         vote.username,
          total_points:     (entry?.total_points ?? 0) + points,
          correct_votes:    (entry?.correct_votes ?? 0) + (isExact ? 1 : 0),
          total_votes:      (entry?.total_votes ?? 0) + 1,
        }, { onConflict: "telegram_user_id" });

        if (points > 0) {
          winners.push({
            username: vote.username,
            points,
            option: OPTION_RANGES[vote.option_index]?.label ?? "Unknown",
          });
        }
      }
    }

    // 5. Close the poll record
    await supabase.from("polls").update({
      is_closed: true,
      actual_minutes: actualMinutes,
      closed_at: new Date().toISOString()
    }).eq("id", poll.id);

    // 6. Final Announcement
    winners.sort((a, b) => b.points - a.points);
    const winnerLines = winners.slice(0, 5).map((w, i) => {
      const medal = ["🥇","🥈","🥉"][i] ?? "🏅";
      return `${medal} *${w.username}*: +${w.points} pts (${w.option})`;
    });

    const announcement = `
🔔 *Poll Results*
Yu Ning was *${actualMinutes}m* late.
Answer: *${correctOption.label}*

${winnerLines.length > 0 ? `*Top Scores:*\n${winnerLines.join("\n")}` : "_No points awarded this round._"}

📊 Total votes: ${votes?.length ?? 0}
`.trim();

    await tgPost("sendMessage", { chat_id: CHAT_ID, text: announcement, parse_mode: "Markdown" });

    return NextResponse.json({ ok: true, winners });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}