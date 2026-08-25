import { AdminSidebar } from "@/components/admin-sidebar";
import { guardAdmin } from "@/lib/auth";

/**
 * The sidebar lives here rather than in each page, so it renders once and stays
 * put while the content area swaps. Navigating between admin sections then
 * costs one content fetch instead of a full-page replacement.
 *
 * The login page sits outside this route group, so it gets no sidebar.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/admin">) {
  await guardAdmin();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
