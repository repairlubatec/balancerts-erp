import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  FileSearch,
  Filter,
  Info,
  LockKeyhole,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pgcaV2Decision, pgcaV2Preflight } from "@/data/pgcaV2Preflight";

const externalBlockers = [
  { label: "Restauro isolado", count: 9, reason: "A RESTORE_DATABASE_URL e o destino MySQL/TiDB isolado ainda não foram disponibilizados." },
  { label: "Windows e instaladores", count: 4, reason: "É necessária uma máquina Windows limpa para validar EXE/MSI e actualizações." },
  { label: "Assinatura Windows", count: 3, reason: "O certificado e a validação da assinatura de código devem ocorrer fora do ambiente actual." },
  { label: "Homologação AGT", count: 3, reason: "Faltam credenciais e endpoint oficiais para homologação controlada." },
  { label: "Integração bancária", count: 3, reason: "Faltam documentação e credenciais dos bancos para integração real." },
  { label: "Aceitação Repair Lubatec", count: 5, reason: "Falta uma sessão de aceitação com utilizadores e dados anonimizados/controlados." },
] as const;

type ConflictDecision = "PENDING" | "EVIDENCE_REQUIRED" | "REJECT_LINE" | "READY_FOR_HUMAN_CONFIRMATION";

export function PgcaV2StagingPanel() {
  const decision = pgcaV2Decision();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");
  const [sortDescending, setSortDescending] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, ConflictDecision>>({});
  const [reservedReviewApproved, setReservedReviewApproved] = useState(false);

  const filteredCodes = useMemo(() => {
    return [...pgcaV2Preflight.duplicateCodes]
      .filter(code => !query.trim() || code.includes(query.trim()))
      .filter(code => status === "ALL" || (status === "RESOLVED" ? decisions[code] && decisions[code] !== "PENDING" : !decisions[code] || decisions[code] === "PENDING"))
      .sort((a, b) => sortDescending ? b.localeCompare(a, undefined, { numeric: true }) : a.localeCompare(b, undefined, { numeric: true }));
  }, [decisions, query, sortDescending, status]);

  const resolvedConflicts = pgcaV2Preflight.duplicateCodes.filter(code => decisions[code] && decisions[code] !== "PENDING").length;

  const setConflictDecision = (code: string, value: ConflictDecision) => {
    setDecisions(current => ({ ...current, [code]: value }));
  };

  return (
    <Card className="rounded-sm border-amber-300 bg-amber-50/60 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <CardTitle className="text-sm text-amber-950">Nova versão PGCA — revisão controlada</CardTitle>
            <p className="mt-0.5 text-[10px] text-amber-900/80">As decisões abaixo alteram apenas o estado de revisão. A activação normativa continua bloqueada.</p>
          </div>
        </div>
        <Badge className="shrink-0 rounded-sm border-amber-400 bg-amber-100 text-[10px] text-amber-900"><LockKeyhole className="mr-1 h-3 w-3" aria-hidden="true" /> Apenas revisão</Badge>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3 px-3 pb-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 2xl:grid-cols-4">
          <Summary label="Contas reconhecidas" value={pgcaV2Preflight.accountCount} />
          <Summary label="Códigos repetidos" value={pgcaV2Preflight.duplicateCodes.length} danger />
          <Summary label="Extensões reservadas" value={pgcaV2Preflight.reservedExtensions} danger />
          <Summary label="Documento concatenado" value="Não" good />
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-sm border border-amber-200 bg-white/70 px-2 py-1.5 text-[10px] text-slate-700"><span className="font-semibold">Códigos a desambiguar:</span>{" "}<span className="font-mono">{pgcaV2Preflight.duplicateCodes.join(", ")}</span></div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-700"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Importação normativa e activação bloqueadas</div>
        </div>

        <section className="space-y-2 rounded-sm border border-amber-200 bg-white/70 p-2" aria-labelledby="pgca-conflitos-title">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 id="pgca-conflitos-title" className="text-[11px] font-semibold text-slate-800">Revisão dos 5 códigos repetidos</h3><p className="text-[10px] text-slate-600">Resolvidos para revisão: {resolvedConflicts}/{pgcaV2Preflight.duplicateCodes.length}. Resolver não activa o código.</p></div>
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="relative"><Filter className="pointer-events-none absolute left-2 top-1.5 h-3 w-3 text-slate-400" aria-hidden="true" /><Input aria-label="Pesquisar códigos repetidos" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filtrar código" className="h-7 w-28 rounded-sm pl-6 text-[10px]" /></div>
              <Select value={status} onValueChange={value => setStatus(value as typeof status)}><SelectTrigger aria-label="Filtrar estado dos conflitos" className="h-7 w-28 rounded-sm bg-white text-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Todos</SelectItem><SelectItem value="PENDING">Pendentes</SelectItem><SelectItem value="RESOLVED">Resolvidos</SelectItem></SelectContent></Select>
              <Button variant="outline" aria-label={sortDescending ? "Ordenar códigos de forma crescente" : "Ordenar códigos de forma decrescente"} title="Ordenar por código" onClick={() => setSortDescending(value => !value)} className="h-7 rounded-sm bg-white px-2 text-[10px]">{sortDescending ? <ArrowDownAZ className="h-3.5 w-3.5" /> : <ArrowUpAZ className="h-3.5 w-3.5" />}</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-sm border border-amber-100">
            <div className="grid grid-cols-[4rem_1fr_10rem_auto] gap-2 border-b border-amber-200 bg-amber-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500"><span>Código</span><span>Estado</span><span>Decisão de staging</span><span>Acção</span></div>
            {filteredCodes.map(code => {
              const current = decisions[code] ?? "PENDING";
              return <div key={code} className="grid grid-cols-[4rem_1fr_10rem_auto] items-center gap-2 border-b border-amber-100 px-2 py-1 text-[10px] last:border-b-0"><span className="font-mono font-semibold text-slate-800">{code}</span><span><Badge variant="outline" className={current === "PENDING" ? "rounded-sm border-red-200 bg-red-50 text-[9px] text-red-700" : "rounded-sm border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700"}>{current === "PENDING" ? "Pendente" : "Registado para revisão"}</Badge></span><Select value={current} onValueChange={value => setConflictDecision(code, value as ConflictDecision)}><SelectTrigger aria-label={`Decisão para ${code}`} className="h-6 rounded-sm bg-white text-[9px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pendente</SelectItem><SelectItem value="EVIDENCE_REQUIRED">Solicitar evidência</SelectItem><SelectItem value="REJECT_LINE">Rejeitar linha</SelectItem><SelectItem value="READY_FOR_HUMAN_CONFIRMATION">Pronto para confirmação humana</SelectItem></SelectContent></Select><Button className="h-6 rounded-sm bg-[#1267d6] px-2 text-[9px]" onClick={() => setConflictDecision(code, current === "PENDING" ? "EVIDENCE_REQUIRED" : current)} disabled={current === "PENDING"}>Guardar</Button></div>;
            })}
            {!filteredCodes.length && <div className="px-2 py-3 text-center text-[10px] text-slate-500">Nenhum código corresponde ao filtro.</div>}
          </div>
        </section>

        <section className="space-y-2 rounded-sm border border-amber-200 bg-white/70 p-2" aria-labelledby="pgca-reservas-title">
          <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 id="pgca-reservas-title" className="text-[11px] font-semibold text-slate-800">Revisão em lote das 86 extensões reservadas</h3><p className="text-[10px] text-slate-600">Aprovar esta etapa significa aprovar a revisão documental, nunca criar designações ou regras.</p></div><Button variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => setReservedReviewApproved(true)} disabled={reservedReviewApproved} title="Regista que as extensões foram encaminhadas para confirmação humana, sem as activar.">{reservedReviewApproved ? <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" /> : null}{reservedReviewApproved ? "Revisão aprovada" : "Aprovar revisão em lote"}</Button></div>
          <div className="flex items-start gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-[10px] text-red-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>As extensões continuam sem designação confirmada, sem lançamentos permitidos e sem regras contabilísticas.</span></div>
        </section>

        <section className="space-y-2 rounded-sm border border-slate-200 bg-white/70 p-2" aria-labelledby="pgca-pendencias-title">
          <div className="flex items-center justify-between gap-2"><div><h3 id="pgca-pendencias-title" className="text-[11px] font-semibold text-slate-800">Pendências externas</h3><p className="text-[10px] text-slate-600">27 itens mantidos em espera porque exigem recursos ou validação fora do ambiente actual.</p></div><Badge variant="outline" className="rounded-sm border-red-200 bg-red-50 text-[10px] text-red-700" title="Nenhuma destas pendências é concluída automaticamente; cada grupo requer evidência externa verificável."><AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" /> 27 em espera</Badge></div>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">{externalBlockers.map(blocker => <div key={blocker.label} aria-label={`${blocker.label} (${blocker.count})`} className="flex min-w-0 items-start gap-1.5 rounded-sm border border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px]" title={blocker.reason}><Info className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" aria-hidden="true" /><span className="min-w-0 truncate text-slate-700">{blocker.label} <span className="font-semibold text-red-700">({blocker.count})</span></span></div>)}</div>
        </section>
        <p className="text-[10px] leading-relaxed text-amber-950/80">As decisões desta interface são rastreáveis como revisão de staging. O catálogo normativo só pode ser activado depois de confirmação da fonte primária, desambiguação dos códigos e validação humana das regras de movimentação.</p>
        <div className="sr-only" aria-live="polite">Estado de incorporação: {decision}. Pendências externas: 27 em espera.</div>
      </CardContent>
    </Card>
  );
}

function Summary({ label, value, danger, good }: { label: string; value: number | string; danger?: boolean; good?: boolean }) {
  return <div className="min-w-0 rounded-sm border border-amber-200 bg-white/70 px-2 py-1.5"><div className="flex items-center gap-1 text-[10px] text-slate-600">{good ? <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" /> : null}<span className="truncate">{label}</span></div><div className={`mt-0.5 text-base font-semibold ${danger ? "text-red-700" : good ? "text-emerald-700" : "text-slate-900"}`}>{value}</div></div>;
}
