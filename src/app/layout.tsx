
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rifa Solidária",
  description: "Sistema de rifa solidária",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
