"use client";

import { useState, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from "recharts";
import { Plus, Trash2, Download, Loader2, Share2 } from "lucide-react";

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
  const [dateStr, setDateStr] = useState("");
  const shareCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }));
  }, []);

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

  const hasCash = holdings.some((h) => h.ticker === "Cash");

  const addCashPosition = () => {
    if (hasCash) return;
    const remainder = Math.max(0, 100 - total);
    setHoldings((prev) => [
      ...prev,
      { id: uid(), ticker: "Cash", allocation: remainder.toFixed(1), color: "#6B7280" },
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

  const slug = portfolioName.toLowerCase().replace(/\s+/g, "-");
  const filename = `${slug}-${new Date().toISOString().slice(0, 10)}.png`;

  const generateBlob = async (): Promise<Blob> => {
    const { toBlob } = await import("html-to-image");
    return toBlob(shareCardRef.current!, { pixelRatio: 2 }) as Promise<Blob>;
  };

  const handleDownload = async () => {
    if (!shareCardRef.current || chartData.length === 0) return;
    setCapturing(true);
    try {
      const blob = await generateBlob();
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current || chartData.length === 0) return;
    setCapturing(true);
    try {
      const blob = await generateBlob();
      const file = new File([blob], filename, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: portfolioName });
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") throw err;
        }
      } else {
        const link = document.createElement("a");
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
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
            <div className="flex items-center gap-2 mb-2">
              {/* Mirror color swatch width */}
              <div className="w-8 shrink-0" />
              {/* Label sits over the ticker column */}
              <label className="w-28 shrink-0 text-xs text-ink-muted uppercase tracking-widest">
                Holdings
              </label>
              {/* Spacer for allocation input */}
              <div className="flex-1" />
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
              {/* Mirror % sign and trash button to keep total flush with input right edge */}
              <span className="text-sm shrink-0 invisible select-none">%</span>
              <div className="p-1 shrink-0 w-[22px]" />
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
                      h.ticker === "Cash"
                        ? undefined
                        : update(h.id, "ticker", e.target.value.toUpperCase().replace(/[^A-Z.]/g, ""))
                    }
                    readOnly={h.ticker === "Cash"}
                    placeholder="TICKER"
                    maxLength={10}
                    className={`w-28 bg-bg-card border border-white/[0.08] rounded-xl px-3 py-2.5 text-ink-primary placeholder-ink-muted font-mono text-sm focus:outline-none focus:border-white/20 transition-colors ${h.ticker === "Cash" ? "opacity-50 cursor-not-allowed" : "uppercase"}`}
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
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={addHolding} className="btn-ghost">
                <Plus size={13} /> Add holding
              </button>
              <button
                onClick={addCashPosition}
                disabled={hasCash}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
                title={hasCash ? "Cash position already added" : "Add remaining allocation as cash"}
              >
                <Plus size={13} /> Add cash position
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Share card + download ── */}
        <div>
          {/* Border wrapper — visible on page but not captured */}
          <div className="border border-white/[0.12]">
          {/* Shareable card — this is what gets screenshotted */}
          <div
            ref={shareCardRef}
            style={{ background: "#0C0F1A", fontFamily: "system-ui, sans-serif", borderRadius: 0, border: "none", overflow: "hidden" }}
          >
            <div style={{ padding: 24 }}>
              {/* Card header */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#6B7280" }}>
                  {dateStr}
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F0F2F5", margin: "0 0 16px", lineHeight: 1.2 }}>
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
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", marginTop: 16 }}>
                    {chartData.map((h) => (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#F0F2F5", whiteSpace: "nowrap" }}>
                          {h.ticker}
                        </span>
                        <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: "auto", flexShrink: 0 }}>
                          {h.pct.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 14 }}>
                  Add holdings to see your chart
                </div>
              )}
            </div>

            {/* Card footer branding */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9, color: "#6B7280", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                foliostuff.com
              </span>
              <span style={{ fontSize: 9, color: "#6B7280" }}>
                {chartData.length} holdings
              </span>
            </div>
          </div>
          </div>

          {/* Share / Download buttons */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleShare}
              disabled={capturing || chartData.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/25 hover:border-accent-purple/50 transition-all duration-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {capturing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              {capturing ? "Capturing..." : "Share"}
            </button>
            <button
              onClick={handleDownload}
              disabled={capturing || chartData.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-ink-secondary hover:text-ink-primary hover:border-white/20 transition-all duration-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} />
              Download
            </button>
          </div>
          <p className="text-xs text-ink-muted text-center mt-2">
            PNG — optimized for sharing
          </p>
        </div>
      </div>
    </div>
  );
}
