import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../lib/utils";

export interface PaymentSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewOrders?: () => void;
  productName: string;
  amount: number;
  orderId?: string;
}

export function PaymentSuccessModal({
  open,
  onOpenChange,
  onViewOrders,
  productName,
  amount,
  orderId,
}: PaymentSuccessModalProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleClose = () => onOpenChange(false);

  const canPortal = typeof document !== "undefined";

  const amountText = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const modalContent = (
    <AnimatePresence>
      {open && mounted && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[2147483600] bg-white/70 backdrop-blur-[2px] dark:bg-black/70"
            onClick={handleClose}
          />

          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            transition={
              isMobile
                ? { type: "spring", damping: 40, stiffness: 400, mass: 1 }
                : { type: "spring", damping: 25, stiffness: 300, mass: 0.8 }
            }
            className={cn(
              "fixed z-[2147483601] overflow-hidden bg-white uapi-success-dialog shadow-lg dark:bg-[#161618]",
              isMobile
                ? "bottom-0 left-0 right-0 max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border border-b-0 border-black/[0.08] p-6 pt-8 dark:border-white/[0.08]"
                : "left-1/2 top-1/2 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/[0.08] dark:border-white/[0.08]",
            )}
          >
            {isMobile && (
              <div className="absolute left-1/2 top-3 h-1 w-10 -translate-x-1/2 rounded-full bg-black/15 dark:bg-white/20" />
            )}

            <div className="absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-teal-50 to-transparent dark:from-teal-950/40" />

            <div className="relative p-6 text-center">
              <motion.div
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center text-teal-600 dark:text-teal-400"
              >
                <svg viewBox="0 0 100 100" className="h-14 w-14">
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="6"
                    initial={{ pathLength: 0, rotate: -90 }}
                    animate={{ pathLength: 1 }}
                    style={{ transformOrigin: "center" }}
                    transition={{ duration: 0.42, delay: 0.08, ease: [0.65, 0, 0.35, 1] }}
                  />
                  <motion.path
                    d="M32 52 L44 64 L68 38"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="6.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.22, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
              </motion.div>

              <h2 className="mb-2 text-xl font-semibold text-[#171717] dark:text-[#EDEDED]">
                Payment successful
              </h2>
              <p className="mb-6 text-sm text-[#737373] dark:text-[#A3A3A3]">
                {productName} is ready
              </p>

              <div className="mb-8">
                <div className="flex items-baseline justify-center text-5xl font-bold text-teal-600 dark:text-teal-400">
                  <span className="mr-1 mt-1 text-2xl">$</span>
                  {amountText}
                </div>
                <p className="mt-2 text-sm text-[#A3A3A3] dark:text-[#737373]">
                  {orderId ? `Order ${orderId}` : "Order created"}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onViewOrders?.();
                    handleClose();
                  }}
                  className="flex h-10 w-full items-center justify-center rounded-full bg-[#171717] text-sm font-medium text-white transition-colors hover:bg-[#171717]/85 dark:bg-white dark:text-[#171717] dark:hover:bg-white/90"
                >
                  View orders
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 w-full rounded-full text-sm text-[#737373] transition-colors hover:bg-black/[0.04] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:bg-white/[0.08] dark:hover:text-white"
                >
                  Continue browsing
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!canPortal) return modalContent;

  return createPortal(modalContent, document.body);
}

