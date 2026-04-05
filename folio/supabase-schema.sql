-- ============================================================
-- FolioStuff Ticker Bar — Supabase Schema
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. symbols — master list of valid US stock tickers
CREATE TABLE IF NOT EXISTS symbols (
  symbol       TEXT PRIMARY KEY,
  company_name TEXT,
  exchange     TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_symbols_company ON symbols USING gin(to_tsvector('english', coalesce(company_name, '')));

-- 2. ticker_votes — one row per user submission per day
CREATE TABLE IF NOT EXISTS ticker_votes (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address   TEXT    NOT NULL,
  tickers      TEXT[]  NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  vote_date    DATE    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticker_votes_date    ON ticker_votes(vote_date);
CREATE INDEX IF NOT EXISTS idx_ticker_votes_ip_date ON ticker_votes(ip_address, vote_date);

-- 3. ticker_counts — aggregated vote counts per ticker per day
CREATE TABLE IF NOT EXISTS ticker_counts (
  symbol    TEXT NOT NULL,
  vote_date DATE NOT NULL,
  count     INTEGER DEFAULT 0,
  PRIMARY KEY (symbol, vote_date)
);

CREATE INDEX IF NOT EXISTS idx_ticker_counts_date   ON ticker_counts(vote_date);
CREATE INDEX IF NOT EXISTS idx_ticker_counts_symbol ON ticker_counts(symbol);

-- 4. active_tickers — current top 30 driving the live ticker bar
CREATE TABLE IF NOT EXISTS active_tickers (
  symbol       TEXT    PRIMARY KEY,
  rank         INTEGER NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_holdover  BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_active_tickers_rank ON active_tickers(rank);

-- ============================================================
-- Row Level Security
-- Allow public reads on active_tickers and ticker_counts.
-- Lock down writes to service role only.
-- ============================================================

ALTER TABLE symbols        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticker_votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticker_counts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_tickers ENABLE ROW LEVEL SECURITY;

-- Public can read symbols (needed for autocomplete)
CREATE POLICY "public_read_symbols"
  ON symbols FOR SELECT USING (true);

-- Public can read active_tickers (needed for ticker bar)
CREATE POLICY "public_read_active_tickers"
  ON active_tickers FOR SELECT USING (true);

-- Public can read ticker_counts (needed for leaderboard)
CREATE POLICY "public_read_ticker_counts"
  ON ticker_counts FOR SELECT USING (true);

-- Public can read ticker_votes (needed for trending calc)
CREATE POLICY "public_read_ticker_votes"
  ON ticker_votes FOR SELECT USING (true);

-- Public can INSERT their own vote (via API route that validates IP)
CREATE POLICY "public_insert_ticker_votes"
  ON ticker_votes FOR INSERT WITH CHECK (true);

-- All writes to symbols, ticker_counts, active_tickers go through
-- the service role key (server-side cron jobs only) — no public write policies.
