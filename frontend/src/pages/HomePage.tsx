import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Server, Database } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 p-8 sm:p-12">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <span>Phase 1 Initial Setup Completed</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Integrated HR & Payroll Operations Platform
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            PeoplePay360 handles end-to-end employee lifecycle, flexible contracts, schedule management, dynamic multi-rule salary processing, automated payruns, and digital payslips.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-lg shadow-cyan-600/30 transition"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition"
            >
              <span>Platform Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Core Flow Pipeline Visualization */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-200 flex items-center space-x-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Core Business Pipeline Architecture</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', name: 'Employee & Contract', desc: 'Working schedule & baseline wage' },
            { step: '02', name: 'Attendance & Time Off', desc: 'Hours worked & approved leave' },
            { step: '03', name: 'Salary Rules Engine', desc: 'Dynamic allowance & tax formulas' },
            { step: '04', name: 'Payrun & Payslips', desc: 'Historical snapshots & PDF / Email' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2"
            >
              <span className="text-xs font-mono text-cyan-400 font-bold">{item.step}</span>
              <h3 className="font-semibold text-slate-200">{item.name}</h3>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status Notice */}
      <div className="p-6 rounded-xl bg-slate-900/60 border border-amber-500/30 flex items-start space-x-4">
        <Database className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold text-amber-300">Phase 1 Database Status Notice</h4>
          <p className="text-slate-400">
            The project foundation is active with clean REST API routes and React layouts. Database tables, Prisma ORM, and SQLite setup are explicitly paused until Phase 2 is requested.
          </p>
        </div>
      </div>
    </div>
  );
};
