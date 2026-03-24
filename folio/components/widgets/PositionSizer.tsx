"use client";

import { useState, useMemo } from "react";
import { Shield, AlertTriangle, Target, DollarSign } from "lucide-react";

const RISK_PRESETS = [0.5, 1, 2, 3];

function fmtUsd(n: number, decimals = 2) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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

interface Result {
  dollarRisk: number;
  riskPerShare: number;
  shares: number;
  positionValue: number;
  positionPct: number;
  potentialProfit: number | null;
  rrRatio: number | null;
}

export default function PositionSizer() {
  const [accountSize, setAccountSize] = useState("");
  const [riskPct, setRiskPct] = useState("1");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [targetPrice, setTargetPrice] = useState("");

  const result: Result | null = useMemo(() => {
    const acct = parseFloat(accountSize);
    const risk = parseFloat(riskPct);
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLoss);

    if (!acct || !risk || !entry || !stop || entry <= 0 || stop <= 0) return null;
    if (entry === stop) return null;

    const dollarRisk = acct * (risk / 100);
    const riskPerShare = Math.abs(entry - stop);
    const shares = Math.floor(dollarRisk / riskPerShare);
    if (shares <= 0) return null;

    const positionValue = shares * entry;
    const positionPct = (positionValue / acct) * 100;

    const target = parseFloat(targetPrice);
    const potentialProfit =
      target > 0 ? shares * Math.abs(target - entry) : null;
    const rrRatio =
      target > 0 ? Math.abs(target - entry) / riskPerShare : null;

    return {
      dollarRisk,
      riskPerShare,
      shares,
      positionValue,
      positionPct,
      potentialProfit,
      rrRatio,
    };
  }, [accountSize, riskPct, entryPrice, stopLoss, targetPrice]);

  const isLong =
    entryPrice && stopLoss
      ? parseFloat(entryPrice) > parseFloat(stopLoss)
      : true;

  const riskLevel =
    parseFloat(riskPct) <= 1 ? "low" : parseFloat(riskPct) <= 2 ? "medium" : "high";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* ── Inputs ── */}
        <div className="space-y-5">
          <NumberInput
            label="Account Size"
            value={accountSize}
            onChange={setAccountSize}
            prefix="$"
            placeholder="25,000"
            hint="Total trading account balance"
          />

          {/* Risk % with presets */}
          <div>
            <label className="block text-xs text-ink-muted uppercase tracking-widest mb-2">
              Max Risk Per Trade
            </label>
            <div className="flex gap-2 mb-2">
              {RISK_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setRiskPct(String(p))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    riskPct === String(p)
                      ? p <= 1
                        ? "bg-accent-green/15 border-accent-green/40 text-accent-green"
                        : p <= 2
                        ? "bg-accent-gold/15 border-accent-gold/40 text-accent-gold"
                        : "bg-accent-red/15 border-accent-red/40 text-accent-red"
                      : "bg-bg-card border-white/[0.08] text-ink-secondary hover:text-ink-primary"
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                min="0.1"
                max="100"
                step="0.1"
                className="input-base pr-12"
                placeholder="1"
              />
              <span className="absolute right-3.5 text-ink-secondary text-sm pointer-events-none select-none">
                %
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {riskLevel === "low" && (
                <Shield size={11} className="text-accent-green" />
              )}
              {riskLevel === "medium" && (
                <AlertTriangle size={11} className="text-accent-gold" />
              )}
              {riskLevel === "high" && (
                <AlertTriangle size={11} className="text-accent-red" />
              )}
              <span
                className={`text-[11px] font-medium ${
                  riskLevel === "low"
                    ? "text-accent-green"
                    : riskLevel === "medium"
                    ? "text-accent-gold"
                    : "text-accent-red"
                }`}
              >
                {riskLevel === "low"
                  ? "Conservative — recommended for most traders"
                  : riskLevel === "medium"
                  ? "Moderate — suitable for high-conviction setups"
                  : "Aggressive — high risk to account equity"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInput
              label="Entry Price"
              value={entryPrice}
              onChange={setEntryPrice}
              prefix="$"
              placeholder="52.00"
            />
            <NumberInput
              label="Stop Loss"
              value={stopLoss}
              onChange={setStopLoss}
              prefix="$"
              placeholder="49.00"
              hint={isLong ? "Below entry for long" : "Above entry for short"}
            />
          </div>

          <NumberInput
            label="Target Price (optional)"
            value={targetPrice}
            onChange={setTargetPrice}
            prefix="$"
            placeholder="62.00"
            hint="Used to calculate risk/reward ratio"
          />
        </div>

        {/* ── Results ── */}
        <div className="bg-bg-card rounded-2xl border border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-accent-gold/[0.15] border border-accent-gold/30 flex items-center justify-center">
              <Target size={13} className="text-accent-gold" />
            </div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Position Size
            </h3>
          </div>

          <div className="space-y-0">
              {/* Primary metric — shares */}
              <div className="pb-4 mb-2 border-b border-white/[0.06]">
                <p className="text-xs text-ink-muted mb-1">Shares to Buy</p>
                <p className="text-4xl font-bold text-ink-primary font-mono tracking-tight">
                  {result ? result.shares.toLocaleString() : "—"}
                </p>
                <p className="text-xs text-ink-muted mt-1">
                  {isLong ? "Long" : "Short"} position
                </p>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-3 py-3">
                <div className="stat-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={11} className="text-accent-red" />
                    <span className="text-[10px] text-ink-muted uppercase tracking-widest">
                      $ at Risk
                    </span>
                  </div>
                  <p className="text-sm font-bold font-mono text-accent-red">
                    {result ? fmtUsd(result.dollarRisk, 0) : "—"}
                  </p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign size={11} className="text-accent-blue" />
                    <span className="text-[10px] text-ink-muted uppercase tracking-widest">
                      Position $
                    </span>
                  </div>
                  <p className="text-sm font-bold font-mono text-accent-blue">
                    {result ? fmtUsd(result.positionValue, 0) : "—"}
                  </p>
                </div>

                <div className="stat-card">
                  <span className="text-[10px] text-ink-muted uppercase tracking-widest block mb-1">
                    % of Account
                  </span>
                  <p
                    className={`text-sm font-bold font-mono ${
                      result
                        ? result.positionPct > 50
                          ? "text-accent-red"
                          : result.positionPct > 25
                          ? "text-accent-gold"
                          : "text-ink-primary"
                        : "text-ink-muted"
                    }`}
                  >
                    {result ? `${result.positionPct.toFixed(1)}%` : "—"}
                  </p>
                </div>

                <div className="stat-card">
                  <span className="text-[10px] text-ink-muted uppercase tracking-widest block mb-1">
                    Risk / Share
                  </span>
                  <p className="text-sm font-bold font-mono text-ink-primary">
                    {result ? fmtUsd(result.riskPerShare) : "—"}
                  </p>
                </div>
              </div>

              {/* R:R section */}
              {result !== null && result.rrRatio !== null && result.potentialProfit !== null && (
                <div className="pt-3 border-t border-white/[0.05]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-ink-muted uppercase tracking-widest">
                      Risk / Reward
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        result.rrRatio >= 3
                          ? "text-accent-green"
                          : result.rrRatio >= 2
                          ? "text-accent-gold"
                          : "text-accent-red"
                      }`}
                    >
                      1 : {result.rrRatio.toFixed(2)}
                    </span>
                  </div>

                  {/* R:R visual bar */}
                  <div className="flex rounded-lg overflow-hidden h-3 mb-3">
                    <div
                      style={{ width: `${100 / (1 + result.rrRatio)}%` }}
                      className="bg-accent-red/60"
                    />
                    <div
                      style={{ width: `${(result.rrRatio * 100) / (1 + result.rrRatio)}%` }}
                      className="bg-accent-green/60"
                    />
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-accent-red font-mono">
                      Risk {fmtUsd(result.dollarRisk, 0)}
                    </span>
                    <span className="text-accent-green font-mono">
                      Reward {fmtUsd(result.potentialProfit, 0)}
                    </span>
                  </div>

                  {result.rrRatio < 2 && (
                    <p className="text-[11px] text-accent-gold mt-2 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      R:R below 2:1 — consider a better target or tighter stop
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
