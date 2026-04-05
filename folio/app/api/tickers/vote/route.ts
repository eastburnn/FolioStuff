import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  let body: { tickers: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tickers } = body;

  // Validate shape
  if (!Array.isArray(tickers) || tickers.length < 1 || tickers.length > 10) {
    return NextResponse.json(
      { error: "Submit between 1 and 10 tickers." },
      { status: 400 }
    );
  }

  // Sanitize: uppercase strings only, max 10 chars each
  const sanitized: string[] = [];
  for (const t of tickers) {
    if (typeof t !== "string") {
      return NextResponse.json({ error: "Each ticker must be a string." }, { status: 400 });
    }
    const clean = t.toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 10);
    if (!clean) continue;
    if (!sanitized.includes(clean)) sanitized.push(clean);
  }

  if (sanitized.length === 0) {
    return NextResponse.json({ error: "No valid tickers provided." }, { status: 400 });
  }

  // Validate all tickers exist in symbols table
  const { data: valid, error: symErr } = await supabase
    .from("symbols")
    .select("symbol")
    .in("symbol", sanitized);

  if (symErr) {
    return NextResponse.json({ error: "Validation failed." }, { status: 500 });
  }

  const validSet = new Set((valid ?? []).map((s) => s.symbol));
  const invalid = sanitized.filter((t) => !validSet.has(t));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Unknown ticker(s): ${invalid.join(", ")}` },
      { status: 400 }
    );
  }

  const ip = getIP(req);
  const today = todayET();

  // Check if IP already voted today
  const { data: existing, error: checkErr } = await supabase
    .from("ticker_votes")
    .select("id")
    .eq("ip_address", ip)
    .eq("vote_date", today)
    .maybeSingle();

  if (checkErr) {
    return NextResponse.json({ error: "Could not verify vote status." }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json(
      { error: "already_voted", message: "You've already voted today. Come back after midnight ET." },
      { status: 409 }
    );
  }

  // Insert vote using admin client to bypass RLS on the insert policy
  const { error: insertErr } = await supabaseAdmin.from("ticker_votes").insert({
    ip_address: ip,
    tickers: sanitized,
    vote_date: today,
  });

  if (insertErr) {
    return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tickers: sanitized });
}
