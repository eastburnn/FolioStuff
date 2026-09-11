import { NextResponse } from "next/server";

// Receives Content Security Policy violation reports from browsers and writes
// a compact line to the server log. Used to rehearse a policy in report-only
// mode and to notice a blocked third party after enforcement.
export async function POST(request: Request) {
  const text = (await request.text()).slice(0, 8000);
  try {
    const body = JSON.parse(text) as Record<string, unknown>;
    const reports = Array.isArray(body) ? body : [body];
    for (const entry of reports) {
      const r = ((entry as Record<string, unknown>)["csp-report"] ??
        (entry as Record<string, unknown>).body ??
        entry) as Record<string, unknown>;
      console.error(
        "[csp-report]",
        JSON.stringify({
          document: r["document-uri"] ?? r.documentURL,
          directive: r["effective-directive"] ?? r["violated-directive"] ?? r.effectiveDirective,
          blocked: r["blocked-uri"] ?? r.blockedURL,
          source: r["source-file"] ?? r.sourceFile,
          line: r["line-number"] ?? r.lineNumber,
          sample: r["script-sample"] ?? r.sample,
        })
      );
    }
  } catch {
    console.error("[csp-report] unreadable report");
  }
  return new NextResponse(null, { status: 204 });
}
