"use client";

import { useEffect, useRef, useState } from "react";

interface ActiveTicker {
  symbol: string;
  rank: number;
  is_holdover: boolean;
}

interface QuoteData {
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

interface TickerPrice {
  price: number;
  change: number;
  changePercent: number;
}

function isMarketOpen(): boolean {
  const et = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const d = new Date(et);
  const day = d.getDay(); // 0 Sun, 6 Sat
  if (day === 0 || day === 6) return false;
  const mins = d.getHours() * 60 + d.getMinutes();
  return mins >= 9 * 60 + 30 && mins < 16 * 60;
}

export default function TickerBar() {
  const [tickers, setTickers] = useState<ActiveTicker[]>([]);
  const [prices, setPrices] = useState<Record<string, TickerPrice>>({});
  const [marketOpen, setMarketOpen] = useState(false);
  const [holdover, setHoldover] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Check market status once on mount and every minute
  useEffect(() => {
    setMarketOpen(isMarketOpen());
    const interval = setInterval(() => setMarketOpen(isMarketOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active tickers + initial quotes
  useEffect(() => {
    async function init() {
      const [activeRes, quotesRes] = await Promise.all([
        fetch("/api/tickers/active"),
        fetch("/api/tickers/previous-close"),
      ]);

      if (!activeRes.ok || !quotesRes.ok) return;

      const active: ActiveTicker[] = await activeRes.json();
      const quotes: Record<string, QuoteData> = await quotesRes.json();

      setTickers(active);
      setHoldover(active.some((t) => t.is_holdover));

      const initialPrices: Record<string, TickerPrice> = {};
      for (const [symbol, q] of Object.entries(quotes)) {
        initialPrices[symbol] = {
          price: q.currentPrice,
          change: q.change,
          changePercent: q.changePercent,
        };
      }
      setPrices(initialPrices);

      return active.map((t) => t.symbol);
    }

    init().then((symbols) => {
      if (!symbols || symbols.length === 0) return;
      openWebSocket(symbols);
    });

    return () => wsRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openWebSocket(symbols: string[]) {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) return;

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      for (const sym of symbols) {
        ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

        // Group trades by symbol, keep only the latest price per symbol
        const updates: Record<string, number> = {};
        for (const trade of msg.data) {
          updates[trade.s] = trade.p;
        }

        setPrices((prev) => {
          const next = { ...prev };
          for (const [symbol, price] of Object.entries(updates)) {
            const pc = next[symbol]?.price ?? price;
            const change = price - (next[symbol]
              ? pc - (next[symbol].change ?? 0)
              : price);
            const base = next[symbol]
              ? next[symbol].price - next[symbol].change
              : price;
            next[symbol] = {
              price,
              change: price - base,
              changePercent: base !== 0 ? ((price - base) / base) * 100 : 0,
            };
          }
          return next;
        });
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      // Reconnect after 5s if we have symbols
      setTimeout(() => {
        if (symbols.length > 0) openWebSocket(symbols);
      }, 5_000);
    };
  }

  if (tickers.length === 0) return null;

  const items = tickers.map((t) => {
    const p = prices[t.symbol];
    const price = p?.price;
    const pct = p?.changePercent;
    const positive = (pct ?? 0) >= 0;

    return (
      <span key={t.symbol} className="ticker-item">
        <span className="ticker-symbol">{t.symbol}</span>
        {price != null ? (
          <>
            <span className="ticker-price">
              ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={positive ? "ticker-up" : "ticker-down"}>
              {positive ? "▲" : "▼"}
              {Math.abs(pct ?? 0).toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="ticker-price">—</span>
        )}
      </span>
    );
  });

  return (
    <div className="ticker-bar-root">
      <div className="ticker-track-wrapper">
        {/* Duplicate items for seamless loop */}
        <div className="ticker-track">
          {items}
          {items}
        </div>
      </div>

      <div className="ticker-bar-meta">
        {!marketOpen && (
          <span className="ticker-closed">Market Closed</span>
        )}
        {holdover && (
          <span className="ticker-holdover">Yesterday&apos;s Top 30</span>
        )}
      </div>
    </div>
  );
}
