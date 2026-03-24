"use client";

import { useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

type Mode = "add" | "trim";

interface AddResult {
  newAvg: number;
  totalShares: number;
  totalCost: number;
  avgChange: number;
  avgChangePct: number;
}

interface TrimResult {
  remainingShares: number;
  remainingAvgCost: number;
  remainingCost: number;
  realizedPnL: number;
  realizedPnLPct: number;
  adjustedCostBasis: number;
  specificCostUsed: number;
  usingSpecificLot: boolean;
}

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number, showPlus = true) {
  const s = `${Math.abs(n).toFixed(2)}%`;
  if (n > 0 && showPlus) return `+${s}`;
  if (n < 0) return `-${s}`;
  return s;
}

function calcAdd(
  currentShares: number,
  currentAvg: number,
  addShares: number,
  addPrice: number
): AddResult | null {
  if (!Number.isFinite(currentShares) || !Number.isFinite(currentAvg) || !Number.isFinite(addShares) || !Number.isFinite(addPrice)) return null;
  if (currentShares < 0 || currentAvg < 0 || addShares <= 0 || addPrice < 0) return null;
  const totalShares = currentShares + addShares;
  if (totalShares === 0) return null;
  const totalCost = currentShares * currentAvg + addShares * addPrice;
  const newAvg = totalCost / totalShares;
  const avgChange = newAvg - currentAvg;
  const avgChangePct = currentAvg > 0 ? (avgChange / currentAvg) * 100 : 0;
  return { newAvg, totalShares, totalCost, avgChange, avgChangePct };
}

