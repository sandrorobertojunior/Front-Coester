"use client";
import { useState, useCallback, useEffect } from "react";

// --- INTERFACES, CONSTANTES E DECODIFICAÇÃO ---
export interface BluetoothHook {
  status: string;
  valorMicrometro: string;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  deviceName: string | null;
  resetarValorMicrometro: () => void;
}

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
// HOOK CORRIGIDO E OTIMIZADO
// =========================================================================
export function useConnectarBluetooth(): BluetoothHook {
  const [status, setStatus] = useState("Clique para conectar");
  const [valorMicrometro, setValorMicrometro] = useState("0.000");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const resetarValorMicrometro = useCallback(() => {
    setValorMicrometro("0.000");
  }, []);

  const handleNotifications = useCallback((event: Event) => {
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
    setIsConnected(false);
    setIsConnecting(false); // Garante que o estado de conexão seja resetado
  }, [device]);

  // ✅ useEffect agora SÓ gerencia listeners
  useEffect(() => {
    // Se não há dispositivo ou característica, não há o que fazer.
    if (!device || !characteristic) {
      return;
    }

    // Adiciona os listeners
    device.addEventListener("gattserverdisconnected", onDisconnected);
    characteristic.addEventListener(
      "characteristicvaluechanged",
      handleNotifications
    );

    // Função de limpeza: remove os listeners para evitar memory leaks
    return () => {
      device.removeEventListener("gattserverdisconnected", onDisconnected);
      characteristic.removeEventListener(
        "characteristicvaluechanged",
        handleNotifications
      );
    };
  }, [device, characteristic, onDisconnected, handleNotifications]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setStatus("Web Bluetooth API não é suportada.");
      return;
    }

    // 👈 1. Inicia o processo de conexão
    setStatus("Procurando por dispositivo...");
    setIsConnecting(true);
    setIsConnected(false);

    try {
      const newDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [MITUTOYO_SERVICE_UUID],
      });

      setStatus(`Conectando a: ${newDevice.name || "Dispositivo"}...`);
      const server = await newDevice.gatt!.connect();
      const service = await server.getPrimaryService(MITUTOYO_SERVICE_UUID);
      const newCharacteristic = await service.getCharacteristic(
        MITUTOYO_CHARACTERISTIC_UUID
      );

      // Inicia as notificações DENTRO da função connect
      await newCharacteristic.startNotifications();

      // ✅ 2. Processo concluído com sucesso!
      // Agora definimos o estado final da conexão.
      setDevice(newDevice);
      setCharacteristic(newCharacteristic);
      setIsConnected(true);
      setStatus(`PRONTO! Conectado a: ${newDevice.name}.`);
    } catch (error: any) {
      if (error.name === "NotFoundError") {
        setStatus("Seleção cancelada ou nenhum dispositivo encontrado.");
      } else {
        setStatus(`Erro de Conexão: ${error.message}`);
      }
      console.error("Erro completo de conexão Bluetooth:", error);
      // Limpa tudo em caso de erro
      setDevice(null);
      setCharacteristic(null);
      setIsConnected(false);
    } finally {
      // 👈 3. Independentemente de sucesso ou falha, o processo "conectando" acabou.
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      // O listener 'onDisconnected' vai limpar o resto do estado.
    } else {
      // Força a limpeza caso não haja uma conexão ativa para desconectar
      onDisconnected();
    }
  }, [device, onDisconnected]);

  return {
    status,
    valorMicrometro,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    deviceName: device?.name ?? null,
    resetarValorMicrometro,
  };
}
