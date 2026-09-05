import React from "react";
import { UserRecord } from "../../lib/api";

interface UserStatusBadgeProps {
  user: UserRecord;
}

export default function UserStatusBadge({ user }: UserStatusBadgeProps) {
  if (user.is_locked) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-1.5"></span>
        Locked
      </span>
    );
  }

  if (user.is_active) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mr-1.5"></span>
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-[#718096]/10 text-[#718096] border border-[#718096]/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#718096] mr-1.5"></span>
      Inactive
    </span>
  );
}
