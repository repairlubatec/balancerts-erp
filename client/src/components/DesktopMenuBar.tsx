import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, HelpCircle, Minus, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DesktopMenuBarProps = {
  activeModule?: string;
  onCommand: (command: string) => void;
};

type MenuDefinition = {
  label: string;
  command: string;
  items: Array<{ label: string; command: string; separatorBefore?: boolean }>;
};

const menus: MenuDefinition[] = [
  {
    label: "Ficheiro",
    command: "file",
    items: [
      { label: "Nova empresa", command: "new-company" },
      { label: "Novo documento", command: "new-document" },
      { label: "Abrir Minhas Empresas", command: "file" },
      { label: "Actualizar dados", command: "refresh", separatorBefore: true },
    ],
  },
  {
    label: "Editar",
    command: "edit",
    items: [
      { label: "Editar registo activo", command: "edit" },
      { label: "Desfazer última acção", command: "undo" },
      { label: "Repetir última acção", command: "redo" },
    ],
  },
  {
    label: "Ver",
    command: "view",
    items: [
      { label: "Mostrar/ocultar painel lateral", command: "view" },
      { label: "Actualizar janela", command: "refresh" },
      { label: "Atalhos de teclado", command: "shortcuts", separatorBefore: true },
    ],
  },
  {
    label: "Operações",
    command: "operations",
    items: [
      { label: "Facturação", command: "operations" },
      { label: "Tesouraria", command: "treasury" },
      { label: "Centro de Tarefas", command: "tasks" },
      { label: "Recursos Humanos", command: "hr" },
    ],
  },
  {
    label: "Relatórios",
    command: "reports",
    items: [
      { label: "Relatórios de controlo", command: "reports" },
      { label: "Auditoria", command: "audit" },
      { label: "Fiscalidade", command: "fiscal" },
    ],
  },
  {
    label: "Janela",
    command: "window",
    items: [
      { label: "Próxima janela", command: "window" },
      { label: "Maximizar/restaurar", command: "shell-maximize" },
      { label: "Minimizar janela", command: "shell-minimize" },
      { label: "Fechar janela activa", command: "shell-close", separatorBefore: true },
    ],
  },
];

export function DesktopMenuBar({ activeModule, onCommand }: DesktopMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const execute = (command: string) => {
    setOpenMenu(null);
    onCommand(command);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpenMenu(menus[index].command);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      (event.currentTarget.parentElement?.children[(index + 1) % menus.length] as HTMLElement)?.focus();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      (event.currentTarget.parentElement?.children[(index - 1 + menus.length) % menus.length] as HTMLElement)?.focus();
    }
  };

  return (
    <div ref={barRef} className="erp-window-chrome flex h-8 items-center border-b border-[#182b41] bg-[#172b42] px-2 text-[11px] text-[#dce8f5]">
      <div className="mr-3 flex items-center gap-2 border-r border-white/10 pr-3" title="BALANCERTS.ERP — aplicação Windows">
        <span className="font-black tracking-[0.01em] text-white">BALANCERTS</span>
        <span className="font-semibold tracking-[0.02em] text-[#8cc63f]">.ERP</span>
      </div>
      <nav className="flex h-full min-w-0 max-w-[48vw] items-center gap-0.5 overflow-visible md:max-w-none" aria-label="Menu da aplicação">
        {menus.map((menu, index) => {
          const isOpen = openMenu === menu.command;
          return (
            <div key={menu.command} className="relative h-full flex items-center">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() => setOpenMenu(isOpen ? null : menu.command)}
                onKeyDown={(event) => handleMenuKeyDown(event, index)}
                className={cn("flex h-6 items-center gap-1 rounded-sm px-2 outline-none hover:bg-white/10 focus-visible:bg-white/15 focus-visible:ring-1 focus-visible:ring-[#78b5ff]", isOpen && "bg-white/15")}
              >
                {menu.label}
                <ChevronDown className="h-3 w-3 text-[#91a9c2]" />
              </button>
              {isOpen && (
                <div role="menu" aria-label={menu.label} className="absolute left-0 top-7 z-[100] min-w-52 overflow-hidden rounded-sm border border-[#9eafc2] bg-[#f8fafc] py-1 text-[12px] text-[#1d2a38] shadow-[0_8px_24px_rgba(15,39,64,0.28)]">
                  {menu.items.map((item) => (
                    <React.Fragment key={item.command}>
                      {item.separatorBefore && <div className="my-1 border-t border-[#d7e0ea]" />}
                      <button type="button" role="menuitem" onClick={() => execute(item.command)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-[#dceafd] focus:bg-[#dceafd] focus:outline-none">
                        {item.label}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="ml-auto hidden items-center gap-2 md:flex" aria-label="Estado da janela">
        {activeModule && <span className="hidden border-l border-white/10 pl-3 text-[#a7bdd5] md:inline">Módulo: <strong className="text-white">{activeModule}</strong></span>}
        <button type="button" onClick={() => execute("help")} aria-label="Ajuda" title="Ajuda e atalhos" className="rounded-sm p-1 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><HelpCircle className="h-3.5 w-3.5" /></button>
        <div className="ml-1 flex items-center gap-0.5 border-l border-white/10 pl-2" aria-label="Controlos da janela activa">
          <button type="button" onClick={() => execute("shell-minimize")} aria-label="Minimizar janela activa" title="Minimizar janela activa" className="rounded-sm p-0.5 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><Minus className="h-3.5 w-3.5 text-[#a7bdd5]" /></button>
          <button type="button" onClick={() => execute("shell-maximize")} aria-label="Maximizar ou restaurar janela activa" title="Maximizar/restaurar janela activa" className="rounded-sm p-0.5 hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><Square className="h-3 w-3 text-[#a7bdd5]" /></button>
          <button type="button" onClick={() => execute("shell-close")} aria-label="Fechar janela activa" title="Fechar janela activa" className="rounded-sm p-0.5 hover:bg-[#b22d3b] hover:text-white focus-visible:ring-1 focus-visible:ring-[#78b5ff]"><X className="h-3.5 w-3.5 text-[#a7bdd5]" /></button>
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
