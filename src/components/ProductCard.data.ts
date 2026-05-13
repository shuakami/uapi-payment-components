import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Clock,
  Coins,
  Cpu,
  Crown,
  Headphones,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export const FEATURE_ICONS: Record<string, LucideIcon> = {
  badgecheck: BadgeCheck,
  clock: Clock,
  coins: Coins,
  cpu: Cpu,
  crown: Crown,
  headphones: Headphones,
  layers: Layers,
  rocket: Rocket,
  shield: Shield,
  sparkles: Sparkles,
  trophy: Trophy,
  users: Users,
  zap: Zap,
};

export interface ProductFeature {
  icon: keyof typeof FEATURE_ICONS;
  text: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  unit: string;
  isPopular?: boolean;
  tag?: string;
  features: ProductFeature[];
}

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "starter",
    name: "Starter Pack",
    price: 18,
    originalPrice: 28,
    unit: "Single order, instant activation",
    features: [
      { icon: "zap", text: "Fast checkout with live payment state" },
      { icon: "shield", text: "Order confirmation after successful payment" },
      { icon: "clock", text: "Average setup time under two minutes" },
      { icon: "headphones", text: "Support-ready purchase metadata" },
    ],
  },
  {
    id: "standard",
    name: "Standard Plan",
    price: 38,
    originalPrice: 58,
    unit: "Best for repeated purchases",
    isPopular: true,
    tag: "Popular",
    features: [
      { icon: "trophy", text: "Highlighted card state for featured SKUs" },
      { icon: "sparkles", text: "Animated shine when a purchase starts" },
      { icon: "badgecheck", text: "Success state stays tied to the active item" },
      { icon: "users", text: "Clear feature list for comparison grids" },
    ],
  },
  {
    id: "pro",
    name: "Pro License",
    price: 138,
    originalPrice: 198,
    unit: "Full access for advanced workflows",
    features: [
      { icon: "crown", text: "Premium visual treatment without layout shift" },
      { icon: "rocket", text: "Works in dense storefront pages" },
      { icon: "layers", text: "Composable product data model" },
      { icon: "cpu", text: "Typed props for application integration" },
    ],
  },
];
