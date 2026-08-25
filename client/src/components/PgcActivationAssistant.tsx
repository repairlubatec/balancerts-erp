import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileDown, LockKeyhole, PlayCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { pgcaV2Preflight } from "@/data/pgcaV2Preflight";

const blockerLabel: Record<string, string> = {
  PGC_VERSION_MUST_BE_VALIDATED: "A versão ainda não foi validada.",
  PGC_VERSION_WITHOUT_ACCOUNTS: "A versão não contém contas persistidas.",
  PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS: "Existem contas sem confirmação.",
  PGC_VERSION_WITHOUT_SOURCES: "Não existem fontes normativas.",
  PGC_VERSION_HAS_UNCONFIRMED_SOURCES: "Existem fontes normativas sem confirmação.",
  PGC_VERSION_WITHOUT_ACCOUNTING_RULES: "Não existem regras contabilísticas activas.",
  PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE: "A cobertura das operações contabilísticas está incompleta.",
};

type Account = { id: number; code: string; name: string; validationStatus: string; acceptsEntries: number };

type Props = { organizationId?: number; companyId?: number; versionId?: number; accounts: Account[]; onChanged?: () => void };

export function canActivatePgcVersion(readiness: { ready?: boolean; blockers?: string[] } | undefined) {
  return readiness?.ready === true && (readiness.blockers ?? []).length === 0;
}

export function canImportPgcAccount(input: { validationStatus: string; hasPrimarySource: boolean; hasParent: boolean; isReserved: boolean; isDuplicate: boolean }) {
  return input.validationStatus === "CONFIRMED" && input.hasPrimarySource && input.hasParent && !input.isReserved && !input.isDuplicate;
}

