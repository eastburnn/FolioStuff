import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

function yesterdayET(): string {
  const d = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const yesterday = yesterdayET();

    // Mark all active_tickers as holdover — do NOT clear them.
    // The bar continues showing yesterday's top 30 until new votes arrive.
    const { error: holdoverErr } = await supabaseAdmin
      .from("active_tickers")
      .update({ is_holdover: true })
      .neq("symbol", "___NEVER___");
    if (holdoverErr) throw holdoverErr;

    // Clear yesterday's votes
    const { error: votesErr } = await supabaseAdmin
      .from("ticker_votes")
      .delete()
      .eq("vote_date", yesterday);
    if (votesErr) throw votesErr;

    // Zero out yesterday's counts (keep rows for historical queries, just zero the count)
    const { error: countsErr } = await supabaseAdmin
      .from("ticker_counts")
      .update({ count: 0 })
      .eq("vote_date", yesterday);
    if (countsErr) throw countsErr;

    return NextResponse.json({ ok: true, cleared_date: yesterday });
  } catch (err) {
    console.error("[midnight-reset]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
