"use client";

import React from "react";
import { RoleOption } from "../../lib/api";

interface RoleSelectorProps {
  roles: RoleOption[];
  selectedRoleIds: number[];
  onChange: (roleIds: number[]) => void;
  disabled?: boolean;
}

export default function RoleSelector({
  roles,
  selectedRoleIds,
  onChange,
  disabled = false,
}: RoleSelectorProps) {
  const handleToggle = (roleId: number) => {
    if (disabled) return;
    if (selectedRoleIds.includes(roleId)) {
      if (selectedRoleIds.length > 1) {
        onChange(selectedRoleIds.filter((id) => id !== roleId));
      }
    } else {
      onChange([...selectedRoleIds, roleId]);
    }
  };

  return (
    <div className="space-y-1.5 p-2 bg-[#0F172A] rounded-[8px] border border-[#263449]">
      {roles.map((r) => {
        const isSelected = selectedRoleIds.includes(r.id);
        return (
          <label
            key={r.id}
            onClick={() => handleToggle(r.id)}
            className={`flex items-center space-x-2.5 py-1 px-1.5 rounded-[4px] cursor-pointer select-none transition-colors ${
              disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#172033]"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                isSelected
                  ? "border-[#4F8CFF] bg-[#4F8CFF]"
                  : "border-[#64748B] bg-transparent"
              }`}
            >
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
            </span>
            <div className="flex flex-col">
              <span className="text-[11.5px] text-[#F8FAFC] font-medium leading-tight">
                {r.display_name || r.name}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
