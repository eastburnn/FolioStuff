"use client";

// Last-resort screen if the root layout itself fails. Plain markup on
// purpose: nothing from the app can be assumed to work here.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#06080F", color: "#EEF2FF", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "120px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, margin: "0 0 12px" }}>Something went wrong</h1>
          <p style={{ color: "#8896B3", fontSize: 14, margin: "0 0 24px" }}>FolioStuff hit an error loading this page.</p>
          <button
            type="button"
            onClick={reset}
            style={{ background: "#8B5CF6", color: "#fff", border: 0, borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
