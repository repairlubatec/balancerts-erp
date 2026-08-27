import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  FileWarning,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type FiscalControlPanelProps = { companyId?: number; periodId?: number; regime?: string };
type CalendarEntry = {
  code: string;
  tax: string;
  title: string;
  regime: string;
  periodicity: string;
  deadlineType: string;
  sourceStatus: "CONFIRMED" | "PENDING_REVIEW" | "BLOCKED";
  sourcePage: number;
  dueDate: string | null;
  month?: number;
  alert: "BLOCKED" | "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "SCHEDULED";
  daysUntilDue: number | null;
};
type ChecklistItem = { id: number; status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "BLOCKED"; dueDate: string | Date | null; notes: string | null; sourceStatus: CalendarEntry["sourceStatus"]; obligation: CalendarEntry };

const alertCopy: Record<CalendarEntry["alert"], { label: string; tone: string; icon: typeof AlertTriangle }> = {
  BLOCKED: { label: "Bloqueado", tone: "border-amber-200 bg-amber-50 text-amber-800", icon: LockKeyhole },
  OVERDUE: { label: "Em atraso", tone: "border-red-200 bg-red-50 text-red-800", icon: AlertTriangle },
  DUE_TODAY: { label: "Vence hoje", tone: "border-orange-200 bg-orange-50 text-orange-800", icon: Clock3 },
  DUE_SOON: { label: "Próximo do prazo", tone: "border-blue-200 bg-blue-50 text-blue-800", icon: Clock3 },
  SCHEDULED: { label: "Agendado", tone: "border-slate-200 bg-slate-50 text-slate-700", icon: CircleDashed },
};

