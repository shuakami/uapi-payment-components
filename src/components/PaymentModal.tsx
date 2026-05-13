import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import QRCode from "qrcode";

import { cn } from "../lib/utils";

const SUPPORTED_PAYMENT_METHODS = ["wechat", "alipay"] as const;
const PAYMENT_MODAL_EXIT_DELAY_MS = 220;
const DESKTOP_MODAL_TRANSITION = {
  type: "spring",
  damping: 25,
  stiffness: 300,
  mass: 0.8,
} as const;

type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

function getMethodLabel(method: PaymentMethod) {
  return method === "wechat" ? "WeChat" : "Alipay";
}

function getMethodDisplayName(method: PaymentMethod) {
  return method === "wechat" ? "WeChat Pay" : "Alipay";
}

function getMethodLogo(method: PaymentMethod) {
  return method === "wechat"
    ? "https://pay.uapis.cn/WechatPay.svg"
    : "https://pay.uapis.cn/AliPay.svg";
}

function truncateMiddle(value: string, start = 8, end = 6) {
  if (value.length <= start + end + 3) return value;
  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatAmount(amountCents?: number, currency?: string) {
  const amount = (amountCents ?? 0) / 100;
  const amountText = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return { amountText, currencyText: (currency || "USD").toUpperCase() };
}

export interface DemoBillingPaymentOrder {
  orderId: string;
  productName?: string;
  productCode?: string;
  amountCents?: number;
  currency?: string;
  availablePaymentMethods?: string[];
  paymentDataByMethod?: Partial<Record<PaymentMethod, string>>;
}

export interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: DemoBillingPaymentOrder | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoSucceedMs?: number;
}

