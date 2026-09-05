"use client";

import React from "react";
import { UserRecord } from "../../lib/api";
import UserStatusBadge from "./UserStatusBadge";

interface UserTableProps {
  users: UserRecord[];
  selectedUserId: number | null;
  onSelectUser: (user: UserRecord) => void;
  loading: boolean;
  disabled?: boolean;
}

export default function UserTable({
  users,
  selectedUserId,
  onSelectUser,
  loading,
  disabled = false,
}: UserTableProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto rounded-[8px] border border-[#263449] bg-[#0F172A]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#263449] bg-[#172033]">
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
                User
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
                Employee
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
                Work Email
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider">
                Role
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider text-center">
                Status
              </th>
              <th className="py-2.5 px-3 text-[10px] font-semibold text-[#718096] uppercase tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263449]">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[12px] text-[#A7B3C6]">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></span>
                    <span>Loading live user records...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[12px] text-[#718096]">
                  No matching user accounts found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isSelected = selectedUserId === u.id;
                const employeeName = u.employee?.name || "—";
                const roleDisplay =
                  u.roles && u.roles.length > 0
                    ? u.roles.map((r) => r.display_name || r.name).join(", ")
                    : u.primary_role || "Employee";

                return (
                  <tr
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#4F8CFF]/10 border-l-2 border-l-[#4F8CFF]"
                        : "hover:bg-[#172033]/60"
                    }`}
                  >
                    <td className="py-2.5 px-3 text-[11.5px] font-medium text-[#F8FAFC]">
                      {u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#A7B3C6]">
                      {employeeName}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-[#A7B3C6]">
                      {u.email}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-[#A7B3C6]">
                      <span className="inline-block max-w-[140px] truncate" title={roleDisplay}>
                        {roleDisplay}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <UserStatusBadge user={u} />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(u);
                        }}
                        disabled={disabled}
                        className="px-2.5 py-0.5 rounded-[5px] border border-[#4F8CFF]/40 text-[#4F8CFF] hover:bg-[#4F8CFF]/15 text-[10.5px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="mt-2.5 px-1 text-[11px] text-[#718096]">
        Select a user to edit access, or create a new user.
      </div>
    </div>
  );
}
