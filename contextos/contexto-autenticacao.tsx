"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

// Tipos de usuário do sistema
export type TipoUsuario = "usuario" | "administrador"

// Interface do usuário autenticado
export interface Usuario {
  id: string
  nome: string
  email: string
  tipo: TipoUsuario
}

// Interface do contexto de autenticação
interface ContextoAutenticacao {
  usuario: Usuario | null
  estaLogado: boolean
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  carregando: boolean
}

// Criação do contexto
const ContextoAutenticacao = createContext<ContextoAutenticacao | undefined>(undefined)

// Usuários fixos para demonstração (normalmente viriam do backend)
const usuariosFixos: Usuario[] = [
  {
    id: "1",
    nome: "João Silva",
    email: "usuario@empresa.com",
    tipo: "usuario",
  },
  {
    id: "2",
    nome: "Maria Santos",
    email: "admin@empresa.com",
    tipo: "administrador",
  },
]

// Credenciais fixas para demonstração
const credenciaisFixas = [
  { email: "usuario@empresa.com", senha: "123456" },
  { email: "admin@empresa.com", senha: "admin123" },
]

// Provider do contexto de autenticação
export function ProvedorAutenticacao({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  // Verifica se há usuário logado no localStorage ao inicializar
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuario-logado")
    if (usuarioSalvo) {
      try {
        const usuarioParsed = JSON.parse(usuarioSalvo)
        setUsuario(usuarioParsed)
      } catch (error) {
        console.error("Erro ao recuperar usuário do localStorage:", error)
        localStorage.removeItem("usuario-logado")
      }
    }
    setCarregando(false)
  }, [])

  // Função de login com validação das credenciais fixas
  const login = async (email: string, senha: string): Promise<boolean> => {
    setCarregando(true)

    // Simula delay de requisição
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verifica credenciais
    const credencialValida = credenciaisFixas.find((cred) => cred.email === email && cred.senha === senha)

    if (credencialValida) {
      const usuarioEncontrado = usuariosFixos.find((u) => u.email === email)
      if (usuarioEncontrado) {
        setUsuario(usuarioEncontrado)
        localStorage.setItem("usuario-logado", JSON.stringify(usuarioEncontrado))
        setCarregando(false)
        return true
      }
    }

    setCarregando(false)
    return false
  }

  // Função de logout
  const logout = () => {
    setUsuario(null)
    localStorage.removeItem("usuario-logado")
  }

  const valor = {
    usuario,
    estaLogado: !!usuario,
    login,
    logout,
    carregando,
  }

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>
}

// Hook para usar o contexto de autenticação
export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao)
  if (contexto === undefined) {
    throw new Error("useAutenticacao deve ser usado dentro de um ProvedorAutenticacao")
  }
  return contexto
}
