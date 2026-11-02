'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Gem, Zap, Trophy, Volume2, BarChart3, Settings, HelpCircle, Rocket, Layers } from "lucide-react";
import { GAME_GEMS } from "@/lib/gems";
import { JEWELRY_PRODUCTS } from "@/lib/jewelry-factory";
import { soundManager, AudioZone } from "@/lib/audio";
import { useAnimatedMoney } from "@/lib/use-animated-money";

type Upgrades = {
  power: number;
  speed: number;
  backpack: number;
  elevatorSpeed: number;
  scanner: boolean;
};

type MiningHUDProps = {
  cash: number;
  inventory: Record<string, number>;
  jewelryInventory: Record<string, number>;
  totalGemsCount: number;
  backpackCapacity: number;
  location: string;
  depthFeet: number;
  elevatorSpeed: number;
  remainingCaveGems: number;
  upgrades: Upgrades;
  onUpgrade: (type: keyof Upgrades) => void;
  onSellGems: () => void;
  onSellJewelry: (productId: string) => void;
  onCallElevator: () => void;
  nearElevator: boolean;
  nearTrader: boolean;
  nearFactory: boolean;
  nearJewelryShop: boolean;
  isAutoDrilling: boolean;
  clearScreenMode: boolean;
  onToggleClearScreen: () => void;
  onDepositToFactory: () => void;
  factoryNotification: string | null;
  onOpenOffice: () => void;
  onOpenEncyclopedia: () => void;
  onOpenSettings: () => void;
  onOpenStatistics: () => void;
  onOpenPublishingKit: () => void;
  onOpenPremiumShop: () => void;
  onOpenTutorial: () => void;
  nearOffice: boolean;
  achievementToast: { title: string; description: string; rewardCash: number; icon: string } | null;
};

