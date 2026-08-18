import React, { type ReactNode } from "react";
import { Maximize2, Minimize2, PanelTop, Square, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DesktopWindowFrameProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  minimized?: boolean;
  maximized?: boolean;
  onFocus?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  children: ReactNode;
};

export function DesktopWindowFrame({
  title,
  subtitle,
  icon: Icon = PanelTop,
  minimized = false,
  maximized = false,
  onFocus,
  onMinimize,
  onMaximize,
  onClose,
  children,
}: DesktopWindowFrameProps) {
  if (minimized) {
    return (
      <div className="erp-window-minimized flex min-h-10 items-center justify-between border border-[#9eabb8] bg-[#f7f9fb] px-3 shadow-[0_2px_5px_rgba(24,43,65,0.12)]" role="region" aria-label={`${title} minimizada`}>
        <button type="button" onClick={onMinimize} className="flex min-w-0 items-center gap-2 text-left text-xs font-semibold text-[#173452] outline-none focus-visible:ring-2 focus-visible:ring-[#1267d6]">
          <Icon className="h-3.5 w-3.5 shrink-0 text-[#1267d6]" />
          <span className="truncate">{title}</span>
          {subtitle && <span className="hidden truncate text-[10px] font-normal text-[#708095] md:inline">{subtitle}</span>}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMinimize} aria-label={`Restaurar ${title}`} title="Restaurar janela" className="rounded-sm p-1 text-[#536273] hover:bg-[#e5edf6] hover:text-[#102a43] focus-visible:ring-2 focus-visible:ring-[#1267d6]"><Square className="h-3 w-3" /></button>
          {onClose && <button type="button" onClick={onClose} aria-label={`Fechar ${title}`} title="Fechar janela" className="rounded-sm p-1 text-[#536273] hover:bg-[#fbe7e7] hover:text-[#a62b2b] focus-visible:ring-2 focus-visible:ring-[#1267d6]"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
    );
  }

  return (
    <section className={cn("erp-internal-window flex min-h-0 flex-1 flex-col overflow-hidden border border-[#8f9eae] bg-[#f9fbfd] shadow-[0_3px_10px_rgba(24,43,65,0.18)]", maximized && "erp-internal-window--maximized")} onMouseDown={onFocus} onFocus={onFocus} aria-label={`${title} janela`}>
      <header className="erp-internal-window__titlebar flex min-h-8 shrink-0 items-center gap-2 border-b border-[#bcc7d3] bg-[linear-gradient(#f8fafc,#e3e9ef)] px-2 text-[#183653]">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#1267d6]" />
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-[11px] font-bold tracking-[0.02em]">{title}</h1>
          {subtitle && <p className="truncate text-[9px] font-medium uppercase tracking-[0.1em] text-[#75869a]">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 border-l border-[#c2ccd7] pl-1">
          {onMinimize && <button type="button" onClick={onMinimize} aria-label={`Minimizar ${title}`} title="Minimizar janela" className="rounded-sm p-1 text-[#536273] hover:bg-[#d8e5f3] hover:text-[#102a43] focus-visible:ring-2 focus-visible:ring-[#1267d6]"><Minimize2 className="h-3.5 w-3.5" /></button>}
          {onMaximize && <button type="button" onClick={onMaximize} aria-label={maximized ? `Restaurar ${title}` : `Maximizar ${title}`} title={maximized ? "Restaurar janela" : "Maximizar janela"} className="rounded-sm p-1 text-[#536273] hover:bg-[#d8e5f3] hover:text-[#102a43] focus-visible:ring-2 focus-visible:ring-[#1267d6]">{maximized ? <Square className="h-3 w-3" /> : <Maximize2 className="h-3.5 w-3.5" />}</button>}
          {onClose && <button type="button" onClick={onClose} aria-label={`Fechar ${title}`} title="Fechar janela" className="rounded-sm p-1 text-[#536273] hover:bg-[#fbe7e7] hover:text-[#a62b2b] focus-visible:ring-2 focus-visible:ring-[#1267d6]"><X className="h-3.5 w-3.5" /></button>}
        </div>
      </header>
      <div className="erp-internal-window__body min-h-0 flex-1 overflow-auto">{children}</div>
    </section>
  );
}
