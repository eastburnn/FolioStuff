"use client";

import { useState, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Plus, Trash2, Download, RefreshCw, Loader2 } from "lucide-react";

const PALETTE = [
  "#8B5CF6", "#3B82F6", "#00C896", "#FFB830", "#FF4B5C",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

interface Holding {
  id: string;
  ticker: string;
  allocation: string;
  color: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as Holding & { pct: number };
  return (
    <div className="bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-sm shadow-xl">
      <span className="font-bold text-ink-primary font-mono">{d.ticker}</span>
      <span className="text-ink-secondary ml-2">{d.pct.toFixed(1)}%</span>
    </div>
  );
}

export default function PortfolioVisualizer() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { id: uid(), ticker: "AAPL", allocation: "30", color: PALETTE[0] },
    { id: uid(), ticker: "MSFT", allocation: "25", color: PALETTE[1] },
    { id: uid(), ticker: "NVDA", allocation: "20", color: PALETTE[2] },
    { id: uid(), ticker: "GOOGL", allocation: "15", color: PALETTE[3] },
    { id: uid(), ticker: "META", allocation: "10", color: PALETTE[4] },
  ]);
  const [portfolioName, setPortfolioName] = useState("My Portfolio");
  const [capturing, setCapturing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const parsed = holdings.map((h) => ({
    ...h,
    value: Math.max(0, parseFloat(h.allocation) || 0),
  }));
  const total = parsed.reduce((s, h) => s + h.value, 0);
  const chartData = parsed
    .filter((h) => h.value > 0 && h.ticker.trim())
    .map((h) => ({ ...h, pct: total > 0 ? (h.value / total) * 100 : 0 }));

  const addHolding = () => {
    setHoldings((prev) => [
      ...prev,
      { id: uid(), ticker: "", allocation: "", color: PALETTE[prev.length % PALETTE.length] },
    ]);
  };

  const removeHolding = (id: string) => {
    if (holdings.length > 1) setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const update = (id: string, field: keyof Holding, value: string) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const normalize = () => {
    if (total === 0) return;
    setHoldings((prev) =>
      prev.map((h) => ({
        ...h,
        allocation: (((parseFloat(h.allocation) || 0) / total) * 100).toFixed(1),
      }))
    );
  };

  const handleDownload = async () => {
    if (!shareCardRef.current || chartData.length === 0) return;
    setCapturing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#0C0F1A",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      const slug = portfolioName.toLowerCase().replace(/\s+/g, "-");
      link.download = `${slug}-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setCapturing(false);
    }
  };

  const totalOk = Math.abs(total - 100) < 0.1;
  const totalOver = total > 100;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
        {/* ── Left: Inputs ── */}
        <div className="space-y-5">
          {/* Portfolio name */}
          <div>
            <label className="block text-xs text-ink-muted uppercase tracking-widest mb-2">
              Portfolio Name
            </label>
            <input
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              maxLength={40}
              className="input-base"
              placeholder="My Portfolio"
            />
          </div>

          {/* Holdings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-ink-muted uppercase tracking-widest">
                Holdings
              </label>
              <span
                className={`text-xs font-mono font-semibold transition-colors ${
                  totalOk
                    ? "text-accent-green"
                    : totalOver
                    ? "text-accent-red"
                    : "text-accent-gold"
                }`}
              >
                {total.toFixed(1)}%{" "}
                {totalOk ? "✓" : totalOver ? "↑ over" : "↓ under"}
              </span>
            </div>

            <div className="space-y-2">
              {holdings.map((h) => (
                <div key={h.id} className="flex items-center gap-2">
                  {/* Color swatch */}
                  <input
                    type="color"
                    value={h.color}
                    onChange={(e) => update(h.id, "color", e.target.value)}
                    className="w-8 h-8 rounded-lg shrink-0 cursor-pointer"
                    title="Change color"
                  />
                  {/* Ticker */}
                  <input
                    value={h.ticker}
                    onChange={(e) =>
                      update(h.id, "ticker", e.target.value.toUpperCase().replace(/[^A-Z.]/g, ""))
                    }
                    placeholder="TICKER"
                    maxLength={10}
                    className="w-28 bg-bg-card border border-white/[0.08] rounded-xl px-3 py-2.5 text-ink-primary placeholder-ink-muted font-mono text-sm focus:outline-none focus:border-white/20 transition-colors uppercase"
                  />
                  {/* Allocation */}
                  <input
                    value={h.allocation}
                    onChange={(e) => update(h.id, "allocation", e.target.value)}
                    placeholder="0"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-bg-card border border-white/[0.08] rounded-xl px-3 py-2.5 text-ink-primary placeholder-ink-muted text-sm focus:outline-none focus:border-white/20 transition-colors text-right"
                  />
                  <span className="text-ink-muted text-sm shrink-0">%</span>
                  {/* Remove */}
                  <button
                    onClick={() => removeHolding(h.id)}
                    disabled={holdings.length <= 1}
                    className="text-ink-muted hover:text-accent-red disabled:opacity-30 transition-colors shrink-0 p-1"
                    aria-label="Remove holding"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button onClick={addHolding} className="btn-ghost">
                <Plus size={13} /> Add holding
              </button>
              <button
                onClick={normalize}
                disabled={total === 0}
                className="btn-ghost disabled:opacity-30"
                title="Normalize to 100%"
              >
                <RefreshCw size={13} /> Normalize
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Share card + download ── */}
        <div>
          {/* Shareable card — this is what gets screenshotted */}
          <div
            ref={shareCardRef}
            className="rounded-2xl border border-white/[0.07] overflow-hidden"
            style={{ background: "#0C0F1A", fontFamily: "system-ui, sans-serif" }}
          >
            <div className="p-6">
              {/* Card header */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold tracking-[0.2em] text-ink-muted uppercase">
                  FOLIO
                </span>
                <span className="text-[10px] text-ink-muted">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="text-xl font-bold text-ink-primary mb-4 leading-tight">
                {portfolioName || "My Portfolio"}
              </h2>

              {/* Chart */}
              {chartData.length > 0 ? (
                <>
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={105}
                          paddingAngle={2}
                          dataKey="pct"
                          strokeWidth={0}
                          animationBegin={0}
                          animationDuration={600}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4">
                    {chartData.map((h) => (
                      <div key={h.id} className="flex items-center gap-2 min-w-0">
                        <div
                          style={{ background: h.color }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                        <span className="text-xs font-bold font-mono text-ink-primary truncate">
                          {h.ticker}
                        </span>
                        <span className="text-xs text-ink-secondary ml-auto shrink-0">
                          {h.pct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-ink-muted text-sm">
                  Add holdings to see your chart
                </div>
              )}
            </div>

            {/* Card footer branding */}
            <div className="border-t border-white/[0.05] px-6 py-2.5 flex items-center justify-between">
              <span className="text-[9px] text-ink-muted tracking-widest uppercase">
                folio.market
              </span>
              <span className="text-[9px] text-ink-muted">
                {chartData.length} holdings
              </span>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={capturing || chartData.length === 0}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/25 hover:border-accent-purple/50 transition-all duration-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {capturing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                <Download size={14} />
                Download Share Card
              </>
            )}
          </button>
          <p className="text-xs text-ink-muted text-center mt-2">
            Saves as a 2× PNG — optimized for Twitter/X
          </p>
        </div>
      </div>
    </div>
  );
}
