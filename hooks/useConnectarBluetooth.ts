"use client";
import { useState, useCallback, useEffect } from "react";

// --- INTERFACES, CONSTANTES E DECODIFICAÇÃO ---
interface BluetoothHook {
  status: string;
  valorMicrometro: string;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  deviceName: string | null;
  resetarValorMicrometro: () => void;
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
export function useConnectarBluetooth(): BluetoothHook {
  const [status, setStatus] = useState("Clique para conectar");
  const [valorMicrometro, setValorMicrometro] = useState("0.000");
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [characteristic, setCharacteristic] =
    useState<BluetoothRemoteGATTCharacteristic | null>(null);

  const resetarValorMicrometro = useCallback(() => {
    setValorMicrometro("0.000");
  }, []);

  const handleNotifications = useCallback((event: Event) => {
    console.log(">>> [handleNotifications] Evento recebido!");
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    if (!target.value) return;

    // A decodificação ainda é específica do Mitutoyo.
    // Se conectar a outro dispositivo, essa função pode não funcionar corretamente.
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
    setStatus("Procurando por dispositivo...");
    try {
      // [MUDANÇA PRINCIPAL] Removido o filtro para aceitar todos os dispositivos
      const newDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true, // <-- Permite que qualquer dispositivo seja visto
        optionalServices: [MITUTOYO_SERVICE_UUID], // <-- Tenta acessar este serviço se ele existir
      });

      setDevice(newDevice);
      setStatus(`Conectando a: ${newDevice.name || "Dispositivo"}...`);

      const server = await newDevice.gatt!.connect();

      // O código abaixo ainda tentará se conectar ao serviço e característica do Mitutoyo.
      // Se o dispositivo escolhido não os tiver, a conexão falhará aqui.
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
  };
}
