import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voltwise — Hane Enerji Platformu",
  description: "Türkiye'ye özel hane enerji zekâsı · Enerjisa pilot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
