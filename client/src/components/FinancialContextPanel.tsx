import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { focusNextField } from "@/lib/financialContext";
import { AccountingWorkbenchPanel, AccountingImportPanel } from "@/components/AccountingWorkbenchPanel";

type CompanyRow = { company: { id: number; name: string; nif: string; configurationStatus: "PENDING" | "READY" | "BLOCKED"; functionalCurrency: string } };
type Period = { period: { id: number; year: number; month: number; status: "OPEN" | "CLOSING" | "CLOSED" | "REOPENED" } };

type FinancialContextPanelProps = {
  moduleTitle: "Contabilidade" | "Tesouraria";
  activeCompanyId?: number;
  selectedPeriodId?: number;
  onCompanyChange: (companyId: number) => void;
  onPeriodChange: (periodId: number, year: number, month: number) => void;
};

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const statusText: Record<Period["period"]["status"], string> = { OPEN: "Aberto", CLOSING: "Em fecho", CLOSED: "Fechado", REOPENED: "Reaberto" };

export function FinancialContextPanel({ moduleTitle, activeCompanyId, selectedPeriodId, onCompanyChange, onPeriodChange }: FinancialContextPanelProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"calendar" | "companies">("calendar");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [companyChoice, setCompanyChoice] = useState<number | undefined>(activeCompanyId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [workspaceGroup, setWorkspaceGroup] = useState("Operações");
  const [operation, setOperation] = useState<"entry" | "import" | null>(null);
  const companies = trpc.companies.list.useQuery();
  const periods = trpc.companies.periods.useQuery({ companyId: companyChoice ?? activeCompanyId ?? 0 }, { enabled: Boolean(companyChoice ?? activeCompanyId) });
  const selectedCompany = (companies.data ?? []).find(({ company }) => company.id === (companyChoice ?? activeCompanyId))?.company;
  const selectedPeriod = (periods.data ?? []).find(({ period }) => period.id === selectedPeriodId)?.period;
  useEffect(() => {
    if (!periods.data?.length || !selectedCompany) return;
    const current = selectedPeriod;
    const openPeriods = periods.data.map(({ period }) => period).filter((period) => period.status === "OPEN").sort((a, b) => (b.year - a.year) || (b.month - a.month));
    if (!current || current.status !== "OPEN") {
      const fallback = openPeriods[0];
      if (fallback && fallback.id !== selectedPeriodId) onPeriodChange(fallback.id, fallback.year, fallback.month);
    }
  }, [periods.data, selectedCompany, selectedPeriod, selectedPeriodId, onPeriodChange]);
  const authorisedCompanies = useMemo(() => (companies.data ?? []).filter(({ company }) => company.configurationStatus === "READY"), [companies.data]);
  const yearOptions = useMemo(() => Array.from(new Set([currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4, ...(periods.data ?? []).map(({ period }) => period.year)])).sort((left, right) => right - left), [currentYear, periods.data]);
  const periodFor = (nextYear: number, nextMonth: number) => (periods.data ?? []).find(({ period }) => period.year === nextYear && period.month === nextMonth)?.period;

  useEffect(() => {
    if (selectedPeriod) { setYear(selectedPeriod.year); setMonth(selectedPeriod.month); }
    if (activeCompanyId) setCompanyChoice(activeCompanyId);
    if (!selectedPeriodId) setOpen(false);
  }, [activeCompanyId, selectedPeriod?.id, selectedPeriodId]);

  const applyPeriod = (nextYear: number, nextMonth: number) => {
    setYear(nextYear); setMonth(nextMonth);
    const period = periodFor(nextYear, nextMonth);
    if (period) onPeriodChange(period.id, period.year, period.month);
    else setFeedback(`Não existe período ${String(nextMonth).padStart(2, "0")}/${nextYear} para esta empresa.`);
  };
  const applyCompany = (nextCompanyId: number) => {
    const company = authorisedCompanies.find(({ company: row }) => row.id === nextCompanyId)?.company;
    if (!company) return setFeedback("A empresa seleccionada não está autorizada para operações financeiras.");
    setCompanyChoice(nextCompanyId); onCompanyChange(nextCompanyId); setFeedback(null);
    const nextPeriod = (periods.data ?? []).find(({ period }) => period.year === year && period.month === month)?.period;
    if (nextPeriod) onPeriodChange(nextPeriod.id, nextPeriod.year, nextPeriod.month);
  };
  const openSelector = () => { setFeedback(null); setCompanyChoice(activeCompanyId); setStep("calendar"); setOpen(true); };
  const chooseMonth = (nextMonth: number) => { setMonth(nextMonth); setStep("companies"); };
  const confirm = () => {
    if (!companyChoice) return setFeedback("Seleccione a empresa que pretende trabalhar.");
    const company = authorisedCompanies.find(({ company: row }) => row.id === companyChoice)?.company;
    if (!company) return setFeedback("A empresa seleccionada não está autorizada para operações financeiras.");
    const period = periodFor(year, month);
    if (!period) return setFeedback(`Não existe período ${String(month).padStart(2, "0")}/${year} para ${company.name}. Crie o período em Empresas antes de operar.`);
    onCompanyChange(company.id); onPeriodChange(period.id, period.year, period.month); setOpen(false); setFeedback(null);
  };

  return <>
    <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><CalendarDays className="h-4 w-4 text-[#1267d6]" /> Contexto financeiro · {moduleTitle}</CardTitle><p className="mt-1 text-xs text-slate-500">Empresa, exercício e período controlam directamente todas as operações deste módulo.</p></div>
        <Button type="button" size="sm" variant="outline" onClick={openSelector} className="bg-white">Configurações avançadas</Button>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-2 text-xs">
        <label className="grid gap-1"><span className="font-semibold uppercase tracking-[0.08em] text-[10px] text-[#687787]">Empresa</span><span className="inline-flex h-9 items-center gap-1 rounded border border-[#dbe5f1] bg-white px-2"><Building2 className="h-3.5 w-3.5 text-[#1267d6]" /><select aria-label="Empresa activa do contexto financeiro" value={companyChoice ?? ""} onChange={(event) => applyCompany(Number(event.target.value))} className="min-w-40 bg-transparent text-xs outline-none"><option value="" disabled>Seleccione a empresa</option>{authorisedCompanies.map(({ company }) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></span></label>
        <label className="grid gap-1"><span className="font-semibold uppercase tracking-[0.08em] text-[10px] text-[#687787]">Exercício</span><select aria-label="Exercício do contexto financeiro" value={year} onChange={(event) => applyPeriod(Number(event.target.value), month)} className="h-9 rounded border border-[#dbe5f1] bg-white px-2 text-xs">{yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        <label className="grid gap-1"><span className="font-semibold uppercase tracking-[0.08em] text-[10px] text-[#687787]">Período</span><select aria-label="Período do contexto financeiro" value={month} onChange={(event) => applyPeriod(year, Number(event.target.value))} className="h-9 min-w-32 rounded border border-[#dbe5f1] bg-white px-2 text-xs">{monthNames.map((name, index) => { const period = periodFor(year, index + 1); return <option key={name} value={index + 1}>{name}{period ? ` · ${statusText[period.status]}` : " · não criado"}</option>; })}</select></label>
        <span className={cn("mb-0 inline-flex h-9 items-center rounded border px-2", selectedPeriod?.status === "CLOSED" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{selectedPeriod ? `Período ${statusText[selectedPeriod.status]}` : "Período não seleccionado"}</span>
        {feedback && <span role="status" className="mb-2 font-semibold text-rose-700">{feedback}</span>}
      </CardContent>
    </Card>
    <Card className="mt-2 border-[#b9d2ef] bg-[#fbfcfd] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-[#dbe5f1] py-2"><div><CardTitle className="text-sm text-[#102a43]">{moduleTitle} — {selectedPeriod ? `${monthNames[selectedPeriod.month - 1]} ${selectedPeriod.year}` : `${monthNames[month - 1]} ${year}`}</CardTitle><p className="text-[11px] text-slate-500">Operações disponíveis no contexto seleccionado.</p></div>{moduleTitle === "Contabilidade" && <div className="flex gap-1"><Button type="button" size="sm" className="h-7 bg-[#1267d6] px-2 text-[11px]" onClick={() => { if (!selectedPeriod || selectedPeriod.status !== "OPEN") { setFeedback("Seleccione um período aberto antes de iniciar um lançamento."); return; } setOperation("entry"); }}>+ Novo lançamento</Button><Button type="button" size="sm" variant="outline" className="h-7 bg-white px-2 text-[11px]" onClick={() => { if (!selectedPeriod || selectedPeriod.status !== "OPEN") { setFeedback("Seleccione um período aberto antes de importar documentos."); return; } setOperation("import"); }}>Importar documento</Button></div>}</CardHeader>
      <CardContent className="space-y-2 p-2"><div className="flex gap-1 overflow-x-auto border-b border-[#dbe5f1] pb-2">{["Operações", "Tesouraria", "Terceiros", "Fiscal", "Existências", "Ativos", "Fecho", "Consultas"].map((group) => <Button key={group} type="button" size="sm" variant={workspaceGroup === group ? "default" : "outline"} className={cn("h-7 shrink-0 rounded-sm px-2 text-[10px]", workspaceGroup === group ? "bg-[#102a43] text-white hover:bg-[#173b5d]" : "bg-white")} onClick={() => setWorkspaceGroup(group)}>{group}</Button>)}</div><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{({"Operações":[["Lançamentos","Novo lançamento","/contabilidade?entry=new"],["Documentos","Importar","/documentos"],["Pesquisar","Registos","/contabilidade"]],"Tesouraria":[["Caixa","Movimentos","/tesouraria"],["Bancos","Movimentos","/tesouraria"],["Reconciliação","Conferir","/tesouraria"]],"Terceiros":[["Clientes","Consultar","/clientes"],["Fornecedores","Consultar","/fornecedores"],["Contas correntes","Consultar","/relatorios"]],"Fiscal":[["IVA","Apuramento","/fiscalidade"],["Declarações","Preparar","/fiscalidade"],["Registo fiscal","Consultar","/fiscalidade"]],"Existências":[["Inventário","Movimentos","/stock"],["Stock","Consultar","/stock"],["Custos","Analisar","/relatorios"]],"Ativos":[["Imobilizado","Consultar","/imobilizado"],["Depreciações","Executar","/imobilizado"],["Movimentos","Consultar","/imobilizado"]],"Fecho":[["Apuramento","Validar","/fecho"],["Fecho mensal","Abrir","/fecho"],["Fecho anual","Abrir","/fecho"]],"Consultas":[["Diário","Consultar","/relatorios"],["Razão","Consultar","/relatorios"],["Balancete","Abrir","/relatorios"]]} as Record<string, string[][]>)[workspaceGroup].map(([title, action, path]) => <button type="button" key={title} onClick={() => setLocation(path)} className="flex min-h-16 flex-col justify-between rounded-sm border border-[#dbe5f1] bg-white p-2 text-left transition-colors hover:border-[#1267d6] hover:bg-[#f4f8fd]"><span className="text-xs font-semibold text-[#102a43]">{title}</span><span className="text-[10px] text-[#1267d6]">{action} →</span></button>)}</div></CardContent>
    </Card>
    {operation && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172b42]/40 p-3" role="dialog" aria-modal="true" aria-label={operation === "entry" ? "Novo lançamento" : "Importar documento"}><div className="flex h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-sm border border-[#8d9baa] bg-[#f7f9fb] shadow-2xl"><div className="flex shrink-0 items-center justify-between border-b border-[#c3ccd6] bg-[#e8edf2] px-3 py-2"><div><p className="text-xs font-semibold text-[#1d2a38]">{operation === "entry" ? "Novo lançamento" : "Importar documento"}</p><p className="text-[10px] text-slate-500">{selectedCompany?.name ?? "Empresa activa"} · {selectedPeriod ? `${String(selectedPeriod.month).padStart(2, "0")}/${selectedPeriod.year}` : "Período não seleccionado"}</p></div><Button type="button" variant="ghost" size="icon" aria-label="Fechar operação" onClick={() => setOperation(null)} className="h-7 w-7"><X className="h-4 w-4" /></Button></div><div className="min-h-0 flex-1 overflow-hidden p-2">{operation === "entry" ? <AccountingWorkbenchPanel company={selectedCompany} periodId={selectedPeriod?.id} /> : <AccountingImportPanel company={selectedCompany} periodId={selectedPeriod?.id} />}</div></div></div>, document.body)}
    {open && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172b42]/35 p-4" role="dialog" aria-modal="true" aria-label={`Configurar contexto de ${moduleTitle}`}><div className="w-full max-w-3xl overflow-hidden rounded-sm border border-[#8d9baa] bg-[#f7f9fb] shadow-2xl"><div className="flex items-center justify-between border-b border-[#c3ccd6] bg-[#e8edf2] px-3 py-2"><div><p className="text-xs font-semibold text-[#1d2a38]">Configurações de contexto · {moduleTitle}</p><p className="text-[10px] text-slate-500">Alteração excepcional · Enter avança o campo activo</p></div><Button type="button" variant="ghost" size="icon" aria-label="Fechar janela" onClick={() => setOpen(false)} className="h-7 w-7"><X className="h-4 w-4" /></Button></div><div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr]">{step === "calendar" ? <form onKeyDown={focusNextField} onSubmit={(event) => { event.preventDefault(); setStep("companies"); }} className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#102a43]">Ano de exercício</h3><div className="flex items-center gap-1"><Button type="button" variant="outline" size="icon" aria-label="Ano anterior" onClick={() => setYear((value) => value - 1)} className="h-7 w-7"><ChevronLeft className="h-3.5 w-3.5" /></Button><input aria-label="Ano de exercício" type="number" min="1900" max={currentYear + 10} value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-7 w-20 rounded border border-[#c9d5e2] bg-white px-2 text-center text-xs" /><Button type="button" variant="outline" size="icon" aria-label="Ano seguinte" onClick={() => setYear((value) => value + 1)} className="h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></Button></div></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{monthNames.map((name, index) => { const monthNumber = index + 1; const isSelected = monthNumber === month; const isExisting = Boolean(periodFor(year, monthNumber)); return <Button key={name} type="button" variant="outline" onClick={() => chooseMonth(monthNumber)} className={cn("h-12 justify-start bg-white text-left text-xs", isSelected && "border-[#1267d6] bg-[#eaf3ff] text-[#1267d6]", !isExisting && "text-slate-400")}><span><span className="block font-semibold">{name}</span><span className="text-[10px]">{isExisting ? "Período criado" : "Sem período"}</span></span></Button>; })}</div><div className="flex justify-end"><Button type="submit" className="bg-[#1267d6] hover:bg-[#0f58b8]">Escolher empresa <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></form> : <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#102a43]">Empresas autorizadas</h3><Button type="button" variant="outline" size="sm" onClick={() => setStep("calendar")}>Voltar ao calendário</Button></div><div className="grid max-h-72 gap-2 overflow-y-auto">{authorisedCompanies.length === 0 ? <p className="rounded border border-dashed border-[#c9d6e4] bg-white p-4 text-xs text-slate-500">Não existem empresas autorizadas.</p> : authorisedCompanies.map(({ company }) => <button type="button" key={company.id} onClick={() => setCompanyChoice(company.id)} className={cn("flex items-center justify-between rounded border bg-white px-3 py-2 text-left", companyChoice === company.id ? "border-[#1267d6] bg-[#eaf3ff]" : "border-[#dbe5f1]")}><span><span className="block text-xs font-semibold text-[#1d2a38]">{company.name}</span><span className="text-[11px] text-slate-500">NIF {company.nif} · {company.functionalCurrency}</span></span>{companyChoice === company.id && <Check className="h-4 w-4 text-[#1267d6]" />}</button>)}</div><div className="flex items-center justify-end gap-2"><Button type="button" variant="outline" onClick={() => setStep("calendar")}>Voltar</Button><Button type="button" onClick={confirm} className="bg-[#1267d6] hover:bg-[#0f58b8]" disabled={!companyChoice || periods.isLoading}>Abrir contexto</Button></div></div>}<div className="hidden rounded border border-[#dbe5f1] bg-white p-3 text-xs text-slate-600 md:block"><p className="font-semibold text-[#102a43]">Ordem de trabalho</p><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Seleccione directamente a empresa, o exercício e o período.</li><li>Use configurações avançadas apenas para alteração excepcional.</li><li>Confirme o contexto para actualizar as operações.</li></ol></div></div></div></div>, document.body)}
  </>;
}
