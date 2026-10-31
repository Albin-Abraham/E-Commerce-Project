import React from "react";
import {
  Building2,
  FileCheck2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { FramerMotion } from "@core/libs/react-motion";
import type { Variants } from "framer-motion";

const floatingVariants: Variants = {
  float1: {
    y: ["-4px", "4px", "-4px"],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
  },
  float2: {
    y: ["4px", "-4px", "4px"],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
  },
};

export const PartnerBrandExperience: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-emerald-500/10 via-surface-raised/50 to-surface overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header & Live Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
          <Building2 className="w-4 h-4" />
          <span>B2B Supplier & Partner Gateway</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>EDI 850 Link Active</span>
        </span>
      </div>

      {/* 2. Interactive B2B Procurement Telemetry & PO Stream */}
      <div className="relative z-10 my-auto py-6 space-y-4">
        {/* Floating Card 1: PO Dispatches Telemetry */}
        <FramerMotion
          variants={floatingVariants}
          animate="float1"
          className="w-full max-w-sm p-4 bg-surface/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-xl text-foreground ring-1 ring-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              PO Dispatches
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              99.4% On-Time
            </span>
          </div>
          <div className="text-xl font-black tracking-tight text-foreground mb-1">
            $842,500.00
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-emerald-500 w-4/5 rounded-full" />
          </div>

          {/* Mini Dispatch Queue Rows */}
          <div className="space-y-1.5 pt-2 border-t border-border/40 text-2xs">
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-surface-raised/60">
              <span className="font-mono font-bold text-foreground">PO-98421</span>
              <span className="text-muted-foreground">$42,500.00</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                In Transit
              </span>
            </div>
            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-surface-raised/60">
              <span className="font-mono font-bold text-foreground">PO-98418</span>
              <span className="text-muted-foreground">$128,900.00</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                Settled
              </span>
            </div>
          </div>
        </FramerMotion>

        {/* Floating Card 2: 3-Way Invoice Matching & Settlement SLA */}
        <FramerMotion
          variants={floatingVariants}
          animate="float2"
          className="w-full max-w-sm p-3.5 bg-surface/90 backdrop-blur-lg border border-border/70 rounded-2xl shadow-lg text-foreground flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                3-Way Invoice Matching
              </div>
              <div className="text-[10px] text-muted-foreground">
                PO • Goods Receipt • Invoice Synced
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xs font-extrabold text-emerald-600 dark:text-emerald-400 block">
              24h Payout
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">Net-30 SLA</span>
          </div>
        </FramerMotion>
      </div>

      {/* 3. Value Proposition & Enterprise Partnership Guarantees */}
      <div className="relative z-10 space-y-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-tight mb-1.5">
            Power your business partnerships.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
            Manage purchase orders, respond to live RFQs, streamline shipments, and accelerate vendor settlement cycles.
          </p>
        </div>

        {/* B2B SLA Guarantees */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/40 text-2xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Automated Settlements</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" />
            <span>EDI 850 / 810 Direct</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Multi-Currency Ledger</span>
          </div>
        </div>
      </div>
    </div>
  );
};
