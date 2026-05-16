import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.GAME_SUPABASE_URL!, process.env.GAME_SUPBASE_ANON_KEY!);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

interface DeezerTrack {
  id: number;
  title: string;
  artist: { name: string };
  preview: string;
  album: { cover_medium: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEARCH_TERMS = [
  "pop hits", "taylor swift", "ed sheeran", "billie eilish",
  "ariana grande", "the weeknd", "dua lipa", "harry styles",
  "olivia rodrigo", "post malone", "drake", "rihanna",
  "beyonce", "lady gaga", "bruno mars", "charlie puth",
  "selena gomez", "justin bieber", "shawn mendes", "camila cabello",
];

// ── Poll option ranges (minutes) ──────────────────────────────────────────────
const OPTION_RANGES = [
  { label: "🟢 Early (0–5 min)",  min: 0,  max: 5  },
  { label: "🟡 5–10 min",         min: 5,  max: 10 },
  { label: "🟠 10–20 min",        min: 10, max: 20 },
  { label: "🔴 20–30 min",        min: 20, max: 30 },
];

const roles = ["Blossom", "Bubbles", "Buttercup", "Mojo Jojo"].sort(() => Math.random() - 0.5);

const ASSETS = {
  LOBBY: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHdxZm53NTFwaHBjaDM1NDh6Y2EzcDQ2aWY3NXE1anZpaGNkeWFsZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BD3jBIALsbOI8/giphy.gif", // PPG flying
  MOJO_WIN: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDkydXBmdnR2Y3Y1bnA4MmQxcWNzbjB2bWg0YWF5MDEzcG05a2YwcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/9dcxwnY5Fl65xW6mjl/giphy.gif", // Mojo laughing
  GIRLS_WIN: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExMXdlaG91ZG9hYm0yMTRyanF0N2lmcDA0cGNha250aGdxNzNzOXRtciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/KpDnCsHaiO7o4/giphy.gif", // Girls celebrating
  WRONG_VOTE: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNW1scmxwNGpsY3pldzY0YnVlY2JzMms4eGozamtwYnM5NHpxcmM3dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/136NDK9Pzd4WWLeHvg/giphy.gif", // Buttercup being annoyed
  QUIT: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWxwZmptM2FnMGJ1YnRpZTlic2Q2djQ2Yjl2MHR1emY0NjBrc2Z3ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iziDlFAa0Ciru/giphy.gif",
  MOJO: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYXd3cnF0aGQ2Yjdmdm1oazJyZ2wyaHBpbTNxajVvb2drMnlwMzY0MyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/dlzd6ldgiIH0nAcciq/giphy.gif",
  BUBBLES: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNXNvbDFpeWt1YndiajA3ZGRybHdpNTFxNGwybWFxMmxwbTZiMTFodSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/k3UkjmH76JtE4H6ZOR/giphy.gif",
  BLOOSOM: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdWQ4Ymg1Z3l6d2xqejFmbGNoNDljNmY3MzZkcHpkOWYxYWNiNTU4NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Qumb7wwbzIQVxUuWw9/giphy.gif",
  BUTTERCUP: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTZlZDhvdDd0MDV2amx4cDNyMGZ1dDMxdmdkM29zNG44bXd2Nnd5MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bu3OZCHFpjzk4/giphy.gif"

};

async function tgSendVisual(method: "sendAnimation" | "sendPhoto", chatId: number, url: string, caption: string) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      [method === "sendAnimation" ? "animation" : "photo"]: url,
      caption: caption,
      parse_mode: "Markdown"
    }),
  });
}

// Update each player in Supabase with their assigned role
// Then send a PRIVATE message to each user telling them who they are

// ── Points: 100 for correct bracket, less for adjacent ───────────────────────
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
  return OPTION_RANGES.length - 1; // 20-30+ bucket
}

async function sendTelegramMessage(chatId: number, text: string, buttons?: any) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown",
      reply_markup: buttons ? { inline_keyboard: buttons } : undefined,
    }),
  });
}

async function tgPost(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
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
      chat_id:    chatId,
      text:       "📊 No leaderboard data yet. Make some predictions first!",
      parse_mode: "Markdown",
    });
    return;
  }

  const medals = ["🥇", "🥈", "🥉"];
  const rows = data.map((row, i) => {
    const medal    = medals[i] ?? `${i + 1}.`;
    const accuracy = row.total_votes > 0
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
    chat_id:    chatId,
    text,
    parse_mode: "Markdown",
  });
}

