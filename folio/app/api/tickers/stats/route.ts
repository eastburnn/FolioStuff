import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function GET() {
  const today = todayET();
  const now = Date.now();
  const thirtyMinAgo = new Date(now - 30 * 60 * 1000).toISOString();
  const sixtyMinAgo = new Date(now - 60 * 60 * 1000).toISOString();

  const [votesRes, symbolsRes, holdoverRes] = await Promise.all([
    // All of today's votes (we'll compute everything from this)
    supabase
      .from("ticker_votes")
      .select("tickers, submitted_at")
      .eq("vote_date", today),

    // Symbol name lookup
    supabase
      .from("symbols")
      .select("symbol, company_name"),

    // Holdover status
    supabase
      .from("active_tickers")
      .select("is_holdover")
      .limit(1)
      .maybeSingle(),
  ]);

  // Build a symbol → company_name map
  const nameMap: Record<string, string> = {};
  for (const row of symbolsRes.data ?? []) {
    nameMap[row.symbol] = row.company_name ?? "";
  }

  // Aggregate all votes for today
  const totalCounts: Record<string, number> = {};
  const recentCounts: Record<string, number> = {};
  const prevCounts: Record<string, number> = {};

  for (const row of votesRes.data ?? []) {
    const ts = row.submitted_at as string;
    const isRecent = ts >= thirtyMinAgo;
    const isPrev = ts >= sixtyMinAgo && ts < thirtyMinAgo;

    for (const sym of row.tickers as string[]) {
      totalCounts[sym] = (totalCounts[sym] ?? 0) + 1;
      if (isRecent) recentCounts[sym] = (recentCounts[sym] ?? 0) + 1;
      if (isPrev)   prevCounts[sym]   = (prevCounts[sym] ?? 0) + 1;
    }
  }

  // Leaderboard — ALL tickers with at least 1 vote today, ranked by count
  const leaderboard = Object.entries(totalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([symbol, count], i) => ({
      rank: i + 1,
      symbol,
      company_name: nameMap[symbol] ?? "",
      count,
    }));

  // Trending — gained the most votes in last 30 min vs prior 30 min
  const trending = Object.entries(recentCounts)
    .map(([symbol, recent]) => ({
      symbol,
      recent,
      previous: prevCounts[symbol] ?? 0,
      gained: recent - (prevCounts[symbol] ?? 0),
    }))
    .filter((t) => t.gained > 0)
    .sort((a, b) => b.gained - a.gained)
    .slice(0, 10);

  // Most consistent — symbols with votes on the most distinct days (historical)
  const { data: historicalData } = await supabase
    .from("ticker_counts")
    .select("symbol, vote_date")
    .gt("count", 0);

  const daysBySymbol: Record<string, Set<string>> = {};
  for (const row of historicalData ?? []) {
    if (!daysBySymbol[row.symbol]) daysBySymbol[row.symbol] = new Set();
    daysBySymbol[row.symbol].add(row.vote_date as string);
  }

  const consistent = Object.entries(daysBySymbol)
    .map(([symbol, days]) => ({
      symbol,
      company_name: nameMap[symbol] ?? "",
      days_active: days.size,
    }))
    .sort((a, b) => b.days_active - a.days_active)
    .slice(0, 10);

  return NextResponse.json(
    {
      leaderboard,
      trending,
      consistent,
      isHoldover: holdoverRes.data?.is_holdover ?? false,
      today,
    },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } }
  );
}
