import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

// Returns today's date string in ET timezone (YYYY-MM-DD)
function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayET();

    // Pull all votes for today
    const { data: votes, error: votesErr } = await supabaseAdmin
      .from("ticker_votes")
      .select("tickers")
      .eq("vote_date", today);

    if (votesErr) throw votesErr;

    // Aggregate counts
    const counts: Record<string, number> = {};
    for (const row of votes ?? []) {
      for (const symbol of row.tickers as string[]) {
        counts[symbol] = (counts[symbol] ?? 0) + 1;
      }
    }

    // Upsert into ticker_counts
    const countRows = Object.entries(counts).map(([symbol, count]) => ({
      symbol,
      vote_date: today,
      count,
    }));

    if (countRows.length > 0) {
      const { error: upsertErr } = await supabaseAdmin
        .from("ticker_counts")
        .upsert(countRows, { onConflict: "symbol,vote_date" });
      if (upsertErr) throw upsertErr;
    }

    // Sort by count desc, take top 30
    const top30 = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    if (top30.length > 0) {
      const activeRows = top30.map(([symbol], i) => ({
        symbol,
        rank: i + 1,
        last_updated: new Date().toISOString(),
        is_holdover: false,
      }));

      // Replace active_tickers with the new top 30
      await supabaseAdmin.from("active_tickers").delete().neq("symbol", "___NEVER___");
      const { error: activeErr } = await supabaseAdmin
        .from("active_tickers")
        .insert(activeRows);
      if (activeErr) throw activeErr;
    }

    return NextResponse.json({ ok: true, counted: countRows.length, top30: top30.length });
  } catch (err) {
    console.error("[aggregate-votes]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
