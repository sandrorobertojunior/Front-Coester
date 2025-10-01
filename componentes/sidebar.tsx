"use client";

import type React from "react";

import { useState, useCallback, useEffect } from "react"; // ⬅️ Adicionado para o Hook
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
  Bluetooth, // ⬅️ Ícone
  Plug, // ⬅️ Ícone
  Unplug, // ⬅️ Ícone
  Loader, // ⬅️ Ícone
} from "lucide-react";
import { cn } from "@/lib/utils";
// import { useIsMobile } from "@/components/ui/use-mobile"; // Removido por não estar em uso

// =========================================================================
// HOOK: useConnectarBluetooth (Copiado da sua implementação)
// =========================================================================

// --- INTERFACES, CONSTANTES E DECODIFICAÇÃO ---
interface BluetoothHook {
  status: string;
  valorMicrometro: string;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  deviceName: string | null;
  resetarValorMicrometro: () => void;
  isConnecting: boolean; // ⬅️ Adicionado para o botão de loading
}

// UUIDs específicos para o micrômetro, mantidos para o caso de o dispositivo ser um
const MITUTOYO_SERVICE_UUID = "7eafd361-f150-4785-b307-47d34ed52c3c";
const MITUTOYO_CHARACTERISTIC_UUID = "7eafd361-f151-4785-b307-47d34ed52c3c";
const CASAS_DECIMAIS = 3;

function decodeMitutoyoUwave(dataView: DataView): number | null {
  const bytes = new Uint8Array(dataView.buffer);
  if (bytes.length !== 7) return null;
  const tempBuffer = new ArrayBuffer(4);
  const tempView = new DataView(tempBuffer);
  tempView.setUint8(0, bytes[3]);
  tempView.setUint8(1, bytes[4]);
  tempView.setUint8(2, bytes[5]);
  if (bytes[5] >= 128) {
    tempView.setUint8(3, 0xff);
  } else {
    tempView.setUint8(3, 0x00);
  }
  const valorBruto = tempView.getInt32(0, true);
  return valorBruto / Math.pow(10, CASAS_DECIMAIS);
}

// =========================================================================
// HOOK MODIFICADO PARA ACEITAR TODOS OS DISPOSITIVOS
// =========================================================================
function useConnectarBluetooth(): BluetoothHook {
  const [status, setStatus] = useState("Clique para conectar");
  const [valorMicrometro, setValorMicrometro] = useState("0.000");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnecting, setIsConnecting] = useState(false); // ⬅️ NOVO ESTADO

  const resetarValorMicrometro = useCallback(() => {
    setValorMicrometro("0.000");
  }, []);

  const handleNotifications = useCallback((event: Event) => {
    console.log(">>> [handleNotifications] Evento recebido!");
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;

    const valorFinal = decodeMitutoyoUwave(target.value);

    if (valorFinal !== null) {
      const formattedValue = valorFinal.toFixed(CASAS_DECIMAIS);
      setValorMicrometro(formattedValue);
    }
  }, []);

  const onDisconnected = useCallback(() => {
    setStatus(`Dispositivo "${device?.name || "Desconhecido"}" desconectado.`);
    setValorMicrometro("0.000");
    setDevice(null);
    setCharacteristic(null);
  }, [device]);

  useEffect(() => {
    if (device) {
      device.addEventListener("gattserverdisconnected", onDisconnected);
    }
    if (characteristic) {
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleNotifications
      );
      characteristic
        .startNotifications()
        .then(() => {
          setStatus(`PRONTO! Conectado a: ${device?.name}.`);
          console.log("Notificações iniciadas com sucesso.");
        })
        .catch((error) => {
          setStatus(`Erro ao iniciar notificações: ${error.message}`);
        });
    }
    return () => {
      if (device) {
        device.removeEventListener("gattserverdisconnected", onDisconnected);
      }
      if (characteristic) {
        characteristic.removeEventListener(
          "characteristicvaluechanged",
          handleNotifications
        );
      }
    };
  }, [device, characteristic, onDisconnected, handleNotifications]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth API não é suportada.");
      return;
    }
    setIsConnecting(true); // INÍCIO DA CONEXÃO
    setStatus("Procurando por dispositivo...");
    try {
      const newDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [MITUTOYO_SERVICE_UUID],
      });

      setDevice(newDevice);
      setStatus(`Conectando a: ${newDevice.name || "Dispositivo"}...`);

      const server = await newDevice.gatt!.connect();

      const service = await server.getPrimaryService(MITUTOYO_SERVICE_UUID);
      const newCharacteristic = await service.getCharacteristic(
        MITUTOYO_CHARACTERISTIC_UUID
      );
      setCharacteristic(newCharacteristic);
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        setStatus("Seleção cancelada ou nenhum dispositivo encontrado.");
      } else {
        setStatus(`Erro de Conexão: ${error.message}`);
      }
      console.error("Erro completo de conexão Bluetooth:", error);
      setDevice(null);
    } finally {
      setIsConnecting(false); // FIM DA CONEXÃO (sucesso ou falha)
    }
  }, []);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
  }, [device]);

  return {
    status,
    valorMicrometro,
    isConnected: !!device?.gatt?.connected,
    connect,
    disconnect,
    deviceName: device?.name ?? null,
    resetarValorMicrometro,
    isConnecting, // ⬅️ RETORNADO O NOVO ESTADO
  };
}

// =========================================================================
// NOVO COMPONENTE: BluetoothStatus (Integração Visual)
// =========================================================================
function BluetoothStatus() {
  // ⬅️ Usa o hook localmente
  const { connect, disconnect, isConnected, status, deviceName, isConnecting } =
    useConnectarBluetooth();

  const statusColor = isConnected ? "text-green-500" : "text-red-500";
  const statusBg = isConnected ? "bg-green-100/50" : "bg-red-100/50";
  const statusTextColor = isConnected ? "text-green-800" : "text-red-800";

  return (
    <div className="p-4 border-b border-sidebar-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bluetooth className={cn("h-5 w-5", statusColor)} />
          <span className="font-semibold text-sm text-sidebar-foreground">
            Bluetooth
          </span>
        </div>
        <div
          className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            statusBg,
            statusTextColor
          )}
        >
          {isConnected ? "CONECTADO" : "OFFLINE"}
        </div>
      </div>

      <p className="text-xs text-sidebar-foreground/70 mb-2 min-h-[1.5rem]">
        {isConnecting ? "Buscando dispositivo..." : status}
        {deviceName && isConnected && (
          <span className="font-medium block truncate mt-0.5 text-sidebar-foreground">
            Dispositivo: {deviceName}
          </span>
        )}
      </p>

      {/* Botão de Ação: Conectar ou Desconectar */}
      <Button
        variant={isConnected ? "destructive" : "default"}
        size="sm"
        onClick={isConnected ? disconnect : connect}
        disabled={isConnecting}
        className="w-full justify-start gap-2"
      >
        {isConnecting ? (
          <Loader className="h-4 w-4 mr-2 animate-spin" />
        ) : isConnected ? (
          <Unplug className="h-4 w-4" />
        ) : (
          <Plug className="h-4 w-4" />
        )}
        {isConnecting
          ? "Conectando..."
          : isConnected
          ? "Desconectar"
          : "Conectar Micrômetro"}
      </Button>
    </div>
  );
}

// =========================================================================
// COMPONENTE PRINCIPAL: Sidebar
// =========================================================================

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

      {/* ⬅️ NOVO COMPONENTE DE STATUS BLUETOOTH */}
      <BluetoothStatus />

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
