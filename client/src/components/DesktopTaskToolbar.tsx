import React from "react";
import { Filter, Keyboard, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type DesktopTaskToolbarProps = {
  eyebrow: string;
  title: string;
  description: string;
  supportsRecordControls: boolean;
  onShortcuts: () => void;
  onNewRecord?: () => void;
  newRecordLabel?: string;
  onImport?: () => void;
  onFilter?: () => void;
  onSearch?: () => void;
};

export function DesktopTaskToolbar({ eyebrow, title, description, supportsRecordControls, onShortcuts, onNewRecord, newRecordLabel = "Novo registo", onImport, onFilter, onSearch }: DesktopTaskToolbarProps) {
  return <div className="border border-[#aeb8c4] bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-[#cbd3dc] bg-[#eef1f4] px-2 py-1.5">
      <span className="mr-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#1d568f]">{eyebrow}</span>
      {supportsRecordControls && <>
        <Button type="button" variant="ghost" size="sm" onClick={onFilter} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Filter className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Filtrar</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onSearch} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Search className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Procurar</Button>
      </>}
      <Button type="button" variant="ghost" size="sm" onClick={onShortcuts} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Keyboard className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Atalhos</Button>
      {supportsRecordControls && onImport && <Button type="button" variant="ghost" size="sm" onClick={onImport} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Plus className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Importar</Button>}
      {supportsRecordControls && <Button type="button" size="sm" onClick={onNewRecord} className="ml-auto h-7 rounded-sm bg-[#1267d6] px-2 text-[11px] text-white hover:bg-[#0f58b8]"><Plus className="mr-1.5 h-3.5 w-3.5" /> {newRecordLabel}</Button>}
    </div>
    <div className="px-3 py-2"><h1 className="text-base font-semibold text-[#1d2a38]">{title}</h1><p className="mt-0.5 text-[11px] text-[#6b7785]">{description}</p></div>
  </div>;
}
