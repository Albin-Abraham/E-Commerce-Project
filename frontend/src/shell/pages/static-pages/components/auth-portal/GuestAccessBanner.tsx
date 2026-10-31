import React from "react";
import { Link } from "react-router-dom";

export interface GuestAccessBannerProps {
  onGuestBypass?: () => void;
}

export const GuestAccessBanner: React.FC<GuestAccessBannerProps> = ({ onGuestBypass }) => {
  return (
    <div className="w-full max-w-6xl mx-auto mb-4 sm:mb-6 p-3 sm:p-4 rounded-2xl border border-border/50 bg-surface-raised/40 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <span className="text-xl shrink-0" aria-hidden="true">
          🚀
        </span>
        <div>
          <span className="text-xs sm:text-sm font-bold text-foreground">
            Browsing as a Guest?
          </span>{" "}
          <span className="text-xs text-muted-foreground">
            No account, registration, or password required to view products and checkout.
          </span>
        </div>
      </div>

      <Link
        to="/"
        onClick={onGuestBypass}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all active:scale-95 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span>Continue Shopping</span>
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
};
