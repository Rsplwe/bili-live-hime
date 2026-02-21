import { OBSWebSocket } from "obs-websocket-js";
import type { Stream } from "@/types/config";

export interface OBSConfig {
  address: string;
  password?: string;
}

let obs: OBSWebSocket | null = null;

/**
 * 连接到 OBS WebSocket
 * @param config OBS 连接配置
 * @returns 是否连接成功
 */
export async function connectToOBS(config: OBSConfig): Promise<boolean> {
  try {
    if (obs) {
      await obs.disconnect();
    }

    obs = new OBSWebSocket();

    await obs.connect(config.address, config.password);

    console.log("OBS WebSocket connected successfully");
    return true;
  } catch (error) {
    console.error("Failed to connect to OBS:", error);
    obs = null;
    throw new Error("连接 OBS 失败：" + (error as Error).message);
  }
}

/**
 * 断开 OBS WebSocket 连接
 */
export async function disconnectOBS(): Promise<void> {
  if (obs) {
    try {
      await obs.disconnect();
      console.log("OBS WebSocket disconnected");
    } catch (error) {
      console.error("Failed to disconnect from OBS:", error);
    } finally {
      obs = null;
    }
  }
}

/**
 * 获取 OBS 当前推流设置
 * @returns 当前推流设置
 */
export async function getOBSStreamSettings(): Promise<{
  streamServiceType: string;
  streamServiceSettings: {
    server?: string;
    key?: string;
    [key: string]: unknown;
  };
}> {
  if (!obs) {
    throw new Error("未连接到 OBS");
  }

  try {
    const response = await obs.call("GetStreamServiceSettings");
    return response as {
      streamServiceType: string;
      streamServiceSettings: {
        server?: string;
        key?: string;
        [key: string]: unknown;
      };
    };
  } catch (error) {
    console.error("Failed to get OBS stream settings:", error);
    throw new Error("获取 OBS 推流设置失败：" + (error as Error).message);
  }
}

/**
 * 更新 OBS 推流设置
 * @param stream 推流配置
 * @param serviceType 服务类型（如 rtmp_custom）
 */
export async function updateOBSStreamSettings(
  stream: Stream,
  serviceType: string = "rtmp_custom",
): Promise<void> {
  if (!obs) {
    throw new Error("未连接到 OBS");
  }

  try {
    // 首先获取当前设置，保留其他配置项
    const currentSettings = await getOBSStreamSettings();
    if (!currentSettings) {
      throw new Error("无法获取当前 OBS 设置");
    }

    // 构建新的设置，合并原有设置
    const newSettings = {
      streamServiceType: serviceType,
      streamServiceSettings: {
        ...currentSettings.streamServiceSettings,
        server: stream.address,
        key: stream.key,
      },
    };

    // 设置新的推流配置
    await obs.call("SetStreamServiceSettings", newSettings);

    console.log("OBS stream settings updated successfully");
  } catch (error) {
    console.error("Failed to update OBS stream settings:", error);
    throw new Error("更新 OBS 推流设置失败：" + (error as Error).message);
  }
}

/**
 * 检查 OBS 连接状态
 * @returns 是否已连接
 */
export function isOBSConnected(): boolean {
  return obs !== null;
}

/**
 * 开始 OBS 推流
 */
export async function startOBSStreaming(): Promise<void> {
  if (!obs) {
    throw new Error("未连接到 OBS");
  }

  try {
    await obs.call("StartStream");
    console.log("OBS streaming started");
  } catch (error) {
    console.error("Failed to start OBS streaming:", error);
    throw new Error("开始 OBS 推流失败：" + (error as Error).message);
  }
}

/**
 * 停止 OBS 推流
 */
export async function stopOBSStreaming(): Promise<void> {
  if (!obs) {
    throw new Error("未连接到 OBS");
  }

  try {
    await obs.call("StopStream");
    console.log("OBS streaming stopped");
  } catch (error) {
    console.error("Failed to stop OBS streaming:", error);
    throw new Error("停止 OBS 推流失败：" + (error as Error).message);
  }
}

/**
 * 获取 OBS 推流状态
 * @returns 推流状态
 */
export async function getOBSStreamStatus(): Promise<{
  outputActive: boolean;
  outputTimecode: string;
  outputDuration: number;
}> {
  if (!obs) {
    throw new Error("未连接到 OBS");
  }

  try {
    const response = await obs.call("GetStreamStatus");
    return {
      outputActive: response.outputActive,
      outputTimecode: response.outputTimecode,
      outputDuration: response.outputDuration,
    };
  } catch (error) {
    console.error("Failed to get OBS stream status:", error);
    throw new Error("获取 OBS 推流状态失败：" + (error as Error).message);
  }
}
