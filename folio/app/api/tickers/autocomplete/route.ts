import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toUpperCase() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  // Run two queries in parallel:
  // 1. Symbol prefix match — highest priority (ONDS → ONDS, ONDAS, etc.)
  // 2. Company name contains match — fallback
  const [symbolRes, nameRes] = await Promise.all([
    supabase
      .from("symbols")
      .select("symbol, company_name")
      .ilike("symbol", `${q}%`)
      .order("symbol", { ascending: true })
      .limit(10),

    supabase
      .from("symbols")
      .select("symbol, company_name")
      .ilike("company_name", `%${q}%`)
      .order("symbol", { ascending: true })
      .limit(10),
  ]);

  // Merge: symbol matches first, then company name matches, no duplicates
  const seen = new Set<string>();
  const results: { symbol: string; company_name: string }[] = [];

  for (const row of [...(symbolRes.data ?? []), ...(nameRes.data ?? [])]) {
    if (!seen.has(row.symbol)) {
      seen.add(row.symbol);
      results.push(row);
    }
    if (results.length >= 10) break;
  }

  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
