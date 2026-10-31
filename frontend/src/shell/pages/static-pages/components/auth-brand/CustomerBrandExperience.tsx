import React from "react";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Headphones,
  Award,
  Sparkles,
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

export const CustomerBrandExperience: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-indigo-500/10 via-surface-raised/50 to-surface overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header & Live Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
          <ShoppingBag className="w-4 h-4" />
          <span>Retail Consumer Hub</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3 h-3" />
          <span>VIP Member Tier Active</span>
        </span>
      </div>

      {/* 2. Interactive Logistics & Order Pipeline Showcase */}
      <div className="relative z-10 my-auto py-6 space-y-4">
        {/* Floating Card 1: Live Order Delivery Telemetry */}
        <FramerMotion
          variants={floatingVariants}
          animate="float1"
          className="w-full max-w-sm p-4 bg-surface/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-xl text-foreground ring-1 ring-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Order #ZN-98421
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Out for Delivery
            </span>
          </div>

          <div className="text-base font-black tracking-tight text-foreground mb-1">
            Expected Today, 2:30 PM
          </div>
          <p className="text-2xs text-muted-foreground mb-3">
            Carrier: FedEx Express Priority • Tracking: FX-8492041-US
          </p>

          {/* 4-Stage Visual Shipment Stepper */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border/40">
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
              <span className="text-[9px] font-medium text-foreground/80">Placed</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
              <span className="text-[9px] font-medium text-foreground/80">Packed</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">✓</div>
              <span className="text-[9px] font-medium text-foreground/80">In Transit</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold animate-pulse">●</div>
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">Arriving</span>
            </div>
          </div>
        </FramerMotion>

        {/* Floating Card 2: Rewards & Volume Savings Card */}
        <FramerMotion
          variants={floatingVariants}
          animate="float2"
          className="w-full max-w-sm p-3.5 bg-surface/90 backdrop-blur-lg border border-border/70 rounded-2xl shadow-lg text-foreground flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                Prime Rewards • 2,450 Pts
              </div>
              <div className="text-[10px] text-muted-foreground">
                +14.8% Member Bonus on Next Order
              </div>
            </div>
          </div>
          <span className="text-2xs font-extrabold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            Gold Tier
          </span>
        </FramerMotion>
      </div>

      {/* 3. Value Proposition & Enterprise Guarantees */}
      <div className="relative z-10 space-y-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-tight mb-1.5">
            Your shopping journey starts here.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm">
            Discover curated products, track orders in real-time, enjoy member rewards, and experience seamless checkout.
          </p>
        </div>

        {/* Trust Guarantees */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/40 text-2xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Buyer Protection</span>
          </div>
          <div className="flex items-center gap-1">
            <Headphones className="w-3.5 h-3.5 text-indigo-500" />
            <span>24/7 Concierge</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>30-Day Returns</span>
          </div>
        </div>
      </div>
    </div>
  );
};
