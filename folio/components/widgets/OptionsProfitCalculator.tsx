"use client";

import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty, Field, ResultCard, StatRow, Toggle, chartTooltipStyle, fmtUsd } from "./CalcUi";

type Kind = "call" | "put";
type Side = "buy" | "sell";

// Profit at expiration for one share; the contract multiplier is applied by
// the caller.
function payoff(kind: Kind, side: Side, strike: number, premium: number, price: number): number {
  const intrinsic = kind === "call" ? Math.max(price - strike, 0) : Math.max(strike - price, 0);
  return side === "buy" ? intrinsic - premium : premium - intrinsic;
}

export default function OptionsProfitCalculator() {
  const [kind, setKind] = useState<Kind>("call");
  const [side, setSide] = useState<Side>("buy");
  const [strike, setStrike] = useState("100");
  const [premium, setPremium] = useState("5");
  const [contracts, setContracts] = useState("1");
  const [current, setCurrent] = useState("100");
  const [target, setTarget] = useState("");

  const calc = useMemo(() => {
    const k = parseFloat(strike);
    const p = parseFloat(premium);
    const n = Math.max(1, Math.round(parseFloat(contracts) || 0));
    const s0 = parseFloat(current);
    if (!(k > 0) || !(p >= 0) || !(n >= 1)) return null;
    const mult = 100 * n;
    const breakeven = kind === "call" ? k + p : k - p;
    const cost = p * mult;
    const maxLoss = side === "buy" ? cost : kind === "call" ? Infinity : (k - p) * mult;
    const maxProfit = side === "buy" ? (kind === "call" ? Infinity : (k - p) * mult) : cost;
    const center = s0 > 0 ? s0 : k;
    const span = Math.max(center * 0.4, p * 4, 1);
    const steps = 24;
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const price = Math.max(0, center - span + (2 * span * i) / steps);
      return { price: Math.round(price * 100) / 100, profit: payoff(kind, side, k, p, price) * mult };
    });
    const t = parseFloat(target);
    const atTarget = t >= 0 ? payoff(kind, side, k, p, t) * mult : null;
    const atCurrent = s0 >= 0 ? payoff(kind, side, k, p, s0) * mult : null;
    return { mult, breakeven, cost, maxLoss, maxProfit, points, atTarget, atCurrent, n };
  }, [kind, side, strike, premium, contracts, current, target]);

  const money = (v: number) => (v === Infinity ? "Unlimited" : fmtUsd(v, 0));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap gap-3 mb-8">
        <Toggle
          accent="purple"
          value={kind}
          onChange={(v) => setKind(v as Kind)}
          options={[
            { value: "call", label: "Call" },
            { value: "put", label: "Put" },
          ]}
        />
        <Toggle
          accent={side === "buy" ? "green" : "red"}
          value={side}
          onChange={(v) => setSide(v as Side)}
          options={[
            { value: "buy", label: "Buy (long)", icon: <ArrowUpRight size={14} /> },
            { value: "sell", label: "Sell (short)", icon: <ArrowDownRight size={14} /> },
          ]}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Strike price" value={strike} onChange={setStrike} prefix="$" placeholder="100" />
            <Field label="Premium per share" value={premium} onChange={setPremium} prefix="$" placeholder="5" hint="What the option costs, per share." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contracts" value={contracts} onChange={setContracts} placeholder="1" hint="Each contract covers 100 shares." />
            <Field label="Stock price now" value={current} onChange={setCurrent} prefix="$" placeholder="100" />
          </div>
          <Field label="Price at expiration" value={target} onChange={setTarget} prefix="$" placeholder="Optional" hint="Enter a guess to see the exact profit or loss at that price." />
        </div>

        <div className="space-y-4">
          {calc ? (
            <>
              <ResultCard title={`${side === "buy" ? "Long" : "Short"} ${kind}, ${calc.n} contract${calc.n === 1 ? "" : "s"}`}>
                <StatRow label="Breakeven at expiration" value={fmtUsd(calc.breakeven)} large />
                <StatRow label="Max profit" value={money(calc.maxProfit)} positive />
                <StatRow label="Max loss" value={money(calc.maxLoss)} positive={false} />
                <StatRow label={side === "buy" ? "Premium paid" : "Premium received"} value={fmtUsd(calc.cost, 0)} />
              </ResultCard>
              {(calc.atTarget !== null || calc.atCurrent !== null) && (
                <ResultCard title="Profit or loss at expiration">
                  {calc.atCurrent !== null && (
                    <StatRow label={`If the stock stays at ${fmtUsd(parseFloat(current))}`} value={fmtUsd(calc.atCurrent, 0)} positive={calc.atCurrent > 0 ? true : calc.atCurrent < 0 ? false : null} />
                  )}
                  {calc.atTarget !== null && (
                    <StatRow label={`If the stock is at ${fmtUsd(parseFloat(target))}`} value={fmtUsd(calc.atTarget, 0)} positive={calc.atTarget > 0 ? true : calc.atTarget < 0 ? false : null} large />
                  )}
                </ResultCard>
              )}
            </>
          ) : (
            <Empty text="Enter a strike and premium to see the payoff." />
          )}
        </div>
      </div>

      {calc && (
        <div className="rounded-2xl border border-white/[0.07] bg-bg-card p-4 sm:p-5 mt-6">
          <p className="text-xs text-ink-muted uppercase tracking-widest mb-3">Profit at expiration by stock price</p>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calc.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="price" tick={{ fill: "#6B7A90", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${Math.round(v)}`} minTickGap={24} />
                <YAxis tick={{ fill: "#6B7A90", fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `${v < 0 ? "-" : ""}$${Math.abs(Math.round(v)).toLocaleString()}`} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number) => [fmtUsd(v, 0), "Profit"]}
                  labelFormatter={(l) => `Stock at ${fmtUsd(Number(l))}`}
                />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
                <ReferenceLine x={calc.breakeven} stroke="#FFB830" strokeDasharray="4 4" label={{ value: "Breakeven", fill: "#FFB830", fontSize: 10, position: "top" }} />
                <Line type="linear" dataKey="profit" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
