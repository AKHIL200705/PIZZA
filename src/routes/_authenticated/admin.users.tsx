import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useCustomers } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { AdminShell } from "@/components/site/AdminShell";
import { Skeleton } from "@/components/site/ui";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Customers — PizzaHub kitchen console" },
      {
        name: "description",
        content: "Every registered PizzaHub customer with contact and delivery details.",
      },
      { property: "og:title", content: "Customers — PizzaHub" },
      { property: "og:description", content: "Registered customers and contact details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { isAdmin } = useAuth();
  const { data: customers, isLoading } = useCustomers(isAdmin);

  return (
    <AdminShell title="Customers">
      {isLoading ? (
        <Skeleton className="h-80" />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-medium">{c.full_name || "—"}</td>
                  <td className="p-4 text-muted-foreground">{c.email}</td>
                  <td className="p-4 text-muted-foreground">{c.phone || "—"}</td>
                  <td className="p-4 text-muted-foreground">{formatDate(c.created_at)}</td>
                </tr>
              ))}
              {(customers ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
