import React from "react";
import {
  ShoppingBag,
  Building2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  PackageSearch,
  Sparkles,
  Zap,
} from "lucide-react";
import { type AuthPersona, AUTH_PERSONAS } from "../../configs/auth-personas";
import { AuthPortalHeader } from "./AuthPortalHeader";
import { AuthPortalFooter } from "./AuthPortalFooter";

export interface PersonaSelectionViewProps {
  onSelectPersona: (persona: AuthPersona) => void;
  onGuestBypass?: () => void;
}

interface TerminalMeta {
  iconComponent: React.ComponentType<{ className?: string }>;
  taxonomy: string;
  subBadge: string;
  capabilities: string[];
  quickLinks: { label: string; href?: string; onClick?: () => void }[];
  borderHover: string;
  badgeClass: string;
  iconBg: string;
  btnClass: string;
}

export const PersonaSelectionView: React.FC<PersonaSelectionViewProps> = ({
  onSelectPersona,
  onGuestBypass,
}) => {
  const personas: AuthPersona[] = ["customer", "partner", "staff"];

  const terminalMetadata: Record<AuthPersona, TerminalMeta> = {
    customer: {
      iconComponent: ShoppingBag,
      taxonomy: "B2C Consumer & Commercial Buyers",
      subBadge: "1-Click Checkout",
      capabilities: [
        "Real-time multi-carrier shipment telemetry & returns",
        "Tiered member rewards, point ledgers, & volume pricing",
        "Curated wishlists, saved billing, & instant reordering",
      ],
      quickLinks: [
        { label: "Guest Order Lookup", href: "#order-tracking" },
        { label: "Rewards Guide", href: "#rewards" },
      ],
      borderHover: "hover:border-indigo-500/80 hover:shadow-2xl hover:shadow-indigo-500/10 focus-visible:ring-indigo-500",
      badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105",
      btnClass: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/25",
    },
    partner: {
      iconComponent: Building2,
      taxonomy: "Suppliers, Wholesalers & 3PL Partners",
      subBadge: "EDI 850 / 810 Ready",
      capabilities: [
        "Automated RFQ response engine & live purchase orders",
        "Multi-warehouse inventory feeds & catalog management",
        "Automated Net-30 invoice reconciliation & settlements",
      ],
      quickLinks: [
        { label: "Vendor Onboarding", onClick: () => (window.location.href = "/register?mode=partner") },
        { label: "EDI Specs", href: "#edi-docs" },
      ],
      borderHover: "hover:border-emerald-500/80 hover:shadow-2xl hover:shadow-emerald-500/10 focus-visible:ring-emerald-500",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105",
      btnClass: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/25",
    },
    staff: {
      iconComponent: ShieldCheck,
      taxonomy: "Internal Enterprise Staff & Operators",
      subBadge: "Zero-Trust Access",
      capabilities: [
        "Multi-tenant RBAC with granular department permissions",
        "Immutable audit trail & real-time log stream monitoring",
        "FIDO2 / WebAuthn hardware key & Okta/Azure SSO ready",
      ],
      quickLinks: [
        { label: "Corporate Directory", href: "#directory" },
        { label: "IT Helpdesk", href: "#helpdesk" },
      ],
      borderHover: "hover:border-slate-500/80 hover:shadow-2xl hover:shadow-slate-500/10 focus-visible:ring-slate-500",
      badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
      iconBg: "bg-slate-500/15 text-slate-700 dark:text-slate-200 group-hover:scale-105",
      btnClass: "bg-slate-800 hover:bg-slate-700 text-white shadow-md shadow-slate-900/30",
    },
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 bg-background text-foreground bg-architectural-grid">
      {/* 1. Top Enterprise Header */}
      <AuthPortalHeader />

      {/* 2. Main Persona Selection Content */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col justify-center my-6 sm:my-8">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Enterprise Identity Gateway • ZenOS v2.4</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            Choose Your Portal
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Select your specialized organization portal, enterprise directory, or trading gateway to authenticate to your dedicated workspace.
          </p>
        </div>

        {/* 3 Large Persona Selection Cards */}
        <div
          role="region"
          aria-label="Available Portals"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 mb-8"
        >
          {personas.map((id) => {
            const config = AUTH_PERSONAS[id];
            const meta = terminalMetadata[id];
            const Icon = meta.iconComponent;

            return (
              <div
                key={id}
                onClick={() => onSelectPersona(id)}
                className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-border/80 bg-surface/90 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 cursor-pointer ring-1 ring-white/5 ${meta.borderHover}`}
              >
                <div>
                  {/* Top Row: Icon, Main Badge, and Sub-badge */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-transform duration-300 shadow-2xs ${meta.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}
                      >
                        {config.badge}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/80">
                        {meta.subBadge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Taxonomy */}
                  <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                      {config.title}
                    </h2>
                    <span className="text-xs font-semibold text-primary">
                      {meta.taxonomy}
                    </span>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-2">
                      {config.subtitle}
                    </p>
                  </div>

                  {/* 3 Enterprise Capability Points */}
                  <div className="space-y-2 py-3 mb-5 border-t border-b border-border/40">
                    {meta.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="leading-snug">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {/* Quick Links */}
                  <div className="flex items-center justify-between text-2xs font-semibold text-muted-foreground mb-4 px-1">
                    {meta.quickLinks.map((ql, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ql.onClick) ql.onClick();
                        }}
                        className="hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        <span>{ql.label}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>

                  {/* Continue Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPersona(id);
                    }}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 ${meta.btnClass}`}
                  >
                    <span>Continue to {config.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Enterprise Guest Access & Order Tracking Surface */}
        <div className="w-full p-4 sm:p-5 rounded-2xl border border-border/70 bg-surface/70 backdrop-blur-md shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <PackageSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Browsing as a Guest or Tracking an Existing Order?
                </span>
                <span className="hidden md:inline-block text-2xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  No Login Required
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Inspect public catalogs, compute live freight rates, or track dispatches by Order ID without creating an account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href="/"
              onClick={(e) => {
                if (onGuestBypass) {
                  e.preventDefault();
                  onGuestBypass();
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all inline-flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </main>

      {/* 4. Enterprise Compliance Footer */}
      <AuthPortalFooter />
    </div>
  );
};
