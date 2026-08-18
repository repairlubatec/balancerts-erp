import React from "react";
import { X, Plus, PanelTop } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WorkspaceTab = {
  path: string;
  label: string;
  icon: LucideIcon;
};

type WorkspaceTabBarProps = {
  tabs: WorkspaceTab[];
  activePath: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onNew: () => void;
};

export function WorkspaceTabBar({
  tabs,
  activePath,
  onSelect,
  onClose,
  onNew,
}: WorkspaceTabBarProps) {
  return (
    <div className="flex h-10 min-w-0 items-center border-b border-[#d8e3ef] bg-[#f6f9fc] px-2 shadow-[0_1px_0_rgba(18,62,112,0.03)]">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const active = tab.path === activePath;
          return (
            <div
              key={tab.path}
              className={cn(
                "group flex h-8 shrink-0 items-center gap-2 rounded-md border px-2.5 text-xs transition-colors",
                active
                  ? "border-[#b8d1ed] bg-white font-semibold text-[#102a43] shadow-sm"
                  : "border-transparent text-slate-500 hover:border-[#d8e3ef] hover:bg-white hover:text-[#305b88]",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(tab.path)}
                className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#1267d6]"
                aria-current={active ? "page" : undefined}
                title={`${tab.label} · Ctrl+${index + 1}`}
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-[#1267d6]" : "text-slate-400")} />
                <span className="max-w-36 truncate">{tab.label}</span>
              </button>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={() => onClose(tab.path)}
                  className="rounded p-0.5 text-slate-400 opacity-60 outline-none transition hover:bg-[#eaf1f9] hover:text-[#102a43] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#1267d6]"
                  aria-label={`Fechar ${tab.label}`}
                  title={`Fechar ${tab.label} · Ctrl+W`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1 border-l border-[#d8e3ef] pl-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onNew}
          className="h-7 w-7 text-slate-500 hover:bg-white hover:text-[#1267d6]"
          aria-label="Abrir módulo"
          title="Abrir módulo"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <span className="hidden items-center gap-1 px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 xl:flex">
          <PanelTop className="h-3 w-3" />
          Janela de trabalho
        </span>
      </div>
    </div>
  );
}
