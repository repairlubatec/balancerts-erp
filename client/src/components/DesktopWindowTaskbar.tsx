import React from "react";
import type { LucideIcon } from "lucide-react";
import { PanelTop } from "lucide-react";
import { cn } from "@/lib/utils";

export type DesktopTaskbarWindow = {
  path: string;
  label: string;
  icon: LucideIcon;
  minimized?: boolean;
};

type DesktopWindowTaskbarProps = {
  windows: DesktopTaskbarWindow[];
  activePath: string;
  onSelect: (path: string) => void;
};

export function DesktopWindowTaskbar({ windows, activePath, onSelect }: DesktopWindowTaskbarProps) {
  return (
    <div className="erp-window-taskbar flex min-h-8 items-center gap-1 overflow-x-auto border-t border-[#9eabb8] bg-[#d8dee5] px-2 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="toolbar" aria-label="Barra de tarefas das janelas">
      <span className="mr-1 flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#647487]"><PanelTop className="h-3 w-3" /> Janelas</span>
      {windows.map((window) => {
        const Icon = window.icon;
        const active = window.path === activePath;
        return (
          <button
            key={window.path}
            type="button"
            onClick={() => onSelect(window.path)}
            aria-pressed={active}
            title={`${window.label}${window.minimized ? " · minimizada" : ""}`}
            className={cn("flex h-6 max-w-44 shrink-0 items-center gap-1.5 border px-2 text-[10px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#1267d6]", active ? "border-[#8ca9c5] bg-[#f8fafc] font-semibold text-[#173452] shadow-[inset_0_1px_0_white]" : "border-transparent text-[#5e6d7e] hover:border-[#b7c4d1] hover:bg-[#edf1f5]", window.minimized && "italic opacity-80")}
          >
            <Icon className={cn("h-3 w-3 shrink-0", active ? "text-[#1267d6]" : "text-[#7a8a9b]")} />
            <span className="truncate">{window.label}</span>
          </button>
        );
      })}
    </div>
  );
}