export function PaymentModal({
  open,
  onOpenChange,
  order,
  onSuccess,
  onCancel,
  autoSucceedMs = 0,
}: PaymentModalProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [renderedOrder, setRenderedOrder] =
    React.useState<DemoBillingPaymentOrder | null>(order);
  const [selectedMethod, setSelectedMethod] = React.useState<PaymentMethod>("wechat");
  const [displayedMethod, setDisplayedMethod] = React.useState<PaymentMethod>("wechat");
  const [isLoading, setIsLoading] = React.useState(false);
  const [paymentData, setPaymentData] = React.useState("");
  const [qrDataUrl, setQrDataUrl] = React.useState("");
  const activeOrder = order ?? renderedOrder;
  const closeCleanupTimerRef = React.useRef<number | null>(null);
  const requestIdRef = React.useRef(0);

  const supportedMethods = React.useMemo<PaymentMethod[]>(() => ["wechat", "alipay"], []);
  const selectedMethodIndex = Math.max(
    0,
    supportedMethods.findIndex((method) => method === selectedMethod),
  );
  const selectionWidth = `${100 / supportedMethods.length}%`;

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (order) setRenderedOrder(order);
  }, [order]);

  React.useEffect(() => {
    if (closeCleanupTimerRef.current) {
      window.clearTimeout(closeCleanupTimerRef.current);
      closeCleanupTimerRef.current = null;
    }
    if (open) return;
    closeCleanupTimerRef.current = window.setTimeout(() => {
      setRenderedOrder(null);
      setIsLoading(false);
      setPaymentData("");
      setQrDataUrl("");
    }, PAYMENT_MODAL_EXIT_DELAY_MS);
    return () => {
      if (closeCleanupTimerRef.current) {
        window.clearTimeout(closeCleanupTimerRef.current);
        closeCleanupTimerRef.current = null;
      }
    };
  }, [open]);

  const handleUserClose = React.useCallback(() => {
    onOpenChange(false);
    onCancel?.();
  }, [onCancel, onOpenChange]);

  const loadPaymentData = React.useCallback(
    async (method: PaymentMethod) => {
      if (!activeOrder?.orderId) return;
      const requestId = ++requestIdRef.current;
      setSelectedMethod(method);
      setIsLoading(true);
      setQrDataUrl("");
      const next =
        activeOrder.paymentDataByMethod?.[method] ??
        (method === "wechat"
          ? `weixin://wxpay/bizpayurl?pr=${activeOrder.orderId.slice(-8)}`
          : `https://qr.alipay.com/${activeOrder.orderId.slice(-12)}`);
      await new Promise((resolve) => setTimeout(resolve, 320));
      if (requestId !== requestIdRef.current) return;
      setDisplayedMethod(method);
      setPaymentData(next);
      setIsLoading(false);
    },
    [activeOrder?.orderId, activeOrder?.paymentDataByMethod],
  );

  React.useEffect(() => {
    if (!open || !activeOrder?.orderId) return;
    requestIdRef.current = 0;
    setPaymentData("");
    setQrDataUrl("");
    const initial = supportedMethods[0] || "wechat";
    setSelectedMethod(initial);
    setDisplayedMethod(initial);
    void loadPaymentData(initial);
  }, [open, activeOrder?.orderId, supportedMethods, loadPaymentData]);

  React.useEffect(() => {
    if (!open || !paymentData) return;
    let cancelled = false;
    QRCode.toDataURL(paymentData, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, paymentData]);

  React.useEffect(() => {
    if (!open || !activeOrder?.orderId || !autoSucceedMs) return;
    const timer = window.setTimeout(() => {
      onOpenChange(false);
      onSuccess?.();
    }, autoSucceedMs);
    return () => window.clearTimeout(timer);
  }, [open, activeOrder?.orderId, autoSucceedMs, onOpenChange, onSuccess]);

  if (!activeOrder) return null;

  const orderTitle = activeOrder.productName || "Product order";
  const orderSubtitle = "One-time purchase, digital delivery";
  const orderStatusText = isLoading ? "Loading" : "Awaiting payment";
  const desktopFootnote = "The product activates automatically after payment is confirmed.";
  const { amountText, currencyText } = formatAmount(activeOrder.amountCents, activeOrder.currency);
  const shortOrderId = truncateMiddle(activeOrder.orderId);
  const showCodeLoading = isLoading;
  const canPortal = typeof document !== "undefined";

  const renderCodeArea = (size: number) => {
    const logoSize = size >= 200 ? 28 : 24;
    const logoIconSize = displayedMethod === "wechat" ? logoSize - 10 : logoSize - 8;

    if (!qrDataUrl) {
      return (
        <div className="absolute inset-0 rounded-[12px] bg-[#F5F5F5] dark:bg-[#1f1f22]">
          <div className="payment-modal-skeleton-shimmer absolute inset-0" />
        </div>
      );
    }

    return (
      <>
        <img
          src={qrDataUrl}
          alt={`${getMethodDisplayName(displayedMethod)} QR code`}
          className="h-full w-full rounded-[12px] object-contain"
          draggable={false}
        />
        <div
          className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded bg-white dark:bg-[#161618]"
          style={{ width: `${logoSize}px`, height: `${logoSize}px` }}
        >
          <img
            src={getMethodLogo(displayedMethod)}
            alt={getMethodDisplayName(displayedMethod)}
            className="object-cover object-left"
            style={{ width: `${logoIconSize}px`, height: `${logoIconSize}px` }}
          />
        </div>
      </>
    );
  };

  const methodTabs = (compact = false) => (
    <div className={cn("relative flex rounded-full bg-black/[0.04] p-0.5 dark:bg-white/[0.06]", compact ? "w-full p-1" : "w-[200px]")}> 
      <div
        className={cn(
          "absolute z-0 rounded-full bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#161618]",
          compact ? "bottom-1 left-1 top-1" : "bottom-0.5 top-0.5",
        )}
        style={{
          width: compact ? `calc(${selectionWidth} - 8px)` : `calc(${selectionWidth} - 2px)`,
          transform: compact
            ? `translateX(calc(${selectedMethodIndex * 100}% + ${selectedMethodIndex * 8}px))`
            : `translateX(calc(${selectedMethodIndex * 100}% + ${selectedMethodIndex * 2}px))`,
        }}
      />
      {supportedMethods.map((method) => (
        <button
          type="button"
          key={method}
          onClick={() => {
            if (method === selectedMethod || isLoading) return;
            void loadPaymentData(method);
          }}
          className={cn("relative z-10 flex flex-1 items-center justify-center rounded-full outline-none", compact ? "h-[34px]" : "h-8")}
        >
          <img
            src={getMethodLogo(method)}
            alt={getMethodDisplayName(method)}
            className={cn(
              "transition-all duration-300",
              method === "wechat" ? "h-[14px]" : "h-[16px]",
              selectedMethod === method ? "scale-100 opacity-100 grayscale-0" : "scale-[0.98] opacity-50 grayscale hover:opacity-80",
            )}
          />
        </button>
      ))}
    </div>
  );

  const renderDesktopCard = () => (
    <div className="pointer-events-auto relative flex w-full max-w-[960px] uapi-payment-shell overflow-hidden rounded-[24px] bg-[#FAFAFA] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.10)] ring-1 ring-black/[0.08] dark:bg-[#111112] dark:ring-white/[0.08]">
      <div className="flex w-[420px] flex-col justify-between p-10">
        <div>
          <div className="mb-10 flex items-center gap-2.5">
            <img src="/favicon.png" alt="Logo" className="h-5 w-5" />
            <span className="text-[14px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">
              Xiaoyueyoqwq
            </span>
          </div>

          <h1 className="mb-1 text-xl font-medium tracking-tight text-[#171717] dark:text-[#EDEDED]">
            {orderTitle}
          </h1>
          <p className="mb-8 text-[13px] text-[#737373] dark:text-[#A3A3A3]">{orderSubtitle}</p>

          <div className="mb-8 flex items-baseline gap-1.5 border-b border-black/[0.04] pb-8 dark:border-white/[0.08]">
            <span className="text-sm font-medium text-[#737373] dark:text-[#A3A3A3]">{currencyText}</span>
            <span className="text-[40px] font-semibold leading-none tracking-tight text-[#171717] dark:text-[#EDEDED]">
              {amountText}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#737373] dark:text-[#A3A3A3]">Order ID</span>
              <span className="font-mono text-[#171717] dark:text-[#EDEDED]">{shortOrderId}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[#737373] dark:text-[#A3A3A3]">Status</span>
              <span className="font-medium text-[#171717] dark:text-[#EDEDED]">{orderStatusText}</span>
            </div>
          </div>
        </div>

        <p className="mt-12 text-[11px] leading-[1.6] text-[#A3A3A3] dark:text-[#737373]">
          Payment confirmation is simulated for the documentation demo. In production, connect this panel to your order status API.
        </p>
      </div>

      <div className="relative flex min-h-[460px] flex-1 flex-col items-center justify-start border-l border-black/[0.04] bg-white p-12 pt-[72px] dark:border-white/[0.08] dark:bg-[#161618]">
        <button
          type="button"
          onClick={handleUserClose}
          className="absolute right-6 top-6 z-20 flex h-8 w-8 items-center justify-center rounded-full text-[#737373] transition-colors hover:bg-black/[0.04] hover:text-[#171717] dark:text-[#A3A3A3] dark:hover:bg-white/[0.08] dark:hover:text-white"
          aria-label="Close payment modal"
        >
          <X className="h-4 w-4 stroke-2" />
        </button>

        <div className="flex w-full max-w-[280px] flex-col items-center">
          <div className="mb-12">{methodTabs()}</div>

          <div className="relative mb-6">
            <div className="relative flex h-[200px] w-[200px] items-center justify-center rounded-[16px] border border-black/[0.04] bg-white p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#161618]">
              <div
                className={cn(
                  "absolute inset-4 overflow-hidden rounded-[8px] border border-black/[0.02] transition-opacity duration-400 ease-out dark:border-white/[0.06]",
                  showCodeLoading ? "z-10 opacity-100 delay-100" : "z-0 opacity-0",
                )}
              >
                <div className="payment-modal-skeleton-shimmer absolute inset-0 bg-[#FAFAFA]/50" />
              </div>
              <div className={cn("relative h-full w-full transition-all duration-500 ease-out", showCodeLoading ? "blur-sm opacity-0" : "delay-150 opacity-100 blur-0")}>
                {renderCodeArea(200)}
              </div>
            </div>
          </div>

          <p className="text-center text-[13px] font-medium text-[#737373] dark:text-[#A3A3A3]">
            Scan with <span className="text-[#171717] dark:text-[#EDEDED]">{getMethodLabel(displayedMethod)}</span> to pay
          </p>
          <p className="mt-4 text-center text-[11px] text-[#A3A3A3] dark:text-[#737373]">{desktopFootnote}</p>
        </div>
      </div>
    </div>
  );

  const renderMobileCard = () => (
    <div className="relative flex w-full flex-col bg-[#FAFAFA] uapi-payment-sheet px-5 pb-6 pt-6 dark:bg-[#111112]">
      <div className="mb-6 flex items-start justify-between px-1">
        <div className="flex min-w-0 flex-col">
          <span className="mb-2 text-[13px] font-semibold tracking-tight text-[#171717] dark:text-[#EDEDED]">Xiaoyueyoqwq</span>
          <h1 className="mb-0.5 text-[16px] font-medium tracking-tight text-[#171717] dark:text-[#EDEDED]">{orderTitle}</h1>
          <span className="font-mono text-[12px] text-[#737373] dark:text-[#A3A3A3]">{shortOrderId}</span>
        </div>
        <div className="flex flex-col items-end pt-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[15px] font-medium text-[#171717] dark:text-[#EDEDED]">$</span>
            <span className="text-[32px] font-bold leading-none tracking-tight text-[#171717] dark:text-[#EDEDED]">{amountText}</span>
          </div>
          <span className="mt-1 text-[12px] font-medium text-[#737373] dark:text-[#A3A3A3]">{orderStatusText}</span>
        </div>
      </div>

      <div className="mb-6 flex w-full flex-col items-center rounded-[24px] bg-white p-5 dark:bg-[#161618]">
        <div className="mb-6 w-full">{methodTabs(true)}</div>
        <div className="relative mb-6 flex h-[180px] w-[180px] items-center justify-center">
          <div className={cn("absolute inset-0 overflow-hidden rounded-[12px] transition-opacity duration-400 ease-out", showCodeLoading ? "z-10 opacity-100 delay-100" : "z-0 opacity-0")}>
            <div className="payment-modal-skeleton-shimmer absolute inset-0 bg-[#F5F5F5] dark:bg-[#1f1f22]" />
          </div>
          <div className={cn("relative h-full w-full transition-all duration-500 ease-out", showCodeLoading ? "blur-sm opacity-0" : "delay-150 opacity-100 blur-0")}>
            {renderCodeArea(180)}
          </div>
        </div>
        <p className="text-center text-[13px] font-medium text-[#737373] dark:text-[#A3A3A3]">
          Save or scan this code with <span className="text-[#171717] dark:text-[#EDEDED]">{getMethodLabel(displayedMethod)}</span>
        </p>
      </div>
      <p className="text-center text-[11px] text-[#A3A3A3] dark:text-[#737373]">{desktopFootnote}</p>
    </div>
  );

  const modalContent = (
    <>
      <AnimatePresence>
        {open && !isMobile && (
          <>
            <motion.div
              key="payment-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[2147483600] bg-white/80 backdrop-blur-[2px] dark:bg-black/70"
              onClick={handleUserClose}
            />
            <motion.div
              key="payment-modal-panel"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={DESKTOP_MODAL_TRANSITION}
              className="fixed left-1/2 top-1/2 z-[2147483601] w-[calc(100vw-48px)] max-w-[960px] -translate-x-1/2 -translate-y-1/2"
            >
              {renderDesktopCard()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && isMobile && (
          <>
            <motion.div
              key="payment-mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[2147483600] bg-white/80 backdrop-blur-[2px] dark:bg-black/70"
              onClick={handleUserClose}
            />
            <motion.div
              key="payment-mobile-drawer"
              className="fixed bottom-0 left-0 right-0 z-[2147483601] mt-0 max-h-[82vh] overflow-hidden rounded-t-[20px] bg-[#FAFAFA] [padding-bottom:env(safe-area-inset-bottom)] dark:bg-[#111112]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 350 }}
            >
              <div className="absolute left-1/2 top-3 z-[110] h-1.5 w-[36px] -translate-x-1/2 rounded-full bg-black/10 dark:bg-white/20" />
              <div className="relative mt-6 h-full w-full overflow-x-hidden overflow-y-auto">{renderMobileCard()}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );

  if (!canPortal) return modalContent;

  return createPortal(modalContent, document.body);
}