async function fetchRandomTracks(count: number = 10): Promise<DeezerTrack[]> {
  const term = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
  const offset = Math.floor(Math.random() * 40);
  const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(term)}&limit=25&index=${offset}`);
  const data = await res.json();
  const tracks: DeezerTrack[] = (data.data || []).filter((t: DeezerTrack) => t.preview && t.title && t.artist?.name);
  return tracks.sort(() => Math.random() - 0.5).slice(0, count);
}

async function sendNewRound(chatId: number, gameMode: string): Promise<void> {
  const tracks = await fetchRandomTracks(10);
  if (tracks.length < 4) {
    await sendTelegramMessage(chatId, "⚠️ Couldn't fetch songs right now. Please try again.");
    return;
  }

  const correctTrack = tracks[0];
  const correctAnswer = gameMode === "artist" ? correctTrack.artist.name : correctTrack.title;
  const wrongOptions = tracks.slice(1)
    .map((t) => (gameMode === "artist" ? t.artist.name : t.title))
    .filter((o) => o !== correctAnswer);

  const uniqueWrong = [...new Set(wrongOptions)].slice(0, 3);
  if (uniqueWrong.length < 3) return sendNewRound(chatId, gameMode);

  const options = [correctAnswer, ...uniqueWrong].sort(() => Math.random() - 0.5);
  const correctIndex = options.indexOf(correctAnswer);

  await supabase.from("music_games").update({
    correct_answer: correctAnswer,
    correct_index: correctIndex,
    options: JSON.stringify(options),
    song_title: correctTrack.title,
    artist_name: correctTrack.artist.name,
    preview_url: correctTrack.preview,
  }).eq("user_id", chatId).eq("is_active", true);

  const question = gameMode === "artist" ? "🎤 *Who is the artist?*" : "🎵 *What is the song name?*";
  const buttons = [
    [{ text: options[0], callback_data: "answer_0" }, { text: options[1], callback_data: "answer_1" }],
    [{ text: options[2], callback_data: "answer_2" }, { text: options[3], callback_data: "answer_3" }],
  ];

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendAudio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      audio: correctTrack.preview,
      caption: question,
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: buttons },
    }),
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: true });

  // ── Handle /leaderboard command ───────────────────────────────────────────
    if (body.message?.text?.startsWith("/leaderboard")) {
      await sendLeaderboard(body.message.chat.id);
      return NextResponse.json({ ok: true });
    }

    // ── Handle poll_answer (someone voted) ───────────────────────────────────
    // 2. Handle Poll Answer (The Vote)
    if (body.poll_answer) {
      console.log("1. Webhook received poll_answer:", body.poll_answer.poll_id);
    
      const { data: poll, error } = await supabase
        .from("polls")
        .select("id")
        .eq("telegram_poll_id", body.poll_answer.poll_id)
        .maybeSingle();
    
      if (error) console.log("2. Supabase Fetch Error:", error);
      
      if (poll) {
        const { error: insertError } = await supabase.from("poll_votes").upsert({
          poll_id: poll.id,
          telegram_user_id: body.poll_answer.user.id,
          username: body.poll_answer.user.username || body.poll_answer.user.first_name || "Anonymous",
          option_index: body.poll_answer.option_ids[0],
          points_earned: 0 // Initialize points
        }, { onConflict: "poll_id,telegram_user_id" });

        if (insertError) console.log("4. Insert Error:", insertError);
        else console.log("5. SUCCESS: Vote stored!");
      } else {
        console.log("3. No poll found in DB with ID:", body.poll_answer.poll_id);
      }
      
      // Stop here for poll updates
      return NextResponse.json({ ok: true });
    }

    // 3. EXTRACT DATA FOR MESSAGE/BUTTON UPDATES
    const isButtonPress = !!body.callback_query;
    const chatId = isButtonPress ? body.callback_query.message.chat.id : body.message?.chat.id;
    const isButton = !!body.callback_query;

    const userId = isButton ? body.callback_query.from.id : body.message?.from.id;
    const username = isButtonPress ? body.callback_query.from.first_name : body.message?.from.first_name;
    const text = body.message?.text;

    // If it's not a poll and doesn't have a chatId, we can't process it
    if (!chatId) return NextResponse.json({ ok: true });
    

    // ─── HELPER: Global Reset ───────────────────────────────────────────
    // This function ends ANY active game for the user across all tables
    const resetAllGames = async () => {
      await supabase.from("number_games").update({ is_active: false }).eq("user_id", chatId);
      await supabase.from("music_games").update({ is_active: false }).eq("user_id", chatId);
    };

    // ─── COMMANDS ───────────────────────────────────────────────────────
    // --- COMMAND: INITIALIZE LOBBY ---
    if (text === "/start_ppg") {
      await supabase.from("ppg_players").delete().eq("chat_id", chatId); // Reset old game

      await tgSendVisual("sendAnimation", chatId, ASSETS.LOBBY, "🌸 *Townsville Social Deduction* 🌸\n\nOne of you is Mojo Jojo! Join now to save the city!");
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "🌸 *Townsville Social Deduction* 🌸\n\n3 Powerpuff Girls. 1 Mojo Jojo.\n\nClick below to join the investigation! (Need 4 players)",
        parse_mode: "Markdown",
        reply_markup: { 
          inline_keyboard: [
            [{ text: "Join Game ✅", callback_data: "ppg_join" }],
            [{ text: "Stop Game 🛑", callback_data: "ppg_stop_manual" }] // New button
          ] 
        }      
      });
      return NextResponse.json({ ok: true });
    }

    if (isButton && body.callback_query.data === "ppg_stop_manual") {
      await supabase.from("ppg_players").delete().eq("chat_id", chatId);
      await tgPost("sendMessage", {
        chat_id: chatId,
        text: "🛑 The game was stopped by a player."
      });
      await tgSendVisual("sendAnimation", chatId, ASSETS.QUIT, "That is truly malicious");
      return NextResponse.json({ ok: true });
    }

    // --- CALLBACK: JOIN & ROLE ASSIGNMENT ---
    if (isButton && body.callback_query.data === "ppg_join") {
      // 1. Add player to DB
      const { data: existing } = await supabase.from("ppg_players").select("*").eq("chat_id", chatId).eq("user_id", userId).maybeSingle();
      if (existing) return NextResponse.json({ ok: true });

      await supabase.from("ppg_players").insert({ chat_id: chatId, user_id: userId, username });

      // 2. Check player count
      const { data: players } = await supabase.from("ppg_players").select("*").eq("chat_id", chatId);
      const count = players?.length || 0;

      if (count < 4) {
        await tgPost("sendMessage", { chat_id: chatId, text: `🎮 ${username} joined! (${count}/4 players)` });
      } else {
        // START GAME: Assign Roles
        const roles = ["Blossom", "Bubbles", "Buttercup", "Mojo Jojo"].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < players!.length; i++) {
          const p = players![i];
          const assignedRole = roles[i];
          const isMojo = assignedRole === "Mojo Jojo";

          await supabase.from("ppg_players").update({ role: assignedRole, is_mojo: isMojo }).eq("user_id", p.user_id);

          // Private Message the role
          await tgPost("sendMessage", {
            chat_id: p.user_id,
            text: `🕵️ Your Secret Role: *${assignedRole}*\n\n${isMojo ? "Goal: Don't get caught!" : "Goal: Find Mojo Jojo!"}`,
            parse_mode: "Markdown"
          });

          if (assignedRole == "Blossom")
            await tgSendVisual("sendAnimation", p.user_id, ASSETS.BLOOSOM, "Blossom, commander and the leader");
          else if (assignedRole == "Bubbles")
            await tgSendVisual("sendAnimation", p.user_id, ASSETS.BUBBLES, "Bubbles, she is the joy and the laughter");
          else if (assignedRole == "Buttercup")
            await tgSendVisual("sendAnimation", p.user_id, ASSETS.BUTTERCUP, "Buttercup, she's the toughest fighter");
          else if (assignedRole == "Mojo Mojo")
            await tgSendVisual("sendAnimation", p.user_id, ASSETS.MOJO, "Mojo Jojo, with a plan to take the world!");
        }

        const voteButtons = players!.map(p => ([{ text: `Vote for ${p.username}`, callback_data: `ppg_vote_${p.user_id}` }]));
        
        await tgPost("sendMessage", {
          chat_id: chatId,
          text: "🌆 *Night Falls over Townsville...*\n\nProfessor Utonium has been attacked! Talk amongst yourselves.\n\nWho is the Mojo Jojo suspect?",
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard: voteButtons }
        });
      }
      return NextResponse.json({ ok: true });
    }

    // --- COMMAND: END GAME ---
    if (text === "/end_ppg") {
      // 1. Delete all player records for this specific chat
      const { error } = await supabase
        .from("ppg_players")
        .delete()
        .eq("chat_id", chatId);

      if (error) {
        console.error("End Game Error:", error);
        await tgPost("sendMessage", {
          chat_id: chatId,
          text: "⚠️ Failed to end the game properly."
        });
      } else {
        await tgPost("sendMessage", {
          chat_id: chatId,
          text: "🛑 *Game Ended.* Lobby cleared.\nType /start_ppg to play again!",
          parse_mode: "Markdown"
        });
      }
      return NextResponse.json({ ok: true });
    }

        // --- CALLBACK: VOTING LOGIC (CONTINUOUS) ---
    if (isButton && body.callback_query.data.startsWith("ppg_vote_")) {
      const targetId = body.callback_query.data.split("_")[2];

      // Add this at the very start of your vote handler
      const { data: isPlayer } = await supabase
      .from("ppg_players")
      .select("id")
      .eq("user_id", userId)
      .eq("chat_id", chatId)
      .maybeSingle();

      if (!isPlayer) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: "✖️ You aren't in this game! Wait for the next round.",
          show_alert: true
        }),
      });
      return NextResponse.json({ ok: true });
      }

      // Prevent self-voting
      if (targetId === userId.toString()) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callback_query_id: body.callback_query.id,
            text: "🚫 You can't vote for yourself, Powerpuff Girl! (Or Mojo...)",
            show_alert: true
          }),
        });
        return NextResponse.json({ ok: true });
      }
      
      // 1. Check if this user already voted (to prevent double voting)
      const { data: voter } = await supabase
      .from("ppg_players")
      .select("voted_for, username")
      .eq("user_id", userId)
      .eq("chat_id", chatId)
      .maybeSingle();

      if (voter?.voted_for) {
      // Optional: Send a popup alert to the user instead of a full message
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id,
          text: "⚠️ You have already cast your vote!",
          show_alert: true
        }),
      });
      return NextResponse.json({ ok: true });
      }
      // 2. Mark the vote in Supabase
      await supabase.from("ppg_players").update({ voted_for: targetId }).eq("user_id", userId).eq("chat_id", chatId);

      // 3. NEW: PM the user to confirm their vote
      const { data: targetPlayer } = await supabase
        .from("ppg_players")
        .select("username")
        .eq("user_id", targetId)
        .eq("chat_id", chatId)
        .maybeSingle();

      await tgPost("sendMessage", {
        chat_id: userId, // Sending to the voter's private ID
        text: `🗳 *Vote Registered!*\nYou voted to expel: *${targetPlayer?.username || "Unknown"}*`,
        parse_mode: "Markdown"
      });

      // 4. Check if everyone has now voted to trigger the reveal
      const { data: alivePlayers } = await supabase.from("ppg_players").select("*").eq("chat_id", chatId);
      const totalVoted = alivePlayers?.filter(p => p.voted_for).length || 0;

      if (totalVoted === alivePlayers?.length) {
        // 3. Tally Votes
        const voteCounts: any = {};
        alivePlayers?.forEach(p => { voteCounts[p.voted_for] = (voteCounts[p.voted_for] || 0) + 1; });

        const expelledId = Object.keys(voteCounts).reduce((a, b) => voteCounts[a] > voteCounts[b] ? a : b);
        const expelledUser = alivePlayers?.find(p => p.user_id.toString() === expelledId);

        const funnyDeaths = [
          "accidentally flew into a giant sliding glass door. *Thud.*",
          "tried to use super-speed but slipped on a banana peel and slid all the way to the next city.",
          "got distracted by a passing butterfly and is now stuck in a giant spiderweb made of cotton candy.",
          "was hit by a stray 'Shrink Ray' and is now being chased by a very confused ladybug."
        ];
        
        // In your vote tally logic:
        const deathReason = funnyDeaths[Math.floor(Math.random() * funnyDeaths.length)];
        const message = `❌ ${expelledUser.username} ${deathReason}`;

        await tgPost("sendMessage", { 
          chat_id: chatId, 
          text: `${message}`,
          parse_mode: "Markdown"
        });

        // Reset votes for the next potential round
        await supabase.from("ppg_players").update({ voted_for: null }).eq("chat_id", chatId);

        if (expelledUser?.is_mojo) {
          // --- GIRLS WIN ---
          const winStory = `
        🎉 *MOJO JOJO IS DEFEATED!*
        The group tackled ${expelledUser.username} and realized his "superpowers" were just a backpack full of stolen batteries. 
        
        **The End:** He was last seen being chased out of Townsville by a very angry squirrel. 🐿️
          `;
          await tgPost("sendMessage", { chat_id: chatId, text: winStory, parse_mode: "Markdown" });
          await tgSendVisual("sendAnimation", chatId, ASSETS.GIRLS_WIN, "🎉 *VICTORY!* Mojo Jojo has been defeated! The Powerpuff Girls save the day");
          await supabase.from("ppg_players").delete().eq("chat_id", chatId); 
        
        } else {
          // --- A GIRL IS ELIMINATED ---
          await supabase.from("ppg_players").update({ is_alive: false }).eq("user_id", expelledId);
          
          // Re-fetch players to see who is left
          const { data: remainingPlayers } = await supabase
            .from("ppg_players")
            .select("*")
            .eq("chat_id", chatId)
            .eq("is_alive", true);
        
          const girlCount = remainingPlayers?.filter(p => !p.is_mojo).length || 0;
        
          if (girlCount <= 1) {
            // --- MOJO WIN CONDITION ---
            const mojoWinStory = `
        🐵 *MOJO JOJO VICTORIOUS!*
        With ${expelledUser?.username} gone, there aren't enough girls left to stop the evil plan!
        
        **The End:** Mojo Jojo has successfully renamed Townsville to "Mojo-opolis" and declared that every day is now "Wear a Funny Hat" day. 🎩
        
        ❌ *GIRLS LOSE!*
            `;
            await tgPost("sendMessage", { chat_id: chatId, text: mojoWinStory, parse_mode: "Markdown" });
            await tgSendVisual("sendAnimation", chatId, ASSETS.MOJO_WIN, "🐵 *MOJO JOJO WINS!* All your Chemical X are belong to me!");
            await supabase.from("ppg_players").delete().eq("chat_id", chatId); // Reset DB for next game
          } else {
            // --- CONTINUE TO NEXT ROUND ---
            const nextButtons = remainingPlayers!.map(p => ([{ text: `Suspect: ${p.username}`, callback_data: `ppg_vote_${p.user_id}` }]));
            
            await tgPost("sendMessage", {
              chat_id: chatId,
              text: `❌ *OOPS!* ${expelledUser?.username} was innocent! They tripped over their own cape and fell into a giant vat of pudding. \n\nThere are ${girlCount} girls left. *FIND HIM!*`,
              reply_markup: { inline_keyboard: nextButtons }
            });
          }
        }
      }
      return NextResponse.json({ ok: true });
    }
    
    if (text === "/start_game") {
      await resetAllGames(); 
      
      const secretNumber = Math.floor(Math.random() * 10) + 1;
    
      // We use user_id as the unique key to overwrite the old game
      const { error } = await supabase.from("number_games").upsert({ 
        user_id: chatId, 
        username: username || "Player", 
        secret_number: secretNumber, 
        attempts: 0, 
        is_active: true 
      }, { onConflict: 'user_id' }); 
    
      if (error) {
        console.error("Start Game Error:", error);
        await sendTelegramMessage(chatId, "❌ Failed to start game. Try again.");
        return NextResponse.json({ ok: true });
      }
      
      const buttons = [
        [{ text: "1", callback_data: "guess_1" }, { text: "2", callback_data: "guess_2" }, { text: "3", callback_data: "guess_3" }],
        [{ text: "4", callback_data: "guess_4" }, { text: "5", callback_data: "guess_5" }, { text: "6", callback_data: "guess_6" }],
        [{ text: "7", callback_data: "guess_7" }, { text: "8", callback_data: "guess_8" }, { text: "9", callback_data: "guess_9" }],
        [{ text: "10", callback_data: "guess_10" }]
      ];
    
      await sendTelegramMessage(chatId, "🎮 *Number Game Reset!*\nI've picked a new number (1-10):", buttons);
      return NextResponse.json({ ok: true });
    }

    if (text === "/start_quiz") {
      await resetAllGames(); 
    
      // Use upsert with onConflict to overwrite previous game data
      const { error } = await supabase.from("music_games").upsert({
        user_id: chatId,
        username: username || "Player",
        score: 0,
        streak: 0,
        is_active: true,
        // Initialize empty strings to avoid null errors later
        game_mode: 'pending', 
        correct_answer: ''
      }, { onConflict: 'user_id' });
    
      if (error) {
        console.error("Music Quiz Start Error:", error);
        await sendTelegramMessage(chatId, "❌ Failed to start quiz.");
        return NextResponse.json({ ok: true });
      }
    
      await sendTelegramMessage(chatId, `🎧 *Music Quiz!* Choose your mode:`, [
        [{ text: "🎵 Song", callback_data: "mode_song" }, { text: "🎤 Artist", callback_data: "mode_artist" }]
      ]);
      return NextResponse.json({ ok: true });
    }

    // --- COMMAND: END QUIZ ---
    if (text === "/end_quiz") {
      // 1. Get final score before closing

      const { data: game } = await supabase
        .from("music_games")
        .select("score")
        .eq("user_id", chatId)
        .eq("is_active", true)
        .maybeSingle();

      if (game) {
        await sendTelegramMessage(chatId, "You have quit the music pop quiz 🙂‍↔️")
      }

      if (!game) {
        await sendTelegramMessage(chatId, "⚠️ You don't have an active quiz running.");
        return NextResponse.json({ ok: true });
      }

      // 2. Mark as inactive in the database
      const { error } = await supabase
        .from("music_games")
        .update({ is_active: false })
        .eq("user_id", chatId);

      if (error) {
        console.error("End Quiz Error:", error);
      }

      // 3. Send the final summary message
      const finalMessage = `🏁 *Quiz Ended!*\n\nFinal Score: *${game.score}*\nThanks for playing! Type /start_quiz to play again.`;
      
      await sendTelegramMessage(chatId, finalMessage);
      return NextResponse.json({ ok: true });
    }

    // ─── CALLBACK HANDLER (BUTTONS) ────────────────────────────────────────

    if (isButtonPress) {
      const callbackData = body.callback_query.data;
      const callbackQueryId = body.callback_query.id;

      // STOP SPINNING IMMEDIATELY
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      });

      // --- 1. NUMBER GAME GUESS ---
      if (callbackData.startsWith("guess_")) {
        const guess = parseInt(callbackData.split("_")[1]);
        const { data: game } = await supabase.from("number_games").select("*").eq("user_id", chatId).eq("is_active", true).maybeSingle();

        if (!game) {
          await sendTelegramMessage(chatId, "⚠️ No active Number Game. Type /start_game");
          return NextResponse.json({ ok: true });
        }

        if (guess === game.secret_number) {
          await supabase.from("number_games").update({ is_active: false }).eq("user_id", chatId);
          await sendTelegramMessage(chatId, `🎉 *CORRECT!* It was ${game.secret_number}! Game Over.`);
        } else {
          await supabase.from("number_games").update({ attempts: (game.attempts || 0) + 1 }).eq("user_id", chatId);
          const hint = guess < game.secret_number ? "Higher! ⬆️" : "Lower! ⬇️";
          await sendTelegramMessage(chatId, `❌ *Wrong!* Try ${hint}`);
        }
        return NextResponse.json({ ok: true });
      }

      // --- 2. MUSIC QUIZ MODE SELECTION ---
      if (callbackData.startsWith("mode_")) {
        const mode = callbackData.replace("mode_", "");
        // Explicitly use onConflict so the game can be reset/restarted
        await supabase.from("music_games").upsert({ 
          user_id: chatId, 
          username, 
          game_mode: mode, 
          score: 0, 
          streak: 0, 
          is_active: true 
        }, { onConflict: 'user_id' });

        await sendNewRound(chatId, mode);
        return NextResponse.json({ ok: true });
      }

      // --- 3. MUSIC QUIZ ANSWER ---
      if (callbackData.startsWith("answer_")) {
        const index = parseInt(callbackData.split("_")[1]);
        const { data: game } = await supabase
          .from("music_games")
          .select("*")
          .eq("user_id", chatId)
          .eq("is_active", true)
          .maybeSingle();

        if (!game) {
          await sendTelegramMessage(chatId, "⚠️ No active Music Quiz. Type /start_quiz");
          return NextResponse.json({ ok: true });
        }

        const options = JSON.parse(game.options);
        const isCorrect = options[index] === game.correct_answer;

        if (isCorrect) {
          await supabase
            .from("music_games")
            .update({ score: game.score + 1, streak: game.streak + 1 })
            .eq("user_id", chatId);
          await sendTelegramMessage(chatId, `✅ *Correct!* Score: ${game.score + 1}`);
        } else {
          await supabase
            .from("music_games")
            .update({ streak: 0 })
            .eq("user_id", chatId);
          await sendTelegramMessage(chatId, `❌ *Wrong!* It was: ${game.correct_answer}`);
        }
        
        // REMOVED SETTIMEOUT: Call the next round immediately. 
        // Telegram handles the message queueing for you.
        await sendNewRound(chatId, game.game_mode);
        
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Critical Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}