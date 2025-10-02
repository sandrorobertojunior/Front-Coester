// src/context/AuthContext.tsx
"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL, setAuthToken } from "./api/api"; // Importa a função de token

// --- CONSTANTES ---
const LOGIN_ENDPOINT = `${BASE_URL}/auth/login`;
// Tipos e Interfaces (Atualizado para "colaborador" e "administrador")
export type TipoUsuario = "colaborador" | "administrador";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  basicAuthToken: string;
}

interface ContextoAutenticacao {
  usuario: Usuario | null;
  estaLogado: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  carregando: boolean;
}

const ContextoAutenticacao = createContext<ContextoAutenticacao | undefined>(
  undefined
);

export function ProvedorAutenticacao({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const logout = () => {
    setUsuario(null);
    setAuthToken(null);
    localStorage.removeItem("usuario-logado");
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    setCarregando(true);
    try {
      const response = await axios.post(LOGIN_ENDPOINT, {
        email,
        password: senha,
      });
      const data = response.data;

      // 1. EXTRAI DADOS ESSENCIAIS E ROLES
      const basicAuthToken = data.basicToken;
      const roles: string[] = data.roles || [];

      // 2. LÓGICA DE PERMISSÃO: SE TIVER ADMINISTRADOR, É ADMIN. CASO CONTRÁRIO, É COLABORADOR.
      const isAdministrador = roles.includes("ADMINISTRADOR");

      // ALTERAÇÃO AQUI: Usa 'colaborador' como tipo padrão.
      const tipoUsuario: TipoUsuario = isAdministrador
        ? "administrador"
        : "colaborador";

      const usuarioLogado: Usuario = {
        id: data.id || "N/A",
        nome: data.nome || "Usuário Logado",
        email: email,
        tipo: tipoUsuario,
        basicAuthToken: basicAuthToken,
      };

      setAuthToken(basicAuthToken);
      setUsuario(usuarioLogado);
      localStorage.setItem("usuario-logado", JSON.stringify(usuarioLogado));
      setCarregando(false);
      return true;
    } catch (error) {
      console.error(
        "Falha no login:",
        axios.isAxiosError(error) ? error.response?.status : error
      );
      setCarregando(false);
      return false;
    }
  };

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario-logado");
    if (usuarioSalvo) {
      try {
        const usuarioParsed: Usuario = JSON.parse(usuarioSalvo);
        setUsuario(usuarioParsed);
        setAuthToken(usuarioParsed.basicAuthToken);
      } catch (error) {
        console.error("Erro ao recuperar usuário:", error);
        logout();
      }
    }
    setCarregando(false);
  }, []);

  const valor: ContextoAutenticacao = {
    usuario,
    estaLogado: !!usuario,
    login,
    logout,
    carregando,
  };

  return (
    <ContextoAutenticacao.Provider value={valor}>
      {children}
    </ContextoAutenticacao.Provider>
  );
}

// Hook para usar o contexto de autenticação
export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (contexto === undefined) {
    throw new Error(
      "useAutenticacao deve ser usado dentro de um ProvedorAutenticacao"
    );
  }
  return contexto;
}
