"use client";

import React, { useState } from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface MonthlyNetSalaryChartProps {
  data: PayrollDashboardData["monthlyNetSalaryTrend"];
}

export default function MonthlyNetSalaryChart({ data }: MonthlyNetSalaryChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxNet = Math.max(...data.map((d) => d.netSalary), 1);
  const minNet = Math.min(...data.map((d) => d.netSalary), 0);
  const range = maxNet - minNet || 1;

  // Compute SVG Line Graph Coordinates
  const chartHeight = 120;
  const chartWidth = 320;
  const paddingX = 20;
  const stepX = data.length > 1 ? (chartWidth - paddingX * 2) / (data.length - 1) : 0;

  const points = data.map((item, idx) => {
    const x = paddingX + idx * stepX;
    const y = chartHeight - 15 - ((item.netSalary - minNet) / range) * (chartHeight - 35);
    return { x, y, item, idx };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : "";

  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Monthly Net Salary Trend
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Historical Payslips / Payruns
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/15 px-2 py-0.5 rounded-[4px] border border-[#2DD4BF]/30">
            Line Graph
          </span>
        </div>

        {/* SVG Line Graph */}
        {data.length === 0 ? (
          <div className="py-8 text-center text-[#A7B3C6] text-[13px]">
            No historical trend data available.
          </div>
        ) : (
          <div className="relative my-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32 overflow-visible"
            >
              <defs>
                <linearGradient id="salaryTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area Fill */}
              {areaD && <path d={areaD} fill="url(#salaryTrendGrad)" />}

              {/* Trend Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2DD4BF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points */}
              {points.map((p) => (
                <g key={p.idx} className="group cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredIdx === p.idx ? 5.5 : 4}
                    className="fill-[#2DD4BF] stroke-[#0B1220] stroke-2 transition-all hover:r-6"
                    onMouseEnter={() => setHoveredIdx(p.idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    className="fill-[#A7B3C6] text-[9.5px] font-medium"
                  >
                    {p.item.month.split(" ")[0]}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredIdx !== null && points[hoveredIdx] && (
              <div className="absolute top-0 right-2 bg-[#0F172A] border border-[#263449] px-2.5 py-1 rounded-[6px] text-[11px] shadow-md">
                <span className="text-[#A7B3C6] block">{points[hoveredIdx].item.month}</span>
                <span className="text-[#2DD4BF] font-bold">
                  ₹{points[hoveredIdx].item.netSalary.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Breakdown List */}
        <div className="space-y-2 mt-2 pt-2 border-t border-[#263449]/40">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[12px]">
              <span className="text-[#A7B3C6] font-medium">{item.month}</span>
              <span className="font-bold text-[#F8FAFC]">
                ₹{item.netSalary.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Periods: <strong className="text-[#F8FAFC]">{data.length} Months</strong></span>
        <span className="font-semibold text-[#2DD4BF]">
          Avg: ₹{Math.round((data.reduce((acc, d) => acc + d.netSalary, 0) / (data.length || 1))).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}