export function PgcActivationAssistant({ organizationId, companyId, versionId, accounts, onChanged }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [reviewStatus, setReviewStatus] = useState<"CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT">("CONFIRMED");
  const [reviewNotes, setReviewNotes] = useState("");
  const readiness = trpc.pgc.activationReadiness.useQuery(
    organizationId && versionId ? { organizationId, versionId } : { organizationId: 0, versionId: 0 },
    { enabled: Boolean(organizationId && versionId) },
  );
  const review = trpc.pgc.reviewAccountsBatch.useMutation({
    onSuccess: async () => { toast.success("Revisão das contas guardada e auditada."); setSelectedIds([]); setReviewNotes(""); await readiness.refetch(); onChanged?.(); },
    onError: error => toast.error(error.message),
  });
  const submit = trpc.pgc.submitForReview.useMutation({ onSuccess: async () => { toast.success("Versão enviada para revisão."); await readiness.refetch(); onChanged?.(); }, onError: error => toast.error(error.message) });
  const validate = trpc.pgc.validateVersion.useMutation({ onSuccess: async () => { toast.success("Versão validada."); await readiness.refetch(); onChanged?.(); }, onError: error => toast.error(error.message) });
  const activate = trpc.pgc.activateVersion.useMutation({ onSuccess: async () => { toast.success("Versão PGCA activada."); await readiness.refetch(); onChanged?.(); }, onError: error => toast.error(error.message) });
  const pending = useMemo(() => accounts.filter(account => account.validationStatus !== "CONFIRMED"), [accounts]);
  const data = readiness.data;
  const blockers = data?.blockers ?? [];
  const canSubmit = Boolean(organizationId && versionId && selectedIds.length && !review.isPending);
  const toggle = (id: number) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const reviewSelected = () => { if (!organizationId || !versionId || !canSubmit) return; review.mutate({ organizationId, versionId, accountIds: selectedIds, validationStatus: reviewStatus, notes: reviewNotes.trim() || undefined }); };
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none" data-testid="pgc-activation-assistant">
    <CardHeader className="border-b border-[#d9e0e7] px-3 py-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Assistente de activação segura PGCA</CardTitle><p className="mt-0.5 text-[11px] text-slate-500">Reveja, configure e simule antes de activar. Nenhuma guarda normativa é ignorada.</p></div><Button type="button" size="sm" variant="outline" onClick={() => readiness.refetch()} disabled={readiness.isFetching} className="h-7 rounded-sm bg-white text-[10px]"><RefreshCw className={`mr-1 h-3 w-3 ${readiness.isFetching ? "animate-spin" : ""}`} /> Actualizar estado</Button></div></CardHeader>
    <CardContent className="space-y-3 p-3">
      <div className="grid gap-2 md:grid-cols-4"><div className="rounded border border-slate-200 bg-white p-2"><p className="text-[10px] uppercase text-slate-500">Versão</p><p className="mt-1 font-semibold text-[#102a43]">{data?.status ?? "A carregar…"}</p></div><div className="rounded border border-slate-200 bg-white p-2"><p className="text-[10px] uppercase text-slate-500">Contas confirmadas</p><p className="mt-1 font-semibold text-[#102a43]">{data ? `${data.confirmedAccountCount}/${data.accountCount}` : "—"}</p></div><div className="rounded border border-slate-200 bg-white p-2"><p className="text-[10px] uppercase text-slate-500">Regras activas</p><p className="mt-1 font-semibold text-[#102a43]">{data?.accountingRuleCount ?? "—"}</p></div><div className={`rounded border p-2 ${data?.ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}><p className="text-[10px] uppercase text-slate-500">Prontidão</p><p className={`mt-1 font-semibold ${data?.ready ? "text-emerald-700" : "text-amber-700"}`}>{data?.ready ? "Pronta" : "Bloqueada"}</p></div></div>
      {blockers.length > 0 ? <div className="rounded border border-amber-200 bg-amber-50 p-3"><p className="flex items-center gap-1 text-xs font-semibold text-amber-900"><AlertTriangle className="h-3.5 w-3.5" /> Bloqueios que têm de ser resolvidos</p><div className="mt-2 grid gap-1 md:grid-cols-2">{blockers.map(blocker => <div key={blocker} className="text-[11px] text-amber-800">{blockerLabel[blocker] ?? blocker}</div>)}</div></div> : <div className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Todas as guardas permitem avançar para a próxima etapa.</div>}
      <div className="grid gap-3 lg:grid-cols-2"><section className="rounded border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><div><h3 className="text-xs font-semibold text-[#102a43]">Revisão de contas pendentes</h3><p className="mt-0.5 text-[10px] text-slate-500">{pending.length} contas persistidas aguardam decisão.</p></div><Badge variant="outline">{selectedIds.length} seleccionadas</Badge></div>{pending.length === 0 ? <p className="mt-3 text-[11px] text-slate-500">Não há contas persistidas pendentes. As restantes contas do documento anexado continuam em staging e não podem ser importadas automaticamente.</p> : <div className="mt-2 max-h-40 space-y-1 overflow-auto">{pending.map(account => <label key={account.id} className="flex items-center gap-2 rounded border border-slate-100 px-2 py-1.5 text-[11px] hover:bg-slate-50"><Checkbox checked={selectedIds.includes(account.id)} onCheckedChange={() => toggle(account.id)} /><span className="font-mono text-[#1267d6]">{account.code}</span><span className="truncate">{account.name}</span><span className="ml-auto text-amber-700">{account.validationStatus}</span></label>)}</div>}
        <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_1fr_auto]"><select value={reviewStatus} onChange={event => setReviewStatus(event.target.value as typeof reviewStatus)} className="h-8 rounded-sm border border-slate-200 bg-white px-2 text-[11px]" aria-label="Decisão da revisão em lote"><option value="CONFIRMED">Confirmar</option><option value="INVALID">Marcar inválida</option><option value="DUPLICATE">Marcar duplicada</option><option value="MISSING_PARENT">Marcar pai em falta</option></select><input value={reviewNotes} onChange={event => setReviewNotes(event.target.value)} placeholder="Nota da decisão" className="h-8 rounded-sm border border-slate-200 px-2 text-[11px]" /><Button type="button" size="sm" onClick={reviewSelected} disabled={!canSubmit} className="h-8 bg-[#1267d6] text-[11px]">Guardar revisão</Button></div></section>
        <section className="rounded border border-slate-200 bg-white p-3"><h3 className="text-xs font-semibold text-[#102a43]">Importação e regras contabilísticas</h3><p className="mt-1 text-[11px] text-slate-600">O documento anexado tem {pgcaV2Preflight.accountCount} contas reconhecidas, {pgcaV2Preflight.reservedExtensions} extensões reservadas e códigos duplicados. A importação integral está bloqueada pelo preflight.</p><div className="mt-2 rounded border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-800"><LockKeyhole className="mr-1 inline h-3.5 w-3.5" /> Não importar nem activar contas sem fonte primária confirmada, hierarquia resolvida e decisão humana.</div><div className="mt-2 flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled title="Bloqueado até que a fonte primária e a matriz jurídica sejam confirmadas"><FileDown className="mr-1 h-3 w-3" /> Preparar importação elegível</Button><span className="self-center text-[10px] text-slate-500">Regras activas: {data?.accountingRuleCount ?? 0} · operações em falta: {data?.coverage?.missing?.join(", ") || "—"}</span></div></section></div>
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-3"><Button type="button" size="sm" variant="outline" onClick={() => organizationId && versionId && submit.mutate({ organizationId, versionId })} disabled={!organizationId || !versionId || data?.status !== "DRAFT" || submit.isPending} className="h-8 text-[11px]">Enviar para revisão</Button><Button type="button" size="sm" variant="outline" onClick={() => organizationId && versionId && validate.mutate({ organizationId, versionId })} disabled={!organizationId || !versionId || data?.status !== "UNDER_REVIEW" || blockers.some(blocker => blocker !== "PGC_VERSION_MUST_BE_VALIDATED") || validate.isPending} className="h-8 text-[11px]">Validar versão</Button><Button type="button" size="sm" onClick={() => organizationId && versionId && activate.mutate({ organizationId, versionId })} disabled={!organizationId || !versionId || !canActivatePgcVersion(data) || activate.isPending} className="h-8 bg-[#477514] text-[11px]"><PlayCircle className="mr-1 h-3 w-3" /> Activar versão</Button></div>
    </CardContent>
  </Card>;
}
