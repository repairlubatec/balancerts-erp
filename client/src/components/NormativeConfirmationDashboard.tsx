import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, FileCheck2, Filter, LockKeyhole, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normativeCatalog } from "@/data/normativeCatalog";

type CatalogAccount = (typeof normativeCatalog.pgcaAccounts)[number];

type StatusFilter = "TODAS" | "CONFIRMED" | "NEEDS_HUMAN_CONFIRMATION";

const statusLabel: Record<StatusFilter, string> = {
  TODAS: "Todas",
  CONFIRMED: "Confirmadas",
  NEEDS_HUMAN_CONFIRMATION: "Pendentes",
};

const statusDescription: Record<string, string> = {
  CONFIRMED: "Confirmada visualmente",
  NEEDS_HUMAN_CONFIRMATION: "Aguarda confirmação humana",
};

function getClassCode(code: string) {
  return code.split(".")[0] || code;
}

function getEvidencePages(account: CatalogAccount): readonly number[] {
  if ("evidencePages" in account) return account.evidencePages;
  if ("pages" in account) return account.pages;
  return [];
}

function getAccountLevel(account: CatalogAccount) {
  return "level" in account ? String(account.level) : "Não especificado";
}

function getParentCode(account: CatalogAccount) {
  return "parentCode" in account && account.parentCode ? account.parentCode : "Classe";
}

function getEvidenceLabel(account: CatalogAccount) {
  return "evidence" in account && account.evidence === "visual" ? "Visual" : "Revisão pendente";
}

function accountStatus(account: CatalogAccount): StatusFilter {
  return account.status === "CONFIRMED" ? "CONFIRMED" : "NEEDS_HUMAN_CONFIRMATION";
}

