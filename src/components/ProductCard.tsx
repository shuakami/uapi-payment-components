import { Check } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "../lib/utils";
import { Loader } from "./Loader";
import {
  FEATURE_ICONS,
  type Product,
  type ProductFeature,
} from "./ProductCard.data";

export type PaymentStatus = "idle" | "creating" | "waiting" | "success" | "failed";

export interface ProductCardProps {
  product: Product;
  onBuy: (productId: string) => void;
  buyingId?: string | null;
  paymentStatus?: PaymentStatus;
  shineTrigger?: number;
  shineDelay?: number;
  className?: string;
}

export function ProductCard({
  product,
  onBuy,
  buyingId = null,
  paymentStatus = "idle",
  shineTrigger = 0,
  shineDelay = 0,
  className,
}: ProductCardProps) {
  const isThisCard = buyingId === product.id;
  const isDisabled = buyingId !== null;

  const buttonContent = (() => {
    if (!isThisCard) return "Buy now";
    if (paymentStatus === "waiting") {
      return (
        <span className="flex items-center gap-2">
          <Loader size={14} />
          Waiting for payment
        </span>
      );
    }
    if (paymentStatus === "success") {
      return (
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" />
          Paid
        </span>
      );
    }
    if (paymentStatus === "failed") return "Payment failed";
    return (
      <span className="flex items-center gap-2">
        <Loader size={14} />
        Creating order
      </span>
    );
  })();

  return (
    <div
      data-product={product.id}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl uapi-card-root border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#161618] sm:p-6",
        className,
      )}
    >
      {shineTrigger > 0 && (
        <motion.div
          key={`product-shine-${product.id}-${shineTrigger}`}
          className="pointer-events-none absolute -inset-x-20 -inset-y-8 z-10 rotate-12 bg-gradient-to-r from-transparent via-white/65 to-transparent"
          initial={{ x: "-160%", y: "-40%" }}
          animate={{ x: "160%", y: "40%" }}
          transition={{ duration: 1.25, delay: shineDelay, ease: "easeInOut" }}
        />
      )}

      {product.isPopular && (
        <div className="absolute right-0 top-0 flex items-center rounded-[0_16px] bg-teal-600 px-3 py-1 text-[11px] font-semibold leading-[18px] text-white sm:px-5 sm:py-1.5 sm:text-[12px]">
          {product.tag || "Popular"}
        </div>
      )}

      {!product.isPopular && product.tag && (
        <div className="absolute right-0 top-0 flex items-center rounded-[0_16px] bg-teal-50 px-3 py-1 text-[11px] font-semibold leading-[18px] text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 sm:px-5 sm:py-1.5 sm:text-[12px]">
          {product.tag}
        </div>
      )}

      <h3 className="text-base font-semibold text-[#171717] dark:text-[#EDEDED] sm:text-lg">
        {product.name}
      </h3>

      <div className="mt-3 flex items-baseline gap-1.5 sm:mt-4 sm:gap-2">
        <span className="text-3xl font-bold text-teal-600 sm:text-4xl">
          ${product.price}
        </span>
        <span className="text-xs text-[#A3A3A3] line-through dark:text-[#737373] sm:text-sm">
          ${product.originalPrice}
        </span>
      </div>

      <p className="mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3] sm:mt-2 sm:text-sm">
        {product.unit}
      </p>

      <button
        type="button"
        onClick={() => onBuy(product.id)}
        disabled={isDisabled}
        className={cn(
          "mt-5 inline-flex h-10 w-full items-center justify-center rounded-full text-[13px] font-medium transition-all",
          "bg-[#171717] text-white hover:bg-[#171717]/90 active:scale-[0.98]",
          "dark:bg-white dark:text-[#171717] dark:hover:bg-white/90",
          "shadow-[0_1px_2px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {buttonContent}
      </button>

      <ul className="mt-6 flex-1 space-y-2.5 text-[13px]">
        {product.features.map((feature: ProductFeature) => {
          const Icon = FEATURE_ICONS[feature.icon] || FEATURE_ICONS.zap;
          return (
            <li key={`${product.id}-${feature.text}`} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#A3A3A3] dark:text-[#737373]" />
              <span className="leading-[1.55] text-[#525252] dark:text-[#A3A3A3]">
                {feature.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
