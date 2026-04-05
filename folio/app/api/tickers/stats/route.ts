import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

interface PriceData { price: number; changePercent: number; }

async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey || symbols.length === 0) return {};

  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) throw new Error();
      const q = await res.json();
      return { symbol, price: q.c as number, changePercent: q.dp as number };
    })
  );

  const prices: Record<string, PriceData> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.price > 0) {
      prices[r.value.symbol] = { price: r.value.price, changePercent: r.value.changePercent };
    }
  }
  return prices;
}

export async function GET() {
  const today = todayET();
  const now = Date.now();
  const thirtyMinAgo = new Date(now - 30 * 60 * 1000).toISOString();
  const sixtyMinAgo = new Date(now - 60 * 60 * 1000).toISOString();

  // Votes + holdover status in parallel
  const [votesRes, holdoverRes] = await Promise.all([
    supabase
      .from("ticker_votes")
      .select("tickers, submitted_at")
      .eq("vote_date", today),
    supabase
      .from("active_tickers")
      .select("is_holdover")
      .limit(1)
      .maybeSingle(),
  ]);

  // Aggregate votes
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

  const rankedSymbols = Object.entries(totalCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([symbol]) => symbol);

  // Fetch company names only for the symbols that actually have votes
  const [namesRes, prices] = await Promise.all([
    rankedSymbols.length > 0
      ? supabase
          .from("symbols")
          .select("symbol, company_name")
          .in("symbol", rankedSymbols)
      : Promise.resolve({ data: [] }),
    fetchPrices(rankedSymbols),
  ]);

  const nameMap: Record<string, string> = {};
  for (const row of namesRes.data ?? []) {
    nameMap[row.symbol] = row.company_name ?? "";
  }

  // Leaderboard
  const leaderboard = rankedSymbols.map((symbol, i) => ({
    rank: i + 1,
    symbol,
    company_name: nameMap[symbol] ?? "",
    price: prices[symbol]?.price ?? null,
    changePercent: prices[symbol]?.changePercent ?? null,
    count: totalCounts[symbol],
  }));

  // Trending
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

  // Most consistent (historical)
  const { data: historicalData } = await supabase
    .from("ticker_counts")
    .select("symbol, vote_date")
    .gt("count", 0);

  const daysBySymbol: Record<string, Set<string>> = {};
  for (const row of historicalData ?? []) {
    if (!daysBySymbol[row.symbol]) daysBySymbol[row.symbol] = new Set();
    daysBySymbol[row.symbol].add(row.vote_date as string);
  }

  // Fetch names for consistent tickers not already in nameMap
  const consistentSymbols = Object.keys(daysBySymbol).filter((s) => !nameMap[s]);
  if (consistentSymbols.length > 0) {
    const { data: extraNames } = await supabase
      .from("symbols")
      .select("symbol, company_name")
      .in("symbol", consistentSymbols);
    for (const row of extraNames ?? []) {
      nameMap[row.symbol] = row.company_name ?? "";
    }
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
