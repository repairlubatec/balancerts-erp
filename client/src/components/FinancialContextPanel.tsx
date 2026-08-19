import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { focusNextField } from "@/lib/financialContext";

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


export function FinancialContextPanel({ moduleTitle, activeCompanyId, selectedPeriodId, onCompanyChange, onPeriodChange }: FinancialContextPanelProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"calendar" | "companies">("calendar");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [companyChoice, setCompanyChoice] = useState<number | undefined>(activeCompanyId);
  const [feedback, setFeedback] = useState<string | null>(null);
  const companies = trpc.companies.list.useQuery();
  const periods = trpc.companies.periods.useQuery({ companyId: companyChoice ?? activeCompanyId ?? 0 }, { enabled: Boolean(companyChoice ?? activeCompanyId) });
  const selectedCompany = (companies.data ?? []).find(({ company }) => company.id === (companyChoice ?? activeCompanyId))?.company;
  const matchingPeriod = (periods.data ?? []).find(({ period }) => period.year === year && period.month === month)?.period;
  const selectedPeriod = (periods.data ?? []).find(({ period }) => period.id === selectedPeriodId)?.period;
  const authorisedCompanies = useMemo(() => (companies.data ?? []).filter(({ company }) => company.configurationStatus === "READY"), [companies.data]);

  useEffect(() => {
    if (selectedPeriod) { setYear(selectedPeriod.year); setMonth(selectedPeriod.month); }
    if (!selectedPeriodId) setOpen(true);
  }, [selectedPeriod?.id, selectedPeriodId]);

  const openSelector = () => {
    setFeedback(null);
    setCompanyChoice(activeCompanyId);
    setStep("calendar");
    setOpen(true);
  };
  const chooseMonth = (nextMonth: number) => {
    setMonth(nextMonth);
    setStep("companies");
  };
  const confirm = () => {
    if (!companyChoice) return setFeedback("Seleccione a empresa que pretende trabalhar.");
    const company = authorisedCompanies.find(({ company: row }) => row.id === companyChoice)?.company;
    if (!company) return setFeedback("A empresa seleccionada não está autorizada para operações financeiras.");
    const period = (periods.data ?? []).find(({ period: row }) => row.year === year && row.month === month)?.period;
    if (!period) return setFeedback(`Não existe período ${String(month).padStart(2, "0")}/${year} para ${company.name}. Crie o período em Empresas antes de operar.`);
    onCompanyChange(company.id);
    onPeriodChange(period.id, period.year, period.month);
    setOpen(false);
    setFeedback(null);
  };

  return <>
    <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><CalendarDays className="h-4 w-4 text-[#1267d6]" /> Contexto financeiro · {moduleTitle}</CardTitle><p className="mt-1 text-xs text-slate-500">Escolha o exercício/período no calendário e, depois, a empresa autorizada para trabalhar.</p></div>
        <Button type="button" size="sm" onClick={openSelector} className="bg-[#1267d6] hover:bg-[#0f58b8]">Alterar contexto</Button>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 text-xs"><span className="inline-flex items-center gap-1 rounded border border-[#dbe5f1] bg-white px-2 py-1"><Building2 className="h-3.5 w-3.5 text-[#1267d6]" />{selectedCompany?.name ?? "Empresa não seleccionada"}</span><span className="rounded border border-[#dbe5f1] bg-white px-2 py-1">Exercício: {selectedPeriod ? selectedPeriod.year : year}</span><span className="rounded border border-[#dbe5f1] bg-white px-2 py-1">Período: {selectedPeriod ? `${String(selectedPeriod.month).padStart(2, "0")}/${selectedPeriod.year}` : "não seleccionado"}</span>{feedback && <span role="status" className="font-semibold text-rose-700">{feedback}</span>}</CardContent>
    </Card>
    {open && createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172b42]/35 p-4" role="dialog" aria-modal="true" aria-label={`Escolher contexto de ${moduleTitle}`}><div className="w-full max-w-3xl overflow-hidden rounded-sm border border-[#8d9baa] bg-[#f7f9fb] shadow-2xl"><div className="flex items-center justify-between border-b border-[#c3ccd6] bg-[#e8edf2] px-3 py-2"><div><p className="text-xs font-semibold text-[#1d2a38]">Contexto de {moduleTitle}</p><p className="text-[10px] text-slate-500">Passo {step === "calendar" ? "1" : "2"} de 2 · Enter avança o campo activo</p></div><Button type="button" variant="ghost" size="icon" aria-label="Fechar janela" onClick={() => setOpen(false)} className="h-7 w-7"><X className="h-4 w-4" /></Button></div><div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr]">{step === "calendar" ? <form onKeyDown={focusNextField} onSubmit={(event) => { event.preventDefault(); setStep("companies"); }} className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#102a43]">Ano de exercício</h3><div className="flex items-center gap-1"><Button type="button" variant="outline" size="icon" aria-label="Ano anterior" onClick={() => setYear((value) => value - 1)} className="h-7 w-7"><ChevronLeft className="h-3.5 w-3.5" /></Button><input aria-label="Ano de exercício" type="number" min="1900" max={currentYear + 10} value={year} onChange={(event) => setYear(Number(event.target.value))} className="h-7 w-20 rounded border border-[#c9d5e2] bg-white px-2 text-center text-xs" /><Button type="button" variant="outline" size="icon" aria-label="Ano seguinte" onClick={() => setYear((value) => value + 1)} className="h-7 w-7"><ChevronRight className="h-3.5 w-3.5" /></Button></div></div><div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{monthNames.map((name, index) => { const monthNumber = index + 1; const isSelected = monthNumber === month; const isExisting = Boolean((periods.data ?? []).some(({ period }) => period.year === year && period.month === monthNumber)); return <Button key={name} type="button" variant="outline" onClick={() => chooseMonth(monthNumber)} className={cn("h-12 justify-start bg-white text-left text-xs", isSelected && "border-[#1267d6] bg-[#eaf3ff] text-[#1267d6]", !isExisting && "text-slate-400")}><span><span className="block font-semibold">{name}</span><span className="text-[10px]">{isExisting ? "Período criado" : "Sem período"}</span></span></Button>; })}</div><div className="flex justify-end"><Button type="submit" className="bg-[#1267d6] hover:bg-[#0f58b8]">Escolher empresa <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></div></form> : <div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-[#102a43]">Empresas autorizadas</h3><Button type="button" variant="outline" size="sm" onClick={() => setStep("calendar")}>Voltar ao calendário</Button></div><div className="grid max-h-72 gap-2 overflow-y-auto">{authorisedCompanies.length === 0 ? <p className="rounded border border-dashed border-[#c9d6e4] bg-white p-4 text-xs text-slate-500">Não existem empresas autorizadas.</p> : authorisedCompanies.map(({ company }) => <button type="button" key={company.id} onClick={() => setCompanyChoice(company.id)} className={cn("flex items-center justify-between rounded border bg-white px-3 py-2 text-left", companyChoice === company.id ? "border-[#1267d6] bg-[#eaf3ff]" : "border-[#dbe5f1]")}><span><span className="block text-xs font-semibold text-[#1d2a38]">{company.name}</span><span className="text-[11px] text-slate-500">NIF {company.nif} · {company.functionalCurrency}</span></span>{companyChoice === company.id && <Check className="h-4 w-4 text-[#1267d6]" />}</button>)}</div><div className="flex items-center justify-end gap-2"><Button type="button" variant="outline" onClick={() => setStep("calendar")}>Voltar</Button><Button type="button" onClick={confirm} className="bg-[#1267d6] hover:bg-[#0f58b8]" disabled={!companyChoice || periods.isLoading}>Abrir contexto</Button></div>{matchingPeriod && <p className="text-xs text-[#477514]">Período encontrado: {String(matchingPeriod.month).padStart(2, "0")}/{matchingPeriod.year} · {matchingPeriod.status === "OPEN" ? "Aberto" : matchingPeriod.status}</p>}</div>}<div className="hidden rounded border border-[#dbe5f1] bg-white p-3 text-xs text-slate-600 md:block"><p className="font-semibold text-[#102a43]">Ordem de trabalho</p><ol className="mt-2 list-decimal space-y-1 pl-4"><li>Seleccione o ano de exercício.</li><li>Escolha o mês no calendário.</li><li>Escolha a empresa autorizada.</li><li>Confirme para abrir o módulo nesse contexto.</li></ol></div></div></div></div>, document.body)}
  </>;
}

