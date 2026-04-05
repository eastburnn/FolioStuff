"use client";

import { useTickerPrices } from "@/context/TickerPricesContext";

export default function TickerBar() {
  const { prices, symbols, marketOpen, holdover, scrollDuration } = useTickerPrices();

  if (symbols.length === 0) return null;

  const items = symbols.map((symbol) => {
    const p = prices[symbol];
    const positive = (p?.changePercent ?? 0) >= 0;

    return (
      <span key={symbol} className="ticker-item">
        <span className="ticker-symbol">{symbol}</span>
        {p?.price != null ? (
          <>
            <span className="ticker-price">
              ${p.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={positive ? "ticker-up" : "ticker-down"}>
              {positive ? "▲" : "▼"}{Math.abs(p.changePercent).toFixed(2)}%
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
        <div className="ticker-track" style={{ animationDuration: `${scrollDuration}s` }}>
          {items}
          {items}
        </div>
      </div>
      <div className="ticker-bar-meta">
        {!marketOpen && <span className="ticker-closed">Market Closed</span>}
        {holdover && <span className="ticker-holdover">Yesterday&apos;s Top 30</span>}
      </div>
    </div>
  );
}
