import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminContext } from "@/lib/admin-gate";
import AdminNav from "@/components/directory/AdminNav";

// Shared shell for every admin page. The heading and tab bar live here,
// inside one container of a single fixed width, so they stay put as you move
// between tabs instead of recentering to each page's own content width.
// Non-admins get a 404 before any of this renders; every page re-checks too.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const ctx = await getAdminContext();
  if (!ctx) notFound();

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
