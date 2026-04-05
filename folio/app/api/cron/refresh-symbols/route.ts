import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing FINNHUB_API_KEY" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`
    );
    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);

    const data: Array<{ symbol: string; description: string; mic: string }> =
      await res.json();

    // Upsert in batches of 500 to stay well within Supabase limits
    const rows = data.map((s) => ({
      symbol: s.symbol,
      company_name: s.description,
      exchange: s.mic,
      updated_at: new Date().toISOString(),
    }));

    const BATCH = 500;
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabaseAdmin
        .from("symbols")
        .upsert(rows.slice(i, i + BATCH), { onConflict: "symbol" });
      if (error) throw error;
    }

    return NextResponse.json({ ok: true, total: rows.length });
  } catch (err) {
    console.error("[refresh-symbols]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
