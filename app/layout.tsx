import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "InvoiceSync - Accounting & Invoice Automation",
  description: "Platform tracking invoice & otomatisasi akuntansi untuk UMKM dan SME di Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
