// src/components/Sidebar.tsx
"use client";

import type React from "react";

import { useState } from "react";
import { useAutenticacao } from "@/contextos/contexto-autenticacao";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Ruler,
  Plus,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { useIsMobile } from "@/components/ui/use-mobile"; // Removido por não estar em uso

interface ItemMenuProps {
  icone: React.ReactNode;
  titulo: string;
  ativo?: boolean;
  onClick?: () => void;
}

function ItemMenu({ icone, titulo, ativo = false, onClick }: ItemMenuProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
        ativo
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      {icone}
      <span className="font-medium">{titulo}</span>
    </button>
  );
}

interface SidebarProps {
  paginaAtiva?: string;
  onMudarPagina?: (pagina: string) => void;
}

export function Sidebar({
  paginaAtiva = "dashboard",
  onMudarPagina,
}: SidebarProps) {
  const { usuario, logout } = useAutenticacao();
  const [menuAberto, setMenuAberto] = useState(false);

  // Determina se é administrador
  const ehAdmin = usuario?.tipo === "administrador";

  // Itens do menu baseados no tipo de usuário
  const itensMenu = [
    {
      id: "dashboard",
      titulo: "Dashboard",
      icone: <BarChart3 className="h-5 w-5" />,
      visivel: true,
    },
    {
      id: "nova-medicao",
      titulo: "Cadastrar Medição",
      icone: <Plus className="h-5 w-5" />,
      visivel: true,
    },
    {
      id: "medicoes",
      titulo: "Medições",
      icone: <Ruler className="h-5 w-5" />,
      // Mantido como false para seguir a estrutura original, mas pode ser mudado para 'true' se for necessário
      visivel: false,
    },
    {
      id: "tipos-pecas",
      titulo: "Lotes",
      icone: <Settings className="h-5 w-5" />,
      visivel: ehAdmin,
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const handleItemClick = (itemId: string) => {
    onMudarPagina?.(itemId);
    setMenuAberto(false); // Fecha menu mobile após seleção
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Header da sidebar */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sidebar-primary rounded-lg">
            <Ruler className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">
              Sistema de Medição
            </h1>
            <p className="text-xs text-sidebar-foreground/70"></p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {itensMenu
            .filter((item) => item.visivel)
            .map((item) => (
              <ItemMenu
                key={item.id}
                icone={item.icone}
                titulo={item.titulo}
                ativo={paginaAtiva === item.id}
                onClick={() => handleItemClick(item.id)}
              />
            ))}
        </div>
      </nav>

      {/* Informações do usuário */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
              {usuario?.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-sidebar-foreground truncate">
              {usuario?.nome}
            </p>
            <div className="flex items-center gap-1">
              {ehAdmin ? (
                <Shield className="h-3 w-3 text-sidebar-primary" />
              ) : (
                <User className="h-3 w-3 text-sidebar-foreground/70" />
              )}
              {/* ALTERAÇÃO: Trocando "Usuário" por "Colaborador" */}
              <p className="text-xs text-sidebar-foreground/70">
                {ehAdmin ? "Administrador" : "Colaborador"}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 bg-transparent"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botão mobile para abrir menu */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMenuAberto(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar desktop */}
      <div className="hidden md:block w-64 h-full">{sidebarContent}</div>

      {/* Overlay mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuAberto(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64">
            {sidebarContent}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setMenuAberto(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
