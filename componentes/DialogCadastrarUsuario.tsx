// src/components/admin/DialogCadastrarUsuario.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { useControleQualidadeApi } from "@/contextos/api/controlequalidade"; // Hook da API
import { useToast } from "@/components/ui/use-toast";

interface DialogCadastrarUsuarioProps {
  // Chamada após o sucesso para recarregar a lista de usuários no dashboard
  onSuccess: () => void;
}

export function DialogCadastrarUsuario({
  onSuccess,
}: DialogCadastrarUsuarioProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Definindo 'COLABORADOR' como padrão
  const [role, setRole] = useState("COLABORADOR");
  const [carregando, setCarregando] = useState(false);

  const { register } = useControleQualidadeApi();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !role) {
      toast({
        title: "Erro de Validação",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);
    try {
      console.log({
        username,
        email,
        password,
        role,
      });
      await register({
        username,
        email,
        password,
        role,
      });

      toast({
        title: "Sucesso!",
        description: `Usuário ${username} cadastrado como ${role} com sucesso.`,
      });
      setIsOpen(false);
      // Limpar campos
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("COLABORADOR");
      onSuccess(); // Recarrega os dados do Dashboard/Usuários
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      toast({
        title: "Erro no Cadastro",
        description:
          "Não foi possível cadastrar o usuário. Verifique as credenciais ou tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" /> Cadastrar Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleRegister} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Nome de Usuário</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ex: joao.silva"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: joao@empresa.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Função (Role)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLABORADOR">COLABORADOR</SelectItem>
                <SelectItem value="ADMINISTRADOR">ADMINISTRADOR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={carregando}>
              {carregando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Cadastrar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
