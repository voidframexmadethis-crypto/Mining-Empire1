// Reliable Save System for Mining Empire
import { managementSystem } from "./management-system";
import { achievementsSystem } from "./achievements-system";
import { gemEncyclopediaSystem } from "./encyclopedia-system";

export type GameSettings = {
  graphicsQuality: "low" | "medium" | "ultra";
  masterVolume: number;
  musicVolume: number;
  caveMusicVolume: number;
  factoryMusicVolume: number;
  sfxVolume: number;
  cameraSensitivity: number;
  movementControls: "keyboard" | "touch" | "both";
  mobileControlsVisible: boolean;
  performanceShadows: boolean;
  particleDensity: "low" | "medium" | "high";
};

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: "ultra",
  masterVolume: 80,
  musicVolume: 70,
  caveMusicVolume: 70,
  factoryMusicVolume: 70,
  sfxVolume: 80,
  cameraSensitivity: 1.0,
  movementControls: "both",
  mobileControlsVisible: true,
  performanceShadows: true,
  particleDensity: "high"
};

export type GameSaveData = {
  version: number;
  timestamp: number;
  cash: number;
  inventory: Record<string, number>;
  jewelryInventory: Record<string, number>;
  backpackCapacity: number;
  depthFeet: number;
  remainingCaveGems: number;
  upgrades: {
    power: number;
    speed: number;
    backpack: number;
    elevatorSpeed: number;
    scanner: boolean;
  };
  managementData: any;
  achievementsData: any;
  encyclopediaData: any;
  settings: GameSettings;
  hasSeenTutorial: boolean;
  statistics: {
    grossDailyIncome: number;
    totalRevenue: number;
    totalOperatingExpenses: number;
    totalWagesPaid: number;
    netProfitRate: number;
    productionEfficiency: number;
    totalGemsProcessed: number;
    totalJewelryManufactured: number;
  };
  batteries: number;
  ownedItems: string[];
};

const SAVE_KEY = "mining_empire_save_data_v1";

export const saveSystem = {
  saveGame(data: Omit<GameSaveData, "version" | "timestamp">): void {
    if (typeof window === "undefined") return;
    try {
      const fullData: GameSaveData = {
        version: 1,
        timestamp: Date.now(),
        ...data
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(fullData));
    } catch (e) {
      console.warn("Failed to save game data:", e);
    }
  },

  loadGame(): GameSaveData | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as GameSaveData;
      return parsed;
    } catch (e) {
      console.warn("Failed to load game data:", e);
      return null;
    }
  },

  clearSave(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn("Failed to clear save data:", e);
    }
  }
};
