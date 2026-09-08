"use client";

// Small shared pieces for the calculators: number fields, result rows, and
// formatting helpers, so every tool looks and behaves the same.

export function fmtUsd(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtPct(n: number, digits = 2, showPlus = false) {
  const s = `${Math.abs(n).toFixed(digits)}%`;
  if (n > 0 && showPlus) return `+${s}`;
  if (n < 0) return `-${s}`;
  return s;
}

export function fmtNum(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  hint,
  min = "0",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-ink-muted uppercase tracking-widest mb-2">{label}</label>
      <div className="flex items-center bg-bg-card border border-white/[0.08] rounded-xl focus-within:border-white/20 transition-colors duration-200">
        {prefix && <span className="pl-4 pr-1 text-ink-muted text-sm select-none shrink-0">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "0"}
          min={min}
          step="any"
          className={`flex-1 bg-transparent py-3 text-ink-primary placeholder-ink-muted focus:outline-none min-w-0 ${prefix ? "pl-1 pr-4" : "px-4"} ${suffix ? "pr-1" : ""}`}
        />
        {suffix && <span className="pr-4 pl-1 text-ink-muted text-sm select-none shrink-0">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-ink-muted mt-1.5">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-ink-muted uppercase tracking-widest mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-ink-primary focus:outline-none focus:border-white/20 transition-colors appearance-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function StatRow({
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
    positive === true ? "text-accent-green" : positive === false ? "text-accent-red" : "text-ink-primary";
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className={`font-semibold font-mono text-right ${large ? "text-base" : "text-sm"} ${colorClass}`}>{value}</span>
    </div>
  );
}

export function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-bg-card p-5">
      <p className="text-xs text-ink-muted uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.1] p-6 text-center">
      <p className="text-sm text-ink-muted">{text}</p>
    </div>
  );
}

export function Toggle({
  options,
  value,
  onChange,
  accent,
}: {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  accent: "green" | "red" | "purple" | "gold";
}) {
  const active = {
    green: "bg-accent-green/[0.15] text-accent-green border border-accent-green/30",
    red: "bg-accent-red/[0.15] text-accent-red border border-accent-red/30",
    purple: "bg-accent-purple/[0.15] text-accent-purple border border-accent-purple/30",
    gold: "bg-accent-gold/[0.15] text-accent-gold border border-accent-gold/30",
  }[accent];
  return (
    <div className="inline-flex bg-bg-card border border-white/[0.07] rounded-xl p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
            value === o.value ? active : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const chartTooltipStyle = {
  background: "#10131E",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#EEF2FF",
};
