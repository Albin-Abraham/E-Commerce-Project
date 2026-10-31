import React from "react";

export const AuthPortalFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-6xl mx-auto mt-6 sm:mt-8 pt-4 pb-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <a
          href="#privacy"
          onClick={(e) => e.preventDefault()}
          className="hover:text-foreground transition-colors"
        >
          Privacy Policy
        </a>
        <span aria-hidden="true">•</span>
        <a
          href="#terms"
          onClick={(e) => e.preventDefault()}
          className="hover:text-foreground transition-colors"
        >
          Terms of Service
        </a>
        <span aria-hidden="true">•</span>
        <a
          href="#security"
          onClick={(e) => e.preventDefault()}
          className="hover:text-foreground transition-colors"
        >
          Security Overview
        </a>
      </div>

      <div>
        © {currentYear} ZenOS Commerce Platform. All Rights Reserved.
      </div>
    </footer>
  );
};
