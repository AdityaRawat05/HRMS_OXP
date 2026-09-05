import React from "react";
import AuthCard from "../../components/auth/AuthCard";
import AuthHeader from "../../components/auth/AuthHeader";
import SignupForm from "../../components/auth/SignupForm";

export const metadata = {
  title: "Create Account - PeoplePay360",
  description: "Request account access to PeoplePay360",
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] flex items-center justify-center p-4 sm:p-6">
      <AuthCard>
        <AuthHeader
          title="Create your account"
          subtitle="Request access to PeoplePay360"
        />
        <SignupForm />
      </AuthCard>
    </main>
  );
}