const checklistCopy: Record<ChecklistItem["status"], { label: string; tone: string }> = {
  PENDING: { label: "Por cumprir", tone: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "Em curso", tone: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Concluído", tone: "bg-emerald-100 text-emerald-800" },
  OVERDUE: { label: "Em atraso", tone: "bg-red-100 text-red-800" },
  BLOCKED: { label: "Bloqueado", tone: "bg-amber-100 text-amber-800" },
};

function formatDate(value: string | Date | null) {
  if (!value) return "Prazo relativo / evento-base necessário";
  return new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function FiscalControlPanel({ companyId, regime }: FiscalControlPanelProps) {
  const [year, setYear] = useState(2026);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODOS" | ChecklistItem["status"]>("TODOS");
  const [taxFilter, setTaxFilter] = useState("TODOS");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const calendarQuery = trpc.fiscal.calendar.useQuery({ companyId: companyId ?? 0, year, regime }, { enabled: Boolean(companyId) });
  const ivaChain = trpc.normative.taxChains.useQuery({ tax: "IVA" });
  const iiChain = trpc.normative.taxChains.useQuery({ tax: "II" });
  const irtChain = trpc.normative.taxChains.useQuery({ tax: "IRT" });
  const ipChain = trpc.normative.taxChains.useQuery({ tax: "IP" });
  const isChain = trpc.normative.taxChains.useQuery({ tax: "IS" });
  const cecChain = trpc.normative.taxChains.useQuery({ tax: "CEC" });
  const ogeMeasures = trpc.normative.oge2026Measures.useQuery({});
  const updateChecklist = trpc.fiscal.updateChecklist.useMutation({
    onSuccess: (result) => {
      toast.success(result.blocked ? "Item mantido bloqueado" : "Checklist actualizado", { description: result.blocked ? "A fonte normativa ainda não foi confirmada." : "A alteração foi registada na auditoria." });
      void calendarQuery.refetch();
    },
    onError: (error) => toast.error("Não foi possível actualizar a checklist", { description: error.message }),
  });

  const data = calendarQuery.data;
  const checklist = (data?.checklist ?? []) as ChecklistItem[];
  const entries = (data?.entries ?? []) as CalendarEntry[];
  const taxes = useMemo(() => Array.from(new Set(entries.map((item) => item.tax.split("/")[0]))).sort(), [entries]);
  const filteredChecklist = useMemo(() => checklist.filter((item) => {
    const text = `${item.obligation.code} ${item.obligation.title} ${item.obligation.tax}`.toLocaleLowerCase();
    return (!query || text.includes(query.toLocaleLowerCase())) && (statusFilter === "TODOS" || item.status === statusFilter) && (taxFilter === "TODOS" || item.obligation.tax.startsWith(taxFilter));
  }), [checklist, query, statusFilter, taxFilter]);
  const selected = checklist.find((item) => item.id === selectedId) ?? filteredChecklist[0];
  const summary = data?.summary ?? { total: 0, pending: 0, blocked: 0, completed: 0, overdue: 0 };
  const readiness = summary.total ? Math.round((summary.completed / summary.total) * 100) : 0;
  const normativeChains = [ivaChain, iiChain, irtChain, ipChain, isChain, cecChain];
  const normativeLabels = [
    ["IVA", "IVA"],
    ["II", "Imposto Industrial"],
    ["IRT", "Rendimentos do Trabalho"],
    ["IP", "Imposto Predial"],
    ["IS", "Imposto do Selo"],
    ["CEC", "Contribuição Especial Cambial"],
  ] as const;

  if (!companyId) return null;
  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[#e5edf5] pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base text-[#102a43]"><CalendarClock className="h-4 w-4 text-[#1267d6]" /> Calendário fiscal e checklist</CardTitle>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">Prazos operacionais de 2026 com alertas locais. Itens sem confirmação normativa ficam fechados para evitar cumprimento indevido.</p>
        </div>
        <label className="shrink-0 text-xs font-medium text-slate-600">Exercício<Input aria-label="Exercício fiscal" type="number" min="2025" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value) || 2026)} className="mt-1 h-8 w-24 bg-white text-xs" /></label>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="border border-[#dbe5f1] bg-white px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-xs font-semibold text-[#102a43]">Cadeias normativas por imposto</p><p className="text-[11px] text-slate-500">Consulta read-only do catálogo; não constitui activação, homologação ou declaração.</p></div>
            <Badge className="rounded-sm bg-slate-100 text-slate-700">READINESS ONLY</Badge>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            {normativeChains.map((chain, index) => { const [code, label] = normativeLabels[index]; const loading = chain.isLoading; const sources = chain.data?.sources ?? []; return <div key={code} className="border border-[#e5edf5] bg-[#f8fbff] px-2.5 py-2" title={loading ? "A consultar catálogo normativo" : `${sources.length} fonte(s) catalogada(s)`}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-[#102a43]">{code}</span><span className={cn("h-2 w-2 rounded-full", loading ? "bg-slate-300" : sources.length ? "bg-emerald-500" : "bg-amber-500")} /></div><p className="mt-1 truncate text-[10px] text-slate-500">{label}</p><p className="mt-1 text-[10px] font-medium text-slate-600">{loading ? "A consultar…" : `${sources.length} fonte(s) no catálogo`}</p></div>; })}
          </div>
          <div className="mt-3 border-t border-[#e5edf5] pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-semibold text-[#102a43]">Medidas fiscais OGE 2026</p><Badge className="rounded-sm bg-amber-100 text-amber-800">REFERENCE_ONLY</Badge></div>
            <p className="mt-1 text-[11px] text-slate-500">Artigos anuais condicionados; não substituem os códigos tributários nem activam taxas ou posting.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{(ogeMeasures.data?.measures ?? []).map((measure) => <div key={measure.code} className="border border-amber-100 bg-amber-50/40 px-2.5 py-2" title={"note" in measure ? measure.note : `${measure.tax} · ${measure.article}`}><div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-[#102a43]">{measure.tax}</span><span className="text-[10px] font-mono text-amber-700">{measure.article}</span></div><p className="mt-1 line-clamp-2 text-[10px] text-slate-600">{measure.factPattern.replaceAll("_", " ")}</p></div>)}</div>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-5">
          <div className="border-l-2 border-blue-500 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Itens</p><p className="mt-1 text-xl font-semibold text-[#102a43]">{summary.total}</p></div>
          <div className="border-l-2 border-slate-400 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Por cumprir</p><p className="mt-1 text-xl font-semibold text-slate-700">{summary.pending}</p></div>
          <div className="border-l-2 border-amber-500 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Bloqueados</p><p className="mt-1 text-xl font-semibold text-amber-700">{summary.blocked}</p></div>
          <div className="border-l-2 border-red-500 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Em atraso</p><p className="mt-1 text-xl font-semibold text-red-700">{summary.overdue}</p></div>
          <div className="border-l-2 border-emerald-500 bg-white px-3 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Concluído</p><p className="mt-1 text-xl font-semibold text-emerald-700">{readiness}%</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-y border-[#e5edf5] py-3">
          <div className="relative min-w-[230px] flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><Input aria-label="Pesquisar obrigação fiscal" placeholder="Pesquisar obrigação, código ou imposto" value={query} onChange={(event) => setQuery(event.target.value)} className="h-8 bg-white pl-8 text-xs" /></div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger className="h-8 w-40 bg-white text-xs"><Filter className="mr-1 h-3.5 w-3.5" /><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos os estados</SelectItem><SelectItem value="PENDING">Por cumprir</SelectItem><SelectItem value="IN_PROGRESS">Em curso</SelectItem><SelectItem value="COMPLETED">Concluído</SelectItem><SelectItem value="BLOCKED">Bloqueado</SelectItem><SelectItem value="OVERDUE">Em atraso</SelectItem></SelectContent></Select>
          <Select value={taxFilter} onValueChange={setTaxFilter}><SelectTrigger className="h-8 w-32 bg-white text-xs"><SelectValue placeholder="Imposto" /></SelectTrigger><SelectContent><SelectItem value="TODOS">Todos os impostos</SelectItem>{taxes.map((tax) => <SelectItem key={tax} value={tax}>{tax}</SelectItem>)}</SelectContent></Select>
        </div>

        <div className="grid min-h-[360px] gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.85fr)]">
          <div className="min-w-0 overflow-hidden border border-[#dbe5f1] bg-white">
            <div className="flex items-center justify-between border-b border-[#e5edf5] bg-[#f4f8fc] px-3 py-2"><div><p className="text-xs font-semibold text-[#102a43]">Checklist do exercício {year}</p><p className="text-[11px] text-slate-500">{filteredChecklist.length} item(ns) visível(is)</p></div>{calendarQuery.isFetching && <span className="text-[11px] text-blue-600">A actualizar…</span>}</div>
            <div className="max-h-[390px] overflow-y-auto">
              {filteredChecklist.map((item) => { const alert = alertCopy[item.obligation.alert]; const Icon = alert.icon; const status = checklistCopy[item.status]; return <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={cn("flex w-full items-start gap-3 border-b border-[#edf2f7] px-3 py-3 text-left transition-colors hover:bg-[#f8fbff]", selected?.id === item.id && "bg-[#eef6ff]")}><span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border", alert.tone)}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-[#102a43]">{item.obligation.tax}</span><Badge className={cn("rounded-sm px-1.5 py-0 text-[10px] font-medium", status.tone)}>{status.label}</Badge></span><span className="mt-1 block truncate text-xs text-slate-700">{item.obligation.title}</span><span className="mt-1 block text-[11px] text-slate-500">{formatDate(item.dueDate)} · {alert.label}</span></span><span className="shrink-0 text-[10px] font-mono text-slate-400">{item.obligation.code}</span></button>; })}
              {!calendarQuery.isLoading && !filteredChecklist.length && <div className="px-4 py-12 text-center text-xs text-slate-500">Não existem itens para os filtros seleccionados.</div>}
              {calendarQuery.isLoading && <div className="px-4 py-12 text-center text-xs text-slate-500">A carregar o calendário fiscal…</div>}
            </div>
          </div>

          <div className="border border-[#dbe5f1] bg-white p-4">
            {selected ? <div className="space-y-4"><div><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Detalhe da obrigação</p><h3 className="mt-1 text-sm font-semibold leading-5 text-[#102a43]">{selected.obligation.title}</h3></div><Badge className={cn("rounded-sm", checklistCopy[selected.status].tone)}>{checklistCopy[selected.status].label}</Badge></div><p className="mt-2 text-[11px] text-slate-500">Código {selected.obligation.code} · {selected.obligation.periodicity} · página {selected.obligation.sourcePage}</p></div><div className={cn("flex items-start gap-2 border px-3 py-2 text-xs", alertCopy[selected.obligation.alert].tone)}><FileWarning className="mt-0.5 h-4 w-4 shrink-0" /><span><strong>{alertCopy[selected.obligation.alert].label}.</strong> {selected.obligation.sourceStatus === "PENDING_REVIEW" ? "A evidência do PDF ainda aguarda confirmação normativa institucional; o item não pode ser concluído." : selected.obligation.daysUntilDue === null ? "É necessário registar o evento-base para calcular o prazo." : `Prazo: ${formatDate(selected.dueDate)}.`}</span></div><div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-[#f7fafc] p-2"><p className="text-[10px] uppercase text-slate-500">Imposto</p><p className="mt-1 font-semibold text-[#102a43]">{selected.obligation.tax}</p></div><div className="bg-[#f7fafc] p-2"><p className="text-[10px] uppercase text-slate-500">Regime</p><p className="mt-1 font-semibold text-[#102a43]">{selected.obligation.regime}</p></div></div><div className="border-t border-[#e5edf5] pt-3"><p className="mb-2 text-[11px] font-semibold text-slate-600">Acção da checklist</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={updateChecklist.isPending || selected.obligation.sourceStatus !== "CONFIRMED" || selected.status === "IN_PROGRESS"} onClick={() => updateChecklist.mutate({ companyId, itemId: selected.id, status: "IN_PROGRESS" })} className="h-8 text-xs">Em curso</Button><Button size="sm" disabled={updateChecklist.isPending || selected.obligation.sourceStatus !== "CONFIRMED" || selected.status === "COMPLETED"} onClick={() => updateChecklist.mutate({ companyId, itemId: selected.id, status: "COMPLETED" })} className="h-8 bg-[#147d64] text-xs hover:bg-[#0f6b55]"><Check className="mr-1 h-3.5 w-3.5" /> Concluir</Button></div></div><div className="flex items-center gap-2 border-t border-[#e5edf5] pt-3 text-[11px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Alterações registadas na auditoria de negócio.</div></div> : <div className="flex h-full min-h-[300px] items-center justify-center text-center text-xs text-slate-500">Seleccione uma obrigação para consultar o detalhe.</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-[#e5edf5] pt-3 text-[11px] text-slate-500"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Fonte operacional: Calendário Fiscal 2026 — AGT/MINFIN. <span className="font-medium text-amber-700">Confirmação institucional ainda pendente.</span></div>
      </CardContent>
    </Card>
  );
}
