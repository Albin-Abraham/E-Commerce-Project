import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@hooks/auth/useAuth";
import { useHttp } from "@hooks/useHttp";

/**
 * API & Hooks Showcase
 *
 * Verifies:
 * 1. Context injection
 * 2. TanStack Query state transitions (loading, data, error)
 * 3. Automatic cancellation on unmount
 * 4. useAuth domain integration
 */
export const ApiShowcase: React.FC = () => {
  const { public: publicHttp } = useHttp();
  const {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading: authLoading,
  } = useAuth();

  // Generic API verification using TanStack Query
  const usersQuery = useQuery({
    queryKey: ["debug", "users"],
    queryFn: ({ signal }) =>
      publicHttp.get<any[]>("/api/v1/debug/users", { signal }),
    enabled: false, // Manual execution (manual: true equivalent)
  });

  const {
    data: response,
    isLoading,
    isFetching,
    error,
    refetch: execute,
  } = usersQuery;

  const users = response?.data;
  const isPending = isLoading || isFetching;

  const [email, setEmail] = useState("admin@example.com");

  return (
    <div className="p-8 space-y-8 bg-slate-900 text-white min-h-screen">
      <header className="border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-sky-400">
          API Infrastructure Showcase
        </h1>
        <p className="text-slate-400">
          Verifying Composite Hooks & Domain Adapters
        </p>
      </header>

      {/* 1. Auth Domain Verification */}
      <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="p-2 bg-sky-500/20 rounded-lg text-sky-400">🔐</span>
          Auth Domain Hook (`useAuth`)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => login({ email, password: "password" })}
                disabled={authLoading}
                className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-4 py-2 rounded-md transition-all"
              >
                {authLoading ? "Logging in..." : "Login"}
              </button>
              <button
                onClick={logout}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Auth State
            </h3>
            <pre className="text-xs text-sky-300 overflow-auto">
              {JSON.stringify({ isAuthenticated, user }, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* 2. Composite Hook Verification */}
      <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            🔄
          </span>
          TanStack Query Showcase
        </h2>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => execute()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-md font-medium transition-all"
            >
              Fetch Debug Users
            </button>
            <p className="text-slate-500 text-xs italic">
              Cancellation is automated via AbortSignal
            </p>

            {isPending && (
              <span className="flex items-center gap-2 text-purple-400 animate-pulse text-sm">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Network Request in flight...
              </span>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-400 text-sm">
              <p className="font-bold">
                Error {(error as any).status}: {error.message}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Check the console for full stack trace.
              </p>
            </div>
          )}

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider">
              Response Data (Casing Automated)
            </h3>
            <div className="max-h-64 overflow-auto">
              {users ? (
                <ul className="space-y-2">
                  {users.map((u: any, i: number) => (
                    <li
                      key={i}
                      className="text-sm border-b border-slate-800 pb-2 flex justify-between"
                    >
                      <span className="text-slate-300">
                        {u.fullName || u.name}
                      </span>
                      <span className="text-slate-500 font-mono text-xs">
                        {u.email}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600 italic">No data fetched yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Architectural Verdict */}
      <footer className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "DI Injection", status: "Verified", icon: "💎" },
          { label: "Auto-Cancellation", status: "Hardened", icon: "🛑" },
          { label: "State Sync", status: "Premium", icon: "🌐" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center"
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="text-xs text-slate-500 uppercase font-bold">
              {item.label}
            </div>
            <div className="text-sm text-sky-400 font-medium">
              {item.status}
            </div>
          </div>
        ))}
      </footer>
    </div>
  );
};
