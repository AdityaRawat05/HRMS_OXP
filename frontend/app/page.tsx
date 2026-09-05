"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0B1220] flex items-center justify-center">
      <div className="flex items-center space-x-2.5 text-[#A7B3C6] text-[13px]">
        <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
        <span>Redirecting to login...</span>
      </div>
    </main>
  );
}
