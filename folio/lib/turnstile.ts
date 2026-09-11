import "server-only";
// Server-side Cloudflare Turnstile verification. Until TURNSTILE_SECRET_KEY
// is configured this passes everything, so the forms work before setup.
export async function verifyTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Missing secret: allowed only outside production, so a misconfigured
  // deployment can never silently run without the captcha.
  if (!secret) return process.env.NODE_ENV !== "production";
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}
