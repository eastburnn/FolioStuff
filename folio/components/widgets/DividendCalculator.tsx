"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty, Field, ResultCard, Select, StatRow, Toggle, chartTooltipStyle, fmtNum, fmtPct, fmtUsd } from "./CalcUi";

interface YearRow {
  year: number;
  shares: number;
  price: number;
  income: number;
  value: number;
  totalDividends: number;
  contributed: number;
}

const FREQUENCIES = [
  { value: "4", label: "Quarterly" },
  { value: "12", label: "Monthly" },
  { value: "2", label: "Twice a year" },
  { value: "1", label: "Annually" },
];

interface Inputs {
  initial: number;
  price: number;
  yieldPct: number;
  dividendGrowth: number;
  priceGrowth: number;
  years: number;
  annualContribution: number;
  perYear: number;
  reinvest: boolean;
}

// Period by period simulation. Each payout is dividend per share times the
// shares held; with DRIP on, the cash buys more shares at that period's
// price. The dividend per share rises once a year by the growth rate, the
// share price drifts every period, and extra contributions land at the end
// of each year.
function simulate(i: Inputs): YearRow[] {
  const rows: YearRow[] = [];
  let shares = i.initial / i.price;
  let price = i.price;
  let annualDps = i.price * (i.yieldPct / 100);
  let totalDividends = 0;
  let contributed = i.initial;
  const priceStep = Math.pow(1 + i.priceGrowth / 100, 1 / i.perYear);
  rows.push({ year: 0, shares, price, income: 0, value: shares * price, totalDividends: 0, contributed });
  for (let y = 1; y <= i.years; y++) {
    let income = 0;
    for (let p = 0; p < i.perYear; p++) {
      const cash = shares * (annualDps / i.perYear);
      income += cash;
      totalDividends += cash;
      price *= priceStep;
      if (i.reinvest && price > 0) shares += cash / price;
    }
    if (i.annualContribution > 0 && price > 0) {
      shares += i.annualContribution / price;
      contributed += i.annualContribution;
    }
    annualDps *= 1 + i.dividendGrowth / 100;
    rows.push({ year: y, shares, price, income, value: shares * price, totalDividends, contributed });
  }
  return rows;
}

export default function DividendCalculator() {
  const [initial, setInitial] = useState("10000");
  const [price, setPrice] = useState("50");
  const [yieldPct, setYieldPct] = useState("4");
  const [dividendGrowth, setDividendGrowth] = useState("5");
  const [priceGrowth, setPriceGrowth] = useState("4");
  const [years, setYears] = useState("20");
  const [contribution, setContribution] = useState("0");
  const [freq, setFreq] = useState("4");
  const [reinvest, setReinvest] = useState("drip");

  const result = useMemo(() => {
    const base = {
      initial: parseFloat(initial) || 0,
      price: parseFloat(price),
      yieldPct: parseFloat(yieldPct),
      dividendGrowth: parseFloat(dividendGrowth) || 0,
      priceGrowth: parseFloat(priceGrowth) || 0,
      years: Math.min(60, Math.max(1, Math.round(parseFloat(years) || 0))),
      annualContribution: parseFloat(contribution) || 0,
      perYear: Number(freq),
    };
    if (base.initial <= 0 || !(base.price > 0) || !Number.isFinite(base.yieldPct) || base.yieldPct < 0) return null;
    return {
      drip: simulate({ ...base, reinvest: true }),
      cash: simulate({ ...base, reinvest: false }),
    };
  }, [initial, price, yieldPct, dividendGrowth, priceGrowth, years, contribution, freq]);

  const rows = result ? (reinvest === "drip" ? result.drip : result.cash) : null;
  const last = rows ? rows[rows.length - 1] : null;
  const first = rows ? rows[1] : null;
  const yieldOnCost = last && last.contributed > 0 ? (last.income / last.contributed) * 100 : 0;
  const chartData = result
    ? result.drip.slice(1).map((r, idx) => ({ year: r.year, drip: r.income, cash: result.cash[idx + 1].income }))
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <Toggle
          accent="green"
          value={reinvest}
          onChange={setReinvest}
          options={[
            { value: "drip", label: "Reinvest dividends (DRIP)", icon: <RefreshCw size={14} /> },
            { value: "cash", label: "Take dividends as cash", icon: <Wallet size={14} /> },
          ]}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Initial investment" value={initial} onChange={setInitial} prefix="$" placeholder="10000" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Share price" value={price} onChange={setPrice} prefix="$" placeholder="50" />
            <Field label="Dividend yield" value={yieldPct} onChange={setYieldPct} suffix="%" placeholder="4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dividend growth" value={dividendGrowth} onChange={setDividendGrowth} suffix="%/yr" placeholder="5" />
            <Field label="Price growth" value={priceGrowth} onChange={setPriceGrowth} suffix="%/yr" placeholder="4" min="-100" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Years" value={years} onChange={setYears} placeholder="20" />
            <Select label="Paid" value={freq} onChange={setFreq} options={FREQUENCIES} />
          </div>
          <Field label="Added each year" value={contribution} onChange={setContribution} prefix="$" placeholder="0" hint="Optional extra cash invested at the end of every year." />
        </div>

        <div className="space-y-4">
          {last && first ? (
            <>
              <ResultCard title={`After ${last.year} years`}>
                <StatRow label="Annual dividend income" value={fmtUsd(last.income, 0)} large positive />
                <StatRow label="Total dividends collected" value={fmtUsd(last.totalDividends, 0)} />
                <StatRow label="Portfolio value" value={fmtUsd(last.value, 0)} />
                <StatRow label="Shares owned" value={fmtNum(last.shares, 1)} />
                <StatRow label="Yield on cost" value={fmtPct(yieldOnCost, 1)} />
              </ResultCard>
              <ResultCard title="Year one, for comparison">
                <StatRow label="Annual dividend income" value={fmtUsd(first.income, 0)} />
                <StatRow label="Shares owned" value={fmtNum(first.shares, 1)} />
              </ResultCard>
              {result && reinvest === "drip" && (
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Without reinvesting, year {last.year} income would be{" "}
                  {fmtUsd(result.cash[result.cash.length - 1].income, 0)}. Reinvesting adds{" "}
                  {fmtUsd(last.income - result.cash[result.cash.length - 1].income, 0)} a year by then.
                </p>
              )}
            </>
          ) : (
            <Empty text="Enter an investment, share price, and yield to project your dividend income." />
          )}
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-bg-card p-4 sm:p-5 mt-6">
          <p className="text-xs text-ink-muted uppercase tracking-widest mb-3">Annual dividend income, reinvested vs cash</p>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#6B7A90", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#6B7A90", fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `$${Math.round(v).toLocaleString()}`} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number, name: string) => [fmtUsd(v, 0), name === "drip" ? "Reinvested" : "Cash"]}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Legend formatter={(v) => (v === "drip" ? "Reinvested" : "Taken as cash")} wrapperStyle={{ fontSize: 11, color: "#6B7A90" }} />
                <Bar dataKey="drip" fill="#00C896" radius={[3, 3, 0, 0]} />
                <Bar dataKey="cash" fill="rgba(255,255,255,0.25)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
