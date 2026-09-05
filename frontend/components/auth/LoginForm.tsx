"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthError from "./AuthError";
import PasswordInput from "./PasswordInput";
import { loginApi, getCurrentUserApi } from "../../lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid work email.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginApi(trimmedEmail, password);

      if (!res.success) {
        setError(res.error || "Invalid email or password.");
      } else {
        // Fetch full profile and session context
        await getCurrentUserApi();
        // Redirect to authenticated workspace route
        router.push("/users");
      }
    } catch (err: any) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthError message={error} type="error" />

      {/* Work Email Field */}
      <div>
        <label htmlFor="login-email" className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
          Work Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@company.com"
          autoComplete="email"
          required
          disabled={loading}
          className="w-full h-10 px-3.5 text-[13.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[8px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Password Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="text-[12.5px] font-medium text-[#A7B3C6]">
            Password
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert("Password reset requests must be submitted to your system administrator.");
            }}
            className="text-[12px] text-[#4F8CFF] hover:text-[#3B78E7] transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <PasswordInput
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 mt-2 rounded-[8px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[13.5px] font-semibold tracking-wide transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <span className="flex items-center space-x-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Signing in...</span>
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      {/* Account Navigation Link */}
      <div className="pt-4 mt-2 border-t border-[#263449]/70 text-center text-[12.5px] text-[#718096]">
        <span>Don&apos;t have an account? </span>
        <Link href="/signup" className="text-[#4F8CFF] hover:text-[#3B78E7] font-medium transition-colors">
          Sign up
        </Link>
      </div>
    </form>
  );
}
