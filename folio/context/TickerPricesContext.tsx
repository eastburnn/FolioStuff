"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TickerPriceData {
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

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

export const SPEED_OPTIONS = [
  { label: "Slow",   duration: 120 },
  { label: "Normal", duration: 60  },
  { label: "Fast",   duration: 30  },
  { label: "Turbo",  duration: 12  },
] as const;

export type SpeedLabel = typeof SPEED_OPTIONS[number]["label"];
const DEFAULT_SPEED: SpeedLabel = "Normal";
const LS_KEY = "ticker-speed";

interface ContextValue {
  prices: Record<string, TickerPriceData>;
  symbols: string[];
  marketOpen: boolean;
  holdover: boolean;
  speed: SpeedLabel;
  setSpeed: (s: SpeedLabel) => void;
  scrollDuration: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const TickerPricesContext = createContext<ContextValue>({
  prices: {},
  symbols: [],
  marketOpen: false,
  holdover: false,
  speed: DEFAULT_SPEED,
  setSpeed: () => {},
  scrollDuration: 60,
});

export function useTickerPrices() {
  return useContext(TickerPricesContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TickerPricesProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, TickerPriceData>>({});
  const [symbols, setSymbols] = useState<string[]>([]);
  const [marketOpen, setMarketOpen] = useState(false);
  const [holdover, setHoldover] = useState(false);
  const [speed, setSpeedState] = useState<SpeedLabel>(DEFAULT_SPEED);

  const scrollDuration = SPEED_OPTIONS.find((o) => o.label === speed)?.duration ?? 60;

  function setSpeed(s: SpeedLabel) {
    setSpeedState(s);
    localStorage.setItem(LS_KEY, s);
  }

  // Load persisted speed on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as SpeedLabel | null;
    if (saved && SPEED_OPTIONS.some((o) => o.label === saved)) {
      setSpeedState(saved);
    }
  }, []);
  // Store previous closes separately so WebSocket updates can always reference them
  const prevCloseRef = useRef<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Market open check — polls Finnhub's real status (handles holidays + early closes)
  useEffect(() => {
    async function checkMarket() {
      try {
        const res = await fetch("/api/tickers/market-status");
        if (res.ok) {
          const data = await res.json();
          setMarketOpen(data.isOpen);
        }
      } catch {
        // leave current state unchanged on error
      }
    }
    checkMarket();
    const t = setInterval(checkMarket, 60_000);
    return () => clearInterval(t);
  }, []);

  // Fetch active tickers + initial quotes, then open WebSocket
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const [activeRes, quotesRes] = await Promise.all([
        fetch("/api/tickers/active"),
        fetch("/api/tickers/previous-close"),
      ]);
      if (!activeRes.ok || !quotesRes.ok || cancelled) return;

      const active: ActiveTicker[] = await activeRes.json();
      const quotes: Record<string, QuoteData> = await quotesRes.json();

      const syms = active.map((t) => t.symbol);
      setSymbols(syms);
      setHoldover(active.some((t) => t.is_holdover));

      // Seed prices from REST quotes and store previous closes
      const initial: Record<string, TickerPriceData> = {};
      for (const [symbol, q] of Object.entries(quotes)) {
        prevCloseRef.current[symbol] = q.previousClose;
        initial[symbol] = {
          price: q.currentPrice,
          previousClose: q.previousClose,
          change: q.change,
          changePercent: q.changePercent,
        };
      }
      setPrices(initial);

      if (!cancelled) openWebSocket(syms);
    }

    init();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openWebSocket(syms: string[]) {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey || syms.length === 0) return;

    const ws = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    wsRef.current = ws;

    ws.onopen = () => {
      for (const sym of syms) {
        ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string);
        if (msg.type !== "trade" || !Array.isArray(msg.data)) return;

        // Keep only the latest trade price per symbol in this batch
        const updates: Record<string, number> = {};
        for (const trade of msg.data) updates[trade.s] = trade.p;

        setPrices((prev) => {
          const next = { ...prev };
          for (const [symbol, price] of Object.entries(updates)) {
            const pc = prevCloseRef.current[symbol] ?? prev[symbol]?.previousClose ?? price;
            next[symbol] = {
              price,
              previousClose: pc,
              change: price - pc,
              changePercent: pc !== 0 ? ((price - pc) / pc) * 100 : 0,
            };
          }
          return next;
        });
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => ws.close();
    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) openWebSocket(syms);
      }, 5_000);
    };
  }

  return (
    <TickerPricesContext.Provider value={{ prices, symbols, marketOpen, holdover, speed, setSpeed, scrollDuration }}>
      {children}
    </TickerPricesContext.Provider>
  );
}
