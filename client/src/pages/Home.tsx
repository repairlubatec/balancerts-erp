import { Badge } from "@/components/ui/badge";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getAccountTraceRoutes, getReportTraceRoutes } from "@/lib/traceability";
import { trpc } from "@/lib/trpc";
import { TraceabilityPanel } from "@/components/TraceabilityPanel";
import { AgtConsolePanel } from "@/components/AgtConsolePanel";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useRef, useState } from "react";
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

export { getAccountTraceRoutes, getReportTraceRoutes } from "@/lib/traceability";

const moduleData: Record<string, { eyebrow: string; title: string; description: string; columns: string[]; rows: string[][] }> = {
  "/contabilidade": { eyebrow: "Motor contabilístico", title: "Contabilidade", description: "Lançamentos, plano de contas e reconciliação sob controlo transaccional.", columns: ["Documento", "Data", "Conta / descrição", "Débito", "Crédito", "Estado"], rows: [["FT 2026/00482", "18 Nov 2026", "21.1.1 · Cliente nacional", "1 250 000 Kz", "1 250 000 Kz", "Confirmado"], ["NC 2026/00017", "17 Nov 2026", "62.2.3 · Serviços externos", "—", "86 500 Kz", "Pendente"], ["LCT 2026/01109", "16 Nov 2026", "11.1 · Caixa geral", "430 000 Kz", "—", "Rascunho"]] },
  "/facturacao": { eyebrow: "Documentos comerciais", title: "Facturação", description: "Emissão por série, validação fiscal e reflexo contabilístico rastreável.", columns: ["Número", "Cliente", "Emissão", "Total", "Regime IVA", "Estado"], rows: [["FT 2026/00482", "Mabeco Trading, Lda.", "18 Nov 2026", "1 250 000 Kz", "Geral · 14%", "ACCOUNTED"], ["FT 2026/00481", "Ana P. Comercial", "18 Nov 2026", "326 400 Kz", "Simplificado", "ISSUED"], ["FT 2026/00480", "Nova Rota, SU", "17 Nov 2026", "74 000 Kz", "Exclusão", "VALIDATED"]] },
  "/clientes": { eyebrow: "Contrapartes comerciais", title: "Clientes", description: "Cadastro fiscal e operacional de clientes, protegido pelo contexto da empresa activa.", columns: ["Nome", "NIF", "Email", "Telefone", "Província", "Estado"], rows: [] },
  "/fornecedores": { eyebrow: "Contrapartes comerciais", title: "Fornecedores", description: "Fornecedores e parceiros de aquisição com histórico auditável e isolamento tenant-aware.", columns: ["Nome", "NIF", "Email", "Telefone", "Província", "Estado"], rows: [] },
  "/imobilizado": { eyebrow: "Activos fixos", title: "Imobilizado", description: "Depreciação linear e ligação auditável ao motor contabilístico.", columns: ["Operação", "Base", "Vida útil", "Período", "Reflexo", "Estado"], rows: [["Depreciação linear", "Servidor", "60 meses", "Aberto", "Lançamento autorizado", "Pronto"]] },
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
  const [asOf] = useState(() => new Date());
  const { data: fiscalRegister } = trpc.reports.fiscalRegister.useQuery({ companyId: activeCompanyId ?? 0 }, { enabled: Boolean(activeCompanyId) });
  const { data: customerAging } = trpc.reports.customerAging.useQuery({ companyId: activeCompanyId ?? 0, asOf }, { enabled: Boolean(activeCompanyId) });
  const { data: reconciliation } = trpc.reports.reconciliation.useQuery({ companyId: activeCompanyId ?? 0 }, { enabled: Boolean(activeCompanyId) });
  const canReadAudit = user?.role === "admin" || user?.role === "auditor";
  const { data: auditRows } = trpc.audit.list.useQuery({ companyId: activeCompanyId ?? 0 }, { enabled: Boolean(activeCompanyId && canReadAudit) });
  const recentEvents = (auditRows ?? []).slice(0, 3).map(({ event }) => ({ id: event.id, title: event.action, meta: `${event.entityType} #${event.entityId} · ${new Date(event.createdAt).toLocaleString()}`, color: "bg-blue-100 text-blue-700", Icon: FileCheck2 }));
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(() => new URLSearchParams(window.location.search).get("shortcuts") === "1");
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
  const formatKz = (value: number) => `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 }).format(value)} Kz`;
  const volumeFacturado = fiscalRegister ? formatKz(fiscalRegister.totals.totalAmount) : "—";
  const aReceber = customerAging ? formatKz(customerAging.totals.outstanding) : "—";
  const reconciliationChecks = reconciliation ? Object.values(reconciliation.checks).filter(Boolean).length : 0;
  const reconciliationValue = reconciliation ? `${reconciliationChecks}/5` : "—";
  return <div className="space-y-5">
    <div className="flex flex-col gap-3 border-b border-[#dbe5f1] pb-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1267d6]"><span className="h-1.5 w-1.5 rounded-full bg-[#79c324]" /> Centro operacional</div><h1 className="text-2xl font-semibold tracking-tight text-[#102a43]">Minhas Empresas</h1><p className="mt-1 text-sm text-slate-500">Visão consolidada da operação contabilística e fiscal.</p></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input ref={searchInputRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar empresa ou NIF" className="h-9 w-[235px] border-[#dbe5f1] bg-white pl-9 text-sm" /></div><Button variant="outline" size="sm" onClick={() => searchInputRef.current?.focus()} className="h-9 border-[#dbe5f1] bg-white"><Filter className="mr-2 h-3.5 w-3.5" /> Filtros</Button><Button size="sm" onClick={() => setLocation("/empresas")} className="h-9 bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-2 h-3.5 w-3.5" /> Nova empresa</Button></div></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Metric label="Volume facturado" value={volumeFacturado} delta={fiscalRegister ? "persistente" : "sem dados"} trend="up" /><Metric label="A receber" value={aReceber} delta={customerAging ? "ageing real" : "sem dados"} trend="up" /><Metric label="Pendências críticas" value="0" delta="sem dados" trend="up" /><Metric label="Reconciliação" value={reconciliationValue} delta={reconciliation ? (reconciliation.reconciled ? "reconciliado" : "rever") : "sem dados"} trend={reconciliation?.reconciled ? "up" : "down"} /></div>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Portefólio empresarial</CardTitle><p className="mt-1 text-xs text-slate-500">Estado financeiro por empresa autorizada</p></div><Button variant="ghost" size="sm" onClick={() => setLocation("/empresas")} className="text-xs text-[#1267d6]">Ver todas <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader><CardContent className="space-y-2 pt-0">{companiesLoading ? <div className="rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">A carregar empresas autorizadas…</div> : filteredCompanies.length === 0 ? <div className="rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">Nenhuma empresa autorizada no tenant actual.</div> : filteredCompanies.map((company) => <button key={company.nif} onClick={() => setLocation("/empresas")} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition-colors hover:border-[#dbe5f1] hover:bg-[#f7faff]"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-sm font-bold text-[#1267d6]">{company.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-[#102a43]">{company.name}</p><StatusBadge status={company.status} /></div><p className="mt-1 text-xs text-slate-500">NIF {company.nif} · {company.period}</p><div className="mt-2 flex flex-wrap gap-1.5 text-[10px] text-slate-500"><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.pending} críticas</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.docs} docs</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.tax}</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.integrations} integrações</span><span className="rounded bg-slate-100 px-1.5 py-0.5">{company.tasks} tarefas</span></div></div><div className="hidden w-36 text-right sm:block"><p className="text-sm font-semibold text-[#102a43]">{company.balance}</p><p className="mt-1 text-[11px] text-slate-500">{company.close}% pronto para fecho</p></div><div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", company.tone === "success" ? "bg-[#79c324]" : company.tone === "warning" ? "bg-[#f0a83b]" : "bg-[#e05a5a]")} style={{ width: `${company.close}%` }} /></div><ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1267d6]" /></button>)}</CardContent></Card>
      <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Actividade recente</CardTitle><p className="mt-1 text-xs text-slate-500">Últimos eventos de negócio auditados</p></div><Button variant="ghost" size="icon" onClick={() => setLocation("/auditoria")} aria-label="Abrir auditoria" className="h-8 w-8"><MoreHorizontal className="h-4 w-4 text-slate-400" /></Button></CardHeader><CardContent className="space-y-4 pt-0">{recentEvents.map(({ id, title, meta, color, Icon }) => <div key={String(id ?? `${title}:${meta}`)} className="flex items-center gap-3"><div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color as string)}><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[#102a43]">{title as string}</p><p className="truncate text-xs text-slate-500">{meta as string}</p></div><span className="text-[10px] text-slate-400">agora</span></div>)}</CardContent></Card>
    </div>
    <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Pendências que requerem atenção</CardTitle><p className="mt-1 text-xs text-slate-500">Cada item mantém ligação à origem operacional</p></div><Badge className="border-slate-200 bg-slate-50 text-slate-600">{alerts.length} abertas</Badge></CardHeader><CardContent className="grid gap-2 md:grid-cols-3 pt-0">{alerts.length === 0 ? <p className="col-span-full rounded-xl border border-dashed border-[#dbe5f1] p-6 text-center text-sm text-slate-500">Sem pendências persistidas no tenant actual.</p> : alerts.map((alert) => <button key={alert.title} onClick={() => setLocation(alert.path)} className="group rounded-xl border border-[#e4ebf3] p-3 text-left transition-all hover:-translate-y-0.5 hover:border-[#b8d0ef] hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div className={cn("mt-0.5 h-2 w-2 rounded-full", alert.type === "critical" ? "bg-[#e05a5a]" : alert.type === "warning" ? "bg-[#f0a83b]" : "bg-[#1267d6]")} /><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#1267d6]" /></div><p className="mt-3 text-sm font-semibold text-[#102a43]">{alert.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{alert.meta}</p><p className="mt-3 text-xs font-semibold text-[#1267d6]">{alert.action} <span aria-hidden="true">→</span></p></button>)}</CardContent></Card>{paletteOpen && <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#102a43]/25 px-4 pt-[14vh] backdrop-blur-sm" onClick={() => setPaletteOpen(false)}><div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#dbe5f1] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-[#e6edf5] px-4 py-3"><Search className="h-4 w-4 text-slate-400" /><input autoFocus value={paletteQuery} onChange={(event) => setPaletteQuery(event.target.value)} placeholder="Ir para módulo, empresa ou acção…" className="flex-1 bg-transparent text-sm outline-none" /><kbd className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500">ESC</kbd></div><div className="p-2">{getQuickActions(paletteQuery).map(([path, label, Icon]) => <button key={String(path)} onClick={() => { setLocation(String(path)); setPaletteOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#102a43] hover:bg-[#f1f6fd]"><Icon className="h-4 w-4 text-[#1267d6]" /><span>{String(label)}</span><ChevronRight className="ml-auto h-4 w-4 text-slate-300" /></button>)}</div></div></div>}
  </div>;
}

export function ActionFlowPanel({ search, completed, onComplete }: { search: string; completed: boolean; onComplete?: () => void }) {
  const presentation = getActionPresentation(search, completed);
  if (!presentation.label) return null;
  return <Card className="border-[#b9d2ef] bg-[#f3f8ff] shadow-sm"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-5 w-5 text-[#1267d6]" /><div><p className="text-sm font-semibold text-[#102a43]">{presentation.label}</p><p className="mt-1 text-xs text-slate-500">Fluxo preparado no contexto da empresa activa; a confirmação será registada no trilho de negócio.</p></div></div>{presentation.feedback ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{presentation.feedback}</Badge> : <Button size="sm" onClick={onComplete} className="bg-[#1267d6] hover:bg-[#0f58b8]">{presentation.cta}</Button>}</CardContent></Card>;
}

function ModulePage({ data, focus, entry, newAction }: { data: typeof moduleData[string]; focus: string | null; entry: string | null; newAction: string | null }) {
  const [, setLocation] = useLocation();
  const isCompaniesPage = data.title === "Empresas";
  const isReportsPage = data.title === "Relatórios";
  const isCustomersPage = data.title === "Clientes";
  const isSuppliersPage = data.title === "Fornecedores";
  const isStockPage = data.title === "Stock";
  const isTreasuryPage = data.title === "Tesouraria";
  const isFixedAssetsPage = data.title === "Imobilizado";
  const { data: realCompanyRows, isLoading: companiesLoading } = trpc.companies.list.useQuery();
  const reportCompanyId = realCompanyRows?.[0]?.company.id;
  const { data: customerRows, isLoading: customersLoading } = trpc.counterparties.list.useQuery({ companyId: reportCompanyId ?? 0, kind: "CUSTOMER" }, { enabled: Boolean(reportCompanyId && isCustomersPage) });
  const { data: supplierRows, isLoading: suppliersLoading } = trpc.counterparties.list.useQuery({ companyId: reportCompanyId ?? 0, kind: "SUPPLIER" }, { enabled: Boolean(reportCompanyId && isSuppliersPage) });
  const { data: productRows, isLoading: productsLoading } = trpc.catalog.list.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(reportCompanyId && isStockPage) });
  const { data: accountRows, isLoading: accountsLoading } = trpc.treasury.accounts.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(reportCompanyId && isTreasuryPage) });
  const { data: transactionRows, isLoading: transactionsLoading } = trpc.treasury.transactions.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(reportCompanyId && isTreasuryPage) });
  const { data: fixedAssetRows, isLoading: fixedAssetsLoading } = trpc.fixedAssets.list.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(reportCompanyId && isFixedAssetsPage) });
  const { data: periodRows } = trpc.companies.periods.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(reportCompanyId && isStockPage) });
  const [agingAsOf] = useState(() => new Date());
  const { data: customerAging, isLoading: customerAgingLoading } = trpc.reports.customerAging.useQuery({ companyId: reportCompanyId ?? 0, asOf: agingAsOf }, { enabled: Boolean(isReportsPage && reportCompanyId) });
  const { data: supplierAging, isLoading: supplierAgingLoading } = trpc.reports.supplierAging.useQuery({ companyId: reportCompanyId ?? 0, asOf: agingAsOf }, { enabled: Boolean(isReportsPage && reportCompanyId) });
  const { data: reportReconciliation, isLoading: reportReconciliationLoading } = trpc.reports.reconciliation.useQuery({ companyId: reportCompanyId ?? 0 }, { enabled: Boolean(isReportsPage && reportCompanyId) });
  const displayRows = isCompaniesPage ? (realCompanyRows ?? []).map(({ company }) => [company.name, company.nif, "BALANCERTS Group", company.functionalCurrency, company.configurationStatus, company.ivaRegime]) : isCustomersPage ? (customerRows ?? []).map(({ counterparty }) => [counterparty.name, counterparty.taxId ?? "—", counterparty.email ?? "—", counterparty.phone ?? "—", counterparty.province ?? "—", "Activo"]) : isSuppliersPage ? (supplierRows ?? []).map(({ counterparty }) => [counterparty.name, counterparty.taxId ?? "—", counterparty.email ?? "—", counterparty.phone ?? "—", counterparty.province ?? "—", "Activo"]) : isStockPage ? (productRows ?? []).map(({ product }) => [product.code, product.name, product.kind === "SERVICE" ? "Serviço" : "Produto", product.unitCode ?? "UN", product.taxCode ?? "—", "Activo"]) : isFixedAssetsPage ? (fixedAssetRows ?? []).map(({ asset }) => [asset.code, asset.name, new Date(asset.acquisitionDate).toLocaleDateString("pt-PT"), `${Number(asset.acquisitionCost).toLocaleString("pt-PT")} Kz`, `${asset.usefulLifeMonths} meses`, asset.status]) : isTreasuryPage ? [...(accountRows ?? []).map(({ account }) => [account.name, account.kind === "BANK" ? "Banco" : "Caixa", account.accountNumber ?? "—", account.currency, "Saldo operacional", "Activo"]), ...(transactionRows ?? []).slice(0, 8).map(({ transaction, account }) => [`Movimento #${transaction.id}`, account.name, new Date(transaction.valueDate).toLocaleDateString("pt-PT"), `${transaction.direction === "IN" ? "+" : "−"}${Number(transaction.amount).toLocaleString("pt-PT")} Kz`, transaction.correlationId, transaction.reconciliationStatus]) ] : isReportsPage && realCompanyRows?.[0] ? data.rows.map((row) => [row[0], "Período activo", realCompanyRows[0].company.name, "Sem execução", "Sem dados", "Abrir"]) : data.rows;
  const operationalLoading = isCustomersPage ? customersLoading : isSuppliersPage ? suppliersLoading : isStockPage ? productsLoading : isTreasuryPage ? accountsLoading || transactionsLoading : isFixedAssetsPage ? fixedAssetsLoading : false;
  const operationalCount = isCustomersPage ? customerRows?.length : isSuppliersPage ? supplierRows?.length : isStockPage ? productRows?.length : isTreasuryPage ? (accountRows?.length ?? 0) + (transactionRows?.length ?? 0) : isFixedAssetsPage ? fixedAssetRows?.length : undefined;
  const operationRowIds = isCustomersPage ? (customerRows ?? []).map(({ counterparty }) => counterparty.id) : isSuppliersPage ? (supplierRows ?? []).map(({ counterparty }) => counterparty.id) : isStockPage ? (productRows ?? []).map(({ product }) => product.id) : isTreasuryPage ? (accountRows ?? []).map(({ account }) => account.id) : isFixedAssetsPage ? (fixedAssetRows ?? []).map(({ asset }) => asset.id) : [];
  const supportsInlineUpdate = isCustomersPage || isSuppliersPage || isStockPage || isTreasuryPage;
  const supportsRecordControls = data.title === "Facturação" || supportsInlineUpdate;
  const [selected, setSelected] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState(false);
  useEffect(() => {
    const requested = entry ?? focus;
    if (!requested) return;
    const needle = decodeURIComponent(requested).replace(/[-_]/g, " ").toLowerCase();
    const match = displayRows.find((row) => row.join(" ").toLowerCase().includes(needle));
    if (match?.[0]) setSelected(match[0]);
  }, [data, displayRows, focus, entry]);
  return <div className="space-y-5"><ActionFlowPanel search={`?new=${newAction ?? ""}`} completed={actionDone} onComplete={() => setActionDone(true)} />{data.title === "Facturação" && <DocumentCreatePanel company={realCompanyRows?.[0]?.company ? { id: realCompanyRows[0].company.id, nif: realCompanyRows[0].company.nif } : undefined} />}{data.title === "Fiscalidade" && <AgtConsolePanel company={realCompanyRows?.[0]?.company ? { id: realCompanyRows[0].company.id } : undefined} />}<OperationalCreatePanel title={data.title} selectedId={selected ? Number(selected) : undefined} company={realCompanyRows?.[0]?.company ? { id: realCompanyRows[0].company.id, organizationId: realCompanyRows[0].company.organizationId } : undefined} />{data.title === "Stock" && <StockMovementPanel company={realCompanyRows?.[0]?.company ? { id: realCompanyRows[0].company.id, organizationId: realCompanyRows[0].company.organizationId } : undefined} periodId={periodRows?.[0]?.period.id} />}{data.title === "Imobilizado" && <FixedAssetPanel company={realCompanyRows?.[0]?.company ? { id: realCompanyRows[0].company.id, organizationId: realCompanyRows[0].company.organizationId } : undefined} />}<div className="flex flex-col gap-3 border-b border-[#dbe5f1] pb-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1267d6]"><span className="h-1.5 w-1.5 rounded-full bg-[#79c324]" /> {data.eyebrow}</div><h1 className="text-2xl font-semibold tracking-tight text-[#102a43]">{data.title}</h1><p className="mt-1 text-sm text-slate-500">{data.description}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setLocation("/?shortcuts=1")} className="border-[#dbe5f1] bg-white"><Keyboard className="mr-2 h-3.5 w-3.5" /> Atalhos</Button>{supportsRecordControls && <Button size="sm" onClick={() => document.getElementById("operational-create-form")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-2 h-3.5 w-3.5" /> Novo registo</Button>}</div></div><div className="grid gap-3 md:grid-cols-3"><Metric label="Registos no período" value={operationalLoading ? "…" : operationalCount === undefined ? "—" : operationalCount.toLocaleString("pt-PT")} delta={operationalCount === undefined ? "sem dados" : "persistente"} trend="up" /><Metric label="A validar" value={isTreasuryPage && transactionRows ? String(transactionRows.filter(({ transaction }) => transaction.reconciliationStatus !== "RECONCILED").length) : "—"} delta={isTreasuryPage ? "reconciliação" : "sem dados"} trend={isTreasuryPage ? "down" : "up"} /><Metric label="Última sincronização" value={operationalLoading ? "…" : operationalCount === undefined ? "—" : "agora"} delta={operationalCount === undefined ? "sem dados" : "consulta real"} trend="up" /></div><Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="text-base text-[#102a43]">Registos recentes</CardTitle><p className="mt-1 text-xs text-slate-500">Empresa activa · Novembro 2026 · AOA</p></div>{supportsRecordControls && <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => document.getElementById("operational-create-form")?.scrollIntoView({ behavior: "smooth", block: "center" })} className="h-8 border-[#dbe5f1] bg-white text-xs"><Filter className="mr-2 h-3.5 w-3.5" /> Filtrar</Button><Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>("#operational-create-form input")?.focus()} className="h-8 border-[#dbe5f1] bg-white text-xs"><Search className="mr-2 h-3.5 w-3.5" /> Procurar</Button></div>}</CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-y border-[#e6edf5] bg-[#f8fafd] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><tr>{data.columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}{supportsInlineUpdate && <th className="px-4 py-3">Acções</th>}</tr></thead><tbody className="divide-y divide-[#edf2f7]">{displayRows.map((row, index) => <tr key={index} id={`record-${row[0]}`} onClick={() => setSelected(String(operationRowIds[index] ?? row[0] ?? ""))} className={cn("cursor-pointer transition-colors hover:bg-[#f7faff]", selected === String(operationRowIds[index] ?? row[0] ?? "") && "bg-[#f0f6ff] ring-1 ring-inset ring-[#9dc2ed]")}>{row.map((value, cellIndex) => <td key={cellIndex} className={cn("whitespace-nowrap px-4 py-3.5", cellIndex === 0 ? "font-semibold text-[#1267d6]" : cellIndex === row.length - 1 ? "" : "text-slate-600")}>{cellIndex === row.length - 1 ? <StatusBadge status={value} /> : value}</td>)}{supportsInlineUpdate && operationRowIds[index] && <td className="px-4 py-3.5"><Button type="button" variant="outline" size="sm" className="border-[#1267d6] bg-white text-[#1267d6]" onClick={(event) => { event.stopPropagation(); setSelected(String(operationRowIds[index])); document.getElementById("operational-update-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>Editar</Button></td>}</tr>)}</tbody></table></div></CardContent></Card>{isReportsPage && <Card className="border-[#dbe5f1] bg-white shadow-[0_10px_28px_rgba(18,62,112,0.05)]"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Antiguidade de saldos</CardTitle><p className="mt-1 text-xs text-slate-500">Documentos com vencimento explícito da empresa activa · corte {agingAsOf.toLocaleDateString()}</p></CardHeader><CardContent className="grid gap-3 md:grid-cols-3 pt-0">{customerAgingLoading || supplierAgingLoading || reportReconciliationLoading ? <p className="text-sm text-slate-500">A carregar saldos em aberto…</p> : <><div className="rounded-lg border border-[#e6edf5] p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Clientes</p><p className="mt-1 text-xl font-semibold text-[#102a43]">{customerAging?.totals.outstanding.toLocaleString("pt-PT")} Kz</p><p className="mt-1 text-xs text-slate-500">{customerAging?.rows.length ?? 0} documentos em aberto</p></div><div className="rounded-lg border border-[#e6edf5] p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Fornecedores</p><p className="mt-1 text-xl font-semibold text-[#102a43]">{supplierAging?.totals.outstanding.toLocaleString("pt-PT")} Kz</p><p className="mt-1 text-xs text-slate-500">{supplierAging?.rows.length ?? 0} documentos em aberto</p></div><div className="rounded-lg border border-[#e6edf5] p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Reconciliação</p><p className={cn("mt-1 text-xl font-semibold", reportReconciliation?.reconciled ? "text-emerald-700" : "text-amber-700")}>{reportReconciliation ? (reportReconciliation.reconciled ? "OK" : "Rever") : "—"}</p><p className="mt-1 text-xs text-slate-500">{reportReconciliation ? `${Object.values(reportReconciliation.checks).filter(Boolean).length}/5 verificações` : "Sem dados persistidos"}</p></div></>}</CardContent></Card>}{(data.title === "Relatórios" || data.title === "Contabilidade" || data.title === "Documentos") && selected && <TraceabilityPanel mode={data.title === "Relatórios" ? "report" : data.title === "Contabilidade" ? "account" : "document"} selected={selected} onNavigate={setLocation} />}<div className="flex items-center gap-2 rounded-xl border border-[#cfe0f5] bg-[#f3f8ff] px-4 py-3 text-xs text-[#305b88]"><LockKeyhole className="h-4 w-4 shrink-0 text-[#1267d6]" /><span>As operações críticas são validadas no servidor, protegidas por idempotência e registadas no trilho de auditoria.</span><span className="ml-auto hidden font-semibold text-[#1267d6] sm:block">BAL-REQ-ACC-001</span></div></div>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const pathname = location.split("?")[0] || "/";
  const searchParams = new URLSearchParams(window.location.search);
  const focus = searchParams.get("focus");
  const entry = searchParams.get("entry");
  const newAction = resolveNewAction(window.location.search).action;
  const isOverview = pathname === "/";
  const data = moduleData[pathname] ?? moduleData["/contabilidade"];
  return <div className="min-h-[calc(100vh-2rem)] bg-[#f4f7fb] text-[#102a43]"><header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#dbe5f1] bg-white/95 px-5 backdrop-blur"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1267d6] text-xs font-black text-white">B</div><Separator orientation="vertical" className="h-5 bg-[#dbe5f1]" /><span className="text-sm font-semibold tracking-tight text-[#102a43]">BALANCERTS.ERP</span><span className="hidden rounded-md bg-[#eff5fc] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1267d6] md:inline-flex">Workspace Angola</span></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-[#e3eaf3] bg-[#f8fafd] px-2.5 py-1.5 text-xs text-slate-500 md:flex"><Command className="h-3.5 w-3.5" /><span>⌘ K</span></div><Button variant="ghost" size="icon" onClick={() => setLocation("/auditoria")} aria-label="Abrir auditoria" className="h-8 w-8"><Bell className="h-4 w-4 text-slate-500" /></Button><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dff0c3] text-xs font-bold text-[#477514]">AM</div></div></header><main className="p-5 lg:p-6">{isOverview ? <Overview /> : <><ModulePage data={data} focus={focus} entry={entry} newAction={newAction} />{(focus || entry) && <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-xl border border-[#b9d2ef] bg-white px-4 py-3 text-xs text-[#305b88] shadow-xl"><CircleAlert className="h-4 w-4 text-[#1267d6]" /> {entry ? "Lançamento aberto" : "Foco activo"}: <strong>{decodeURIComponent(entry ?? focus ?? "")}</strong><button onClick={() => window.history.replaceState({}, "", pathname)} className="ml-2 text-slate-400 hover:text-slate-700">×</button></div>}</>}</main><footer className="flex items-center justify-between px-6 pb-5 pt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400"><span>Motor contabilístico protegido · PGC Angola</span><span className="hidden sm:inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Sistema operacional</span></footer></div>;
}


function OperationalCreatePanel({ title, company, selectedId }: { title: string; company?: { id: number; organizationId: number }; selectedId?: number }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState(title === "Tesouraria" ? "BANK" : title === "Stock" ? "SERVICE" : "CUSTOMER");
  const [accountNumber, setAccountNumber] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [recordId, setRecordId] = useState(selectedId ? String(selectedId) : "");
  useEffect(() => { if (selectedId) setRecordId(String(selectedId)); }, [selectedId]);
  const [updateName, setUpdateName] = useState("");
  const [updateEmail, setUpdateEmail] = useState("");
  const counterpartyCreate = trpc.counterparties.create.useMutation({ onSuccess: async () => { await utils.counterparties.list.invalidate(); setFeedback("Contraparte criada e auditada."); setName(""); setTaxId(""); setEmail(""); } });
  const productCreate = trpc.catalog.create.useMutation({ onSuccess: async () => { await utils.catalog.list.invalidate(); setFeedback("Produto/serviço criado e auditado."); setName(""); setCode(""); } });
  const accountCreate = trpc.treasury.createAccount.useMutation({ onSuccess: async () => { await utils.treasury.accounts.invalidate(); setFeedback("Conta de caixa/banco criada e auditada."); setName(""); setAccountNumber(""); } });
  const counterpartyUpdate = trpc.counterparties.update.useMutation({ onSuccess: async () => { await utils.counterparties.list.invalidate(); setFeedback("Contraparte actualizada e auditada."); } });
  const productUpdate = trpc.catalog.update.useMutation({ onSuccess: async () => { await utils.catalog.list.invalidate(); setFeedback("Produto/serviço actualizado e auditado."); } });
  const accountUpdate = trpc.treasury.updateAccount.useMutation({ onSuccess: async () => { await utils.treasury.accounts.invalidate(); setFeedback("Conta actualizada e auditada."); } });
  const active = ["Clientes", "Fornecedores", "Stock", "Tesouraria"].includes(title);
  if (!active || !company) return null;
  const pending = counterpartyCreate.isPending || productCreate.isPending || accountCreate.isPending || counterpartyUpdate.isPending || productUpdate.isPending || accountUpdate.isPending;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (!name.trim()) return setFeedback("Indique um nome válido.");
    if (title === "Clientes" || title === "Fornecedores") {
      counterpartyCreate.mutate({ organizationId: company.organizationId, companyId: company.id, kind: title === "Clientes" ? "CUSTOMER" : "SUPPLIER", name: name.trim(), taxId: taxId.trim() || undefined, email: email.trim() || undefined });
    } else if (title === "Stock") {
      if (!code.trim()) return setFeedback("Indique o código do produto/serviço.");
      productCreate.mutate({ companyId: company.id, code: code.trim(), name: name.trim(), kind: kind as "GOOD" | "SERVICE", taxCode: taxId.trim() || undefined });
    } else {
      accountCreate.mutate({ organizationId: company.organizationId, companyId: company.id, name: name.trim(), kind: kind as "CASH" | "BANK", accountNumber: accountNumber.trim() || undefined, currency: "AOA" });
    }
  };
  const update = (event: React.FormEvent) => { event.preventDefault(); const id = Number(recordId); if (!Number.isInteger(id) || id <= 0 || !updateName.trim()) return setFeedback("Indique o ID e o novo nome do registo."); if (title === "Clientes" || title === "Fornecedores") counterpartyUpdate.mutate({ companyId: company.id, counterpartyId: id, name: updateName.trim(), email: updateEmail.trim() || undefined }); else if (title === "Stock") productUpdate.mutate({ companyId: company.id, productId: id, name: updateName.trim() }); else accountUpdate.mutate({ companyId: company.id, cashAccountId: id, name: updateName.trim() }); };
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm text-[#102a43]">Novo registo operacional</CardTitle><p className="text-xs text-slate-500">A criação é persistida na empresa activa, validada pelo RBAC e registada na auditoria.</p></CardHeader><CardContent><form id="operational-create-form" onSubmit={submit} className="grid gap-2 md:grid-cols-[1.3fr_1fr_1.3fr_auto]">{(title === "Stock" || title === "Tesouraria") && <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder={title === "Stock" ? "Código" : "Referência opcional"} className="bg-white" />}{title === "Tesouraria" ? <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="BANK">Banco</option><option value="CASH">Caixa</option></select> : title === "Stock" ? <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="SERVICE">Serviço</option><option value="GOOD">Produto</option></select> : <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="NIF" className="bg-white" />}{<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" className="bg-white" />}{title === "Clientes" || title === "Fornecedores" ? <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email opcional" className="bg-white" /> : title === "Tesouraria" ? <Input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} placeholder="Número da conta" className="bg-white" /> : <Input value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="Código fiscal opcional" className="bg-white" />}<Button type="submit" disabled={pending} className="bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-2 h-3.5 w-3.5" />{pending ? "A guardar…" : "Guardar"}</Button></form><form id="operational-update-form" onSubmit={update} className="mt-3 grid gap-2 border-t border-[#dbe5f1] pt-3 md:grid-cols-[0.6fr_1.4fr_1.4fr_auto]"><Input value={recordId} onChange={(event) => setRecordId(event.target.value)} placeholder="ID" className="bg-white" /><Input value={updateName} onChange={(event) => setUpdateName(event.target.value)} placeholder="Novo nome" className="bg-white" /><Input value={updateEmail} onChange={(event) => setUpdateEmail(event.target.value)} placeholder="Novo email (opcional)" className="bg-white" /><Button type="submit" variant="outline" disabled={pending} className="border-[#1267d6] bg-white text-[#1267d6]">Actualizar</Button></form>{feedback && <p className="mt-2 text-xs font-medium text-[#477514]">{feedback}</p>}{(counterpartyCreate.error || productCreate.error || accountCreate.error || counterpartyUpdate.error || productUpdate.error || accountUpdate.error) && <p className="mt-2 text-xs font-medium text-rose-700">Não foi possível guardar. Verifique o contexto da empresa e as permissões.</p>}</CardContent></Card>;
}


function FixedAssetPanel({ company }: { company?: { id: number; organizationId: number } }) {
  const utils = trpc.useUtils();
  const depreciation = trpc.fixedAssets.depreciation.useMutation();
  const createAsset = trpc.fixedAssets.create.useMutation({ onSuccess: async () => { await utils.fixedAssets.list.invalidate(); } });
  const updateAsset = trpc.fixedAssets.update.useMutation({ onSuccess: async () => { await utils.fixedAssets.list.invalidate(); } });
  const [acquisitionCost, setAcquisitionCost] = useState("0");
  const [residualValue, setResidualValue] = useState("0");
  const [usefulLifeMonths, setUsefulLifeMonths] = useState("60");
  const [elapsedMonths, setElapsedMonths] = useState("0");
  const [assetCode, setAssetCode] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetCost, setAssetCost] = useState("0");
  const [updateAssetId, setUpdateAssetId] = useState("");
  const [updateAssetName, setUpdateAssetName] = useState("");
  const [updateAssetStatus, setUpdateAssetStatus] = useState<"ACTIVE" | "DISPOSED">("ACTIVE");
  const submit = (event: React.FormEvent) => { event.preventDefault(); depreciation.mutate({ acquisitionCost: Number(acquisitionCost), residualValue: Number(residualValue), usefulLifeMonths: Number(usefulLifeMonths), elapsedMonths: Number(elapsedMonths) }); };
  const create = (event: React.FormEvent) => { event.preventDefault(); if (company && assetCode.trim() && assetName.trim()) createAsset.mutate({ organizationId: company.organizationId, companyId: company.id, code: assetCode.trim(), name: assetName.trim(), acquisitionDate: new Date(), acquisitionCost: Number(assetCost), usefulLifeMonths: Number(usefulLifeMonths), residualValue: Number(residualValue) }); };
  const update = (event: React.FormEvent) => { event.preventDefault(); const id = Number(updateAssetId); if (company && Number.isInteger(id) && id > 0 && updateAssetName.trim()) updateAsset.mutate({ companyId: company.id, assetId: id, name: updateAssetName.trim(), status: updateAssetStatus }); };
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm text-[#102a43]">Novo activo fixo e depreciação</CardTitle><p className="text-xs text-slate-500">Validação contabilística no servidor; o lançamento só é permitido por procedimento contabilístico autorizado.</p></CardHeader><CardContent><form onSubmit={create} className="mb-3 grid gap-2 md:grid-cols-4"><Input value={assetCode} onChange={(event) => setAssetCode(event.target.value)} placeholder="Código do activo" className="bg-white" /><Input value={assetName} onChange={(event) => setAssetName(event.target.value)} placeholder="Nome do activo" className="bg-white" /><Input type="number" min="0" value={assetCost} onChange={(event) => setAssetCost(event.target.value)} placeholder="Custo de aquisição" className="bg-white" /><Button type="submit" disabled={createAsset.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8]">{createAsset.isPending ? "A guardar…" : "Registar activo"}</Button></form><form onSubmit={update} className="mb-3 grid gap-2 border-t border-[#dbe5f1] pt-3 md:grid-cols-4"><Input value={updateAssetId} onChange={(event) => setUpdateAssetId(event.target.value)} placeholder="ID do activo" className="bg-white" /><Input value={updateAssetName} onChange={(event) => setUpdateAssetName(event.target.value)} placeholder="Novo nome" className="bg-white" /><select value={updateAssetStatus} onChange={(event) => setUpdateAssetStatus(event.target.value as "ACTIVE" | "DISPOSED")} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="ACTIVE">Activo</option><option value="DISPOSED">Baixar activo</option></select><Button type="submit" variant="outline" disabled={updateAsset.isPending} className="border-[#1267d6] bg-white text-[#1267d6]">Actualizar activo</Button></form><form onSubmit={submit} className="grid gap-2 md:grid-cols-5"><Input type="number" min="0" value={acquisitionCost} onChange={(event) => setAcquisitionCost(event.target.value)} placeholder="Custo" className="bg-white" /><Input type="number" min="0" value={residualValue} onChange={(event) => setResidualValue(event.target.value)} placeholder="Residual" className="bg-white" /><Input type="number" min="1" value={usefulLifeMonths} onChange={(event) => setUsefulLifeMonths(event.target.value)} placeholder="Vida (meses)" className="bg-white" /><Input type="number" min="0" value={elapsedMonths} onChange={(event) => setElapsedMonths(event.target.value)} placeholder="Decorridos" className="bg-white" /><Button type="submit" disabled={depreciation.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8]">{depreciation.isPending ? "A calcular…" : "Calcular"}</Button></form>{depreciation.data && <p className="mt-3 text-sm font-semibold text-[#477514]">Depreciação acumulada: {depreciation.data.accumulated.toLocaleString("pt-PT")} · Valor líquido: {depreciation.data.netBookValue.toLocaleString("pt-PT")}</p>}{depreciation.error && <p className="mt-3 text-xs font-medium text-rose-700">Não foi possível calcular; confirme os valores contabilísticos.</p>}</CardContent></Card>;
}


function StockMovementPanel({ company, periodId }: { company?: { id: number; organizationId: number }; periodId?: number }) {
  const movement = trpc.inventory.record.useMutation({ onSuccess: () => setFeedback("Movimento persistido e auditado."), onError: () => setFeedback("O servidor rejeitou o movimento; confirme período, permissões e código.") });
  const [productCode, setProductCode] = useState("");
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [feedback, setFeedback] = useState<string | null>(null);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setFeedback(null); if (!company || !periodId || !productCode.trim()) return setFeedback("Seleccione um período e indique o código do artigo."); setFeedback("Movimento enviado para validação…"); movement.mutate({ organizationId: company.organizationId, companyId: company.id, periodId, productCode: productCode.trim(), type, quantity: Number(quantity), unitCost: Number(unitCost), correlationId: `stock-ui-${Date.now()}` }); };
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm text-[#102a43]">Novo movimento de stock</CardTitle><p className="text-xs text-slate-500">A entrada/saída usa o período activo e passa pelos guards de stock e auditoria.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-2 md:grid-cols-5"><Input value={productCode} onChange={(event) => setProductCode(event.target.value)} placeholder="Código do artigo" className="bg-white" /><select value={type} onChange={(event) => setType(event.target.value as "IN" | "OUT")} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="IN">Entrada</option><option value="OUT">Saída</option></select><Input type="number" min="0.0001" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Quantidade" className="bg-white" /><Input type="number" min="0" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="Custo unitário" className="bg-white" /><Button type="submit" disabled={movement.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8]">{movement.isPending ? "A guardar…" : "Registar movimento"}</Button></form>{feedback && <p className="mt-2 text-xs font-medium text-[#477514]">{feedback}</p>}{movement.error && <p className="mt-2 text-xs font-medium text-rose-700">O servidor rejeitou o movimento; confirme período, permissões e código.</p>}</CardContent></Card>;
}


function AgtQrPreview({ company }: { company: { id: number; nif?: string } }) {
  const generateQrProcedure = (trpc.documents as typeof trpc.documents & { generateAgtQr?: typeof trpc.documents.generateAgtQr }).generateAgtQr;
  if (!generateQrProcedure) return null;
  const [qrDocumentNo, setQrDocumentNo] = useState("");
  const qrQuery = generateQrProcedure.useQuery({ companyId: company.id, issuerNif: company.nif ?? "", documentNo: qrDocumentNo }, { enabled: Boolean(company.nif && qrDocumentNo.trim()) });
  return <div className="mt-4 border-t border-[#dbe5f1] pt-4"><div className="flex flex-wrap items-end gap-2"><div className="min-w-[240px] flex-1"><label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">QR Code AGT</label><Input value={qrDocumentNo} onChange={(event) => setQrDocumentNo(event.target.value)} placeholder="N.º do documento emitido" className="mt-1 bg-white" /></div><span className="pb-2 text-xs text-slate-500">Consulta oficial no Quiosque AGT</span></div>{qrQuery.data && <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#dbe5f1] bg-white p-3"><img src={qrQuery.data.dataUrl} alt="QR Code AGT" width={140} height={140} className="h-[140px] w-[140px]" /><div className="text-xs text-slate-600"><p className="font-semibold text-[#102a43]">Payload validado</p><p className="mt-1 break-all">{qrQuery.data.payload.url}</p><p className="mt-2 text-amber-700">O logotipo AGT deve ser configurado no activo oficial antes da impressão certificada.</p></div></div>}{qrQuery.error && <p className="mt-2 text-xs text-rose-700">Não foi possível gerar o QR Code; confirme o NIF e o número do documento.</p>}</div>;
}

function DocumentCreatePanel({ company }: { company?: { id: number; nif?: string } }) {
  const [series, setSeries] = useState("FT");
  const [documentType, setDocumentType] = useState("FT");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const createDraft = trpc.documents.createDraft.useMutation({ onSuccess: (result) => { setFeedback(`Rascunho ${result.documentNumber} criado e auditado.`); setDescription(""); setUnitPrice(""); }, onError: () => setFeedback("Não foi possível criar o documento; confirme contraparte, série e totais.") });
  if (!company) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    const parsedCounterpartyId = Number(counterpartyId);
    const parsedQuantity = Number(quantity);
    const parsedUnitPrice = Number(unitPrice);
    if (!series.trim() || !documentType.trim() || !Number.isInteger(parsedCounterpartyId) || parsedCounterpartyId <= 0 || !description.trim() || !quantity.trim() || !unitPrice.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      setFeedback("Preencha série, contraparte, descrição, quantidade e preço válidos.");
      return;
    }
    const netAmount = parsedQuantity * parsedUnitPrice;
    createDraft.mutate({ companyId: company.id, series: series.trim(), documentType: documentType.trim(), counterpartyId: parsedCounterpartyId, counterpartyType: "CUSTOMER", ivaRegime: "EXCLUSAO", currency: "AOA", items: [{ description: description.trim(), quantity: parsedQuantity, unitPrice: parsedUnitPrice, netAmount, taxAmount: 0, totalAmount: netAmount, taxType: "IVA", taxRate: 0 }] });
  };
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-3"><CardTitle className="text-sm text-[#102a43]">Novo documento de facturação</CardTitle><p className="text-xs text-slate-500">Cria um rascunho fiscal na empresa activa, reserva a numeração e regista auditoria.</p></CardHeader><CardContent><form id="operational-create-form" onSubmit={submit} className="grid gap-2 md:grid-cols-[0.7fr_0.7fr_0.8fr_1.4fr_0.7fr_0.9fr_auto]"><Input value={series} onChange={(event) => setSeries(event.target.value)} placeholder="Série" className="bg-white" /><Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="Tipo" className="bg-white" /><Input value={counterpartyId} onChange={(event) => setCounterpartyId(event.target.value)} placeholder="ID cliente" className="bg-white" /><Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição" className="bg-white" /><Input type="number" min="0.0001" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Qtd." className="bg-white" /><Input type="number" min="0" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} placeholder="Preço" className="bg-white" /><Button type="submit" disabled={createDraft.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8]">{createDraft.isPending ? "A guardar…" : "Criar rascunho"}</Button></form>{feedback && <p className={`mt-2 text-xs font-medium ${createDraft.error ? "text-rose-700" : "text-[#477514]"}`}>{feedback}</p>}{company && <AgtQrPreview company={company} />}</CardContent></Card>;
}
