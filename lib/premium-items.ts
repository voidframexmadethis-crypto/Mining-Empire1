export type PremiumItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD" | "CASH" | "BATTERIES";
  imageUrl: string;
  payhipUrl?: string;
  category: "premium_drills" | "endgame_drills" | "batteries" | "endgame_cash";
};

export const PREMIUM_ITEMS: PremiumItem[] = [
  // Premium Drills (Real Money - USD)
  {
    id: "drill_premium_v1",
    name: "Obsidian Core Drillbit",
    description: "Premium drillbit with extreme heat resistance and 3x mining speed.",
    price: 4.99,
    currency: "USD",
    imageUrl: "💎",
    payhipUrl: "https://payhip.com/b/example1",
    category: "premium_drills"
  },
  {
    id: "drill_premium_v2",
    name: "Diamond-Infused Bit",
    description: "Elite drillbit that ignores hardness levels of all known ores.",
    price: 9.99,
    currency: "USD",
    imageUrl: "💠",
    payhipUrl: "https://payhip.com/b/example2",
    category: "premium_drills"
  },

  // Endgame Drillbits (Require Batteries)
  {
    id: "drill_endgame_gold",
    name: "Midas Touch Drill",
    description: "Requires advanced power. Converts waste rock into gold dust.",
    price: 10,
    currency: "BATTERIES",
    imageUrl: "🏆",
    category: "endgame_drills"
  },

  // Batteries (Purchased with In-Game Cash)
  {
    id: "battery_pack_small",
    name: "Advanced Battery Cell",
    description: "High-density energy storage for endgame equipment.",
    price: 500000,
    currency: "CASH",
    imageUrl: "🔋",
    category: "batteries"
  },

  // Endgame Cash Section (Real Money - USD)
  {
    id: "cash_bundle_mega",
    name: "Empire Expansion Fund",
    description: "Instantly inject $10,000,000 into your corporate account.",
    price: 14.99,
    currency: "USD",
    imageUrl: "💰",
    payhipUrl: "https://payhip.com/b/example3",
    category: "endgame_cash"
  }
];
