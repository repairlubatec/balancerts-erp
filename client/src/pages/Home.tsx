import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Command,
  FileCheck2,
  FileText,
  Filter,
  Keyboard,
  LayoutDashboard,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const demoCompanies = [
  { name: "BALANCERTS Serviços, Lda.", nif: "5417283901", status: "Em dia", period: "Novembro 2026", tone: "success", balance: "18 420 500 Kz", close: 82, pending: 0, docs: 2, tax: "IVA pronto", integrations: 0, tasks: 3 },
  { name: "Kwanza Norte Comércio, Lda.", nif: "5419037284", status: "Atenção", period: "Outubro 2026", tone: "warning", balance: "7 830 240 Kz", close: 61, pending: 3, docs: 3, tax: "IVA em revisão", integrations: 1, tasks: 5 },
  { name: "Luz & Linha Consultoria, SU", nif: "5416640198", status: "Bloqueado", period: "Setembro 2026", tone: "danger", balance: "2 104 880 Kz", close: 38, pending: 6, docs: 5, tax: "Declaração pendente", integrations: 2, tasks: 7 },
];

const alerts: { type: "critical" | "warning" | "info"; title: string; meta: string; action: string; path: string }[] = [];

const quickActions = [
  ["/", "Minhas Empresas", LayoutDashboard],
  ["/contabilidade", "Contabilidade", BookOpenCheck],
  ["/facturacao", "Facturação", FileText],
  ["/tesouraria", "Tesouraria", WalletCards],
  ["/auditoria", "Auditoria", ShieldAlert],
  ["/facturacao?new=1", "Criar novo documento", Plus],
  ["/empresas?focus=5417283901", "Abrir BALANCERTS Serviços", Building2],
  ["/tesouraria?new=reconcile", "Iniciar reconciliação bancária", WalletCards],
  ["/fecho?new=checklist", "Executar checklist de fecho", ClipboardCheck],
] as const;

export function resolveNewAction(search: string) {
  const action = new URL(search, "https://balancerts.local").searchParams.get("new");
  return {
    action,
    label: action === "1" ? "Criar novo documento" : action === "reconcile" ? "Iniciar reconciliação bancária" : action === "checklist" ? "Executar checklist de fecho" : null,
  };
}

export function getActionPresentation(search: string, completed = false) {
  const { action, label } = resolveNewAction(search);
  if (!label) return { action, label: null, cta: null, feedback: null };
  return {
    action,
    label,
    cta: action === "1" ? "Abrir formulário" : action === "reconcile" ? "Seleccionar movimentos" : "Abrir checklist",
    feedback: completed ? "Fluxo iniciado" : null,
  };
}

export function getQuickActions(query: string) {
  return quickActions.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));
}

export function getReportTraceRoutes(selected: string) {
  const encoded = encodeURIComponent(selected);
  return { account: `/contabilidade?focus=${encoded}`, document: `/documentos?focus=${encoded}`, audit: `/auditoria?focus=${encoded}` };
}

