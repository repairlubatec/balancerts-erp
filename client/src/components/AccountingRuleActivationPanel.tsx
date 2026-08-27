import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Filter, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Rule = {
  id: number;
  operation: string;
  documentType: string | null;
  debitAccountId: number | null;
  creditAccountId: number | null;
  ivaAccountId: number | null;
  priority: number;
  active: number;
  effectiveFrom: Date | string;
  effectiveTo: Date | string | null;
  sourceId: number | null;
  taxType?: string | null;
  calculationBase?: string | null;
  taxRate?: string | number | null;
  notes?: string | null;
};

type Account = { id: number; code: string; name: string };
type RuleFilter = "ALL" | "DRAFT" | "ACTIVE";

export function AccountingRuleActivationPanel({ organizationId, versionId, versionStatus, rules, accounts }: { organizationId?: number; versionId?: number; versionStatus?: string; rules: Rule[]; accounts: Account[] }) {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<RuleFilter>("ALL");
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const activateRule = trpc.pgc.activateAccountingRule.useMutation({
    onSuccess: async () => { toast.success("Regra contabilística activada e auditada."); setReviewConfirmed(false); setSelectedRuleId(null); await utils.pgc.accountingRules.invalidate(); await utils.pgc.activationReadiness.invalidate(); },
    onError: error => toast.error(error.message),
  });
  const accountLabel = (id: number | null) => { const account = accounts.find(item => item.id === id); return account ? `${account.code} · ${account.name}` : `Conta #${id ?? "—"}`; };
  const visibleRules = useMemo(() => rules.filter(rule => filter === "ALL" || (filter === "ACTIVE" ? rule.active === 1 : rule.active !== 1)), [filter, rules]);
  const selectedRule = rules.find(rule => rule.id === selectedRuleId) ?? null;
  const canActivate = Boolean(organizationId && versionId && versionStatus === "UNDER_REVIEW" && selectedRule && selectedRule.active !== 1 && reviewConfirmed && !activateRule.isPending);
  return <Card className="rounded-sm border-[#bfc9d4] shadow-none" data-testid="pgca-rule-review-panel"><CardHeader className="border-b border-[#d9e0e7] px-3 py-2"><div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><ClipboardCheck className="h-4 w-4 text-[#1267d6]" /> Revisão e aprovação das regras PGCA-82-01</CardTitle><p className="mt-0.5 text-[10px] text-slate-500">Seleccione uma regra, confirme a evidência e active-a individualmente. Cada activação é revalidada no servidor e registada em auditoria.</p></div><Badge variant="outline" className="rounded-sm text-[10px]">{rules.filter(rule => rule.active === 1).length} activas · {rules.filter(rule => rule.active !== 1).length} em rascunho</Badge></div></CardHeader><CardContent className="space-y-3 p-3"><div className="flex flex-wrap items-center gap-1.5"><Filter className="h-3.5 w-3.5 text-slate-500" /><span className="mr-1 text-[10px] font-semibold text-slate-600">Mostrar:</span>{([ ["ALL", "Todas"], ["DRAFT", "Em rascunho"], ["ACTIVE", "Activas"] ] as const).map(([value, label]) => <Button key={value} type="button" variant={filter === value ? "default" : "outline"} className="h-7 rounded-sm px-2 text-[10px]" onClick={() => { setFilter(value); setSelectedRuleId(null); setReviewConfirmed(false); }}>{label}</Button>)}</div>{!rules.length ? <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"><LockKeyhole className="h-3.5 w-3.5" /> Ainda não existem regras definidas para esta versão.</div> : <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]"><div className="space-y-1.5">{visibleRules.map(rule => { const selected = selectedRuleId === rule.id; return <button key={rule.id} type="button" onClick={() => { setSelectedRuleId(rule.id); setReviewConfirmed(false); }} className={`flex w-full items-center justify-between gap-2 border px-3 py-2 text-left text-[11px] ${selected ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:bg-white"}`}><div className="min-w-0"><div className="font-semibold text-slate-900">{rule.operation}{rule.documentType ? ` · ${rule.documentType}` : ""}</div><div className="truncate text-slate-600">{accountLabel(rule.debitAccountId)} → {accountLabel(rule.creditAccountId)}</div><div className="text-[10px] text-slate-500">Prioridade {rule.priority} · Vigência desde {new Date(rule.effectiveFrom).toLocaleDateString("pt-PT")}</div></div>{rule.active === 1 ? <Badge className="shrink-0 rounded-sm bg-emerald-100 text-[10px] text-emerald-800"><CheckCircle2 className="mr-1 h-3 w-3" /> Activa</Badge> : <Badge variant="outline" className="shrink-0 rounded-sm text-[10px]">Rascunho</Badge>}</button>; })}{!visibleRules.length && <p className="border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-500">Não existem regras neste filtro.</p>}</div><div className="border border-slate-200 bg-white p-3 text-[11px]">{selectedRule ? <><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-[#102a43]">Detalhe da regra #{selectedRule.id}</p><p className="mt-0.5 text-slate-500">{selectedRule.operation}{selectedRule.documentType ? ` · ${selectedRule.documentType}` : ""}</p></div>{selectedRule.active === 1 ? <Badge className="rounded-sm bg-emerald-100 text-[10px] text-emerald-800">Activa</Badge> : <Badge variant="outline" className="rounded-sm text-[10px]">DRAFT</Badge>}</div><div className="mt-3 grid gap-1.5 sm:grid-cols-2"><Detail label="Débito" value={accountLabel(selectedRule.debitAccountId)} /><Detail label="Crédito" value={accountLabel(selectedRule.creditAccountId)} /><Detail label="Conta IVA" value={accountLabel(selectedRule.ivaAccountId)} /><Detail label="Fonte" value={selectedRule.sourceId ? `Fonte #${selectedRule.sourceId} confirmada no servidor` : "Em falta"} /><Detail label="Tratamento fiscal" value={`${selectedRule.taxType ?? "NONE"} · ${selectedRule.calculationBase ?? "NONE"}${selectedRule.taxRate != null ? ` · ${selectedRule.taxRate}%` : ""}`} /><Detail label="Vigência" value={`${new Date(selectedRule.effectiveFrom).toLocaleDateString("pt-PT")} → ${selectedRule.effectiveTo ? new Date(selectedRule.effectiveTo).toLocaleDateString("pt-PT") : "sem termo"}`} /></div>{selectedRule.active !== 1 && <div className="mt-3 space-y-2 border-t border-slate-200 pt-3"><p className="font-semibold text-slate-800">Checklist de aprovação humana</p><label className="flex items-start gap-2 text-[10px] text-slate-600"><input type="checkbox" className="mt-0.5" checked={reviewConfirmed} onChange={event => setReviewConfirmed(event.target.checked)} />Confirmo que revi as contas, a natureza, a fonte normativa e a vigência desta regra. Compreendo que a activação será auditada e não poderá ser feita por inferência.</label><Button type="button" className="h-8 rounded-sm bg-[#1267d6] px-3 text-[11px]" disabled={!canActivate} title={versionStatus !== "UNDER_REVIEW" ? "A versão tem de estar em revisão." : !reviewConfirmed ? "Conclua a confirmação humana." : "Activar regra com auditoria."} onClick={() => { if (!organizationId || !versionId || !selectedRule || !reviewConfirmed) return; activateRule.mutate({ organizationId, versionId, ruleId: selectedRule.id }); }}>{activateRule.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1 h-3.5 w-3.5" />} Aprovar e activar regra</Button></div>}{selectedRule.active === 1 && <div className="mt-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] text-emerald-900"><CheckCircle2 className="h-3.5 w-3.5" /> Regra activa; a aprovação já foi registada e não é repetida neste painel.</div>}</> : <div className="flex min-h-[150px] items-center justify-center text-center text-[11px] text-slate-500">Seleccione uma regra para rever a fonte, contas, vigência e tratamento fiscal antes da decisão.</div>}</div></div>}{versionStatus !== "UNDER_REVIEW" && <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-900"><ShieldAlert className="h-3.5 w-3.5" /> A aprovação está bloqueada porque a versão PGCA não está em revisão. O servidor mantém esta guarda.</div>}</CardContent></Card>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[9px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="truncate text-slate-800" title={value}>{value}</p></div>; }
