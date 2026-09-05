"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthError from "./AuthError";
import PasswordInput from "./PasswordInput";
import { requestSignupApi } from "../../lib/api";

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password requirement validation states
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid work email.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password does not meet all security requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestSignupApi({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      if (!res.success) {
        setError(res.error || "Failed to submit account request.");
      } else {
        setSuccess("Account request submitted successfully. Return to sign in.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthError message={error} type="error" />
      <AuthError message={success} type="success" />

      {/* Full Name Field */}
      <div>
        <label htmlFor="signup-name" className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Vikram Malhotra"
          autoComplete="name"
          required
          disabled={loading}
          className="w-full h-10 px-3.5 text-[13.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[8px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Work Email Field */}
      <div>
        <label htmlFor="signup-email" className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
          Work Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="employee@company.com"
          autoComplete="email"
          required
          disabled={loading}
          className="w-full h-10 px-3.5 text-[13.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[8px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Password Field */}
      <div>
        <label htmlFor="signup-password" className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
          Password
        </label>
        <PasswordInput
          id="signup-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading}
        />
      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="signup-confirm-password" className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
          Confirm Password
        </label>
        <PasswordInput
          id="signup-confirm-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading}
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-[11.5px] text-[#EF4444] mt-1">Passwords do not match.</p>
        )}
      </div>

      {/* Password Requirements Checklist */}
      <div className="p-3 rounded-[8px] bg-[#0F172A] border border-[#263449] text-[11.5px] space-y-1">
        <p className="text-[#A7B3C6] font-medium mb-1">Password must contain:</p>
        <div className="grid grid-cols-2 gap-1 text-[#718096]">
          <span className={hasMinLength ? "text-[#22C55E]" : ""}>
            {hasMinLength ? "✓" : "•"} At least 8 characters
          </span>
          <span className={hasUppercase ? "text-[#22C55E]" : ""}>
            {hasUppercase ? "✓" : "•"} Uppercase letter
          </span>
          <span className={hasLowercase ? "text-[#22C55E]" : ""}>
            {hasLowercase ? "✓" : "•"} Lowercase letter
          </span>
          <span className={hasNumber ? "text-[#22C55E]" : ""}>
            {hasNumber ? "✓" : "•"} Number
          </span>
          <span className={hasSpecialChar ? "text-[#22C55E]" : ""}>
            {hasSpecialChar ? "✓" : "•"} Special character
          </span>
        </div>
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
            <span>Submitting...</span>
          </span>
        ) : (
          "Request Account"
        )}
      </button>

      {/* Administrator Managed Notice */}
      <p className="text-[11px] text-[#718096] text-center leading-relaxed">
        Account access is subject to administrator approval.
      </p>

      {/* Account Navigation Link */}
      <div className="pt-4 mt-2 border-t border-[#263449]/70 text-center text-[12.5px] text-[#718096]">
        <span>Already have an account? </span>
        <Link href="/login" className="text-[#4F8CFF] hover:text-[#3B78E7] font-medium transition-colors">
          Sign in
        </Link>
      </div>
    </form>
  );
}
