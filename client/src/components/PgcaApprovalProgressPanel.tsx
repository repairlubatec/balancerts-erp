import { BarChart3, CheckCircle2, CircleDashed, Download, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildPgcaApprovalCsv, buildPgcaApprovalExcel, downloadPgcaApprovalFile } from "@/lib/pgcaApprovalExport";

type Account = { code: string; name: string; validationStatus: string; accountType: string; nature: string; acceptsEntries: number; parentCode?: string | null; classCode?: string };
type Rule = { operation: string; active: number; taxType?: string | null; calculationBase?: string | null; taxRate?: string | number | null; priority: number; effectiveFrom: Date | string; effectiveTo?: Date | string | null };

const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 0;

export function PgcaApprovalProgressPanel({ accounts, rules }: { accounts: Account[]; rules: Rule[] }) {
  const confirmed = accounts.filter(account => account.validationStatus === "CONFIRMED").length;
  const pending = accounts.filter(account => account.validationStatus === "NEEDS_NORMATIVE_VALIDATION").length;
  const other = accounts.length - confirmed - pending;
  const activeRules = rules.filter(rule => rule.active === 1).length;
  const draftRules = rules.length - activeRules;
  const operations = ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"];
  const covered = operations.filter(operation => rules.some(rule => rule.active === 1 && rule.operation.toUpperCase().includes(operation))).length;
  const exportFiles = (kind: "csv" | "xls") => {
    const content = kind === "csv" ? buildPgcaApprovalCsv(accounts.filter(account => account.validationStatus === "CONFIRMED"), rules) : buildPgcaApprovalExcel(accounts.filter(account => account.validationStatus === "CONFIRMED"), rules);
    downloadPgcaApprovalFile(content, `pgca-aprovacao-${new Date().toISOString().slice(0, 10)}.${kind}`, kind === "csv" ? "text/csv;charset=utf-8" : "application/vnd.ms-excel;charset=utf-8");
    toast.success(`Exportação ${kind.toUpperCase()} concluída.`);
  };
  return <Card className="rounded-sm border-[#bfc9d4] shadow-none"><CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-[#d9e0e7] px-3 py-2"><div><CardTitle className="text-sm">Progresso de aprovação PGCA</CardTitle><p className="mt-0.5 text-[10px] text-slate-500">Indicadores derivados dos registos da versão seleccionada; não representam activação normativa.</p></div><BarChart3 className="h-5 w-5 text-[#1267d6]" /></CardHeader><CardContent className="grid gap-3 p-3 lg:grid-cols-[1.35fr_1fr_auto]"><div className="space-y-2"><div className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Contas confirmadas</span><strong>{confirmed} / {accounts.length} ({percent(confirmed, accounts.length)}%)</strong></div><div className="h-2 bg-slate-100"><div className="h-2 bg-emerald-500" style={{ width: `${percent(confirmed, accounts.length)}%` }} /></div><div className="flex items-center justify-between text-[11px]"><span className="flex items-center gap-1.5"><CircleDashed className="h-3.5 w-3.5 text-amber-600" /> Pendentes normativas</span><strong>{pending}</strong></div><div className="h-2 bg-slate-100"><div className="h-2 bg-amber-500" style={{ width: `${percent(pending, accounts.length)}%` }} /></div>{other > 0 && <div className="text-[10px] text-slate-500">{other} contas em estados de excepção ou bloqueio.</div>}</div><div className="space-y-2 border-l border-slate-200 pl-3 text-[11px]"><div className="flex items-center justify-between"><span>Regras activas</span><Badge className="rounded-sm bg-emerald-100 text-[10px] text-emerald-800">{activeRules}</Badge></div><div className="flex items-center justify-between"><span>Regras em rascunho</span><Badge variant="outline" className="rounded-sm text-[10px]">{draftRules}</Badge></div><div className="flex items-center justify-between"><span>Cobertura de operações</span><strong>{covered}/{operations.length}</strong></div><div className="flex gap-1">{operations.map(operation => <span key={operation} title={`${operation}: ${rules.some(rule => rule.active === 1 && rule.operation.toUpperCase().includes(operation)) ? "coberta" : "sem regra activa"}`} className={`h-2.5 flex-1 ${rules.some(rule => rule.active === 1 && rule.operation.toUpperCase().includes(operation)) ? "bg-emerald-500" : "bg-slate-200"}`} />)}</div></div><div className="flex flex-wrap items-start gap-1.5 lg:flex-col"><Button type="button" variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => exportFiles("csv")} disabled={!confirmed && !activeRules}><Download className="mr-1 h-3 w-3" /> CSV aprovado</Button><Button type="button" variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => exportFiles("xls")} disabled={!confirmed && !activeRules}><FileSpreadsheet className="mr-1 h-3 w-3" /> Excel aprovado</Button><div className="flex items-center gap-1 text-[9px] text-slate-500"><ShieldAlert className="h-3 w-3" /> Só exporta confirmados/activos</div></div></CardContent></Card>;
}
