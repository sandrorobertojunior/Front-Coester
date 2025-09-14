import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProvedorAutenticacao } from "@/contextos/contexto-autenticacao";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sistema de Medição de Peças",
  description:
    "Sistema profissional para medição e controle de qualidade de peças industriais",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ProvedorAutenticacao>
          {children} {/* Remove o LayoutPrincipal daqui */}
        </ProvedorAutenticacao>
      </body>
    </html>
  );
}
