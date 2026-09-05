import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import LoginForm from "../../components/auth/LoginForm";

export const metadata = {
  title: "Sign In - PeoplePay360",
  description: "Sign in to your PeoplePay360 workspace",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4 sm:p-6">
      <AuthCard>
        <AuthHeader
          title="Welcome back"
          subtitle="Sign in to continue to your workspace."
        />
        <LoginForm />
      </AuthCard>
    </main>
  );
}
