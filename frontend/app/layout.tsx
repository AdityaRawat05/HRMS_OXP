import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeoplePay360 - HR & Payroll Operations Platform",
  description: "Enterprise HR & Payroll Authentication Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0B1220] min-h-screen text-[#F8FAFC] antialiased">
        {children}
      </body>
    </html>
  );
}
