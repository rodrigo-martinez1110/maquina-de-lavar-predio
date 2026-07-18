import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lava e Seca",
  description: "Agenda compartilhada da lava e seca do predio",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
