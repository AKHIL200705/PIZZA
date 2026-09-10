import { Link } from "@tanstack/react-router";
import { Pizza } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="ember-gradient flex h-8 w-8 items-center justify-center rounded-lg">
              <Pizza className="h-4 w-4 text-primary-foreground" aria-hidden />
            </span>
            <span className="font-display text-lg font-extrabold">PizzaHub</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Fresh dough, fire ovens and a pizza built exactly your way — delivered hot in 30
            minutes.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/menu" className="hover:text-foreground">
                Menu
              </Link>
            </li>
            <li>
              <Link to="/builder" className="hover:text-foreground">
                Pizza Builder
              </Link>
            </li>
            <li>
              <Link to="/orders" className="hover:text-foreground">
                My Orders
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Account</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Sign in / Register
              </Link>
            </li>
            <li>
              <Link to="/forgot-password" className="hover:text-foreground">
                Forgot password
              </Link>
            </li>
            <li>
              <Link to="/admin-login" className="hover:text-foreground">
                Staff login
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Kitchen</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Open daily 11:00 – 23:00
            <br />
            Free delivery over ₹999
          </p>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>© {new Date().getFullYear()} PizzaHub · Built for the Oasis Infobyte internship</span>
        <span className="hidden sm:inline text-border">·</span>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("pizzahub:replay_splash"))}
          className="text-amber-500 hover:text-amber-400 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          <span>Replay 5s Intro</span> 🎬
        </button>
      </div>
    </footer>
  );
}
