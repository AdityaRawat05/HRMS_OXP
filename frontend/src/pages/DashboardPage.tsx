import React from 'react';
import { Users, DollarSign, FileCheck, Clock, ShieldAlert, Layers } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const placeholderMetrics = [
    { title: 'Total Active Employees', value: '--', icon: Users, desc: 'Awaiting Phase 4 HR module' },
    { title: 'Gross Payroll (Current Run)', value: '$0.00', icon: DollarSign, desc: 'Awaiting Phase 7 Payrun' },
    { title: 'Generated Payslips', value: '0', icon: FileCheck, desc: 'Awaiting Phase 8 Payslips' },
    { title: 'Pending Time Off Requests', value: '0', icon: Clock, desc: 'Awaiting Phase 5 Time Off' },
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Payroll & HR Operations Overview</h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            System status: Phase 1 Foundation Verified | Live Dashboard calculation pending Phase 9
          </p>
        </div>
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          <Layers className="w-4 h-4" />
          <span>Setup Mode: No DB Connection</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderMetrics.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{item.title}</span>
                <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                  <IconComp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-100">{item.value}</div>
              <p className="text-xs text-slate-500 font-mono">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Architecture Modules Readiness Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span>Implementation Phase Matrix</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          {[
            { phase: 'Phase 1', name: 'Foundation & Express Setup', status: 'COMPLETE', color: 'bg-emerald-950 text-emerald-400 border-emerald-800' },
            { phase: 'Phase 2', name: 'SQLite + Prisma DB Setup', status: 'PENDING NEXT STEP', color: 'bg-amber-950 text-amber-400 border-amber-800' },
            { phase: 'Phase 3', name: 'JWT & Role Auth', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 4', name: 'Employee & Contracts', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 5', name: 'Attendance & Time Off', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 6', name: 'Dynamic Salary Rules Engine', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 7', name: 'Payrun Processing', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 8', name: 'Payslip PDF & Email', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
            { phase: 'Phase 9', name: 'Live Dashboard Metrics', status: 'PENDING', color: 'bg-slate-800 text-slate-400 border-slate-700' },
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border flex items-center justify-between ${item.color}`}>
              <div>
                <span className="font-bold block">{item.phase}</span>
                <span className="text-slate-300">{item.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-current">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
