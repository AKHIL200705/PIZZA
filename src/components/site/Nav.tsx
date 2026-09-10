import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Pizza, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/data";

const linkClass =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export function Nav() {
  const { user, isAdmin, profile, signOut: authSignOut } = useAuth();
  const { data: cart } = useCart(user?.id);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const count = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await authSignOut();
    navigate({ to: "/auth", replace: true });
  };

  const links = (
    <>
      <Link to="/" className={linkClass} onClick={() => setOpen(false)}>
        Home
      </Link>
      <Link to="/menu" className={linkClass} onClick={() => setOpen(false)}>
        Menu
      </Link>
      <Link to="/builder" className={linkClass} onClick={() => setOpen(false)}>
        Build a Pizza
      </Link>
      {user && (
        <Link to="/orders" className={linkClass} onClick={() => setOpen(false)}>
          My Orders
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" className={linkClass} onClick={() => setOpen(false)}>
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="ember-gradient glow flex h-9 w-9 items-center justify-center rounded-xl">
            <Pizza className="h-5 w-5 text-primary-foreground" aria-hidden />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            Pizza<span className="ember-text">Hub</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">{links}</div>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            aria-label={`Cart with ${count} items`}
            className="relative rounded-xl border border-border p-2 transition-colors hover:bg-secondary"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            {count > 0 && (
              <span className="ember-gradient absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to="/profile"
                className="max-w-32 truncate rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary"
              >
                {profile?.full_name || user.email}
              </Link>
              <button
                onClick={signOut}
                className="rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="ember-gradient hidden rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:block"
            >
              Sign in
            </Link>
          )}

          <button
            className="rounded-xl border border-border p-2 md:hidden"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4 md:hidden">
          {links}
          {user ? (
            <>
              <Link to="/profile" className={linkClass} onClick={() => setOpen(false)}>
                Profile
              </Link>
              <button onClick={signOut} className={`${linkClass} text-left`}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className={linkClass} onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
