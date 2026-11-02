'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { AnimatePresence } from "motion/react";
import MiningHUD from "@/components/MiningHUD";
import ManagementModal from "@/components/ManagementModal";
import EncyclopediaModal from "@/components/EncyclopediaModal";
import LoadingScreen from "@/components/LoadingScreen";
import TutorialModal from "@/components/TutorialModal";
import SettingsModal from "@/components/SettingsModal";
import StatisticsModal from "@/components/StatisticsModal";
import PublishingKitModal from "@/components/PublishingKitModal";
import PremiumShopModal from "@/components/PremiumShopModal";
import { saveSystem, DEFAULT_SETTINGS, GameSettings } from "@/lib/save-system";
import { createSurfaceFactory } from "@/lib/factory-engine";
import { createJewelryFactory } from "@/lib/jewelry-factory";
import { GAME_GEMS, GemOreDeposit, GemDrillController, GemType } from "@/lib/gems";
import { soundManager } from "@/lib/audio";
import { buildMiningWorld } from "@/lib/cave-builder";
import { managementSystem } from "@/lib/management-system";
import { achievementsSystem } from "@/lib/achievements-system";
import { gemEncyclopediaSystem, GemstoneEntry } from "@/lib/encyclopedia-system";
import { createWorkerRenderer, WorkerRenderer } from "@/lib/worker-render-engine";
import { createManagementOfficeBuilding, ManagementOfficeBuilding } from "@/lib/management-office-building";

type ElevatorState = "mine" | "traveling-up" | "surface" | "traveling-down";

