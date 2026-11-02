'use client';

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Sliders, Volume2, Monitor, Gamepad2, Eye, ShieldCheck, RotateCcw } from "lucide-react";
import { GameSettings, DEFAULT_SETTINGS, saveSystem } from "@/lib/save-system";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (newSettings: GameSettings) => void;
  onRestartTutorial: () => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onRestartTutorial
}: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<GameSettings>(settings);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  const handleResetDefaults = () => {
    setLocalSettings(DEFAULT_SETTINGS);
    onSettingsChange(DEFAULT_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-w-xl w-full bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Game Settings</h2>
              <p className="text-xs text-emerald-400 font-mono">
                Graphics, Audio, Camera & Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Settings Options */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Graphics Quality */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>Graphics Quality</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "ultra"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleUpdate("graphicsQuality", q)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border ${
                    localSettings.graphicsQuality === q
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20"
                      : "bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Audio Volumes */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Audio Volumes</span>
            </label>

            <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {/* Music Volume */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Music Volume</span>
                  <span className="font-mono text-emerald-400">{localSettings.musicVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.musicVolume}
                  onChange={(e) => handleUpdate("musicVolume", Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Sound Effects Volume</span>
                  <span className="font-mono text-emerald-400">{localSettings.sfxVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.sfxVolume}
                  onChange={(e) => handleUpdate("sfxVolume", Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Camera Sensitivity */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Camera Sensitivity</span>
            </label>
            <div className="flex items-center gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={localSettings.cameraSensitivity}
                onChange={(e) => handleUpdate("cameraSensitivity", Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="font-mono text-xs text-emerald-400 w-12 text-right">
                {localSettings.cameraSensitivity.toFixed(1)}x
              </span>
            </div>
          </div>

          {/* Controls & Performance Toggles */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>Controls & Performance</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                <span className="text-xs text-slate-300">Mobile Joystick</span>
                <input
                  type="checkbox"
                  checked={localSettings.mobileControlsVisible}
                  onChange={(e) => handleUpdate("mobileControlsVisible", e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800/50">
                <span className="text-xs text-slate-300">Real-Time Shadows</span>
                <input
                  type="checkbox"
                  checked={localSettings.performanceShadows}
                  onChange={(e) => handleUpdate("performanceShadows", e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Tutorial Replay Action */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Need a refresher on how to play?</span>
            <button
              onClick={() => {
                onClose();
                onRestartTutorial();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-emerald-500/30"
            >
              Replay Tutorial Guide
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
          >
            Save & Close
          </button>
        </div>

      </motion.div>
    </div>
  );
}
