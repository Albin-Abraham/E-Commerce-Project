import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ShieldCheck, Server, X, ArrowRight } from "lucide-react";

export const AuthPortalHeader: React.FC = () => {
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [tenantInput, setTenantInput] = useState("");

  const handleTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantInput.trim()) return;
    const cleanTenant = tenantInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    window.location.href = `/login?mode=customer&tenant=${cleanTenant}`;
  };

  return (
    <>
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between py-3 sm:py-3.5 px-4 sm:px-6 mb-4 sm:mb-6 border border-border/70 bg-surface/80 backdrop-blur-xl rounded-2xl shadow-xs ring-1 ring-white/5">
        {/* Brand Identity */}
        <Link
          to="/"
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center font-black text-lg sm:text-xl shadow-md shadow-primary/20">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg sm:text-xl tracking-tight text-foreground flex items-center gap-1">
              Zen<span className="text-primary">OS</span>
            </span>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted-foreground -mt-1">
              Enterprise Commerce ERP
            </span>
          </div>
        </Link>

        {/* Global Datacenter & SLA Telemetry */}
        <div className="hidden lg:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/60 text-muted-foreground font-medium shadow-2xs">
            <Server className="w-3.5 h-3.5 text-primary" />
            <span>Region: <strong className="text-foreground font-semibold">us-east-1</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>99.99% SLA Operational</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border/60 text-muted-foreground text-2xs font-bold uppercase tracking-wider shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>SOC2 • ISO 27001</span>
          </div>
        </div>

        {/* Navigation & Tenant Resolver Button */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-muted-foreground">
          <button
            type="button"
            onClick={() => setShowTenantModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-surface hover:bg-muted text-foreground transition-all duration-200 cursor-pointer shadow-2xs text-xs font-bold"
          >
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>Tenant Domain</span>
          </button>

          <a
            href="#help"
            onClick={(e) => e.preventDefault()}
            className="hover:text-foreground transition-colors hidden sm:inline"
          >
            Help Center
          </a>
          <a
            href="#support"
            onClick={(e) => e.preventDefault()}
            className="hover:text-foreground transition-colors"
          >
            Support
          </a>
        </div>
      </header>

      {/* Tenant Resolution Modal */}
      {showTenantModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md p-6 bg-surface border border-border/80 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Connect to Dedicated Tenant
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTenantModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your enterprise organization slug to connect directly to your dedicated private cloud instance and SAML IdP.
            </p>

            <form onSubmit={handleTenantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Tenant Workspace Domain
                </label>
                <div className="flex items-center rounded-xl border border-border bg-surface-raised px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20">
                  <input
                    type="text"
                    value={tenantInput}
                    onChange={(e) => setTenantInput(e.target.value)}
                    placeholder="acme-corp"
                    className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none placeholder:text-muted-foreground/50"
                    autoFocus
                  />
                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                    .zenos.com
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTenantModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tenantInput.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <span>Resolve Tenant</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
