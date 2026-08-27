import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, FileWarning, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const issueLabels: Record<string, string> = {
  INVALID_CURRENCY: "Moeda funcional diferente de AOA",
  DOCUMENT_OUTSIDE_PERIOD: "Documento fora do período seleccionado",
  UNBALANCED_ENTRY: "Lançamento sem equilíbrio entre débito e crédito",
  UNKNOWN_ACCOUNT: "Conta não encontrada no conjunto SAF-T",
  NON_POSTABLE_ACCOUNT: "Conta de grupo usada como conta lançável",
  EMPTY_DOCUMENT_NUMBER: "Documento sem numeração",
  DOCUMENT_TOTAL_MISMATCH: "Totais do documento incoerentes",
  EXCLUSAO_WITH_TAX: "Regime de exclusão com imposto indicado",
  ENTRY_OUTSIDE_PERIOD: "Movimento fora do período seleccionado",
  INVALID_DATE: "Data inválida",
};

export function getReportOnlyIssueCount(input: { semanticIssues?: unknown[]; xsdMessages?: unknown[] }) { return (input.semanticIssues?.length ?? 0) + (input.xsdMessages?.length ?? 0); }
export function statusLabel(valid: boolean) { return valid ? "Sem inconsistências" : "Requer revisão"; }

export function ReportOnlyControlPanel({ companyId }: { companyId?: number }) {
  const [showXml, setShowXml] = useState(false);
  const exportQuery = trpc.reports.saftExport.useQuery(
    companyId ? { companyId } : skipToken,
    { enabled: Boolean(companyId), retry: false },
  );
  if (!companyId) return null;
  const result = exportQuery.data;
  const semanticIssues: Array<{ code: string; message: string }> = result?.semanticValidation?.issues ?? [];
  const xsdIssues: string[] = result?.xsdValidation?.messages ?? [];
  const counts = result?.counts;
  const totalIssues = getReportOnlyIssueCount({ semanticIssues, xsdMessages: xsdIssues });
  const refresh = () => void exportQuery.refetch();
  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none" data-testid="report-only-control-panel">
      <CardHeader className="border-b border-[#d9e0e7] px-3 py-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Controlo da simulação REPORT_ONLY</CardTitle>
            <p className="mt-0.5 text-[11px] text-slate-500">Resultado local do exportador SAF-T AO. Este painel reporta problemas, mas não altera lançamentos nem submete ficheiros.</p>
          </div>
          <Badge className="rounded-sm bg-blue-100 text-[10px] text-blue-800">REPORT_ONLY</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {exportQuery.isLoading ? <div className="flex items-center gap-2 text-xs text-slate-500"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> A executar a simulação local…</div> : exportQuery.error ? <div className="flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900"><AlertTriangle className="h-4 w-4 shrink-0" /> Não foi possível obter o resultado da simulação para esta empresa.</div> : result ? <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Estado" value={statusLabel(totalIssues === 0)} tone={totalIssues === 0 ? "ok" : "warn"} />
            <Metric label="Inconsistências" value={String(totalIssues)} tone={totalIssues === 0 ? "ok" : "warn"} />
            <Metric label="Contas" value={String(counts?.accounts ?? 0)} />
            <Metric label="Movimentos" value={String(counts?.journalEntries ?? 0)} />
            <Metric label="Documentos" value={String(counts?.documents ?? 0)} />
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <ValidationTile title="Validação semântica" valid={Boolean(result.semanticValidation?.valid)} detail={`${semanticIssues.length} ocorrência(s)`} />
            <ValidationTile title="Validação estrutural XSD" valid={Boolean(result.structuralValidation)} detail={xsdIssues.length ? `${xsdIssues.length} erro(s)` : "XSD válido"} />
            <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"><LockKeyhole className="h-4 w-4 shrink-0" /><span><strong>Submissão externa:</strong> bloqueada ({result.externalSubmission ?? "não configurada"}).</span></div>
          </div>
          {totalIssues > 0 ? <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950"><div className="flex items-center gap-2 font-semibold"><FileWarning className="h-4 w-4" /> Inconsistências a rever</div><div className="mt-2 grid gap-1 md:grid-cols-2">{semanticIssues.map((issue, index) => <div key={`semantic-${issue.code}-${index}`} className="border-l-2 border-rose-400 pl-2"><strong>{issueLabels[issue.code] ?? issue.code}</strong><span className="ml-1 text-rose-800">{issue.message}</span></div>)}{xsdIssues.map((issue, index) => <div key={`xsd-${index}`} className="border-l-2 border-rose-400 pl-2"><strong>Erro XSD</strong><span className="ml-1 text-rose-800">{String(issue)}</span></div>)}</div></div> : <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><CheckCircle2 className="h-4 w-4" /> A simulação não encontrou inconsistências nos dados disponíveis.</div>}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2"><div className="text-[10px] text-slate-500">Esquema {result.version} · hash {result.contentHash.slice(0, 16)}… · pacote local preparado</div><div className="flex gap-1"><Button type="button" variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={refresh}><RefreshCw className="mr-1 h-3 w-3" /> Actualizar</Button><Button type="button" variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => setShowXml(value => !value)}><ChevronDown className="mr-1 h-3 w-3" /> {showXml ? "Ocultar XML" : "Ver XML local"}</Button><Button type="button" variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" disabled><Download className="mr-1 h-3 w-3" /> Download bloqueado</Button></div></div>
          {showXml && <pre className="max-h-60 overflow-auto rounded border border-slate-200 bg-slate-950 p-3 text-[10px] leading-4 text-slate-100">{result.xml}</pre>}
        </> : <p className="text-xs text-slate-500">Sem resultado de simulação disponível.</p>}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) { return <div className="rounded border border-slate-200 bg-white px-2 py-2"><p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className={`mt-1 text-sm font-semibold ${tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-rose-700" : "text-[#102a43]"}`}>{value}</p></div>; }
function ValidationTile({ title, valid, detail }: { title: string; valid: boolean; detail: string }) { return <div className={`flex items-center gap-2 rounded border px-3 py-2 text-xs ${valid ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{valid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}<span><strong>{title}:</strong> {detail}</span></div>; }