const moduleData: Record<string, { eyebrow: string; title: string; description: string; columns: string[]; rows: string[][] }> = {
  "/contabilidade": { eyebrow: "Motor contabilístico", title: "Contabilidade", description: "Lançamentos, plano de contas e reconciliação sob controlo transaccional.", columns: ["Documento", "Data", "Conta / descrição", "Débito", "Crédito", "Estado"], rows: [["FT 2026/00482", "18 Nov 2026", "21.1.1 · Cliente nacional", "1 250 000 Kz", "1 250 000 Kz", "Confirmado"], ["NC 2026/00017", "17 Nov 2026", "62.2.3 · Serviços externos", "—", "86 500 Kz", "Pendente"], ["LCT 2026/01109", "16 Nov 2026", "11.1 · Caixa geral", "430 000 Kz", "—", "Rascunho"]] },
  "/facturacao": { eyebrow: "Documentos comerciais", title: "Facturação", description: "Emissão por série, validação fiscal e reflexo contabilístico rastreável.", columns: ["Número", "Cliente", "Emissão", "Total", "Regime IVA", "Estado"], rows: [["FT 2026/00482", "Mabeco Trading, Lda.", "18 Nov 2026", "1 250 000 Kz", "Geral · 14%", "ACCOUNTED"], ["FT 2026/00481", "Ana P. Comercial", "18 Nov 2026", "326 400 Kz", "Simplificado", "ISSUED"], ["FT 2026/00480", "Nova Rota, SU", "17 Nov 2026", "74 000 Kz", "Exclusão", "VALIDATED"]] },
  "/documentos": { eyebrow: "Arquivo e origem", title: "Documentos", description: "Arquivo empresarial com hash, ACL, classificação e ligação à operação.", columns: ["Ficheiro", "Origem", "Empresa", "Actualizado", "Integridade", "Acesso"], rows: [["factura_00482.pdf", "Facturação", "BALANCERTS Serviços", "18 Nov 2026", "SHA-256 válido", "Privado"], ["extracto_bfa_nov.csv", "Banco", "Luz & Linha", "18 Nov 2026", "SHA-256 válido", "Privado"], ["contrato_mabeco.pdf", "Cliente", "Kwanza Norte", "15 Nov 2026", "A validar", "Privado"]] },
  "/fiscalidade": { eyebrow: "Normas versionadas", title: "Fiscalidade", description: "IVA angolano por regime, vigência e evidência normativa — sem alterar históricos.", columns: ["Regra", "Regime", "Vigência", "Base", "Taxa", "Estado"], rows: [["IVA-GER-001", "Geral", "01 Jan 2026 →", "Operações tributáveis", "14%", "Vigente"], ["IVA-SIM-001", "Simplificado", "01 Jan 2026 →", "Recebimentos efectivos", "Configurar", "Revisão"], ["IVA-EXC-001", "Exclusão", "01 Jan 2026 →", "Sem liquidação", "0%", "Vigente"]] },
  "/stock": { eyebrow: "Inventário", title: "Stock", description: "Movimentos, valorização e reconciliação entre auxiliares e razão.", columns: ["Artigo", "Armazém", "Movimento", "Quantidade", "Custo", "Estado"], rows: [["SERV-001", "Central", "Entrada", "120", "2 400 000 Kz", "Conciliado"], ["MAT-044", "Central", "Saída", "-18", "342 000 Kz", "Conciliado"], ["EQP-203", "Luanda", "Ajuste", "+2", "—", "Pendente"]] },
  "/tesouraria": { eyebrow: "Caixa e bancos", title: "Tesouraria", description: "Pagamentos, recebimentos e reconciliação financeira idempotente.", columns: ["Movimento", "Conta", "Data", "Valor", "Referência", "Estado"], rows: [["Recebimento FT 00482", "BFA · 0034", "18 Nov 2026", "+1 250 000 Kz", "BFA-889102", "Conciliado"], ["Pagamento fornecedor", "BAI · 1180", "17 Nov 2026", "-430 000 Kz", "BAI-200481", "Conciliado"], ["Transferência interna", "BIC · 0021", "17 Nov 2026", "-86 500 Kz", "A validar", "Pendente"]] },
  "/relatorios": { eyebrow: "Informação financeira", title: "Relatórios", description: "Demonstrações e auxiliares preparados para reconciliação e auditoria.", columns: ["Relatório", "Período", "Empresa", "Última execução", "Reconciliação", "Acção"], rows: [["Balancete analítico", "Nov 2026", "BALANCERTS Serviços", "18 Nov · 08:42", "100%", "Abrir"], ["Demonstração de Resultados", "Out 2026", "Kwanza Norte Comércio", "17 Nov · 17:10", "98,4%", "Rever"], ["Mapa de IVA", "Out 2026", "Luz & Linha", "17 Nov · 16:58", "Pendente", "Corrigir"]] },
  "/fecho": { eyebrow: "Controlo de período", title: "Fecho e reabertura", description: "Checklist operacional, bloqueios explícitos e reabertura sempre auditada.", columns: ["Empresa", "Período", "Checklist", "Pendências", "Responsável", "Estado"], rows: [["BALANCERTS Serviços", "Nov 2026", "18 / 22", "0 críticas", "A. Mateus", "Pronto"], ["Kwanza Norte Comércio", "Out 2026", "12 / 22", "3 críticas", "M. Domingos", "Bloqueado"], ["Luz & Linha", "Set 2026", "8 / 22", "6 críticas", "C. António", "Em revisão"]] },
  "/auditoria": { eyebrow: "Trilho de negócio", title: "Auditoria", description: "Eventos append-only separados dos logs técnicos, com antes/depois e correlação.", columns: ["Evento", "Actor", "Entidade", "Quando", "Correlação", "Resultado"], rows: [["ISSUE / CONFIRM", "A. Mateus", "FT 2026/00482", "18 Nov · 08:38", "op_8J2K…", "Sucesso"], ["RULE_CHANGE", "Admin", "IVA-GER-001", "17 Nov · 16:02", "op_4X9P…", "Aprovado"], ["REOPEN", "M. Domingos", "Período Out/26", "17 Nov · 15:44", "op_6A1M…", "Auditado"]] },
  "/empresas": { eyebrow: "Estrutura empresarial", title: "Empresas", description: "Organizações, empresas, exercícios e perfis com contexto seguro.", columns: ["Empresa", "NIF", "Organização", "Moeda", "Exercício", "Estado"], rows: demoCompanies.map((c) => [c.name, c.nif, "BALANCERTS Group", "AOA", "2026", c.status]) },
  "/definicoes": { eyebrow: "Governança", title: "Definições", description: "Perfis, permissões, séries, regimes, normas, integrações e preferências.", columns: ["Área", "Última alteração", "Responsável", "Versão", "Estado", "Acção"], rows: [["Perfis e permissões", "18 Nov 2026", "Admin", "v1.4", "Activo", "Gerir"], ["Séries de facturação", "17 Nov 2026", "Contabilista", "v2.1", "Activo", "Gerir"], ["Matriz normativa", "17 Nov 2026", "Responsável fiscal", "v3.0", "Revisão", "Rever"]] },
};

