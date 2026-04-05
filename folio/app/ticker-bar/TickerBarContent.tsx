"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Plus, X, TrendingUp, BarChart2, Star, Info, ChevronDown } from "lucide-react";
import { useTickerPrices, SPEED_OPTIONS, SpeedLabel } from "@/context/TickerPricesContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderboardRow {
  rank: number;
  symbol: string;
  company_name: string;
  price: number | null;
  changePercent: number | null;
  count: number;
}

interface TrendingRow {
  symbol: string;
  recent: number;
  previous: number;
  gained: number;
}

interface ConsistentRow {
  symbol: string;
  company_name: string;
  days_active: number;
}

interface Stats {
  leaderboard: LeaderboardRow[];
  trending: TrendingRow[];
  consistent: ConsistentRow[];
  isHoldover: boolean;
  today: string;
}

interface Suggestion {
  symbol: string;
  company_name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#8B5CF6","#3B82F6","#00C896","#FFB830","#FF4B5C",
  "#EC4899","#06B6D4","#84CC16","#F97316","#6366F1",
  "#8B5CF6","#3B82F6","#00C896","#FFB830","#FF4B5C",
  "#EC4899","#06B6D4","#84CC16","#F97316","#6366F1",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs text-ink-muted uppercase tracking-widest mb-4">{children}</h2>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TickerBarContent() {
  const { prices: livePrices, speed, setSpeed } = useTickerPrices();
  const [infoOpen, setInfoOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Vote form state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [voteResult, setVoteResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch stats ──────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/tickers/stats");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ── Autocomplete ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 1) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/tickers/autocomplete?q=${encodeURIComponent(query)}`);
      if (res.ok) setSuggestions(await res.json());
    }, 280);
  }, [query]);

  function addTicker(s: Suggestion) {
    if (selected.length >= 10) return;
    if (selected.find((x) => x.symbol === s.symbol)) return;
    setSelected((prev) => [...prev, s]);
    setQuery("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function removeTicker(symbol: string) {
    setSelected((prev) => prev.filter((s) => s.symbol !== symbol));
  }

  async function handleSubmit() {
    if (selected.length === 0) return;
    setSubmitting(true);
    setVoteResult(null);
    try {
      const res = await fetch("/api/tickers/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers: selected.map((s) => s.symbol) }),
      });
      const data = await res.json();
      if (res.ok) {
        setVoteResult({ ok: true, message: `Voted for: ${selected.map((s) => s.symbol).join(", ")}` });
        setSelected([]);
        fetchStats();
      } else if (data.error === "already_voted") {
        setVoteResult({ ok: false, message: data.message });
      } else {
        setVoteResult({ ok: false, message: data.error ?? "Something went wrong." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const chartData = (stats?.leaderboard ?? []).slice(0, 20).map((r) => ({
    symbol: r.symbol,
    votes: r.count,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">

      {/* ── How it works ── */}
      <section className="mb-14">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 flex items-center justify-center">
            <Info size={15} className="text-accent-purple" />
          </div>
          <h1 className="text-2xl font-bold text-ink-primary tracking-tight">Ticker Bar</h1>
        </div>
        <button
          onClick={() => setInfoOpen((o) => !o)}
          className={`w-full flex items-center justify-between px-5 py-4 border border-white/[0.06] bg-bg-card transition-colors duration-200 ${infoOpen ? "rounded-t-2xl border-b-0" : "rounded-2xl hover:border-white/[0.12]"}`}
        >
          <span className="text-sm font-medium text-ink-secondary">What is it and how does it work?</span>
          <ChevronDown
            size={18}
            className="text-ink-muted transition-transform duration-300"
            style={{ transform: infoOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
        {infoOpen && (
          <div className="rounded-2xl border border-white/[0.06] border-t-0 rounded-t-none bg-bg-card px-6 pb-6 pt-5 grid sm:grid-cols-3 gap-6 text-sm text-ink-secondary leading-relaxed">
            <div>
              <p className="text-ink-primary font-semibold mb-1">What is it?</p>
              <p>The scrolling bar at the top of every page shows live prices for the 30 most-voted tickers of the day, updated in real time via WebSocket.</p>
            </div>
            <div>
              <p className="text-ink-primary font-semibold mb-1">How does voting work?</p>
              <p>Anyone can submit up to 10 tickers once per day. The top 30 by total votes drive the bar. Votes reset at midnight ET.</p>
            </div>
            <div>
              <p className="text-ink-primary font-semibold mb-1">What about after midnight?</p>
              <p>Until new votes push tickers into the top 30, the bar shows the previous day&apos;s top 30 as a holdover — clearly labeled.</p>
            </div>
          </div>
        )}
      </section>

      {/* ── Scroll speed ── */}
      <section className="mb-14">
        <SectionLabel>Ticker bar speed</SectionLabel>
        <div className="flex items-center gap-2">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setSpeed(opt.label as SpeedLabel)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                speed === opt.label
                  ? "bg-accent-purple/[0.15] border-accent-purple/40 text-accent-purple"
                  : "border-white/[0.08] text-ink-secondary hover:text-ink-primary hover:border-white/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-muted mt-2">Your preference is saved automatically.</p>
      </section>

      {/* ── Holdover notice ── */}
      {stats?.isHoldover && (
        <div className="mb-8 px-4 py-3 rounded-xl border border-accent-gold/30 bg-accent-gold/[0.06] text-sm text-accent-gold">
          Showing yesterday&apos;s top tickers — vote below to influence today&apos;s feed.
        </div>
      )}

      {/* ── Vote form ── */}
      <section className="mb-14">
        <SectionLabel>Cast your vote</SectionLabel>

        {voteResult ? (
          <div className={`rounded-xl border p-5 text-sm ${voteResult.ok ? "border-accent-green/30 bg-accent-green/[0.06] text-accent-green" : "border-accent-red/30 bg-accent-red/[0.06] text-accent-red"}`}>
            {voteResult.message}
            {voteResult.ok && (
              <p className="text-ink-muted mt-1 text-xs">Come back tomorrow to vote again.</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-6 space-y-5">
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((s) => (
                  <span key={s.symbol} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-lg bg-accent-purple/[0.12] border border-accent-purple/25 text-xs font-semibold text-ink-primary">
                    {s.symbol}
                    <button onClick={() => removeTicker(s.symbol)} className="text-ink-muted hover:text-accent-red transition-colors">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <span className="text-xs text-ink-muted self-center">{selected.length}/10</span>
              </div>
            )}

            {/* Autocomplete input */}
            <div className="relative">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value.toUpperCase()); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={selected.length >= 10 ? "Max 10 tickers reached" : "Search ticker or company name…"}
                disabled={selected.length >= 10}
                className="input-base font-mono text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-white/[0.08] bg-bg-surface shadow-xl overflow-hidden">
                  {suggestions.map((s) => (
                    <li key={s.symbol}>
                      <button
                        onMouseDown={() => addTicker(s)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors text-left"
                      >
                        <span className="font-mono font-semibold text-ink-primary w-16 shrink-0">{s.symbol}</span>
                        <span className="text-ink-muted truncate">{s.company_name}</span>
                        <Plus size={12} className="text-ink-muted ml-auto shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={selected.length === 0 || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-purple/[0.15] border border-accent-purple/30 text-accent-purple hover:bg-accent-purple/25 hover:border-accent-purple/50 transition-all duration-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : `Submit vote${selected.length > 1 ? "s" : ""}`}
            </button>
          </div>
        )}
      </section>

      {/* ── Leaderboard ── */}
      <section className="mb-14">
        <SectionLabel>
          <span className="flex items-center gap-2"><BarChart2 size={12} />Today&apos;s top 30</span>
        </SectionLabel>

        {loadingStats ? (
          <div className="text-ink-muted text-sm">Loading…</div>
        ) : stats?.leaderboard.length === 0 ? (
          <div className="text-ink-muted text-sm">No votes yet today — be the first!</div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-ink-muted uppercase tracking-widest">
                  <th className="text-left px-5 py-3 w-10">#</th>
                  <th className="text-left px-5 py-3">Ticker</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Company</th>
                  <th className="text-right px-5 py-3 hidden sm:table-cell">Price</th>
                  <th className="text-right px-5 py-3">Votes</th>
                </tr>
              </thead>
              <tbody>
                {stats?.leaderboard.map((row) => (
                  <tr key={row.symbol} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-ink-muted font-mono">{row.rank}</td>
                    <td className="px-5 py-3 font-mono font-semibold text-ink-primary">{row.symbol}</td>
                    <td className="px-5 py-3 text-ink-secondary hidden sm:table-cell truncate max-w-[200px]">{row.company_name}</td>
                    <td className="px-5 py-3 text-right font-mono hidden sm:table-cell">
                      {(() => {
                        const live = livePrices[row.symbol];
                        const price = live?.price ?? row.price;
                        const pct = live?.changePercent ?? row.changePercent;
                        if (price == null) return <span className="text-ink-muted">—</span>;
                        const up = (pct ?? 0) >= 0;
                        return (
                          <span className="flex items-center justify-end gap-2">
                            <span className="text-ink-secondary">
                              ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {pct != null && (
                              <span className={up ? "text-accent-green" : "text-accent-red"}>
                                {up ? "▲" : "▼"}{Math.abs(pct).toFixed(2)}%
                              </span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-accent-purple">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Bar chart ── */}
      {chartData.length > 0 && (
        <section className="mb-14">
          <SectionLabel>Top 20 by votes</SectionLabel>
          <div className="rounded-2xl border border-white/[0.06] bg-bg-card p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fill: "#3D5066", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="symbol" tick={{ fill: "#8896B3", fontSize: 11, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  contentStyle={{ background: "#10131E", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                  labelStyle={{ color: "#EEF2FF", fontFamily: "monospace", fontWeight: 700 }}
                  itemStyle={{ color: "#8896B3" }}
                  formatter={(v: number) => [`${v} votes`, ""]}
                />
                <Bar dataKey="votes" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ── Trending ── */}
      <section className="mb-14">
        <SectionLabel>
          <span className="flex items-center gap-2"><TrendingUp size={12} />Rising fast (last 30 min)</span>
        </SectionLabel>
        {!stats || stats.trending.length === 0 ? (
          <p className="text-ink-muted text-sm">Not enough data yet — check back soon.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.trending.map((t) => (
              <div key={t.symbol} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-bg-card">
                <span className="font-mono font-semibold text-ink-primary w-16 shrink-0">{t.symbol}</span>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-green"
                      style={{ width: `${Math.min(100, (t.gained / Math.max(...(stats?.trending.map((x) => x.gained) ?? [1]))) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-accent-green text-xs font-semibold font-mono">+{t.gained}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Most Consistent ── */}
      <section>
        <SectionLabel>
          <span className="flex items-center gap-2"><Star size={12} />Most consistent</span>
        </SectionLabel>
        {!stats || stats.consistent.length === 0 ? (
          <p className="text-ink-muted text-sm">Consistency data builds over time — check back after a few days of voting.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.consistent.map((t, i) => (
              <div key={t.symbol} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-bg-card">
                <span className="text-ink-muted font-mono text-xs w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold text-ink-primary text-sm">{t.symbol}</p>
                  <p className="text-xs text-ink-muted truncate">{t.company_name}</p>
                </div>
                <span className="text-xs text-ink-secondary font-mono shrink-0">{t.days_active}d</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
