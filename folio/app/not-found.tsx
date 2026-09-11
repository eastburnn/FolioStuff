import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-16 grid-bg min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-24 text-center">
        <p className="text-xs text-ink-muted uppercase tracking-widest mb-3">404</p>
        <h1 className="text-3xl font-bold text-ink-primary tracking-tight mb-3">Page not found</h1>
        <p className="text-sm text-ink-secondary mb-8">
          That page does not exist, or a listing you followed a link to is no longer live.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/" className="rounded-xl bg-accent-purple/[0.12] border border-accent-purple/40 hover:bg-accent-purple/[0.22] transition-colors px-5 py-2.5 text-sm font-semibold text-accent-purple">
            Home
          </Link>
          <Link href="/tools" className="rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors px-5 py-2.5 text-sm font-semibold text-ink-primary">
            Tools
          </Link>
          <Link href="/directory" className="rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-colors px-5 py-2.5 text-sm font-semibold text-ink-primary">
            Directory
          </Link>
        </div>
      </div>
    </div>
  );
}