function calcTrim(
  currentShares: number,
  currentAvg: number,
  sellShares: number,
  sellPrice: number,
  sellCostBasis?: number
): TrimResult | null {
  if (!Number.isFinite(currentShares) || !Number.isFinite(currentAvg) || !Number.isFinite(sellShares) || !Number.isFinite(sellPrice)) return null;
  if (
    currentShares <= 0 ||
    currentAvg < 0 ||
    sellShares <= 0 ||
    sellShares > currentShares ||
    sellPrice < 0
  )
    return null;
  const specificCost = sellCostBasis != null && sellCostBasis > 0 ? sellCostBasis : currentAvg;
  const usingSpecificLot = sellCostBasis != null && sellCostBasis > 0 && sellCostBasis !== currentAvg;
  const remainingShares = currentShares - sellShares;
  const remainingCost = currentShares * currentAvg - sellShares * specificCost;
  const remainingAvgCost = remainingShares > 0 ? remainingCost / remainingShares : 0;
  const realizedPnL = sellShares * (sellPrice - specificCost);
  const realizedPnLPct = specificCost > 0 ? ((sellPrice - specificCost) / specificCost) * 100 : 0;
  const adjustedCostBasis =
    remainingShares > 0 ? (remainingCost - realizedPnL) / remainingShares : 0;
  return {
    remainingShares,
    remainingAvgCost,
    remainingCost,
    realizedPnL,
    realizedPnLPct,
    adjustedCostBasis,
    specificCostUsed: specificCost,
    usingSpecificLot,
  };
}

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-ink-muted uppercase tracking-widest mb-2">
        {label}
      </label>
      <div className="flex items-center bg-bg-card border border-white/[0.08] rounded-xl focus-within:border-white/20 transition-colors duration-200">
        {prefix && (
          <span className="pl-4 pr-1 text-ink-muted text-sm select-none shrink-0">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          min="0"
          step="any"
          className={`flex-1 bg-transparent py-3 text-ink-primary placeholder-ink-muted focus:outline-none min-w-0 ${prefix ? "pl-1 pr-4" : "px-4"} ${suffix ? "pr-1" : ""}`}
        />
        {suffix && (
          <span className="pr-4 pl-1 text-ink-muted text-sm select-none shrink-0">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-ink-muted mt-1.5">{hint}</p>}
    </div>
  );
}

function StatRow({
  label,
  value,
  positive,
  large,
}: {
  label: string;
  value: string;
  positive?: boolean | null;
  large?: boolean;
}) {
  const colorClass =
    positive === true
      ? "text-accent-green"
      : positive === false
      ? "text-accent-red"
      : "text-ink-primary";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className={`font-semibold font-mono ${large ? "text-base" : "text-sm"} ${colorClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function CostBasisCalculator() {
  const [mode, setMode] = useState<Mode>("add");

  // Add mode state
  const [currShares, setCurrShares] = useState("");
  const [currAvg, setCurrAvg] = useState("");
  const [addShares, setAddShares] = useState("");
  const [addPrice, setAddPrice] = useState("");

  // Trim mode state
  const [trimShares, setTrimShares] = useState("");
  const [trimAvg, setTrimAvg] = useState("");
  const [sellShares, setSellShares] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellCostBasis, setSellCostBasis] = useState("");

  const addResult = calcAdd(
    parseFloat(currShares),
    parseFloat(currAvg),
    parseFloat(addShares),
    parseFloat(addPrice)
  );

  const trimResult = calcTrim(
    parseFloat(trimShares),
    parseFloat(trimAvg),
    parseFloat(sellShares),
    parseFloat(sellPrice),
    sellCostBasis ? parseFloat(sellCostBasis) : undefined
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Mode toggle */}
      <div className="inline-flex bg-bg-card border border-white/[0.07] rounded-xl p-1 mb-8">
        <button
          onClick={() => setMode("add")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            mode === "add"
              ? "bg-accent-green/[0.15] text-accent-green border border-accent-green/30"
              : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <TrendingDown size={14} />
          Add to Position
        </button>
        <button
          onClick={() => setMode("trim")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            mode === "trim"
              ? "bg-accent-red/[0.15] text-accent-red border border-accent-red/30"
              : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <TrendingUp size={14} />
          Trim Position
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* ── Add to Position ── */}
        {mode === "add" && (
          <>
            <div className="space-y-4">
              <div className="text-xs text-ink-muted uppercase tracking-widest mb-1 font-semibold">
                Current Position
              </div>
              <NumberInput
                label="Shares Owned"
                value={currShares}
                onChange={setCurrShares}
                placeholder="100"
                hint="How many shares you currently hold"
              />
              <NumberInput
                label="Avg Cost Per Share"
                value={currAvg}
                onChange={setCurrAvg}
                prefix="$"
                placeholder="50.00"
              />

              <div className="pt-2 border-t border-white/[0.05]">
                <div className="text-xs text-ink-muted uppercase tracking-widest mb-3 font-semibold">
                  New Purchase
                </div>
                <div className="space-y-4">
                  <NumberInput
                    label="Shares to Add"
                    value={addShares}
                    onChange={setAddShares}
                    placeholder="50"
                  />
                  <NumberInput
                    label="Purchase Price"
                    value={addPrice}
                    onChange={setAddPrice}
                    prefix="$"
                    placeholder="45.00"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-bg-card rounded-2xl border border-white/[0.07] p-5 flex flex-col">
              <h3 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
                Result
              </h3>
              <div className="flex-1 space-y-0">
                <StatRow
                  label="New Avg Cost"
                  value={addResult ? fmtUsd(addResult.newAvg) : "—"}
                  large
                  positive={addResult ? addResult.avgChange <= 0 : null}
                />
                <StatRow
                  label="Change from Current Avg"
                  value={addResult ? `${fmtUsd(addResult.avgChange)} (${fmtPct(addResult.avgChangePct)})` : "—"}
                  positive={addResult ? addResult.avgChange <= 0 : null}
                />
                <StatRow
                  label="Total Shares After"
                  value={addResult ? addResult.totalShares.toLocaleString() : "—"}
                />
                <StatRow
                  label="Total Cost Basis"
                  value={addResult ? fmtUsd(addResult.totalCost) : "—"}
                />
              </div>

            </div>
          </>
        )}

        {/* ── Trim Position ── */}
        {mode === "trim" && (
          <>
            <div className="space-y-4">
              <div className="text-xs text-ink-muted uppercase tracking-widest mb-1 font-semibold">
                Current Position
              </div>
              <NumberInput
                label="Shares Owned"
                value={trimShares}
                onChange={setTrimShares}
                placeholder="100"
              />
              <NumberInput
                label="Avg Cost Per Share"
                value={trimAvg}
                onChange={setTrimAvg}
                prefix="$"
                placeholder="50.00"
              />

              <div className="pt-2 border-t border-white/[0.05]">
                <div className="text-xs text-ink-muted uppercase tracking-widest mb-3 font-semibold">
                  Sell Order
                </div>
                <div className="space-y-4">
                  <NumberInput
                    label="Shares to Sell"
                    value={sellShares}
                    onChange={setSellShares}
                    placeholder="20"
                    hint={
                      trimShares
                        ? `Max: ${parseFloat(trimShares) || 0} shares`
                        : undefined
                    }
                  />
                  <NumberInput
                    label="Sell Price"
                    value={sellPrice}
                    onChange={setSellPrice}
                    prefix="$"
                    placeholder="65.00"
                  />
                  <NumberInput
                    label="Original Cost of Shares Being Sold"
                    value={sellCostBasis}
                    onChange={setSellCostBasis}
                    prefix="$"
                    placeholder={trimAvg || "50.00"}
                    hint="e.g. sell your highest-cost lot first — defaults to your avg cost if left blank"
                  />
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="bg-bg-card rounded-2xl border border-white/[0.07] p-5 flex flex-col">
              <h3 className="text-xs text-ink-muted uppercase tracking-widest mb-4">
                Result
              </h3>
              <div className="flex-1 space-y-0">
                <StatRow
                  label="Remaining Shares"
                  value={trimResult ? trimResult.remainingShares.toLocaleString() : "—"}
                />
                <StatRow
                  label={trimResult?.usingSpecificLot ? "New Avg Cost / Share" : "Cost Basis / Share"}
                  value={trimResult ? fmtUsd(trimResult.remainingAvgCost) : "—"}
                  positive={trimResult?.usingSpecificLot ? trimResult.remainingAvgCost < parseFloat(trimAvg) : null}
                />
                <StatRow
                  label="Remaining Cost Basis"
                  value={trimResult ? fmtUsd(trimResult.remainingCost) : "—"}
                />
                <StatRow
                  label={trimResult?.usingSpecificLot ? `Realized P&L (vs ${fmtUsd(trimResult.specificCostUsed)}/sh)` : "Realized P&L"}
                  value={trimResult ? `${fmtUsd(trimResult.realizedPnL)} (${fmtPct(trimResult.realizedPnLPct)})` : "—"}
                  positive={trimResult ? trimResult.realizedPnL >= 0 : null}
                />

                {/* Adjusted cost basis — always visible */}
                <div className="mt-3 pt-3 border-t border-white/[0.05]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-ink-secondary font-semibold">
                        Adjusted Cost Basis
                      </p>
                      <p className="text-[11px] text-ink-muted mt-0.5 leading-snug">
                        Applies realized P&L back into remaining cost
                      </p>
                    </div>
                    <span
                      className={`font-bold font-mono text-sm shrink-0 ${
                        trimResult
                          ? trimResult.realizedPnL >= 0 ? "text-accent-green" : "text-accent-red"
                          : "text-ink-muted"
                      }`}
                    >
                      {trimResult && trimResult.remainingShares > 0 ? fmtUsd(trimResult.adjustedCostBasis) : "—"}
                    </span>
                  </div>
                </div>

                {trimResult?.remainingShares === 0 && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05]">
                    <p className="text-xs text-ink-muted text-center">
                      Full position closed — no shares remaining.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Position Bar Visual ── */}
      {mode === "add" && addResult && (
        <div className="mt-6">
          {/* Share count labels */}
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-accent-green font-semibold">
              {parseFloat(currShares).toLocaleString()} Shares (current)
            </span>
            <span className="text-[11px] text-blue-400 font-semibold">
              {parseFloat(addShares).toLocaleString()} Shares (new)
            </span>
          </div>

          {/* Bar */}
          <div className="flex mt-1 rounded-xl overflow-hidden" style={{ gap: 3 }}>
            <div
              className="bg-accent-green/20 border border-accent-green/40 py-3.5 text-center font-mono font-semibold text-accent-green text-sm"
              style={{ flex: parseFloat(currShares) * parseFloat(currAvg) }}
            >
              {fmtUsd(parseFloat(currShares) * parseFloat(currAvg))}
            </div>
            <div
              className="bg-blue-500/20 border border-blue-500/40 py-3.5 text-center font-mono font-semibold text-blue-400 text-sm"
              style={{ flex: parseFloat(addShares) * parseFloat(addPrice) }}
            >
              {fmtUsd(parseFloat(addShares) * parseFloat(addPrice))}
            </div>
          </div>

          {/* Avg price label */}
          <div className="text-center mt-1.5">
            <span className="text-[11px] text-ink-muted font-semibold">
              — Avg Price {fmtUsd(addResult.newAvg)} —
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