export default function MiningHUD({
  cash,
  inventory,
  jewelryInventory,
  totalGemsCount,
  backpackCapacity,
  location,
  depthFeet,
  upgrades,
  onUpgrade,
  onSellGems,
  onSellJewelry,
  nearElevator,
  nearTrader,
  nearFactory,
  nearJewelryShop,
  isAutoDrilling,
  clearScreenMode,
  onToggleClearScreen,
  factoryNotification,
  onOpenOffice,
  onOpenSettings,
  onOpenPremiumShop,
}: MiningHUDProps) {
  const [activeTab, setActiveTab] = useState<"gems" | "upgrades" | "jewelry" | "none">("none");

  const animatedCash = useAnimatedMoney(cash, 250); // Increments one by one, very very slowly

  const upgradeCosts = {
    power: Math.floor(100 * Math.pow(1.5, Math.floor(upgrades.power - 20))),
    speed: Math.floor(150 * Math.pow(1.6, Math.round((upgrades.speed - 1) * 10))),
    backpack: Math.floor(120 * Math.pow(1.4, Math.floor(backpackCapacity / 10))),
    elevatorSpeed: Math.floor(250 * Math.pow(1.5, Math.round((upgrades.elevatorSpeed - 35) / 5))),
    scanner: 1000
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* 1. TOP SECTIONS (HIDDEN IN CLEAR SCREEN) */}
      {!clearScreenMode && (
        <div className="flex justify-between items-start w-full">
          {/* TOP LEFT: PRODUCT SHOP */}
          <div className="pointer-events-auto">
            <button
              onClick={onOpenPremiumShop}
              className="group bg-slate-950/90 backdrop-blur-xl border border-purple-500/50 rounded-2xl px-5 py-3 text-white font-black text-xs flex items-center gap-4 hover:bg-slate-900 transition-all shadow-2xl shadow-purple-900/20 active:scale-95 border-b-4 border-b-purple-700"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-start">
                <span className="uppercase tracking-widest text-[10px] text-purple-400">Empire Logistics</span>
                <span className="text-sm">PRODUCT SHOP</span>
              </div>
            </button>
          </div>

          {/* TOP RIGHT: MINIMALIST MONEY */}
          <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="bg-slate-950/90 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-6 py-3 shadow-2xl shadow-emerald-900/10 border-b-4 border-b-emerald-700/50">
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/60 font-black mb-1 text-right">Available Capital</div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-mono font-black text-2xl tabular-nums leading-none">
                  ${animatedCash.toLocaleString()}
                </span>
              </div>
            </div>
            
            <button
              onClick={onToggleClearScreen}
              className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:text-white transition-colors"
            >
              HIDE INTERFACE
            </button>
          </div>
        </div>
      )}

      {/* 2. PERSISTENT TOGGLE (ONLY VISIBLE WHEN INTERFACE HIDDEN) */}
      {clearScreenMode && (
        <div className="absolute top-8 right-8 pointer-events-auto">
          <button
            onClick={onToggleClearScreen}
            className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
          >
            SHOW INTERFACE
          </button>
        </div>
      )}

      {/* 3. CENTER / BOTTOM OVERLAYS (HIDDEN IN CLEAR SCREEN) */}
      <AnimatePresence>
        {!clearScreenMode && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="pointer-events-auto flex flex-col gap-4 max-w-5xl mx-auto w-full mb-4"
          >
            {/* Primary Action Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl px-6 py-4 text-white shadow-2xl flex items-center justify-between gap-6 border-b-4 border-b-slate-800">
              <div className="flex items-center gap-8">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Global Ops</span>
                  <span className="text-sm font-black text-white flex items-center gap-2">
                    <Rocket className="w-3 h-3 text-cyan-400" />
                    {location}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Depth</span>
                  <span className="text-sm font-black text-cyan-400 flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" />
                    {depthFeet.toLocaleString()} ft
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <HUDTabButton active={activeTab === "gems"} onClick={() => setActiveTab(activeTab === "gems" ? "none" : "gems")} icon={<Gem className="w-3.5 h-3.5" />} label="INVENTORY" color="amber" />
                <HUDTabButton active={activeTab === "jewelry"} onClick={() => setActiveTab(activeTab === "jewelry" ? "none" : "jewelry")} icon={<Layers className="w-3.5 h-3.5" />} label="JEWELRY" color="pink" />
                <HUDTabButton active={activeTab === "upgrades"} onClick={() => setActiveTab(activeTab === "upgrades" ? "none" : "upgrades")} icon={<Zap className="w-3.5 h-3.5" />} label="WORKSHOP" color="emerald" />
                <div className="w-px h-6 bg-slate-700 mx-2" />
                <button onClick={onOpenOffice} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-900/20 transition-all active:scale-95 border-b-2 border-b-blue-800">OFFICE</button>
                <button onClick={onOpenSettings} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-colors"><Settings className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODALS & PANELS */}
      <AnimatePresence>
        {activeTab !== "none" && !clearScreenMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="pointer-events-auto fixed bottom-32 left-1/2 -translate-x-1/2 w-full max-w-4xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-[2.5rem] shadow-2xl p-8 z-50 overflow-hidden max-h-[60vh] flex flex-col border-b-8 border-b-slate-950"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 shadow-inner">
                  {activeTab === "gems" && <Gem className="text-amber-400" />}
                  {activeTab === "upgrades" && <Zap className="text-emerald-400" />}
                  {activeTab === "jewelry" && <Layers className="text-pink-400" />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">
                    {activeTab} EXECUTIVE TERMINAL
                  </h2>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">Empire Management v4.2</div>
                </div>
              </div>
              <button onClick={() => setActiveTab("none")} className="p-3 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-2xl transition-all border border-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar pr-4 -mr-4">
               {activeTab === "gems" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {GAME_GEMS.map(gem => (
                        <div key={gem.id} className="p-5 bg-slate-800/40 rounded-3xl border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/60 transition-all border-b-4 border-b-slate-900">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-3xl shadow-inner border border-slate-800" style={{ color: `#${gem.color.toString(16).padStart(6, "0")}` }}>◆</div>
                              <div>
                                 <div className="text-base font-black text-white italic">{gem.name}</div>
                                 <div className="text-[10px] font-mono text-emerald-400 font-bold tracking-tight">${gem.value.toLocaleString()} UNIT VALUE</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-2xl font-black text-white tabular-nums leading-none">{inventory[gem.id] ?? 0}</div>
                              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Reserve</div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === "upgrades" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <UpgradeCard title="Drill Impact" value={`${upgrades.power.toFixed(1)} DPS`} cost={upgradeCosts.power} icon={<Zap className="w-5 h-5" />} onUpgrade={() => onUpgrade("power")} canAfford={cash >= upgradeCosts.power} />
                     <UpgradeCard title="Rotational RPM" value={`${upgrades.speed.toFixed(2)}x`} cost={upgradeCosts.speed} icon={<Rocket className="w-5 h-5" />} onUpgrade={() => onUpgrade("speed")} canAfford={cash >= upgradeCosts.speed} />
                     <HUDUpgradeCard title="Backpack Slots" value={`${backpackCapacity} UNITS`} cost={upgradeCosts.backpack} icon={<Gem className="w-5 h-5" />} onUpgrade={() => onUpgrade("backpack")} canAfford={cash >= upgradeCosts.backpack} />
                     <HUDUpgradeCard title="Elevator Thrust" value={`${upgrades.elevatorSpeed} m/s`} cost={upgradeCosts.elevatorSpeed} icon={<Rocket className="w-5 h-5" />} onUpgrade={() => onUpgrade("elevatorSpeed")} canAfford={cash >= upgradeCosts.elevatorSpeed} />
                  </div>
               )}

               {activeTab === "jewelry" && (
                  <div className="space-y-4">
                     {JEWELRY_PRODUCTS.map(prod => (
                        <div key={prod.id} className="p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50 flex items-center justify-between border-b-4 border-b-slate-900">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-4xl shadow-inner border border-slate-800">{prod.icon}</div>
                              <div>
                                 <div className="text-lg font-black text-white italic">{prod.name}</div>
                                 <div className="text-xs text-emerald-400 font-bold uppercase tracking-widest">${prod.price.toLocaleString()} RETAIL PRICE</div>
                              </div>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right">
                                 <div className="text-2xl font-black text-pink-400 tabular-nums">{jewelryInventory[prod.id] ?? 0}</div>
                                 <div className="text-[10px] text-slate-500 font-bold uppercase">STOCK</div>
                              </div>
                              <button onClick={() => onSellJewelry(prod.id)} disabled={(jewelryInventory[prod.id] ?? 0) <= 0} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-xs shadow-lg transition-all active:scale-95">SELL ITEM</button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. INDICATORS (HIDDEN IN CLEAR SCREEN) */}
      {!clearScreenMode && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center gap-2 w-full max-w-lg">
           {isAutoDrilling && (
              <div className="bg-amber-500/90 text-slate-950 font-black text-[10px] px-6 py-2 rounded-full shadow-2xl border border-amber-300 flex items-center gap-2 animate-pulse uppercase tracking-[0.2em]">
                 <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
                 High-Torque Auto-Drill Active
              </div>
           )}
           {nearTrader && (
              <div className="bg-cyan-500 text-slate-950 font-black text-[10px] px-6 py-2 rounded-full shadow-2xl border border-cyan-300 uppercase tracking-[0.2em]">Merchant Interaction Detected - [E] TO SELL</div>
           )}
           {nearElevator && (
              <div className="bg-indigo-600 text-white font-black text-[10px] px-6 py-2 rounded-full shadow-2xl border border-indigo-400 uppercase tracking-[0.2em]">Transport Hub Available - [E] TO BOARD</div>
           )}
           {nearFactory && (
              <div className="bg-emerald-500 text-slate-950 font-black text-[10px] px-6 py-2 rounded-full shadow-2xl border border-emerald-300 uppercase tracking-[0.2em]">Factory Intake Proximity - [E] TO DEPOSIT</div>
           )}
           {nearJewelryShop && (
              <div className="bg-rose-500 text-white font-black text-[10px] px-6 py-2 rounded-full shadow-2xl border border-rose-300 uppercase tracking-[0.2em]">Showroom Proximity - [E] TO SELL</div>
           )}
        </div>
      )}

      {/* 6. BOTTOM LABEL (HIDDEN IN CLEAR SCREEN) */}
      {!clearScreenMode && (
        <div className="pointer-events-none self-center text-[10px] font-black text-slate-600 bg-slate-950/40 px-6 py-2 rounded-full uppercase tracking-[0.3em]">
           Empire Control Console · Corporate Authority Level 1
        </div>
      )}
    </div>
  );
}

// INNER COMPONENTS
function HUDTabButton({ active, onClick, icon, label, color }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  };
  const activeMap: Record<string, string> = {
    amber: "bg-amber-500 text-slate-950 shadow-amber-900/20",
    pink: "bg-pink-500 text-slate-950 shadow-pink-900/20",
    emerald: "bg-emerald-500 text-slate-950 shadow-emerald-900/20"
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl flex items-center gap-2 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent shadow-lg ${active ? activeMap[color] : `${colorMap[color]} hover:bg-slate-800`}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function HUDUpgradeCard({ title, value, cost, icon, onUpgrade, canAfford, isMaxed }: any) {
  return (
    <div className="p-5 bg-slate-800/40 rounded-3xl border border-slate-700/50 flex items-center justify-between border-b-4 border-b-slate-950">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-xl text-emerald-400 shadow-inner border border-slate-800">{icon}</div>
        <div>
          <div className="text-sm font-black text-white italic">{title}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{value}</div>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        disabled={!canAfford || isMaxed}
        className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isMaxed ? "bg-slate-800 text-slate-500 cursor-default" : canAfford ? "bg-emerald-600 hover:bg-emerald-500 text-white border-b-2 border-b-emerald-800" : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"}`}
      >
        {isMaxed ? "MAXED" : `UPGRADE $${cost.toLocaleString()}`}
      </button>
    </div>
  );
}

const UpgradeCard = HUDUpgradeCard;
