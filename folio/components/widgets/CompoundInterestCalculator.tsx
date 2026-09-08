"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Empty, Field, ResultCard, Select, StatRow, chartTooltipStyle, fmtUsd } from "./CalcUi";

interface YearPoint {
  year: number;
  balance: number;
  contributed: number;
  interest: number;
}

const FREQUENCIES = [
  { value: "12", label: "Monthly" },
  { value: "4", label: "Quarterly" },
  { value: "1", label: "Annually" },
  { value: "365", label: "Daily" },
];

// Month by month simulation. Interest compounds at the chosen frequency; the
// monthly growth factor is derived from it so contributions can still land
// every month. Contributions are added at the end of each month.
function simulate(initial: number, monthly: number, ratePct: number, years: number, perYear: number): YearPoint[] {
  const monthlyFactor = Math.pow(1 + ratePct / 100 / perYear, perYear / 12);
  const points: YearPoint[] = [{ year: 0, balance: initial, contributed: initial, interest: 0 }];
  let balance = initial;
  let contributed = initial;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * monthlyFactor + monthly;
      contributed += monthly;
    }
    points.push({ year: y, balance, contributed, interest: balance - contributed });
  }
  return points;
}

export default function CompoundInterestCalculator() {
  const [initial, setInitial] = useState("10000");
  const [monthly, setMonthly] = useState("500");
  const [rate, setRate] = useState("7");
  const [years, setYears] = useState("20");
  const [freq, setFreq] = useState("12");

  const points = useMemo(() => {
    const i = parseFloat(initial) || 0;
    const m = parseFloat(monthly) || 0;
    const r = parseFloat(rate);
    const y = Math.min(80, Math.max(1, Math.round(parseFloat(years) || 0)));
    if (!Number.isFinite(r) || r < 0 || (i <= 0 && m <= 0) || !(y >= 1)) return null;
    return simulate(i, m, r, y, Number(freq));
  }, [initial, monthly, rate, years, freq]);

  const final = points ? points[points.length - 1] : null;
  const multiple = final && final.contributed > 0 ? final.balance / final.contributed : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Starting amount" value={initial} onChange={setInitial} prefix="$" placeholder="10000" />
          <Field label="Monthly contribution" value={monthly} onChange={setMonthly} prefix="$" placeholder="500" hint="Set to 0 for a lump sum only." />
          <Field label="Annual interest rate" value={rate} onChange={setRate} suffix="%" placeholder="7" hint="The S&P 500 has averaged around 10% a year before inflation, roughly 7% after." />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Years" value={years} onChange={setYears} placeholder="20" />
            <Select label="Compounds" value={freq} onChange={setFreq} options={FREQUENCIES} />
          </div>
        </div>

        <div className="space-y-4">
          {final ? (
            <>
              <ResultCard title="After the full period">
                <StatRow label="Ending balance" value={fmtUsd(final.balance, 0)} large positive />
                <StatRow label="Total contributed" value={fmtUsd(final.contributed, 0)} />
                <StatRow label="Interest earned" value={fmtUsd(final.interest, 0)} positive={final.interest > 0 ? true : null} />
                <StatRow label="Growth multiple" value={`${multiple.toFixed(2)}x`} />
              </ResultCard>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Interest earned is the ending balance minus everything you put in. Taxes, fees, and
                inflation are not included.
              </p>
            </>
          ) : (
            <Empty text="Enter a starting amount or a monthly contribution to see the growth." />
          )}
        </div>
      </div>

      {points && points.length > 1 && (
        <div className="rounded-2xl border border-white/[0.07] bg-bg-card p-4 sm:p-5 mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <p className="text-xs text-ink-muted uppercase tracking-widest">Balance over time</p>
            <div className="flex items-center gap-4 text-[11px] text-ink-muted">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-purple" />Balance</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-white/30" />Contributed</span>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="ci-balance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#6B7A90", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fill: "#6B7A90", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1000)}k`)}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v: number, name: string) => [fmtUsd(v, 0), name === "balance" ? "Balance" : "Contributed"]}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <Area type="monotone" dataKey="contributed" stroke="rgba(255,255,255,0.35)" fill="rgba(255,255,255,0.06)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="balance" stroke="#8B5CF6" fill="url(#ci-balance)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
