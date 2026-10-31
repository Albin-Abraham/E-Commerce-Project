import React from "react";
import {
  ShieldCheck,
  Terminal,
  Activity,
  Lock,
  Server,
  Cpu,
  KeyRound,
  CheckCircle2,
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

export const StaffBrandExperience: React.FC = () => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-100 overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-slate-800/20 rounded-full blur-2xl pointer-events-none" />

      {/* 1. Header & Live Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4" />
          <span>ENTERPRISE OPERATIONS TERMINAL</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>ZTNA Active</span>
        </span>
      </div>

      {/* 2. Command Console Telemetry & Monospaced Security Log Stream */}
      <div className="relative z-10 my-auto py-6 space-y-4">
        {/* Floating Card 1: Node Topology & RBAC */}
        <FramerMotion
          variants={floatingVariants}
          animate="float1"
          className="w-full max-w-sm p-4 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl text-slate-100 ring-1 ring-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              NODE TOPOLOGY
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              14 Branches Online
            </span>
          </div>
          <div className="text-xl font-mono font-black tracking-tight text-white mb-1">
            RBAC Manifest O(1)
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-indigo-500 w-full rounded-full" />
          </div>

          {/* Monospaced Real-Time Audit Log Feed */}
          <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-[10px] space-y-1 text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>[AUDIT 17:04:12] TLS 1.3 / AES-256 Session Handshake: OK</span>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span>[SECURITY] Zero-Trust Perimeter Enforced: IP In-Range</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>[RBAC] Policy Engine Loaded: 64 Role Manifests</span>
            </div>
          </div>
        </FramerMotion>

        {/* Floating Card 2: Session Audit Active Card */}
        <FramerMotion
          variants={floatingVariants}
          animate="float2"
          className="w-full max-w-sm p-3.5 bg-slate-900/90 backdrop-blur-lg border border-slate-800 rounded-2xl shadow-lg text-slate-100 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Session Audit Active
              </div>
              <div className="text-[10px] text-slate-400">
                Zero-Trust ACL Enforcement
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xs font-mono font-bold text-emerald-400 block">
              100% SECURE
            </span>
            <span className="text-[10px] text-slate-500 font-mono">FIDO2 Ready</span>
          </div>
        </FramerMotion>
      </div>

      {/* 3. Value Proposition & Compliance Strip */}
      <div className="relative z-10 space-y-3">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-1.5">
            Your enterprise. Securely connected.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
            Access internal operations through a secure, centralized enterprise gateway with full multi-tenant audit logging.
          </p>
        </div>

        {/* Security Compliance Strip */}
        <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-2xs font-semibold text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>SOC2 Type II</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>ISO 27001</span>
          </div>
          <div className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hardware MFA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
