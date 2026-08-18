import React from "react";
import { ChevronDown, HelpCircle, Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DesktopMenuBarProps = {
  activeModule?: string;
  onCommand: (command: string) => void;
};

const menus = [
  { label: "Ficheiro", command: "file" },
  { label: "Editar", command: "edit" },
  { label: "Ver", command: "view" },
  { label: "Operações", command: "operations" },
  { label: "Relatórios", command: "reports" },
  { label: "Janela", command: "window" },
];

export function DesktopMenuBar({ activeModule, onCommand }: DesktopMenuBarProps) {
  return (
    <div className="erp-window-chrome flex h-8 items-center border-b border-[#182b41] bg-[#172b42] px-2 text-[11px] text-[#dce8f5]">
      <div className="mr-3 flex items-center gap-2 border-r border-white/10 pr-3" title="BALANCERTS.ERP — aplicação Windows">
        <span className="font-black tracking-[0.01em] text-white">BALANCERTS</span>
        <span className="font-semibold tracking-[0.02em] text-[#8cc63f]">.ERP</span>
      </div>
      <nav className="flex h-full min-w-0 max-w-[48vw] items-center gap-0.5 overflow-x-auto md:max-w-none" aria-label="Menu da aplicação">
        {menus.map((menu) => (
          <button
            key={menu.command}
            type="button"
            onClick={() => onCommand(menu.command)}
            className="flex h-6 items-center gap-1 rounded-sm px-2 outline-none hover:bg-white/10 focus-visible:bg-white/15 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"
          >
            {menu.label}
            <ChevronDown className="h-3 w-3 text-[#91a9c2]" />
          </button>
        ))}
      </nav>
      <div className="ml-auto hidden items-center gap-2 md:flex" aria-label="Estado da janela">
        {activeModule && <span className="hidden border-l border-white/10 pl-3 text-[#a7bdd5] md:inline">Módulo: <strong className="text-white">{activeModule}</strong></span>}
        <button type="button" onClick={() => onCommand("help")} aria-label="Ajuda" className="rounded-sm p-1 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><HelpCircle className="h-3.5 w-3.5" /></button>
        <div className="ml-1 flex items-center gap-0.5 border-l border-white/10 pl-2" aria-label="Controlos da janela activa">
          <button type="button" onClick={() => onCommand("shell-minimize")} aria-label="Minimizar janela activa" title="Minimizar janela activa" className="rounded-sm p-0.5 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><Minus className="h-3.5 w-3.5 text-[#a7bdd5]" /></button>
          <button type="button" onClick={() => onCommand("shell-maximize")} aria-label="Maximizar ou restaurar janela activa" title="Maximizar/restaurar janela activa" className="rounded-sm p-0.5 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><Square className="h-3 w-3 text-[#a7bdd5]" /></button>
          <button type="button" onClick={() => onCommand("shell-close")} aria-label="Fechar janela activa" title="Fechar janela activa" className="rounded-sm p-0.5 hover:bg-[#b22d3b] hover:text-white focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><X className="h-3.5 w-3.5 text-[#a7bdd5]" /></button>
        </div>
      </div>
    </div>
  );
}

export function DesktopStatusBar({ module, company, period }: { module?: string; company?: string; period?: string }) {
  return (
    <div className={cn("erp-statusbar flex min-h-6 items-center gap-3 border-t border-[#aeb8c4] bg-[#e6eaef] px-3 py-1 text-[10px] text-[#536273]", "font-medium")} role="status">
      <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#70ae20]" /> Sistema operacional</span>
      {module && <span className="border-l border-[#b9c2cc] pl-3">{module}</span>}
      {company && <span className="hidden border-l border-[#b9c2cc] pl-3 lg:inline">Empresa: {company}</span>}
      {period && <span className="hidden border-l border-[#b9c2cc] pl-3 lg:inline">Período: {period}</span>}
      <span className="ml-auto hidden sm:inline">BAL-REQ-ACC-001 · Preparação AGT</span>
    </div>
  );
}
