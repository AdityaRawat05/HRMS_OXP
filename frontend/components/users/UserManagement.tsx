"use client";

import React, { useState, useEffect, useCallback } from "react";
import UserToolbar from "./UserToolbar";
import UserTable from "./UserTable";
import UserForm from "./UserForm";
import { UserRecord, RoleOption, EmployeeOption, getUsersApi, getRolesApi, getEmployeesApi, AuthSessionData } from "../../lib/api";

interface UserManagementProps {
  authState: AuthSessionData | null;
}

export default function UserManagement({ authState }: UserManagementProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Load roles & employees metadata from backend APIs
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [rolesRes, empRes] = await Promise.all([
          getRolesApi(),
          getEmployeesApi(),
        ]);

        if (rolesRes.success && rolesRes.data?.roles) {
          setRoles(rolesRes.data.roles);
        }

        if (empRes.success && empRes.data?.employees) {
          setEmployees(empRes.data.employees);
        }
      } catch (err) {
        console.error("Error loading metadata:", err);
      }
    }
    loadMetadata();
  }, []);

  // Fetch users from backend API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setPermissionError(null);
    try {
      const res = await getUsersApi(searchQuery, selectedRole);

      if (!res.success) {
        if (res.error?.includes("permission") || res.error?.includes("403")) {
          setPermissionError("You do not have permission to manage users.");
        } else {
          setPermissionError(res.error || "Unable to fetch users.");
        }
        setUsers([]);
        return;
      }

      if (res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const isAdmin = authState?.authenticated ? authState.isAdmin : false;

  return (
    <div className="w-full bg-[#111827] border border-[#263449] rounded-[20px] overflow-hidden flex flex-col shadow-lg">
      {/* Top Header Strip */}
      <div className="bg-[#172033] px-6 py-4 border-b border-[#263449] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-[18px] font-bold text-[#F8FAFC] tracking-tight">User Management</h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-[11px] font-semibold text-[#4F8CFF] bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 tracking-wide uppercase">
            ADMIN ONLY
          </span>
        </div>
        <div className="text-[12px] text-[#A7B3C6] font-medium">
          {users.length} {users.length === 1 ? "User" : "Users"}
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {permissionError && (
          <div className="mb-4 p-3 rounded-[6px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[12px] flex items-center space-x-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{permissionError}</span>
          </div>
        )}

        {/* Toolbar */}
        <UserToolbar
          onNewUser={() => setSelectedUser(null)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          roles={roles}
          disabled={!isAdmin && authState?.authenticated === true}
        />

        {/* Two-Column Internal Layout: Left = Table, Right = Create/Edit Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* User Table (~65% on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-full">
            <UserTable
              users={users}
              selectedUserId={selectedUser?.id || null}
              onSelectUser={(u) => setSelectedUser(u)}
              loading={loading}
              disabled={!isAdmin && authState?.authenticated === true}
            />
          </div>

          {/* Create / Edit Form (~35% on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full">
            <UserForm
              selectedUser={selectedUser}
              roles={roles}
              employees={employees}
              onSaved={() => {
                fetchUsers();
                setSelectedUser(null);
              }}
              onCancel={() => setSelectedUser(null)}
              disabled={!isAdmin && authState?.authenticated === true}
            />
          </div>
        </div>

        {/* Bottom Information Note */}
        <div className="mt-6 pt-4 border-t border-[#263449]/80 text-[11px] text-[#718096] leading-relaxed">
          User accounts are separate from employee records, but should be linked to an employee for access and ownership.
        </div>
      </div>
    </div>
  );
}
