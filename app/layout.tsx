import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PeoplePay360 - System Status",
  description: "PeoplePay360 HR & Payroll Operations Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
