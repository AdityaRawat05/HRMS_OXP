"use client";

import { useEffect, useState } from "react";

interface HealthStatus {
  status: string;
  database: string;
  rolesCount?: number;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health/database");
        const data = await res.json();
        if (res.ok) {
          setHealth(data);
        } else {
          setError(data.message || "Unable to reach database");
        }
      } catch (err: any) {
        setError(err.message || "Failed to query health endpoint");
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-slate-100">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl shadow-xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            P
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PeoplePay360</h1>
            <p className="text-xs text-slate-400 font-medium">HR & Payroll Operations Platform</p>
          </div>
        </div>

        <div className="border-t border-slate-700/70 pt-5 space-y-4">
          <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            System Status
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
            <span className="text-sm text-slate-300">Application</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Connected
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-700/40">
            <span className="text-sm text-slate-300">Database</span>
            {loading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Checking...
              </span>
            ) : health?.database === "peoplepay360" ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {error || "Disconnected"}
              </span>
            )}
          </div>

          {health?.rolesCount !== undefined && (
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 text-xs text-slate-400 flex justify-between">
              <span>Verified Seed Records:</span>
              <span className="font-semibold text-slate-200">{health.rolesCount} roles active</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-500 text-center mt-6">
          Phase 2 Verification Screen &bull; Next.js + Prisma + MySQL
        </p>
      </div>
    </main>
  );
}
