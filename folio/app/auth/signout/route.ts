import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/", request.url), { status: 302 });
  // Drop the last-visit stamp so it cannot expire the next login early.
  response.cookies.set("fs-last-seen", "", { path: "/", maxAge: 0 });
  return response;
}
