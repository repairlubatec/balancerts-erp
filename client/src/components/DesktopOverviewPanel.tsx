import React from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Command, Filter, Info, MoreHorizontal, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CompanyRow = {
  name: string;
  nif: string;
  status: string;
  period: string;
  balance: string;
  close: number;
  pending: number;
  docs: number;
  tax: string;
  integrations: number;
  tasks: number;
};

type ActivityRow = { id: number | string; title: string; meta: string };
type ActionRow = { path: string; label: string; icon: React.ComponentType<{ className?: string }> };

type DesktopOverviewPanelProps = {
  companies: CompanyRow[];
  activities: ActivityRow[];
  actions: ActionRow[];
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: "TODOS" | "EM_DIA" | "CONFIGURACAO" | "BLOQUEADO";
  onStatusFilterChange: (status: "TODOS" | "EM_DIA" | "CONFIGURACAO" | "BLOQUEADO") => void;
  onOpenCompanies: () => void;
  onOpenCompany: (company: CompanyRow) => void;
  onOpenAudit: () => void;
  onOpenAction: (path: string) => void;
  onOpenNewCompany: () => void;
  volumeFacturado: string;
  aReceber: string;
  reconciliation: string;
  documentosPendentes: number;
  obrigacoesPendentes: number;
  prontidaoFiscal: string;
  companiesLoading: boolean;
  paletteOpen: boolean;
  paletteQuery: string;
  onPaletteQueryChange: (query: string) => void;
  onClosePalette: () => void;
};

