"use client";

import type React from "react";

import { useState } from "react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { FormularioLogin } from "./formulario-login";
import { Sidebar } from "./sidebar";
import { DashboardUsuario } from "./dashboard-usuario";
import { DashboardAdministrador } from "./dashboard-administrador";
import { FormularioMedicaoPecas } from "./formulario-medicao-pecas";
import { GerenciamentoTiposPecas } from "./gerenciamento-tipos-pecas";
import { Loader2 } from "lucide-react";

interface LayoutPrincipalProps {
  children?: React.ReactNode;
}

export function LayoutPrincipal({ children }: LayoutPrincipalProps) {
  const { estaLogado, carregando, usuario } = useAutenticacao();
  const [paginaAtiva, setPaginaAtiva] = useState("dashboard");

  // Determina se é administrador
  const ehAdmin = usuario?.tipo === "administrador";

  // Mostra loading enquanto verifica autenticação
  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de login
  if (!estaLogado) {
    return <FormularioLogin />;
  }

  // Renderiza o conteúdo baseado na página ativa e tipo de usuário
  const renderizarConteudo = () => {
    switch (paginaAtiva) {
      case "dashboard":
        return ehAdmin ? <DashboardAdministrador /> : <DashboardUsuario />;
      case "nova-medicao":
        return (
          <FormularioMedicaoPecas
            onVoltar={() => setPaginaAtiva("dashboard")}
          />
        );
      case "medicoes":
        return ehAdmin ? <DashboardAdministrador /> : <DashboardUsuario />;
      case "tipos-pecas":
        return ehAdmin ? (
          <GerenciamentoTiposPecas />
        ) : (
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta funcionalidade.
            </p>
          </div>
        );
      default:
        return ehAdmin ? <DashboardAdministrador /> : <DashboardUsuario />;
    }
  };

  // Se estiver logado, mostra layout com sidebar
  return (
    <div className="flex h-screen bg-background">
      <Sidebar paginaAtiva={paginaAtiva} onMudarPagina={setPaginaAtiva} />
      <main className="flex-1 overflow-auto">
        {children || renderizarConteudo()}
      </main>
    </div>
  );
}
