import { writeTextFile, readTextFile, exists, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
import { type AppConfig, DEFAULT_CONFIG } from "@/types/config";

const CONFIG_FILENAME = "app-config.json";
const DIR = BaseDirectory.AppConfig;

export class ConfigManager {
  private static async ensureDir() {
    try {
      if (!(await exists("", { baseDir: DIR }))) {
        await mkdir("", { baseDir: DIR, recursive: true });
      }
    } catch (e) {
      console.error("检查目录失败", e);
    }
  }

  public static async load(): Promise<AppConfig> {
    try {
      const fileExists = await exists(CONFIG_FILENAME, { baseDir: DIR });
      if (!fileExists) {
        await this.ensureDir();
        await this.save(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }

      const content = await readTextFile(CONFIG_FILENAME, { baseDir: DIR });
      const parsed = JSON.parse(content);
      return { ...DEFAULT_CONFIG, ...parsed };
    } catch (error) {
      console.error("加载配置失败，使用默认值:", error);
      return DEFAULT_CONFIG;
    }
  }

  public static async save(config: AppConfig): Promise<void> {
    try {
      await this.ensureDir();
      await writeTextFile(CONFIG_FILENAME, JSON.stringify(config, null, 2), { baseDir: DIR });
    } catch (error) {
      console.error("保存配置失败:", error);
      throw error;
    }
  }
}
