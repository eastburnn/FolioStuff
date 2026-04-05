import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export async function GET() {
  const today = todayET();

  // Run all queries concurrently
  const [leaderboardRes, trendingRes, consistentRes, holdoverRes] = await Promise.all([
    // Leaderboard: active_tickers joined with today's counts and symbol names
    supabase
      .from("active_tickers")
      .select("symbol, rank, is_holdover, ticker_counts(count), symbols(company_name)")
      .order("rank", { ascending: true }),

    // Trending: raw votes in last 30 min vs previous 30 min
    // We pull recent ticker_votes and compute client-side
    supabase
      .from("ticker_votes")
      .select("tickers, submitted_at")
      .eq("vote_date", today)
      .gte("submitted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()),

    // Most consistent: symbols with the most days having any votes
    supabase
      .from("ticker_counts")
      .select("symbol, vote_date, symbols(company_name)")
      .gt("count", 0)
      .order("vote_date", { ascending: false }),

    // Is today a holdover day?
    supabase
      .from("active_tickers")
      .select("is_holdover")
      .limit(1)
      .maybeSingle(),
  ]);

  // --- Leaderboard ---
  const leaderboard = (leaderboardRes.data ?? []).map((row) => {
    const countRow = Array.isArray(row.ticker_counts)
      ? row.ticker_counts[0]
      : row.ticker_counts;
    const symRow = Array.isArray(row.symbols) ? row.symbols[0] : row.symbols;
    return {
      rank: row.rank,
      symbol: row.symbol,
      company_name: (symRow as { company_name?: string } | null)?.company_name ?? "",
      count: (countRow as { count?: number } | null)?.count ?? 0,
    };
  });

  // --- Trending ---
  const now = Date.now();
  const thirtyMinAgo = now - 30 * 60 * 1000;
  const sixtyMinAgo = now - 60 * 60 * 1000;

  const recentCounts: Record<string, number> = {};
  const prevCounts: Record<string, number> = {};

  for (const row of trendingRes.data ?? []) {
    const ts = new Date(row.submitted_at as string).getTime();
    const bucket = ts >= thirtyMinAgo ? recentCounts : ts >= sixtyMinAgo ? prevCounts : null;
    if (!bucket) continue;
    for (const sym of row.tickers as string[]) {
      bucket[sym] = (bucket[sym] ?? 0) + 1;
    }
  }

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

  // --- Most Consistent ---
  const daysBySymbol: Record<string, { days: Set<string>; company_name: string }> = {};
  for (const row of consistentRes.data ?? []) {
    if (!daysBySymbol[row.symbol]) {
      const symRow = Array.isArray(row.symbols) ? row.symbols[0] : row.symbols;
      daysBySymbol[row.symbol] = {
        days: new Set(),
        company_name: (symRow as { company_name?: string } | null)?.company_name ?? "",
      };
    }
    daysBySymbol[row.symbol].days.add(row.vote_date as string);
  }

  const consistent = Object.entries(daysBySymbol)
    .map(([symbol, { days, company_name }]) => ({
      symbol,
      company_name,
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
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } }
  );
}
