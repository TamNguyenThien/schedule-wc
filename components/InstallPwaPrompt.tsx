"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && window.navigator.standalone === true)
  );
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPwaPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (window.localStorage.getItem("wc2026.installPrompt.dismissed") === "true") return;

    const ios = isIosDevice();
    setIsIos(ios);
    setVisible(ios);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      setExpanded(true);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem("wc2026.installPrompt.dismissed", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-3 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white sm:bottom-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-700 text-white">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black">Cài WC 2026 như app</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600 dark:text-slate-300">
            {isIos
              ? "Trên iPhone/iPad, mở bằng Safari rồi dùng nút Chia sẻ để thêm vào màn hình chính."
              : "Cài lên màn hình chính để mở nhanh và dùng được như web app."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Ẩn hướng dẫn cài app"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isIos || expanded ? (
        <div className="mt-3 rounded-2xl bg-slate-100 p-3 text-xs font-bold leading-5 text-slate-700 dark:bg-white/10 dark:text-slate-200">
          <div className="flex items-center gap-2">
            <Share className="h-4 w-4 text-rose-700 dark:text-rose-300" />
            Safari: Share → Add to Home Screen → Add
          </div>
          <div className="mt-1 text-slate-500 dark:text-slate-400">
            Nếu đang mở trong Zalo, Facebook hoặc Chrome iOS, hãy copy link và mở lại bằng Safari.
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={installApp}
        className={cn(
          "mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white transition",
          isIos ? "bg-slate-900 dark:bg-white dark:text-slate-950" : "bg-rose-700 hover:bg-rose-800"
        )}
      >
        <Download className="h-4 w-4" />
        {isIos ? "Xem cách cài trên iPhone" : "Cài app"}
      </button>
    </div>
  );
}
