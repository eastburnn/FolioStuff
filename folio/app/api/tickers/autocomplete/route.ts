import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toUpperCase() ?? "";

  if (q.length < 1) {
    return NextResponse.json([]);
  }

  // Match on symbol prefix first, then company name contains
  const { data, error } = await supabase
    .from("symbols")
    .select("symbol, company_name")
    .or(`symbol.ilike.${q}%,company_name.ilike.%${q}%`)
    .order("symbol", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
