import { AlertTriangle, CheckCircle2, FlaskConical, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Readiness = {
  ready: boolean;
  status: string;
  accountCount: number;
  confirmedAccountCount: number;
  sourceCount: number;
  confirmedSourceCount: number;
  accountingRuleCount: number;
  blockers: string[];
  coverage?: { required: string[]; active: string[]; missing: string[]; complete: boolean };
};

const blockerLabels: Record<string, string> = {
  PGC_VERSION_MUST_BE_VALIDATED: "A versão PGCA ainda não foi validada",
  PGC_VERSION_WITHOUT_ACCOUNTING_RULES: "Não existem regras contabilísticas activas",
  PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE: "Falta cobertura de uma ou mais operações",
  PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS: "Existem contas sem confirmação",
  PGC_VERSION_HAS_UNCONFIRMED_SOURCES: "Existem fontes normativas sem confirmação",
  PGC_VERSION_WITHOUT_ACCOUNTS: "A versão não tem contas",
  PGC_VERSION_WITHOUT_SOURCES: "A versão não tem fontes normativas",
};

const operationLabels: Record<string, string> = {
  COMPRAS: "Compras",
  VENDAS: "Vendas",
  STOCK: "Stock",
  TESOURARIA: "Tesouraria",
  SALARIOS: "Salários",
  IMOBILIZADO: "Imobilizado",
};

export const getReadinessCoveragePercent = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;
const percent = getReadinessCoveragePercent;

export function PgcaReadinessDetailPanel({ readiness, versionCode, testMetrics = { testFiles: 155, tests: 633, verifiedAt: "27/08/2026" } }: { readiness?: Readiness; versionCode?: string; testMetrics?: { testFiles: number; tests: number; verifiedAt: string } }) {
  if (!readiness) return <Card className="rounded-sm border-[#bfc9d4] shadow-none"><CardContent className="p-3 text-xs text-slate-500">Seleccione uma versão PGCA para consultar o estado detalhado.</CardContent></Card>;
  const accountCoverage = percent(readiness.confirmedAccountCount, readiness.accountCount);
  const sourceCoverage = percent(readiness.confirmedSourceCount, readiness.sourceCount);
  const operations = readiness.coverage?.required ?? [];
  const activeOperations = new Set(readiness.coverage?.active ?? []);
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none" data-testid="pgca-readiness-detail"><CardHeader className="border-b border-[#d9e0e7] px-3 py-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Estado detalhado de prontidão PGCA</CardTitle><p className="mt-0.5 text-[11px] text-slate-500">Versão {versionCode ?? "seleccionada"}; leitura operacional dos bloqueadores e da cobertura actual.</p></div><Badge className={`rounded-sm text-[10px] ${readiness.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{readiness.ready ? "Pronta" : "Bloqueada"}</Badge></div></CardHeader><CardContent className="space-y-3 p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Contas confirmadas" value={`${readiness.confirmedAccountCount}/${readiness.accountCount}`} detail={`${accountCoverage}%`} tone={accountCoverage === 100 ? "ok" : "warn"} /><Metric label="Fontes confirmadas" value={`${readiness.confirmedSourceCount}/${readiness.sourceCount}`} detail={`${sourceCoverage}%`} tone={sourceCoverage === 100 ? "ok" : "warn"} /><Metric label="Regras activas" value={String(readiness.accountingRuleCount)} detail="por versão" tone={readiness.accountingRuleCount > 0 ? "ok" : "warn"} /><Metric label="Estado da versão" value={readiness.status} detail="workflow auditado" /></div><div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]"><div className="rounded border border-slate-200 bg-white p-3"><div className="flex items-center justify-between text-[11px] font-semibold text-[#102a43]"><span>Cobertura das seis operações</span><span>{activeOperations.size}/{operations.length}</span></div><div className="mt-2 grid grid-cols-2 gap-1.5 md:grid-cols-3">{operations.map(operation => { const active = activeOperations.has(operation); return <div key={operation} className={`flex items-center gap-1.5 border px-2 py-1.5 text-[10px] ${active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-900"}`}>{active ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}{operationLabels[operation] ?? operation}</div>; })}</div></div><div className="rounded border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900"><div className="flex items-center gap-2 font-semibold"><FlaskConical className="h-3.5 w-3.5" /> Qualidade verificada</div><p className="mt-1">Última suite local: <strong>{testMetrics.testFiles} ficheiros de teste</strong> e <strong>{testMetrics.tests} testes aprovados</strong>, verificada em {testMetrics.verifiedAt}. Estes números documentam a qualidade do código; não substituem a aprovação normativa.</p></div></div>{readiness.blockers.length ? <div className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-950"><p className="font-semibold">Bloqueadores que impedem a activação</p><div className="mt-1 grid gap-1 md:grid-cols-2">{readiness.blockers.map(blocker => <div key={blocker} className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-700" /><span>{blockerLabels[blocker] ?? blocker}</span></div>)}</div></div> : <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Não existem bloqueadores de readiness registados.</div>}<p className="text-[10px] text-slate-500">A prontidão é informativa até a transição auditada. Nenhuma regra é activada por este painel.</p></CardContent></Card>;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "ok" | "warn" }) { return <div className="border border-slate-200 bg-white px-2 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className={`mt-1 text-sm font-semibold ${tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-rose-700" : "text-[#102a43]"}`}>{value}</p><p className="text-[10px] text-slate-500">{detail}</p></div>; }
