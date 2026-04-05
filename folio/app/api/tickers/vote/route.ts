import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

const MAX_TICKERS = 10;

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

async function getExistingTickers(ip: string, today: string): Promise<string[]> {
  const { data } = await supabase
    .from("ticker_votes")
    .select("tickers")
    .eq("ip_address", ip)
    .eq("vote_date", today);

  return (data ?? []).flatMap((row) => row.tickers as string[]);
}

// GET — returns how many votes this IP has used today
export async function GET(req: NextRequest) {
  const ip = getIP(req);
  const today = todayET();
  const existing = await getExistingTickers(ip, today);
  return NextResponse.json({
    used: existing.length,
    remaining: Math.max(0, MAX_TICKERS - existing.length),
    tickers: existing,
  });
}

// POST — submit tickers (up to MAX_TICKERS total across all submissions today)
export async function POST(req: NextRequest) {
  let body: { tickers: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tickers } = body;

  if (!Array.isArray(tickers) || tickers.length < 1 || tickers.length > MAX_TICKERS) {
    return NextResponse.json(
      { error: `Submit between 1 and ${MAX_TICKERS} tickers.` },
      { status: 400 }
    );
  }

  // Sanitize
  const sanitized: string[] = [];
  for (const t of tickers) {
    if (typeof t !== "string") {
      return NextResponse.json({ error: "Each ticker must be a string." }, { status: 400 });
    }
    const clean = t.toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 10);
    if (clean && !sanitized.includes(clean)) sanitized.push(clean);
  }

  if (sanitized.length === 0) {
    return NextResponse.json({ error: "No valid tickers provided." }, { status: 400 });
  }

  // Validate against symbols table
  const { data: valid, error: symErr } = await supabase
    .from("symbols")
    .select("symbol")
    .in("symbol", sanitized);

  if (symErr) return NextResponse.json({ error: "Validation failed." }, { status: 500 });

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
  const existing = await getExistingTickers(ip, today);

  // Remove tickers already voted on today
  const alreadyVoted = new Set(existing);
  const newTickers = sanitized.filter((t) => !alreadyVoted.has(t));

  if (newTickers.length === 0) {
    return NextResponse.json(
      { error: "You've already voted for all of these tickers today." },
      { status: 409 }
    );
  }

  // Check capacity
  const totalAfter = existing.length + newTickers.length;
  if (totalAfter > MAX_TICKERS) {
    const allowed = MAX_TICKERS - existing.length;
    return NextResponse.json(
      { error: `You can only add ${allowed} more ticker${allowed === 1 ? "" : "s"} today.` },
      { status: 409 }
    );
  }

  const { error: insertErr } = await supabaseAdmin.from("ticker_votes").insert({
    ip_address: ip,
    tickers: newTickers,
    vote_date: today,
  });

  if (insertErr) return NextResponse.json({ error: "Failed to record vote." }, { status: 500 });

  const remaining = MAX_TICKERS - totalAfter;
  return NextResponse.json({ ok: true, tickers: newTickers, remaining });
}