function StatusCell({ status }: { status: string }) {
  const good = status === "Em dia";
  const bad = status === "Bloqueado";
  return <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", good ? "text-[#4f7e17]" : bad ? "text-[#b34848]" : "text-[#a26911]")}><span className={cn("h-1.5 w-1.5 rounded-full", good ? "bg-[#79c324]" : bad ? "bg-[#d85c5c]" : "bg-[#e4a438]")} />{status}</span>;
}

export function DesktopOverviewPanel({
  companies,
  activities,
  actions,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onOpenCompanies,
  onOpenCompany,
  onOpenAudit,
  onOpenAction,
  onOpenNewCompany,
  volumeFacturado,
  aReceber,
  reconciliation,
  documentosPendentes,
  obrigacoesPendentes,
  prontidaoFiscal,
  companiesLoading,
  paletteOpen,
  paletteQuery,
  onPaletteQueryChange,
  onClosePalette,
}: DesktopOverviewPanelProps) {
  const filteredActions = actions.filter(({ label }) => label.toLowerCase().includes(paletteQuery.toLowerCase()));
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#aeb8c4] bg-[#e6eaef] px-2 py-1.5 text-[11px]">
        <Button type="button" variant="ghost" size="sm" onClick={onOpenNewCompany} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Plus className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Nova empresa</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenCompanies} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><Search className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Ver todas</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onOpenAudit} className="h-7 rounded-sm px-2 text-[11px] text-[#1d2a38] hover:bg-white"><MoreHorizontal className="mr-1.5 h-3.5 w-3.5 text-[#1267d6]" /> Actividade</Button>
        <span className="mx-1 h-5 border-l border-[#bdc6d0]" />
        {actions.slice(0, 4).map(({ path, label, icon: Icon }) => <Button key={path} type="button" variant="ghost" size="sm" onClick={() => onOpenAction(path)} className="hidden h-7 rounded-sm px-2 text-[11px] text-[#536273] hover:bg-white lg:inline-flex"><Icon className="mr-1.5 h-3.5 w-3.5" />{label}</Button>)}
        <div className="ml-auto flex items-center gap-1.5"><Command className="h-3.5 w-3.5 text-[#6e7c8b]" /><span className="text-[10px] text-[#6e7c8b]">Ctrl/Cmd+K</span><Button type="button" variant="ghost" size="sm" onClick={() => setAboutOpen(true)} className="h-7 rounded-sm px-2 text-[11px] text-[#536273] hover:bg-white"><Info className="mr-1 h-3.5 w-3.5 text-[#1267d6]" /> Sobre</Button></div>
      </div>

      <div className="grid grid-cols-4 divide-x border border-[#bfc9d4] bg-[#fbfcfd]">
        {[["Facturação", volumeFacturado, "up"], ["A receber", aReceber, "up"], ["Pendências", String(documentosPendentes + obrigacoesPendentes), "up"], ["Reconciliação", reconciliation, reconciliation === "5/5" ? "up" : "down"]].map(([label, value, trend]) => <div key={label} className="min-w-0 px-3 py-2"><div className="flex items-center justify-between text-[10px] uppercase tracking-[0.1em] text-[#697888]"><span>{label}</span>{trend === "up" ? <ArrowUpRight className="h-3 w-3 text-[#5f9d1d]" /> : <ArrowDownRight className="h-3 w-3 text-[#b97818]" />}</div><div className="mt-1 text-base font-semibold text-[#1d2a38]">{value}</div></div>)}
      </div>

      <div className="border border-[#aeb8c4] bg-white">
        <div className="flex items-center gap-2 border-b border-[#cbd3dc] bg-[#eef1f4] px-2 py-1.5"><span className="text-xs font-semibold text-[#1d2a38]">Empresas autorizadas</span><span className="text-[10px] text-[#6b7785]">{companies.length} {companies.length === 1 ? "empresa" : "empresas"}</span><div className="ml-auto flex items-center gap-1"><Input ref={searchRef} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Pesquisar empresa ou NIF" className="h-7 w-48 rounded-sm border-[#bfc9d4] bg-white text-[11px]" /><Button type="button" variant="outline" size="sm" onClick={() => searchRef.current?.focus()} className="h-7 rounded-sm border-[#bfc9d4] bg-white px-2 text-[11px]"><Filter className="mr-1 h-3 w-3" /> Filtros</Button><select aria-label="Filtrar empresas por estado" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as "TODOS" | "EM_DIA" | "CONFIGURACAO" | "BLOQUEADO")} className="h-7 rounded-sm border border-[#bfc9d4] bg-white px-2 text-[11px]"><option value="TODOS">Todos os estados</option><option value="EM_DIA">Em dia</option><option value="CONFIGURACAO">Configuração</option><option value="BLOQUEADO">Bloqueado</option></select></div></div>
        <div className="overflow-x-auto">
          <table aria-label="Empresas autorizadas" className="w-full min-w-[780px] text-left text-[11px]">
            <thead className="border-b border-[#cbd3dc] bg-[#f5f6f8] text-[10px] uppercase tracking-[0.08em] text-[#687787]"><tr><th className="px-2 py-2">Empresa</th><th className="px-2 py-2">NIF</th><th className="px-2 py-2">Período</th><th className="px-2 py-2">Estado</th><th className="px-2 py-2">Fiscal</th><th className="px-2 py-2 text-right">Fecho</th><th className="w-8 px-2 py-2" /></tr></thead>
            <tbody className="divide-y divide-[#e0e5ea]">{companiesLoading ? <tr><td colSpan={7} className="px-3 py-5 text-center text-[#6b7785]">A carregar empresas…</td></tr> : companies.length === 0 ? <tr><td colSpan={7} className="px-3 py-5 text-center text-[#6b7785]">Nenhuma empresa autorizada na organização actual.</td></tr> : companies.map((company) => <tr key={company.nif} tabIndex={0} onDoubleClick={() => onOpenCompany(company)} onKeyDown={(event) => { if (event.key === "Enter") onOpenCompany(company); }} className="cursor-pointer outline-none hover:bg-[#f3f7fb] focus:bg-[#e7f0fa]"><td className="px-2 py-2 font-semibold text-[#1d568f]">{company.name}</td><td className="px-2 py-2 text-[#566574]">{company.nif}</td><td className="px-2 py-2 text-[#566574]">{company.period}</td><td className="px-2 py-2"><StatusCell status={company.status} /></td><td className="px-2 py-2 text-[#566574]">{company.tax}</td><td className="px-2 py-2 text-right text-[#566574]">{company.close}%</td><td className="px-2 py-2"><ChevronRight className="h-3.5 w-3.5 text-[#98a5b2]" /></td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="border border-[#aeb8c4] bg-white"><div className="flex items-center justify-between border-b border-[#cbd3dc] bg-[#eef1f4] px-2 py-1.5"><span className="text-xs font-semibold text-[#1d2a38]">Actividade recente</span><Button type="button" variant="ghost" size="sm" onClick={onOpenAudit} className="h-6 rounded-sm px-2 text-[10px] text-[#1d568f]">Abrir auditoria</Button></div><div className="divide-y divide-[#e0e5ea]">{activities.length === 0 ? <div className="px-3 py-4 text-[11px] text-[#6b7785]">Sem eventos persistidos no tenant actual.</div> : activities.map((event) => <div key={event.id} className="flex items-center gap-2 px-3 py-2 text-[11px]"><span className="h-1.5 w-1.5 rounded-full bg-[#1267d6]" /><span className="font-medium text-[#1d2a38]">{event.title}</span><span className="ml-auto text-[#7b8794]">{event.meta}</span></div>)}</div></div>
        <div className="border border-[#aeb8c4] bg-white"><div className="border-b border-[#cbd3dc] bg-[#eef1f4] px-2 py-1.5 text-xs font-semibold text-[#1d2a38]">Resumo operacional</div><div className="space-y-1 px-3 py-2 text-[11px] text-[#566574]"><div className="flex justify-between"><span>Documentos por validar</span><strong className="text-[#1d2a38]">{documentosPendentes}</strong></div><div className="flex justify-between"><span>Obrigações pendentes</span><strong className="text-[#1d2a38]">{obrigacoesPendentes}</strong></div><div className="flex justify-between"><span>Prontidão fiscal</span><strong className="text-[#a26911]">{prontidaoFiscal}</strong></div></div></div>
      </div>
      {paletteOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#172b42]/30 px-4 pt-[12vh] backdrop-blur-[1px]" onClick={onClosePalette}><div className="w-full max-w-lg border border-[#9eabb8] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2 border-b border-[#cbd3dc] bg-[#eef1f4] px-3 py-2"><Search className="h-4 w-4 text-[#667789]" /><input autoFocus value={paletteQuery} onChange={(event) => onPaletteQueryChange(event.target.value)} placeholder="Ir para módulo, empresa ou acção…" className="flex-1 bg-transparent text-sm outline-none" /><kbd className="border border-[#bfc9d4] bg-white px-1.5 py-0.5 text-[10px] text-[#667789]">ESC</kbd></div><div className="divide-y divide-[#e0e5ea]">{filteredActions.map(({ path, label, icon: Icon }) => <button key={path} type="button" onClick={() => { onOpenAction(path); onClosePalette(); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#1d2a38] hover:bg-[#e7f0fa]"><Icon className="h-3.5 w-3.5 text-[#1267d6]" />{label}<ChevronRight className="ml-auto h-3.5 w-3.5 text-[#98a5b2]" /></button>)}</div></div></div>}
      {aboutOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172b42]/30 px-4" onClick={() => setAboutOpen(false)}><div role="dialog" aria-modal="true" aria-labelledby="sobre-balancerts-titulo" className="w-full max-w-md border border-[#9eabb8] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-2 border-b border-[#cbd3dc] bg-[#eef1f4] px-3 py-2"><Info className="h-4 w-4 text-[#1267d6]" /><h2 id="sobre-balancerts-titulo" className="text-sm font-semibold text-[#1d2a38]">Sobre o BALANCERTS.ERP</h2><button type="button" aria-label="Fechar Sobre" onClick={() => setAboutOpen(false)} className="ml-auto text-lg leading-none text-[#687787] hover:text-[#1d2a38]">×</button></div><div className="space-y-3 p-4 text-xs text-[#566574]"><div><p className="text-base font-semibold text-[#1267d6]">BALANCERTS<span className="text-[#79c324]">.ERP</span></p><p className="mt-1">Gestão contabilística, fiscal e empresarial para Angola.</p></div><div className="border-t border-[#e0e5ea] pt-3"><p><strong className="text-[#1d2a38]">Copyright © Repair Lubatec</strong></p><p className="mt-1">Software criado pela Repair Lubatec.</p><p className="mt-1">Versão operacional interna · Preparação de distribuição</p></div><p className="border-t border-[#e0e5ea] pt-3 text-[10px] text-[#7b8794]">As integrações externas e a distribuição assinada permanecem fora da execução activa até existirem credenciais e validações reais.</p></div><div className="flex justify-end border-t border-[#d9e0e7] bg-[#f4f6f8] px-3 py-2"><Button type="button" size="sm" onClick={() => setAboutOpen(false)} className="h-7 rounded-sm bg-[#1267d6] text-[11px] hover:bg-[#0f58b8]">Fechar</Button></div></div></div>}
    </div>
  );
}
