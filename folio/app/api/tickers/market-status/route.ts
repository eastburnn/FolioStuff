import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ isOpen: false }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/stock/market-status?exchange=US&token=${apiKey}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(
      { isOpen: data.isOpen as boolean },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } }
    );
  } catch {
    return NextResponse.json({ isOpen: false });
  }
}
