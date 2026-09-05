"use client";

import React, { useState, useEffect } from "react";
import RoleSelector from "./RoleSelector";
import PasswordInput from "../auth/PasswordInput";
import { UserRecord, RoleOption, EmployeeOption, createUserApi, updateUserApi } from "../../lib/api";

interface UserFormProps {
  selectedUser: UserRecord | null;
  roles: RoleOption[];
  employees: EmployeeOption[];
  onSaved: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function UserForm({
  selectedUser,
  roles,
  employees,
  onSaved,
  onCancel,
  disabled = false,
}: UserFormProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([5]); // Default Employee (id: 5)
  const [isActive, setIsActive] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccess(null);
    if (selectedUser) {
      setEmail(selectedUser.email || "");
      setFirstName(selectedUser.first_name || "");
      setLastName(selectedUser.last_name || "");
      setEmployeeId(selectedUser.employee ? String(selectedUser.employee.id) : "");
      setSelectedRoleIds(
        selectedUser.roles && selectedUser.roles.length > 0
          ? selectedUser.roles.map((r) => r.id)
          : [5]
      );
      setIsActive(selectedUser.is_active);
      setPassword("");
    } else {
      // New user default form
      setEmail("");
      setFirstName("");
      setLastName("");
      setEmployeeId("");
      setSelectedRoleIds([5]);
      setIsActive(true);
      setPassword("");
    }
  }, [selectedUser]);

  const handleEmployeeChange = (eId: string) => {
    setEmployeeId(eId);
    if (!eId) return;

    const emp = employees.find((e) => String(e.id) === eId);
    if (emp) {
      if (emp.work_email && (!email || !selectedUser)) {
        setEmail(emp.work_email);
      }
      if (emp.first_name && (!firstName || !selectedUser)) {
        setFirstName(emp.first_name);
      }
      if (emp.last_name && (!lastName || !selectedUser)) {
        setLastName(emp.last_name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid work email.");
      return;
    }

    setSaving(true);
    try {
      if (selectedUser) {
        // Edit existing user
        const res = await updateUserApi(selectedUser.id, {
          email: trimmedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          employee_id: employeeId ? Number(employeeId) : null,
          role_ids: selectedRoleIds,
          is_active: isActive,
          ...(password.trim() ? { password: password.trim() } : {}),
        });

        if (!res.success) {
          setError(res.error || "Failed to update user.");
        } else {
          setSuccess("User access saved successfully.");
          onSaved();
        }
      } else {
        // Create new user
        const res = await createUserApi({
          email: trimmedEmail,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          employee_id: employeeId ? Number(employeeId) : null,
          role_ids: selectedRoleIds,
          is_active: isActive,
          ...(password.trim() ? { password: password.trim() } : {}),
        });

        if (!res.success) {
          setError(res.error || "Failed to create user.");
        } else {
          setSuccess("User created successfully.");
          onSaved();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#172033] border border-[#263449] rounded-[12px] p-4 sm:p-5 flex flex-col h-full shadow-sm">
      {/* Top Indicator / Mode */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-wider text-[#4F8CFF] uppercase bg-[#4F8CFF]/10 px-2 py-0.5 rounded-[4px] border border-[#4F8CFF]/20">
          {selectedUser ? "Edit User" : "Create User"}
        </span>
        {selectedUser && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[11px] text-[#A7B3C6] hover:text-[#F8FAFC] transition-colors"
          >
            Clear / New
          </button>
        )}
      </div>

      <h3 className="text-[15px] font-bold text-[#F8FAFC] mb-3">
        {selectedUser ? "Edit User Access" : "Create New User"}
      </h3>

      {error && (
        <div className="mb-3 p-2.5 rounded-[6px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[11px] leading-relaxed">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-3 p-2.5 rounded-[6px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[11px] leading-relaxed">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 flex-1 flex flex-col">
        {/* Employee Dropdown - ONLY shown in Edit Mode */}
        {selectedUser && (
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Linked Employee</label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={disabled}
                className="w-full h-8.5 px-2.5 pr-7 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">No linked employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#64748B]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Work Email */}
        <div>
          <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Work Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employee@company.com"
            disabled={disabled}
            className="w-full h-8.5 px-2.5 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              disabled={disabled}
              className="w-full h-8.5 px-2.5 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              disabled={disabled}
              className="w-full h-8.5 px-2.5 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">
            {selectedUser ? "Password (leave blank to keep)" : "Password"}
          </label>
          <PasswordInput
            id="form-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={selectedUser ? "••••••••••" : "Default: Welcome@123"}
            required={!selectedUser}
            disabled={disabled}
          />
        </div>

        {/* Roles Vertical List via RoleSelector */}
        <div>
          <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1.5">Roles *</label>
          <RoleSelector
            roles={roles}
            selectedRoleIds={selectedRoleIds}
            onChange={setSelectedRoleIds}
            disabled={disabled}
          />
        </div>

        {/* Account Status */}
        <div>
          <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Account Status</label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              disabled={disabled}
              className={`h-7 px-3 rounded-[5px] text-[11px] font-medium border flex items-center space-x-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive
                  ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
                  : "bg-[#718096]/10 border-[#718096]/30 text-[#718096]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#22C55E]" : "bg-[#718096]"}`}
              ></span>
              <span>{isActive ? "Active" : "Inactive"}</span>
            </button>
            <span className="text-[10px] text-[#718096]">Click to toggle</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-3 mt-auto">
          <button
            type="submit"
            disabled={saving || disabled}
            className="w-full h-9 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold tracking-wide transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving
              ? "Saving..."
              : selectedUser
              ? "Save Changes"
              : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}