function formatGeneratedAt(value: string) {
  return new Date(value).toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

function StatCard({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: "blue" | "green" | "amber" }) {
  return (
    <div data-testid={`normative-stat-${label}`} className="border border-[#d7e0e8] bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <span className={cn("h-2 w-2 rounded-full", tone === "green" && "bg-emerald-500", tone === "amber" && "bg-amber-500", tone === "blue" && "bg-[#1267d6]")} />
      </div>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#1d2a38]">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function AccountRow({ account, selected, onSelect }: { account: CatalogAccount; selected: boolean; onSelect: () => void }) {
  const confirmed = accountStatus(account) === "CONFIRMED";
  return (
    <button type="button" onClick={onSelect} className={cn("flex w-full items-center gap-3 border-b border-[#edf1f5] px-3 py-2 text-left transition-colors hover:bg-[#f4f8fc]", selected && "bg-[#edf5ff] ring-1 ring-inset ring-[#8eb8ea]")}>
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", confirmed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
        {confirmed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#1d2a38]">{account.code}</span>
          <span className="truncate text-xs text-slate-700">{account.name}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
          <span>Classe {getClassCode(account.code)}</span>
          <span>•</span>
          <span>{confirmed ? `Pág. ${getEvidencePages(account).join(", ") || "—"}` : statusDescription[account.status] ?? account.status}</span>
        </span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
    </button>
  );
}

export function NormativeConfirmationDashboard() {
  const accounts = normativeCatalog.pgcaAccounts as readonly CatalogAccount[];
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");
  const [classFilter, setClassFilter] = useState("TODAS");
  const [search, setSearch] = useState("");
  const [selectedCode, setSelectedCode] = useState(accounts.find((account) => account.status === "CONFIRMED")?.code ?? accounts[0]?.code ?? "");

  const classes = useMemo(() => Array.from(new Set(accounts.map((account) => getClassCode(account.code)))).sort((a, b) => Number(a) - Number(b)), [accounts]);
  const confirmedAccounts = useMemo(() => accounts.filter((account) => account.status === "CONFIRMED"), [accounts]);
  const pendingAccounts = useMemo(() => accounts.filter((account) => account.status !== "CONFIRMED"), [accounts]);
  const filteredAccounts = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-PT");
    return accounts.filter((account) => {
      const matchesStatus = statusFilter === "TODAS" || accountStatus(account) === statusFilter;
      const matchesClass = classFilter === "TODAS" || getClassCode(account.code) === classFilter;
      const matchesSearch = !normalized || `${account.code} ${account.name}`.toLocaleLowerCase("pt-PT").includes(normalized);
      return matchesStatus && matchesClass && matchesSearch;
    });
  }, [accounts, classFilter, search, statusFilter]);
  const selectedAccount = accounts.find((account) => account.code === selectedCode) ?? filteredAccounts[0] ?? accounts[0];
  const pendingByClass = useMemo(() => classes.map((classCode) => ({ classCode, total: accounts.filter((account) => getClassCode(account.code) === classCode).length, pending: accounts.filter((account) => getClassCode(account.code) === classCode && account.status !== "CONFIRMED").length })), [accounts, classes]);

  const selectAccount = (account: CatalogAccount) => setSelectedCode(account.code);

  return (
    <section className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard label="Contas no catálogo" value={accounts.length} hint="Inventário normativo PGCA" tone="blue" />
        <StatCard label="Confirmadas" value={confirmedAccounts.length} hint="Evidência visual conferida" tone="green" />
        <StatCard label="Pendentes" value={pendingAccounts.length} hint="Aguardam confirmação humana" tone="amber" />
        <StatCard label="Movimentos activos" value={0} hint="Regras PGCA confirmadas" tone="amber" />
      </div>

      <Card className="rounded-sm border-[#bfc9d4] bg-[#f8fafc] shadow-none">
        <CardHeader className="border-b border-[#d9e0e7] px-3 py-2.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Painel de confirmação normativa</CardTitle>
              <p className="mt-1 text-[11px] text-slate-500">Consulta visual do estado real do catálogo. A confirmação não activa movimentos automaticamente.</p>
            </div>
            <Badge variant="outline" className="rounded-sm border-amber-300 bg-amber-50 text-amber-700"><LockKeyhole className="mr-1 h-3.5 w-3.5" /> CONFIRMED_ONLY</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="grid gap-2 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar código ou designação" className="h-8 rounded-sm bg-white pl-8 text-xs" />
            </div>
            <div className="flex items-center gap-1 border border-[#d7e0e8] bg-white p-1">
              <Filter className="ml-1 h-3.5 w-3.5 text-slate-400" />
              {(["TODAS", "CONFIRMED", "NEEDS_HUMAN_CONFIRMATION"] as const).map((value) => <Button key={value} type="button" variant="ghost" aria-label={`Filtrar por estado ${statusLabel[value]}`} onClick={() => setStatusFilter(value)} className={cn("h-6 rounded-sm px-2 text-[10px]", statusFilter === value ? "bg-[#e6f0fc] text-[#1267d6]" : "text-slate-600")}>{statusLabel[value]}</Button>)}
            </div>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="h-8 border border-[#d7e0e8] bg-white px-2 text-xs text-slate-700 outline-none focus:border-[#1267d6]">
              <option value="TODAS">Todas as classes</option>
              {classes.map((classCode) => <option key={classCode} value={classCode}>Classe {classCode}</option>)}
            </select>
          </div>

          <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
            <div className="border border-[#d7e0e8] bg-white">
              <div className="flex items-center justify-between border-b border-[#e4e9ef] bg-[#eef3f7] px-3 py-2">
                <div><p className="text-xs font-semibold text-[#1d2a38]">Contas do catálogo</p><p className="text-[10px] text-slate-500">{filteredAccounts.length} resultado(s) · seleccione uma linha para ver a evidência</p></div>
                <Badge variant="outline" className="rounded-sm bg-white text-[10px]">{statusFilter === "CONFIRMED" ? "Confirmadas" : statusFilter === "NEEDS_HUMAN_CONFIRMATION" ? "Pendentes" : "Todas"}</Badge>
              </div>
              <div className="max-h-[390px] overflow-y-auto">
                {filteredAccounts.map((account) => <AccountRow key={account.code} account={account} selected={selectedAccount?.code === account.code} onSelect={() => selectAccount(account)} />)}
                {!filteredAccounts.length && <div className="px-3 py-12 text-center text-xs text-slate-500">Nenhuma conta corresponde aos filtros actuais.</div>}
              </div>
            </div>

            <div className="space-y-3">
              <div className="border border-[#d7e0e8] bg-white">
                <div className="flex items-center gap-2 border-b border-[#e4e9ef] bg-[#eef3f7] px-3 py-2"><FileCheck2 className="h-3.5 w-3.5 text-[#1267d6]" /><p className="text-xs font-semibold text-[#1d2a38]">Detalhe da conta seleccionada</p></div>
                {selectedAccount ? <div className="space-y-2.5 p-3 text-xs"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-lg font-semibold text-[#1d2a38]">{selectedAccount.code}</p><p className="mt-0.5 text-sm text-slate-700">{selectedAccount.name}</p></div><Badge variant="outline" className={cn("rounded-sm", selectedAccount.status === "CONFIRMED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-700")}>{selectedAccount.status === "CONFIRMED" ? "Confirmada" : "Pendente"}</Badge></div><div className="grid grid-cols-2 gap-2 text-[11px]"><div className="border border-slate-200 bg-slate-50 p-2"><span className="text-slate-500">Hierarquia</span><strong className="mt-0.5 block text-slate-900">{getParentCode(selectedAccount)} · nível {getAccountLevel(selectedAccount)}</strong></div><div className="border border-slate-200 bg-slate-50 p-2"><span className="text-slate-500">Evidência</span><strong className="mt-0.5 block text-slate-900">{getEvidenceLabel(selectedAccount)}</strong></div></div><div className="border border-[#dbe7f3] bg-[#f3f8fd] p-2 text-[11px] text-slate-600"><p><strong className="text-slate-800">Autoridade:</strong> {selectedAccount.authority ?? "Decreto n.º 82/01"}</p><p className="mt-1"><strong className="text-slate-800">Páginas:</strong> {getEvidencePages(selectedAccount).join(", ") || "A confirmar"}</p><p className="mt-1"><strong className="text-slate-800">Fonte de trabalho:</strong> {selectedAccount.source ?? "Aguardando conferência"}</p></div>{selectedAccount.status !== "CONFIRMED" && <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Não utilizar em posting automático. A confirmação humana e a evidência primária ainda são obrigatórias.</span></div>}</div> : <p className="p-4 text-xs text-slate-500">Seleccione uma conta para consultar o detalhe.</p>}
              </div>

              <div className="border border-[#d7e0e8] bg-white">
                <div className="border-b border-[#e4e9ef] bg-[#eef3f7] px-3 py-2"><p className="text-xs font-semibold text-[#1d2a38]">Pendências por classe</p><p className="mt-0.5 text-[10px] text-slate-500">Distribuição do estado actual do catálogo</p></div>
                <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">{pendingByClass.map(({ classCode, total, pending }) => <button type="button" key={classCode} data-testid={`normative-class-summary-${classCode}`} onClick={() => { setClassFilter(classCode); setStatusFilter(pending ? "NEEDS_HUMAN_CONFIRMATION" : "TODAS"); }} className="border border-slate-200 bg-slate-50 p-2 text-left transition-colors hover:border-[#9fc1e7] hover:bg-[#f3f8fd]"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Classe {classCode}</span><ChevronRight className="h-3 w-3 text-slate-400" /></div><p className="mt-1 text-lg font-semibold text-slate-900">{pending}</p><p className="text-[10px] text-slate-500">pendentes · {total} total</p></button>)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e4e9ef] pt-2 text-[10px] text-slate-500"><span>Catálogo actualizado em {formatGeneratedAt(normativeCatalog.generatedAt)}</span><span className="font-medium text-amber-700">Os movimentos permanecem bloqueados até confirmação primária integral.</span></div>
        </CardContent>
      </Card>
    </section>
  );
}
