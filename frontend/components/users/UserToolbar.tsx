"use client";

import React from "react";
import { RoleOption } from "../../lib/api";

interface UserToolbarProps {
  onNewUser: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRole: string;
  onRoleChange: (r: string) => void;
  roles: RoleOption[];
  disabled?: boolean;
}

export default function UserToolbar({
  onNewUser,
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  roles,
  disabled = false,
}: UserToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
      {/* + New User Button */}
      <button
        type="button"
        onClick={onNewUser}
        disabled={disabled}
        className="h-8.5 px-3.5 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12px] font-medium tracking-wide transition-colors flex items-center justify-center space-x-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <span>+</span>
        <span>New User</span>
      </button>

      {/* Search Input - Wider */}
      <div className="relative flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search users, employees or email..."
          className="w-full h-8.5 pl-8 pr-3 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors"
        />
        <svg
          className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#64748B]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Role Filter Dropdown */}
      <div className="relative shrink-0">
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-8.5 px-3 pr-7 text-[12px] text-[#A7B3C6] bg-[#172033] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] cursor-pointer appearance-none"
        >
          <option value="all">Role Filter (All)</option>
          {roles.map((r) => (
            <option key={r.id} value={r.name}>
              {r.display_name || r.name}
            </option>
          ))}
        </select>
        <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#A7B3C6]">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
