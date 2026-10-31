import React, { useState } from "react";
import { ShieldCheck, Globe, KeyRound, ArrowRight } from "lucide-react";

export interface EnterpriseSsoPanelProps {
  onSsoTrigger?: (provider: "okta" | "azure" | "google" | "saml", domain?: string) => void;
  className?: string;
}

export const EnterpriseSsoPanel: React.FC<EnterpriseSsoPanelProps> = ({
  onSsoTrigger,
  className = "",
}) => {
  const [tenantDomain, setTenantDomain] = useState("");
  const [showDomainInput, setShowDomainInput] = useState(false);

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantDomain.trim()) return;
    if (onSsoTrigger) {
      onSsoTrigger("saml", tenantDomain.trim());
    } else {
      window.location.href = `/login?mode=staff&tenant=${encodeURIComponent(tenantDomain.trim())}`;
    }
  };

  return (
    <div className={`space-y-3 pt-3 border-t border-border/50 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Enterprise SSO & Directory Sign-In
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-500 font-bold">
          <ShieldCheck className="w-3 h-3" />
          <span>SAML 2.0 / OIDC</span>
        </span>
      </div>

      {/* Corporate IdP Providers */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onSsoTrigger ? onSsoTrigger("okta") : alert("Redirecting to Okta SAML IdP...")}
          className="flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border border-border/70 bg-surface-raised/40 hover:bg-surface hover:border-indigo-500/40 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
        >
          <span className="font-black text-sm text-indigo-500 tracking-tight">okta</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Verify via Okta</span>
        </button>

        <button
          type="button"
          onClick={() => onSsoTrigger ? onSsoTrigger("azure") : alert("Redirecting to Microsoft Entra ID...")}
          className="flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border border-border/70 bg-surface-raised/40 hover:bg-surface hover:border-blue-500/40 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
        >
          <span className="font-black text-sm text-blue-500 tracking-tight">Azure AD</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Microsoft 365</span>
        </button>

        <button
          type="button"
          onClick={() => onSsoTrigger ? onSsoTrigger("google") : alert("Redirecting to Google Workspace SSO...")}
          className="flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border border-border/70 bg-surface-raised/40 hover:bg-surface hover:border-emerald-500/40 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs"
        >
          <span className="font-black text-sm text-emerald-500 tracking-tight">Workspace</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Google Cloud</span>
        </button>
      </div>

      {/* Tenant Domain Input Toggle */}
      {!showDomainInput ? (
        <button
          type="button"
          onClick={() => setShowDomainInput(true)}
          className="w-full text-center text-2xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1 flex items-center justify-center gap-1 cursor-pointer"
        >
          <Globe className="w-3 h-3 text-muted-foreground" />
          <span>Sign in with private tenant domain (company.zenos.com)</span>
        </button>
      ) : (
        <form onSubmit={handleDomainSubmit} className="pt-1">
          <div className="flex items-center rounded-xl border border-border/80 bg-surface px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-primary/20">
            <input
              type="text"
              value={tenantDomain}
              onChange={(e) => setTenantDomain(e.target.value)}
              placeholder="organization-slug"
              className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none"
              autoFocus
            />
            <span className="text-2xs font-mono text-muted-foreground shrink-0 mr-2">
              .zenos.com
            </span>
            <button
              type="submit"
              disabled={!tenantDomain.trim()}
              className="px-2.5 py-1 rounded-lg text-2xs font-bold bg-primary text-primary-foreground disabled:opacity-40 shrink-0 cursor-pointer"
            >
              Continue
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