function StatusBadge({ status }: { status: string }) {
  const positive = ["Em dia", "Confirmado", "ACCOUNTED", "Conciliado", "Vigente", "Sucesso", "Pronto", "Activo", "100%", "SHA-256 válido"].includes(status);
  const negative = ["Bloqueado", "Pendente", "REJECTED", "A validar", "Revisão", "Em revisão", "98,4%"].includes(status);
  return <Badge className={cn("border font-medium", positive && "border-emerald-200 bg-emerald-50 text-emerald-700", negative && "border-rose-200 bg-rose-50 text-rose-700", !positive && !negative && "border-amber-200 bg-amber-50 text-amber-700")}>{status}</Badge>;
}

function Metric({ label, value, delta, trend }: { label: string; value: string; delta: string; trend: "up" | "down" }) {
  return <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardContent className="p-4"><div className="flex items-start justify-between"><span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</span><div className={cn("flex items-center gap-0.5 text-xs font-semibold", trend === "up" ? "text-emerald-600" : "text-rose-600")}>{trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{delta}</div></div><p className="mt-2 text-[26px] font-semibold tracking-tight text-[#102a43]">{value}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", trend === "up" ? "w-[72%] bg-[#1267d6]" : "w-[38%] bg-[#f0a83b]")} /></div></CardContent></Card>;
}

function Overview() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: companyRows, isLoading: companiesLoading } = trpc.companies.list.useQuery();
  const activeCompanyId = companyRows?.[0]?.company.id;
  const canReadAudit = user?.role === "admin" || user?.role === "auditor";
  const { data: auditRows } = trpc.audit.list.useQuery({ companyId: activeCompanyId ?? 0 }, { enabled: Boolean(activeCompanyId && canReadAudit) });
  const recentEvents = (auditRows ?? []).slice(0, 3).map(({ event }) => ({ title: event.action, meta: `${event.entityType} #${event.entityId} · ${new Date(event.createdAt).toLocaleString()}`, color: "bg-blue-100 text-blue-700", Icon: FileCheck2 }));
  const portfolioCompanies = (companyRows ?? []).map(({ company }) => ({
    name: company.name,
    nif: company.nif,
    status: company.configurationStatus === "READY" ? "Em dia" : company.configurationStatus === "PENDING" ? "Configuração" : "Bloqueado",
    period: company.configurationStatus === "READY" ? "Operacional" : "Configuração pendente",
    tone: company.configurationStatus === "READY" ? "success" : company.configurationStatus === "PENDING" ? "warning" : "danger",
    balance: "—",
    close: company.configurationStatus === "READY" ? 100 : 0,
    pending: 0,
    docs: 0,
    tax: `IVA ${company.ivaRegime}`,
    integrations: 0,
    tasks: 0,
  }));
  const [query, setQuery] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (event.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  const filteredCompanies = portfolioCompanies.filter((company) => `${company.name} ${company.nif}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="space-y-5">
    <div className="flex flex-col gap-3 border-b border-[#dbe5f1] pb-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1267d6]"><span className="h-1.5 w-1.5 rounded-full bg-[#79c324]" /> Centro operacional</div><h1 className="text-2xl font-semibold tracking-tight text-[#102a43]">Minhas Empresas</h1><p className="mt-1 text-sm text-slate-500">Visão consolidada da operação contabilística e fiscal.</p></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar empresa ou NIF" className="h-9 w-[235px] border-[#dbe5f1] bg-white pl-9 text-sm" /></div><Button variant="outline" size="sm" className="h-9 border-[#dbe5f1] bg-white"><Filter className="mr-2 h-3.5 w-3.5" /> Filtros</Button><Button size="sm" className="h-9 bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-2 h-3.5 w-3.5" /> Nova empresa</Button></div></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Volume facturado" value="—" delta="sem dados" trend="up" /><Metric label="A receber" value="—" delta="sem dados" trend="up" /><Metric label="Pendências críticas" value="0" delta="sem dados" trend="up" /><Metric label="Reconciliação" value="—" delta="sem dados" trend="up" /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Portefólio empresarial</CardTitle><p className="mt-1 text-xs text-slate-500">Estado financeiro por empresa autorizada</p></div><Button variant="ghost" size="sm" className="text-xs text-[#1267d6]">Ver todas <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader><CardContent className="space-y-2 pt-0">{companiesLoading ? <div className="rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">A carregar empresas autorizadas…</div> : filteredCompanies.length === 0 ? <div className="rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">Nenhuma empresa autorizada no tenant actual.</div> : filteredCompanies.map((company) => <button key={company.nif} onClick={() => setLocation("/empresas")} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-[#dbe5f1] hover:bg-[#f7faff]"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-sm font-bold text-[#1267d6]">{company.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-[#102a43]">{company.name}</p><StatusBadge status={company.status} /></div><p className="mt-1 text-xs text-slate-500">NIF {company.nif} · {company.period}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500"><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.pending} críticas</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.docs} docs</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.tax}</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.integrations} integrações</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.tasks} tarefas</span></div></div><div className="hidden w-36 text-right sm:block"><p className="text-sm font-semibold text-[#102a43]">{company.balance}</p><p className="mt-1 text-[11px] text-slate-500">{company.close}% pronto para fecho</p></div><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", company.tone === "success" ? "bg-[#79c324]" : company.tone === "warning" ? "bg-[#f0a83b]" : "bg-[#e05a5a]")} style={{ width: `${company.close}%` }} /></div><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1267d6]" /></button>)}</CardContent></Card>
      <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Actividade recente</CardTitle><p className="mt-1 text-xs text-slate-500">Últimos eventos de negócio auditados</p></div><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4 text-slate-400" /></Button></CardHeader><CardContent className="space-y-4 pt-0">{recentEvents.map(({ title, meta, color, Icon }) => <div key={String(title)} className="flex items-center gap-3"><div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color as string)}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#102a43]">{title as string}</p><p className="truncate text-xs text-slate-500">{meta as string}</p></div><span className="text-[10px] text-slate-400">agora</span></div>)}</CardContent></Card>
    </div>
    <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Pendências que requerem atenção</CardTitle><p className="mt-1 text-xs text-slate-500">Cada item mantém ligação à origem operacional</p></div><Badge className="border-slate-200 bg-slate-50 text-slate-600">{alerts.length} abertas</Badge></CardHeader><CardContent className="grid gap-2 md:grid-cols-3 pt-0">{alerts.length === 0 ? <p className="col-span-full rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">Sem pendências persistidas no tenant actual.</p> : alerts.map((alert) => <button key={alert.title} onClick={() => setLocation(alert.path)} className="group rounded-xl border border-[#e4ebf3] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#b8d0ef] hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div className={cn("mt-0.5 h-2 w-2 rounded-full", alert.type === "critical" ? "bg-[#e05a5a]" : alert.type === "warning" ? "bg-[#f0a83b]" : "bg-[#1267d6]")} /><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1267d6]" /></div><p className="mt-3 text-sm font-semibold text-[#102a43]">{alert.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{alert.meta}</p><p className="mt-3 text-xs font-semibold text-[#1267d6]">{alert.action} <span aria-hidden="true">→</span></p></button>)}</CardContent></Card>{paletteOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#102a43]/25 px-4 pt-[14vh] backdrop-blur-sm" onClick={() => setPaletteOpen(false)}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-[#e6edf5] px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={paletteQuery} onChange={(event) => setPaletteQuery(event.target.value)} placeholder="Ir para módulo, empresa ou acção…" className="flex-1 bg-transparent text-sm outline-none" /><kbd className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">ESC</kbd></div><div className="p-2">{getQuickActions(paletteQuery).map(([path, label, Icon]) => <button key={String(path)} onClick={() => { setLocation(String(path)); setPaletteOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#102a43] hover:bg-[#f1f6fd]"><Icon className="h-4 w-4 text-[#1267d6]" /><span>{String(label)}</span><ChevronRight className="ml-auto h-4 w-4 text-slate-300" /></button>)}</div></div></div>}
  </div>;
}

export function ActionFlowPanel({ search, completed, onComplete }: { search: string; completed: boolean; onComplete?: () => void }) {
  const presentation = getActionPresentation(search, completed);
  if (!presentation.label) return null;
  return <Card className="border-[#b9d2ef] bg-[#f3f8ff] shadow-sm"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-[#1267d6]" /><div><p className="text-sm font-semibold text-[#102a43]">{presentation.label}</p><p className="mt-1 text-xs text-slate-500">Fluxo preparado no contexto da empresa activa; a confirmação será registada no trilho de negócio.</p></div></div>{presentation.feedback ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{presentation.feedback}</Badge> : <Button size="sm" onClick={onComplete} className="bg-[#1267d6] hover:bg-[#0f58b8]">{presentation.cta}</Button>}</CardContent></Card>;
}

function ModulePage({ data, focus, newAction }: { data: typeof moduleData[string]; focus: string | null; newAction: string | null }) {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  useEffect(() => {
    if (!focus) return;
    const needle = decodeURIComponent(focus).replace(/[-_]/g, " ").toLowerCase();
    const match = data.rows.find((row) => row.join(" ").toLowerCase().includes(needle));
    if (match?.[0]) setSelected(match[0]);
  }, [data, focus]);
  return <div className="space-y-5"><ActionFlowPanel search={`?new=${newAction ?? ""}`} completed={actionDone} onComplete={() => setActionDone(true)} /><div className="flex flex-col gap-3 border-b border-[#dbe5f1] pb-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1267d6]"><span className="h-1.5 w-1.5 rounded-full bg-[#79c324]" /> {data.eyebrow}</div><h1 className="text-2xl font-semibold tracking-tight text-[#102a43]">{data.title}</h1><p className="mt-1 text-sm text-slate-500">{data.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" className="border-[#dbe5f1] bg-white"><Keyboard className="mr-2 h-3.5 w-3.5" /> Atalhos</Button><Button size="sm" className="bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-2 h-3.5 w-3.5" /> Novo registo</Button></div></div><div className="grid gap-3 md:grid-cols-3"><Metric label="Registos no período" value="1 284" delta="8,4%" trend="up" /><Metric label="A validar" value="18" delta="3 novas" trend="down" /><Metric label="Última sincronização" value="08:42" delta="agora" trend="up" /></div><Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Registos recentes</CardTitle><p className="mt-1 text-xs text-slate-500">Empresa activa · Novembro 2026 · AOA</p></div><div className="flex gap-2"><Button variant="outline" size="sm" className="h-8 border-[#dbe5f1] bg-white text-xs"><Filter className="mr-2 h-3.5 w-3.5" /> Filtrar</Button><Button variant="outline" size="sm" className="h-8 border-[#dbe5f1] bg-white text-xs"><Search className="mr-2 h-3.5 w-3.5" /> Procurar</Button></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-y border-[#e6edf5] bg-[#f8fafd] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><tr>{data.columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody className="divide-y divide-[#edf2f7]">{data.rows.map((row, index) => <tr key={index} id={`record-${row[0]}`} onClick={() => setSelected(row[0] ?? null)} className={cn("cursor-pointer transition-colors hover:bg-[#f7faff]", selected === row[0] && "bg-[#f0f6ff] ring-1 ring-inset ring-[#9dc2ed]")}>{row.map((value, cellIndex) => <td key={cellIndex} className={cn("whitespace-nowrap px-4 py-3.5", cellIndex === 0 ? "font-semibold text-[#1267d6]" : cellIndex === row.length - 1 ? "" : "text-slate-600")}>{cellIndex === row.length - 1 ? <StatusBadge status={value} /> : value}</td>)}</tr>)}</tbody></table></div></CardContent></Card>{data.title === "Relatórios" && selected && <Card className="border-[#cfe0f5] bg-[#f3f8ff] shadow-sm"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#102a43]">Percurso de rastreabilidade</p><p className="mt-1 text-xs text-slate-500">Registo seleccionado: {selected}. Abrir o contexto operacional relacionado.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setLocation(getReportTraceRoutes(selected).account)}>Conta</Button><Button variant="outline" size="sm" onClick={() => setLocation(getReportTraceRoutes(selected).document)}>Documento</Button><Button variant="outline" size="sm" onClick={() => setLocation(getReportTraceRoutes(selected).audit)}>Auditoria</Button></div></CardContent></Card>}<div className="flex items-center gap-2 rounded-xl border border-[#cfe0f5] bg-[#f3f8ff] px-4 py-3 text-xs text-[#305b88]"><LockKeyhole className="h-4 w-4 shrink-0 text-[#1267d6]" /><span>As operações críticas são validadas no servidor, protegidas por idempotência e registadas no trilho de auditoria.</span><span className="ml-auto hidden font-semibold text-[#1267d6] sm:block">BAL-REQ-ACC-001</span></div></div>;
}

export default function Home() {
  const [location] = useLocation();
  const pathname = location.split("?")[0] || "/";
  const searchParams = new URLSearchParams(window.location.search);
  const focus = searchParams.get("focus");
  const newAction = resolveNewAction(window.location.search).action;
  const isOverview = pathname === "/";
  const data = moduleData[pathname] ?? moduleData["/contabilidade"];
  return <div className="min-h-[calc(100vh-2rem)] bg-[#f4f7fb] text-[#102a43]"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#dbe5f1] bg-white/95 px-5 backdrop-blur"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1267d6] text-xs font-black text-white">B</div><Separator orientation="vertical" className="h-5 bg-[#dbe5f1]" /><span className="text-sm font-semibold tracking-tight text-[#102a43]">BALANCERTS.ERP</span><span className="hidden rounded-md bg-[#eff5fc] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1267d6] md:inline-flex">Workspace Angola</span></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-[#e3eaf3] bg-[#f8fafd] px-2.5 py-1.5 text-xs text-slate-500 md:flex"><Command className="h-3.5 w-3.5" /><span>⌘ K</span></div><Button variant="ghost" size="icon" className="h-8 w-8"><Bell className="h-4 w-4 text-slate-500" /></Button><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff0c3] text-xs font-bold text-[#477514]">AM</div></div></header><main className="p-5 lg:p-6">{isOverview ? <Overview /> : <><ModulePage data={data} focus={focus} newAction={newAction} />{focus && <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-xl border border-[#b9d2ef] bg-white px-4 py-3 text-xs text-[#305b88] shadow-xl"><CircleAlert className="h-4 w-4 text-[#1267d6]" /> Foco activo: <strong>{decodeURIComponent(focus)}</strong><button onClick={() => window.history.replaceState({}, "", pathname)} className="ml-2 text-slate-400 hover:text-slate-700">×</button></div>}</>}</main><footer className="flex items-center justify-between px-6 pb-5 pt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400"><span>Motor contabilístico protegido · PGC Angola</span><span className="hidden sm:inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sistema operacional</span></footer></div>;
}
