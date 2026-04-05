import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface QuoteData {
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  }

  // Fetch the current active symbols
  const { data: active, error } = await supabase
    .from("active_tickers")
    .select("symbol")
    .order("rank", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const symbols = (active ?? []).map((r) => r.symbol);

  // Fetch quotes concurrently (Finnhub free tier: 60 calls/min — 30 symbols is fine)
  const results = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) throw new Error(`Quote fetch failed for ${symbol}`);
      const q = await res.json();
      return {
        symbol,
        data: {
          currentPrice: q.c as number,
          previousClose: q.pc as number,
          change: q.d as number,
          changePercent: q.dp as number,
        } satisfies QuoteData,
      };
    })
  );

  const quotes: Record<string, QuoteData> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      quotes[r.value.symbol] = r.value.data;
    }
  }

  return NextResponse.json(quotes, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" },
  });
}