export default function DeepMiningApp() {
  const mountRef = useRef<HTMLDivElement>(null);

  const INITIAL_CAVE_GEMS = 185000000;
  const STARTING_BACKPACK_CAPACITY = 13;

  const [cash, setCash] = useState(100);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [jewelryInventory, setJewelryInventory] = useState<Record<string, number>>({});
  const [backpackCapacity, setBackpackCapacity] = useState(STARTING_BACKPACK_CAPACITY);
  const [location, setLocation] = useState("Underground Cave Mine");
  const [depthFeet, setDepthFeet] = useState(100);
  const [remainingCaveGems, setRemainingCaveGems] = useState(INITIAL_CAVE_GEMS);
  const [showFactory, setShowFactory] = useState(false);
  const [nearJewelryShop, setNearJewelryShop] = useState(false);
  const [factoryNotification, setFactoryNotification] = useState<string | null>(null);

  // Drill & Mining Upgrades State
  const [upgrades, setUpgrades] = useState({
    power: 24.4,
    speed: 1.35,
    backpack: STARTING_BACKPACK_CAPACITY,
    elevatorSpeed: 35.0,
    scanner: false
  });

  // Management, Workers, Encyclopedia & Achievements State
  const [isLoading, setIsLoading] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatisticsOpen, setIsStatisticsOpen] = useState(false);
  const [isPublishingKitOpen, setIsPublishingKitOpen] = useState(false);
  const [isPremiumShopOpen, setIsPremiumShopOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [batteries, setBatteries] = useState(0);

  const handlePurchasePremiumItem = useCallback((item: any) => {
    let success = false;
    let nextCash = cash;
    let nextBatteries = batteries;

    if (item.currency === "CASH") {
      if (cash >= item.price) {
        nextCash = cash - item.price;
        setCash(nextCash);
        success = true;
      }
    } else if (item.currency === "BATTERIES") {
      if (batteries >= item.price) {
        nextBatteries = batteries - item.price;
        setBatteries(nextBatteries);
        success = true;
      }
    } else if (item.currency === "USD") {
      // Real money handled via Payhip URL in UI
      return;
    }

    if (success) {
      const nextOwned = [...ownedItems, item.id];
      setOwnedItems(nextOwned);
      
      // Special effect for battery items
      if (item.category === "batteries") {
        nextBatteries += 1;
        setBatteries(nextBatteries);
      }

      // Special effect for cash bundle
      if (item.id === "cash_bundle_mega") {
        nextCash += 10000000;
        setCash(nextCash);
      }

      soundManager.playCashRegister();

      // Save immediately
      saveSystem.saveGame({
        cash: nextCash,
        inventory,
        jewelryInventory,
        backpackCapacity,
        depthFeet,
        remainingCaveGems,
        upgrades,
        managementData: {},
        achievementsData: {},
        encyclopediaData: {},
        settings,
        hasSeenTutorial: true,
        statistics: managementSystem.getStats(),
        batteries: nextBatteries,
        ownedItems: nextOwned
      });
    }
  }, [cash, batteries, ownedItems, inventory, jewelryInventory, backpackCapacity, depthFeet, remainingCaveGems, upgrades, settings]);

  const [isOfficeOpen, setIsOfficeOpen] = useState(false);
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const [featuredDiscoveredGem, setFeaturedDiscoveredGem] = useState<GemstoneEntry | null>(null);
  const [nearOffice, setNearOffice] = useState(false);
  const [achievementToast, setAchievementToast] = useState<{
    title: string;
    description: string;
    rewardCash: number;
    icon: string;
  } | null>(null);

  // Load game on mount
  useEffect(() => {
    const saved = saveSystem.loadGame();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof saved.cash === "number") setCash(saved.cash);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.inventory) setInventory(saved.inventory);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.jewelryInventory) setJewelryInventory(saved.jewelryInventory);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.backpackCapacity) setBackpackCapacity(saved.backpackCapacity);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.upgrades) setUpgrades(saved.upgrades);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.settings) setSettings(saved.settings);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved.ownedItems) setOwnedItems(saved.ownedItems);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof saved.batteries === "number") setBatteries(saved.batteries);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTutorialOpen(!saved.hasSeenTutorial);
    } else {
      setIsTutorialOpen(true);
    }
    setIsLoading(false);
  }, []);

  // Periodic Auto-Save
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveSystem.saveGame({
        cash,
        inventory,
        jewelryInventory,
        backpackCapacity,
        depthFeet,
        remainingCaveGems,
        upgrades,
        managementData: {},
        achievementsData: {},
        encyclopediaData: {},
        settings,
        hasSeenTutorial: true,
        statistics: managementSystem.getStats(),
        batteries,
        ownedItems
      });
    }, 20000);

    return () => clearInterval(autoSaveInterval);
  }, [cash, inventory, jewelryInventory, backpackCapacity, depthFeet, remainingCaveGems, upgrades, settings, batteries, ownedItems]);

  // Clear Screen Toggle
  const [clearScreenMode, setClearScreenMode] = useState(false);

  // Automatic Proximity State
  const [isAutoDrilling, setIsAutoDrilling] = useState(false);
  const [nearElevator, setNearElevator] = useState(false);
  const [nearTrader, setNearTrader] = useState(false);
  const [nearFactory, setNearFactory] = useState(false);

  // Mutable refs for state guarding in 60fps loop
  const drillControllerRef = useRef(new GemDrillController());
  const elevatorStateRef = useRef<ElevatorState>("mine");
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const worldRef = useRef<ReturnType<typeof buildMiningWorld> | null>(null);
  const factoryEngineRef = useRef<ReturnType<typeof createSurfaceFactory> | null>(null);
  const jewelryFactoryRef = useRef<ReturnType<typeof createJewelryFactory> | null>(null);
  const managementOfficeRef = useRef<ManagementOfficeBuilding | null>(null);
  const workerRendererRef = useRef<WorkerRenderer | null>(null);

  // Tracking refs & state
  const [totalMined, setTotalMined] = useState(0);
  const backpackMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const backpackScreenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const backpackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const lastLocationRef = useRef("Underground Cave Mine");
  const lastDepthRef = useRef(100);
  const lastNearElevatorRef = useRef(false);
  const lastNearTraderRef = useRef(false);
  const lastNearFactoryRef = useRef(false);
  const lastNearJewelryShopRef = useRef(false);
  const lastNearOfficeRef = useRef(false);
  const lastAutoDrillingRef = useRef(false);

  // Hook Achievement Unlock Listener
  useEffect(() => {
    achievementsSystem.onUnlocked = (ach) => {
      setAchievementToast({
        title: ach.title,
        description: ach.description,
        rewardCash: ach.rewardCash,
        icon: ach.icon
      });
      soundManager.playCashRegister();
      setTimeout(() => {
        setAchievementToast(null);
      }, 5000);
    };
  }, []);

  // Apply Premium Item Effects
  useEffect(() => {
    if (!drillControllerRef.current) return;
    
    // Reset to base upgrades first
    drillControllerRef.current.power = upgrades.power;
    drillControllerRef.current.speed = upgrades.speed;
    drillControllerRef.current.scanner = upgrades.scanner;

    // Apply bonuses
    if (ownedItems.includes("drill_premium_v1")) {
      drillControllerRef.current.speed *= 3.0;
    }
    if (ownedItems.includes("drill_premium_v2")) {
      drillControllerRef.current.power *= 10.0; // "Ignores hardness" approx
    }
    if (ownedItems.includes("drill_endgame_gold")) {
      // Logic for this would be inside the drill function, 
      // but let's give it a power boost for now
      drillControllerRef.current.power *= 2.0;
    }
  }, [ownedItems, upgrades]);

  // Upgrade Handler
  const handleUpgrade = useCallback((type: keyof typeof upgrades) => {
    setCash(prevCash => {
      let cost = 0;
      if (type === "power") cost = Math.floor(100 * Math.pow(1.5, Math.floor(upgrades.power - 20)));
      else if (type === "speed") cost = Math.floor(150 * Math.pow(1.6, Math.round((upgrades.speed - 1) * 10)));
      else if (type === "backpack") cost = Math.floor(120 * Math.pow(1.4, Math.floor(backpackCapacity / 10)));
      else if (type === "elevatorSpeed") cost = Math.floor(250 * Math.pow(1.5, Math.round((upgrades.elevatorSpeed - 35) / 5)));
      else if (type === "scanner") cost = 1000;

      if (prevCash < cost) return prevCash;

      setUpgrades(prev => {
        const next = { ...prev };
        if (type === "power") {
          next.power += 5;
          drillControllerRef.current.upgradePower(5);
        } else if (type === "speed") {
          next.speed += 0.2;
          drillControllerRef.current.upgradeSpeed(0.2);
        } else if (type === "backpack") {
          next.backpack += 10;
          setBackpackCapacity(next.backpack);
        } else if (type === "elevatorSpeed") {
          next.elevatorSpeed += 5.0;
        } else if (type === "scanner") {
          next.scanner = true;
          drillControllerRef.current.scanner = true;
        }
        return next;
      });

      return prevCash - cost;
    });
  }, [upgrades, backpackCapacity]);

  // Sell All Gems
  const handleSellGems = useCallback(() => {
    setInventory(currentInventory => {
      let totalEarned = 0;
      const gemMult = managementSystem.getGemValueMultiplier();

      GAME_GEMS.forEach(gem => {
        const count = currentInventory[gem.id] ?? 0;
        if (count > 0) {
          totalEarned += count * Math.round(gem.value * gemMult);
        }
      });

      if (totalEarned > 0) {
        soundManager.playCashRegister();
        setCash(prev => prev + totalEarned);
        managementSystem.recordRevenue(totalEarned);

        if (worldRef.current) {
          worldRef.current.deposits.forEach(d => d.clearInventory());
        }
      }

      return {};
    });
  }, []);

  // Deposit Gems from Backpack to Factory Conveyor
  const handleDepositBackpackToFactory = useCallback(() => {
    let depositedCount = 0;
    const gemsToTransfer: GemType[] = [];

    // 1. Gather all gems from all deposits in the world and clear them cleanly
    if (worldRef.current) {
      worldRef.current.deposits.forEach(deposit => {
        const inv = deposit.getInventory();
        for (const [gemId, count] of Object.entries(inv)) {
          if (count > 0) {
            const gemConfig = GAME_GEMS.find(g => g.id === gemId) ?? GAME_GEMS[0];
            for (let i = 0; i < count; i++) {
              gemsToTransfer.push(gemConfig);
            }
          }
        }
        deposit.clearInventory();
      });
    }

    // 2. Also check inventory state if deposits were already empty
    if (gemsToTransfer.length === 0) {
      for (const [gemId, count] of Object.entries(inventory)) {
        if (count > 0) {
          const gemConfig = GAME_GEMS.find(g => g.id === gemId) ?? GAME_GEMS[0];
          for (let i = 0; i < count; i++) {
            gemsToTransfer.push(gemConfig);
          }
        }
      }
    }

    // 3. Physically transfer gems onto factory conveyor
    if (factoryEngineRef.current && gemsToTransfer.length > 0) {
      for (const gem of gemsToTransfer) {
        factoryEngineRef.current.addGem(gem);
        depositedCount++;
      }
      soundManager.playConveyorMotor(true);
    }

    if (depositedCount > 0) {
      setInventory({});
      soundManager.playCashRegister();
      setFactoryNotification(`✨ Backpack emptied! Deposited ${depositedCount} gems onto factory conveyor (Backpack: 0 / ${backpackCapacity}). Processing through Driller, Crusher, Washer, Compactor & Gem Jam.`);
      setTimeout(() => setFactoryNotification(null), 5000);
    }
  }, [inventory, backpackCapacity]);

  // Primary Three.js Mounting & Physics Loop
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Detect software WebGL renderer string for safe frame pacing
    const isSoftwareGl = (() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return true;
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1418);
    scene.fog = new THREE.Fog(0x0f1418, 20, 65);

    const camera = new THREE.PerspectiveCamera(
      65,
      mount.clientWidth / mount.clientHeight,
      0.1,
      180
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: "high-performance"
    });

    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    mount.appendChild(renderer.domElement);

    // Studio & Ambient Lighting
    scene.add(new THREE.HemisphereLight(0x38bdf8, 0x1e1b18, 1.2));
    const playerLight = new THREE.PointLight(0xffedd5, 30, 20);
    scene.add(playerLight);

    // Build Mine Cave, Ravines & Surface Outpost
    const world = buildMiningWorld(scene);
    worldRef.current = world;

    // Build Player Character Rig
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, -6);
    scene.add(playerGroup);

    // Player Body Parts
    const bodyMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.75, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    bodyMesh.position.y = 0.725;
    playerGroup.add(bodyMesh);

    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x3b2a1a, roughness: 0.8 });
    backpackMaterialRef.current = backpackMat;
    const backpackMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.75, 0.35),
      backpackMat
    );
    backpackMesh.position.set(0, 0.95, 0.38);
    playerGroup.add(backpackMesh);

    // 3.5. BACKPACK CAPACITY INDICATOR (Small screen on the back)
    const bCanvas = document.createElement("canvas");
    bCanvas.width = 256;
    bCanvas.height = 128;
    backpackCanvasRef.current = bCanvas;
    const bTexture = new THREE.CanvasTexture(bCanvas);
    backpackScreenTextureRef.current = bTexture;

    const screenGeo = new THREE.PlaneGeometry(0.55, 0.28);
    const screenMat = new THREE.MeshStandardMaterial({ 
      map: bTexture, 
      transparent: true,
      emissive: 0xffffff,
      emissiveMap: bTexture,
      emissiveIntensity: 0.5
    });
    const bScreen = new THREE.Mesh(screenGeo, screenMat);
    
    // Position it exactly on the back face of the backpack (Z: 0.35/2 = 0.175 + a tiny bit)
    bScreen.position.set(0, 0.95, 0.56); 
    bScreen.rotation.y = 0; // Facing back
    playerGroup.add(bScreen);

    // 3D Gem Tower Group stacked on player's backpack
    const backpackTowerGroup = new THREE.Group();
    backpackTowerGroup.position.set(0, 1.35, 0.38);
    playerGroup.add(backpackTowerGroup);

    const helmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 24), // Smoother geometry
      new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        roughness: 0.1,
        metalness: 0.6,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05
      })
    );
    helmetMesh.position.y = 1.45;
    playerGroup.add(helmetMesh);

    const headlight = new THREE.PointLight(0xfffbeb, 15, 12);
    headlight.position.set(0, 1.5, -0.3);
    playerGroup.add(headlight);

    // Automatic Drill Equipment
    const drillArm = new THREE.Group();
    drillArm.position.set(0.45, 0.8, -0.4);
    playerGroup.add(drillArm);

    const drillBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
    );
    drillBody.rotation.x = Math.PI / 2;
    drillArm.add(drillBody);

    const drillBit = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.6, 24), // Smoother
      new THREE.MeshPhysicalMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02
      })
    );
    drillBit.rotation.x = -Math.PI / 2;
    drillBit.position.z = -0.4;
    drillArm.add(drillBit);

    // Sparks Particle System
    const sparksGeometry = new THREE.BufferGeometry();
    const sparkCount = 30;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i++) sparkPositions[i] = 0;
    sparksGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));

    const sparksMaterial = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.15,
      transparent: true,
      opacity: 0
    });

    const sparksPoints = new THREE.Points(sparksGeometry, sparksMaterial);
    drillArm.add(sparksPoints);

    // Separate Jewelry Production Factory Engine at Z: 180 (Connected via outdoor road)
    const jewelryFactory = createJewelryFactory(scene, {
      position: new THREE.Vector3(0, 0, 180),
      onJewelryManufactured: (item) => {
        managementSystem.recordJewelryManufactured();
        setJewelryInventory(jewelryFactory.getJewelryInventory());
        setFactoryNotification(`✨ Finished ${item.name} manufactured & stored in Factory Output Storage! ($${item.price})`);
        setTimeout(() => setFactoryNotification(null), 4500);
      }
    });
    jewelryFactoryRef.current = jewelryFactory;

    // Surface Factory Engine at Z: 105 (Surface Base) -> Automatically sends finished gems to Jewelry Factory pipeline!
    const factoryEngine = createSurfaceFactory(scene, {
      position: new THREE.Vector3(0, 0, 105),
      onFinished: (value: number, gemType: GemType) => {
        managementSystem.recordGemProcessed();
        if (jewelryFactoryRef.current) {
          jewelryFactoryRef.current.addProcessedGem(gemType);
        }
      }
    });
    factoryEngineRef.current = factoryEngine;

    // 3D Physical Management Headquarters Building at Z: 135
    const managementOffice = createManagementOfficeBuilding(scene, new THREE.Vector3(0, 0, 135));
    managementOfficeRef.current = managementOffice;

    // 3D Physical Animated Worker Renderer
    const workerRenderer = createWorkerRenderer(scene);
    workerRenderer.updateWorkers(managementSystem.getWorkers());
    workerRendererRef.current = workerRenderer;

    // Wire Gem Collection Discovery hook to all ore deposits for Gem Encyclopedia & Achievements
    world.deposits.forEach(deposit => {
      deposit.options.onGemCollected = (collectedGem) => {
        setTotalMined(prev => prev + 1);
        const discovery = gemEncyclopediaSystem.recordDiscovery(collectedGem.id);
        if (discovery.isFirstDiscovery && discovery.gem) {
          setFeaturedDiscoveredGem(discovery.gem);
          setIsEncyclopediaOpen(true);
          soundManager.playCashRegister();
        }
      };
    });

    // Joystick Touch Control Setup
    let joyX = 0;
    let joyY = 0;
    let joyActive = false;

    const joystickContainer = document.createElement("div");
    joystickContainer.style.cssText =
      "position:absolute;bottom:28px;left:28px;width:120px;height:120px;border-radius:50%;background:rgba(15,23,42,0.7);border:2px solid rgba(56,189,248,0.5);touch-action:none;z-index:50;backdrop-filter:blur(6px);box-shadow:0 10px 25px rgba(0,0,0,0.5);";
    const joystickKnob = document.createElement("div");
    joystickKnob.style.cssText =
      "position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#0284c7);box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid #ffffff;";
    joystickContainer.appendChild(joystickKnob);
    mount.appendChild(joystickContainer);

    const handlePointerMove = (e: PointerEvent) => {
      if (!joyActive) return;
      const rect = joystickContainer.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.min(42, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      joyX = (Math.cos(angle) * dist) / 42;
      joyY = (Math.sin(angle) * dist) / 42;
      joystickKnob.style.transform = `translate(${joyX * 42}px, ${joyY * 42}px)`;
    };

    const handlePointerDown = (e: PointerEvent) => {
      joyActive = true;
      joystickContainer.setPointerCapture(e.pointerId);
      handlePointerMove(e);
    };

    const handlePointerUp = () => {
      joyActive = false;
      joyX = 0;
      joyY = 0;
      joystickKnob.style.transform = "translate(0px, 0px)";
    };

    joystickContainer.addEventListener("pointerdown", handlePointerDown);
    joystickContainer.addEventListener("pointermove", handlePointerMove);
    joystickContainer.addEventListener("pointerup", handlePointerUp);
    joystickContainer.addEventListener("pointercancel", handlePointerUp);

    // Keyboard Listeners (WASD / Arrows)
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "e") {
        const distToElevator = Math.hypot(playerGroup.position.x, playerGroup.position.z - 2);
        const distToOffice = Math.hypot(playerGroup.position.x - 0, playerGroup.position.z - 129);
        if (distToOffice < 4.8 && elevatorStateRef.current === "surface") {
          setIsOfficeOpen(prev => !prev);
        } else if (distToElevator < 3.2 && elevatorStateRef.current === "mine") {
          triggerElevator("traveling-up");
        } else if (distToElevator < 3.2 && elevatorStateRef.current === "surface") {
          triggerElevator("traveling-down");
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Elevator Travel Function (35.0 m/s Speed)
    let elevatorProgress = 0;
    const ELEVATOR_TRAVEL_DISTANCE = 98;

    function triggerElevator(targetState: "traveling-up" | "traveling-down") {
      if (elevatorStateRef.current === "traveling-up" || elevatorStateRef.current === "traveling-down") return;

      elevatorStateRef.current = targetState;
      elevatorProgress = 0;

      // Seal Doors
      world.elevatorDoors[0].position.x = -0.55;
      world.elevatorDoors[1].position.x = 0.55;

      // Lock player inside cabin platform safely
      playerGroup.position.set(world.elevatorGroup.position.x, 0.15, world.elevatorGroup.position.z);
      playerGroup.rotation.y = 0;
    }

    // Function to render 3D Backpack Gem Tower
    let currentRenderedGemCount = -1;
    function updateBackpackGemTower(totalGems: number) {
      if (totalGems === currentRenderedGemCount) return;
      currentRenderedGemCount = totalGems;

      // Update Backpack Visuals (Color & Screen)
      const isFull = totalGems >= backpackCapacity;
      if (backpackMaterialRef.current) {
        backpackMaterialRef.current.color.set(isFull ? 0xff0000 : 0x3b2a1a);
        backpackMaterialRef.current.emissive.set(isFull ? 0x440000 : 0x000000);
      }

      const ctx = backpackCanvasRef.current?.getContext("2d");
      const tex = backpackScreenTextureRef.current;
      if (ctx && tex) {
        ctx.clearRect(0, 0, 256, 128);
        
        // Dynamic styling based on full state
        const color = isFull ? "#ff0000" : "#ffffff";
        
        // Background Pill Shape
        ctx.fillStyle = isFull ? "rgba(255, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.roundRect(10, 10, 236, 108, 64);
        ctx.fill();
        
        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (isFull) {
          ctx.fillStyle = "#ff0000";
          ctx.font = "bold 64px sans-serif";
          ctx.fillText("MAX", 128, 64);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 52px monospace";
          ctx.fillText(`${totalGems} / ${backpackCapacity}`, 128, 64);
        }
        tex.needsUpdate = true;
      }

      while (backpackTowerGroup.children.length > 0) {
        const child = backpackTowerGroup.children[0];
        backpackTowerGroup.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      }

      for (let i = 0; i < totalGems; i++) {
        const gemConfig = GAME_GEMS[i % GAME_GEMS.length];
        const gemMesh = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.14, 1),
          new THREE.MeshPhysicalMaterial({
            color: gemConfig.color,
            emissive: gemConfig.color,
            emissiveIntensity: 0.8,
            roughness: 0.05,
            metalness: 0.15,
            transmission: 0.82,
            ior: 1.58,
            thickness: 0.6,
            clearcoat: 1.0,
            clearcoatRoughness: 0.08
          })
        );
        gemMesh.position.set(
          ((i % 2) - 0.5) * 0.08,
          i * 0.14,
          ((Math.floor(i / 2) % 2) - 0.5) * 0.08
        );
        gemMesh.rotation.set(0.2, i * 0.5, 0.2);
        backpackTowerGroup.add(gemMesh);
      }
    }

    // Helper functions for guarded state updates
    function setLocationGuarded(newLoc: string) {
      if (lastLocationRef.current !== newLoc) {
        lastLocationRef.current = newLoc;
        setLocation(newLoc);
      }
    }

    function setDepthGuarded(newDepth: number) {
      if (lastDepthRef.current !== newDepth) {
        lastDepthRef.current = newDepth;
        setDepthFeet(newDepth);
      }
    }

    function setNearElevatorGuarded(val: boolean) {
      if (lastNearElevatorRef.current !== val) {
        lastNearElevatorRef.current = val;
        setNearElevator(val);
      }
    }

    function setNearTraderGuarded(val: boolean) {
      if (lastNearTraderRef.current !== val) {
        lastNearTraderRef.current = val;
        setNearTrader(val);
      }
    }

    function setNearFactoryGuarded(val: boolean) {
      if (lastNearFactoryRef.current !== val) {
        lastNearFactoryRef.current = val;
        setNearFactory(val);
      }
    }

    function setIsAutoDrillingGuarded(val: boolean) {
      if (lastAutoDrillingRef.current !== val) {
        lastAutoDrillingRef.current = val;
        setIsAutoDrilling(val);
      }
    }

    // Main Game Loop
    let previousTime = performance.now();
    let animationFrameId = 0;
    let lastFactoryUnloadTime = 0;
    let lastAchievementCheckTime = 0;

    const animate = (now: number) => {
      const dt = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;

      const keys = keysRef.current;
      const state = elevatorStateRef.current;

      // --------------------------------------------------
      // 1. HYPER-SPEED ELEVATOR LOCOMOTION
      // --------------------------------------------------
      if (state === "traveling-up" || state === "traveling-down") {
        const currentSpeed = upgrades.elevatorSpeed;
        elevatorProgress += (currentSpeed * dt) / ELEVATOR_TRAVEL_DISTANCE;

        soundManager.playHyperElevatorSound(true, elevatorProgress);

        if (state === "traveling-up") {
          const currentZ = THREE.MathUtils.lerp(2, 100, Math.min(1, elevatorProgress));
          world.elevatorGroup.position.z = currentZ;
          playerGroup.position.copy(world.elevatorGroup.position);

          const currentDepth = Math.round(100 * (1 - elevatorProgress));
          setDepthGuarded(currentDepth);

          if (elevatorProgress >= 1) {
            elevatorStateRef.current = "surface";
            setLocationGuarded("Surface Mining Outpost");
            setShowFactory(true);
            soundManager.playHyperElevatorSound(false);
            soundManager.setMusicZone("surface");

            world.elevatorDoors[0].position.x = -2.1;
            world.elevatorDoors[1].position.x = 2.1;
          }
        } else {
          const currentZ = THREE.MathUtils.lerp(100, 2, Math.min(1, elevatorProgress));
          world.elevatorGroup.position.z = currentZ;
          playerGroup.position.copy(world.elevatorGroup.position);

          const currentDepth = Math.round(100 * elevatorProgress);
          setDepthGuarded(currentDepth);

          if (elevatorProgress >= 1) {
            elevatorStateRef.current = "mine";
            setLocationGuarded("Underground Cave Mine");
            setShowFactory(false);
            soundManager.playHyperElevatorSound(false);
            soundManager.setMusicZone("cave");

            world.elevatorDoors[0].position.x = -2.1;
            world.elevatorDoors[1].position.x = 2.1;
          }
        }
      }

      // --------------------------------------------------
      // 2. JOYSTICK & KEYBOARD LOCOMOTION WITH LADDER CLIMBING
      // --------------------------------------------------
      let moveX = joyX;
      let moveZ = joyY;

      if (keys["w"] || keys["arrowup"]) moveZ -= 1;
      if (keys["s"] || keys["arrowdown"]) moveZ += 1;
      if (keys["a"] || keys["arrowleft"]) moveX -= 1;
      if (keys["d"] || keys["arrowright"]) moveX += 1;

      const inputLen = Math.hypot(moveX, moveZ);
      const isMoving = inputLen > 0.1 && (state === "mine" || state === "surface");

      if (isMoving) {
        const normX = moveX / Math.max(1, inputLen);
        const normZ = moveZ / Math.max(1, inputLen);

        playerGroup.position.x += normX * dt * 5.8;
        playerGroup.position.z += normZ * dt * 5.8;
        playerGroup.rotation.y = THREE.MathUtils.damp(
          playerGroup.rotation.y,
          Math.atan2(normX, normZ),
          14,
          dt
        );
      }

      // Automatic Cliff Ladder Climbing
      if (state === "mine") {
        if (playerGroup.position.z < -27) {
          playerGroup.position.y = THREE.MathUtils.damp(playerGroup.position.y, -3.5, 8, dt);
          setLocationGuarded("Deep Ravine & Crystal Water");
          setDepthGuarded(500);
        } else {
          playerGroup.position.y = THREE.MathUtils.damp(playerGroup.position.y, 0, 8, dt);
          setLocationGuarded("Underground Cave Mine");
          setDepthGuarded(100);
        }

        playerGroup.position.x = THREE.MathUtils.clamp(playerGroup.position.x, -13.5, 13.5);
        playerGroup.position.z = THREE.MathUtils.clamp(playerGroup.position.z, -38.5, 3.5);
      } else if (state === "surface") {
        playerGroup.position.y = 0;
        playerGroup.position.x = THREE.MathUtils.clamp(playerGroup.position.x, -55, 55);
        playerGroup.position.z = THREE.MathUtils.clamp(playerGroup.position.z, 85, 360);

        if (playerGroup.position.z < 130) setLocationGuarded("Surface Mining Outpost & Original Factory");
        else if (playerGroup.position.z < 180) setLocationGuarded("Gemstone Cutting & Polishing Plants");
        else if (playerGroup.position.z < 230) setLocationGuarded("Precious Metal & Jewelry Manufacturing Plant");
        else if (playerGroup.position.z < 280) setLocationGuarded("Jewelry Finishing & Inspection Plant");
        else if (playerGroup.position.z < 320) setLocationGuarded("Jewelry Retail Shopping District");
        else setLocationGuarded("Storage & Shipping Depot");
      }

      // Proximity Triggers
      const distToElevator = Math.hypot(
        playerGroup.position.x - world.elevatorGroup.position.x,
        playerGroup.position.z - world.elevatorGroup.position.z
      );
      setNearElevatorGuarded(distToElevator < 3.2 && (state === "mine" || state === "surface"));

      const distToTrader = Math.hypot(
        playerGroup.position.x - (-12),
        playerGroup.position.z - 95
      );
      setNearTraderGuarded(distToTrader < 4.5 && state === "surface");

      // Executive Management Office Proximity (Z: 129 entrance)
      const distToOffice = Math.hypot(
        playerGroup.position.x - 0,
        playerGroup.position.z - 129
      );
      const isNearOffice = distToOffice < 4.8 && state === "surface";
      if (lastNearOfficeRef.current !== isNearOffice) {
        lastNearOfficeRef.current = isNearOffice;
        setNearOffice(isNearOffice);
      }

      // Factory Conveyor Belt Proximity
      const distToFactoryBelt = Math.hypot(
        playerGroup.position.x - 0,
        playerGroup.position.z - 105
      );
      const isNearBelt = distToFactoryBelt < 5.0 && state === "surface";
      setNearFactoryGuarded(isNearBelt);

      // AUTOMATIC FACTORY GEMS UNLOADING ONTO 3D CONVEYOR BELT
      if (isNearBelt && now - lastFactoryUnloadTime > 350) {
        lastFactoryUnloadTime = now;

        let gemToProcess: { type: GemType; deposit: GemOreDeposit } | null = null;

        for (const deposit of world.deposits) {
          const inv = deposit.getInventory();
          for (const [gemId, count] of Object.entries(inv)) {
            if (count > 0) {
              const gemConfig = GAME_GEMS.find(g => g.id === gemId) ?? GAME_GEMS[0];
              gemToProcess = { type: gemConfig, deposit };
              break;
            }
          }
          if (gemToProcess) break;
        }

        if (gemToProcess && factoryEngineRef.current) {
          // Remove 1 gem from deposit inventory
          const removed = gemToProcess.deposit.removeGem(gemToProcess.type.id);
          if (removed) {
            // Re-sync overall inventory state
            const newOverallInventory: Record<string, number> = {};
            world.deposits.forEach(d => {
              Object.entries(d.getInventory()).forEach(([gId, cnt]) => {
                if (cnt > 0) {
                  newOverallInventory[gId] = (newOverallInventory[gId] ?? 0) + cnt;
                }
              });
            });
            setInventory(newOverallInventory);

            // Add physical 3D gem onto conveyor belt!
            factoryEngineRef.current.addGem(gemToProcess.type);
            soundManager.playConveyorMotor(true);
          }
        }
      }

      // --------------------------------------------------
      // 3. AUTOMATIC DRILLING MECHANICS (+22% BOOSTED POWER)
      // --------------------------------------------------
      let nearbyTargetDeposit: GemOreDeposit | null = null;
      let minDistance = Infinity;

      if (state === "mine") {
        for (const deposit of world.deposits) {
          if (deposit.broken) continue;
          const dist = playerGroup.position.distanceTo(deposit.group.position);
          if (dist < minDistance) {
            minDistance = dist;
            nearbyTargetDeposit = deposit;
          }
        }
      }

      const autoDrilling = state === "mine" && nearbyTargetDeposit !== null && minDistance < 4.5;
      setIsAutoDrillingGuarded(autoDrilling);
      soundManager.playDrillSound(autoDrilling, drillControllerRef.current.speed);

      if (autoDrilling && nearbyTargetDeposit) {
        drillBit.rotation.z += dt * 35 * drillControllerRef.current.speed;

        // Spark Particle Effect
        const posAttr = sparksGeometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < sparkCount; i++) {
          posAttr.setXYZ(
            i,
            (Math.random() - 0.5) * 0.55,
            (Math.random() - 0.5) * 0.55,
            -0.6 - Math.random() * 0.6
          );
        }
        posAttr.needsUpdate = true;
        sparksMaterial.opacity = 0.95;

        const rockBroke = drillControllerRef.current.drill(nearbyTargetDeposit, dt);
        soundManager.playRockCrunch();

        if (rockBroke) {
          soundManager.playGemChime(0.5);
          setRemainingCaveGems(prev => Math.max(0, prev - 250));
        }
      } else {
        sparksMaterial.opacity = 0;
      }

      // --------------------------------------------------
      // 4. LOOSE GEM DROPS, REGENERATION & AUTOMATIC PICKUP
      // --------------------------------------------------
      let currentTotalGemsInBackpack = 0;
      world.deposits.forEach(d => {
        Object.values(d.getInventory()).forEach(cnt => {
          currentTotalGemsInBackpack += cnt;
        });
      });

      let anyPickedUp = false;
      for (const deposit of world.deposits) {
        deposit.updateDrops(dt, playerGroup.position.y + 0.15);

        if (state === "mine") {
          const pickedUp = deposit.collectNear(
            playerGroup.position,
            2.8,
            backpackCapacity,
            currentTotalGemsInBackpack
          );

          if (pickedUp > 0) {
            anyPickedUp = true;
            currentTotalGemsInBackpack += pickedUp;
          }
        }
      }

      if (anyPickedUp) {
        soundManager.playGemChime(0.85);

        const newOverallInventory: Record<string, number> = {};
        world.deposits.forEach(d => {
          Object.entries(d.getInventory()).forEach(([id, cnt]) => {
            if (cnt > 0) newOverallInventory[id] = (newOverallInventory[id] ?? 0) + cnt;
          });
        });
        setInventory(newOverallInventory);
      }

      // Update 3D Backpack Gem Tower
      updateBackpackGemTower(currentTotalGemsInBackpack);

      // --------------------------------------------------
      // 5. CAMERA & SCENE RENDER
      // --------------------------------------------------
      const camOffset = state === "mine"
        ? new THREE.Vector3(playerGroup.position.x, playerGroup.position.y + 5.5, playerGroup.position.z + 9)
        : new THREE.Vector3(playerGroup.position.x, 8.0, playerGroup.position.z + 12);

      camera.position.lerp(camOffset, 0.08);
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);
      playerLight.position.set(playerGroup.position.x, playerGroup.position.y + 4.5, playerGroup.position.z);

      const distToJewelryShop = Math.hypot(
        playerGroup.position.x - 10,
        playerGroup.position.z - 186
      );
      const isNearJewelryShop = distToJewelryShop < 5.0 && state === "surface";
      if (lastNearJewelryShopRef.current !== isNearJewelryShop) {
        lastNearJewelryShopRef.current = isNearJewelryShop;
        setNearJewelryShop(isNearJewelryShop);
      }

      // Update Audio Zone based on player coordinates
      if (state === "mine") {
        soundManager.setMusicZone("cave");
      } else if (state === "surface") {
        if (playerGroup.position.z < 120) {
          soundManager.setMusicZone("surface");
        } else if (playerGroup.position.z < 260) {
          soundManager.setMusicZone("factory");
        } else {
          soundManager.setMusicZone("jewelry");
        }
      }

      // Worker Wages deduction & financial rate calculation
      const wageDeduction = managementSystem.tickWages(dt);
      if (wageDeduction > 0) {
        setCash(prev => Math.max(0, prev - wageDeduction));
      }

      // Periodic Achievements & Milestone Check (Every 500ms)
      if (now - lastAchievementCheckTime > 500) {
        lastAchievementCheckTime = now;
        achievementsSystem.checkAll(
          {
            totalMined: totalMined,
            totalProcessed: managementSystem.getStats().totalGemsProcessed,
            totalJewelry: managementSystem.getStats().totalJewelryManufactured,
            workerCount: managementSystem.getWorkers().length,
            cash: cash,
            depth: lastDepthRef.current,
            discoveredGemsCount: gemEncyclopediaSystem.getDiscoveredGems().length
          },
          (reward) => {
            setCash(prev => prev + reward);
            soundManager.playCashRegister();
          }
        );
      }

      world.updateWorld(dt);
      managementOffice.update(dt);
      workerRenderer.update(dt);

      // Business upgrade multipliers applied to factory processing lines
      const conveyorMult = managementSystem.getConveyorSpeedMultiplier();
      const machineMult = managementSystem.getMachineSpeedMultiplier();
      factoryEngine.update(dt * conveyorMult * machineMult);
      if (jewelryFactoryRef.current) {
        jewelryFactoryRef.current.update(dt * machineMult);
      }
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 30);
      } else {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      joystickContainer.removeEventListener("pointerdown", handlePointerDown);
      joystickContainer.removeEventListener("pointermove", handlePointerMove);
      joystickContainer.removeEventListener("pointerup", handlePointerUp);
      joystickContainer.removeEventListener("pointercancel", handlePointerUp);

      renderer.dispose();
      world.disposeWorld();
      factoryEngine.dispose();
      workerRenderer.dispose();
      managementOffice.dispose();
      if (jewelryFactoryRef.current) {
        jewelryFactoryRef.current.dispose();
      }

      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (mount.contains(joystickContainer)) mount.removeChild(joystickContainer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upgrades.elevatorSpeed]);

  const handleSellJewelry = useCallback((productId: string) => {
    if (jewelryFactoryRef.current) {
      const baseEarned = jewelryFactoryRef.current.sellJewelry(productId);
      if (baseEarned > 0) {
        const priceMult = managementSystem.getJewelryPriceMultiplier();
        const boostedEarned = Math.round(baseEarned * priceMult);
        setCash(prev => prev + boostedEarned);
        managementSystem.recordRevenue(boostedEarned);
        soundManager.playCashRegister();
        setJewelryInventory(jewelryFactoryRef.current.getJewelryInventory());
      }
    }
  }, []);

  const totalGemsCount = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full h-dvh relative overflow-hidden bg-slate-950 select-none">
      {/* Professional Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>

      {/* 3D Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Mining HUD Overlay */}
      <MiningHUD
        cash={cash}
        inventory={inventory}
        jewelryInventory={jewelryInventory}
        totalGemsCount={totalGemsCount}
        backpackCapacity={backpackCapacity}
        location={location}
        depthFeet={depthFeet}
        elevatorSpeed={upgrades.elevatorSpeed}
        remainingCaveGems={remainingCaveGems}
        upgrades={upgrades}
        onUpgrade={handleUpgrade}
        onSellGems={handleSellGems}
        onSellJewelry={handleSellJewelry}
        onCallElevator={() => {
          if (nearElevator) {
            const event = new KeyboardEvent("keydown", { key: "e" });
            window.dispatchEvent(event);
          }
        }}
        nearElevator={nearElevator}
        nearTrader={nearTrader}
        nearFactory={nearFactory}
        nearJewelryShop={nearJewelryShop}
        isAutoDrilling={isAutoDrilling}
        clearScreenMode={clearScreenMode}
        onToggleClearScreen={() => setClearScreenMode(!clearScreenMode)}
        onDepositToFactory={handleDepositBackpackToFactory}
        factoryNotification={factoryNotification}
        onOpenOffice={() => setIsOfficeOpen(true)}
        onOpenEncyclopedia={() => {
          setFeaturedDiscoveredGem(null);
          setIsEncyclopediaOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStatistics={() => setIsStatisticsOpen(true)}
        onOpenPublishingKit={() => setIsPublishingKitOpen(true)}
        onOpenPremiumShop={() => setIsPremiumShopOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        nearOffice={nearOffice}
        achievementToast={achievementToast}
      />

      {/* Corporate Executive Management Headquarters Modal */}
      <ManagementModal
        isOpen={isOfficeOpen}
        onClose={() => setIsOfficeOpen(false)}
        cash={cash}
        onCashChange={(newCash) => {
          setCash(newCash);
        }}
        onWorkersUpdated={() => {
          if (workerRendererRef.current) {
            workerRendererRef.current.updateWorkers(managementSystem.getWorkers());
          }
        }}
      />

      {/* Illustrated Gemstone Encyclopedia Modal */}
      <EncyclopediaModal
        isOpen={isEncyclopediaOpen}
        onClose={() => {
          setIsEncyclopediaOpen(false);
          setFeaturedDiscoveredGem(null);
        }}
        featuredGem={featuredDiscoveredGem}
      />

      {/* First-Time Player Tutorial Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Game Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
        onRestartTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Production & Business Statistics Modal */}
      <StatisticsModal
        isOpen={isStatisticsOpen}
        onClose={() => setIsStatisticsOpen(false)}
        cash={cash}
        totalMined={totalMined}
      />

      {/* Publishing & Launch Kit Modal (YouTube & Payhip) */}
      <PublishingKitModal
        isOpen={isPublishingKitOpen}
        onClose={() => setIsPublishingKitOpen(false)}
        gameUrl={typeof window !== "undefined" ? window.location.href : ""}
      />

      {/* Premium Shop Modal */}
      <PremiumShopModal
        isOpen={isPremiumShopOpen}
        onClose={() => setIsPremiumShopOpen(false)}
        ownedItems={ownedItems}
        cash={cash}
        batteries={batteries}
        onPurchaseWithCash={handlePurchasePremiumItem}
      />
    </div>
  );
}
