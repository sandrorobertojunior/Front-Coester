// ARQUIVO: app/layout.tsx

import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvedorAutenticacao } from "@/contextos/contexto-autenticacao";

const inter = Inter({ subsets: ["latin"] });

// ... (metadata) ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ProvedorAutenticacao>{children}</ProvedorAutenticacao>
      </body>
    </html>
  );
}
