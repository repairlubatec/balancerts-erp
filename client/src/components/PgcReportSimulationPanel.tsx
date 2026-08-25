import { useMemo, useState } from "react";
import { Eye, LockKeyhole } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Account = { code: string; name: string };
type Props = { companyId?: number; periodId?: number; versionCode?: string; versionStatus?: string; accounts: Account[] };

export function resolveCandidateAccountName(accountCode: string, candidateAccounts: Account[], fallback: string) {
  return candidateAccounts.find(account => account.code === accountCode)?.name ?? fallback;
}

export function PgcReportSimulationPanel({ companyId, periodId, versionCode, versionStatus, accounts }: Props) {
  const [map, setMap] = useState<"trial" | "results" | "balance">("trial");
  const input = companyId ? { companyId, periodId } : skipToken;
  const trial = trpc.reports.trialBalance.useQuery(input);
  const results = trpc.reports.incomeStatement.useQuery(input, { enabled: Boolean(companyId && map === "results") });
  const balance = trpc.reports.balanceSheet.useQuery(input, { enabled: Boolean(companyId && map === "balance") });
  const names = useMemo(() => new Map(accounts.map(account => [account.code, account.name])), [accounts]);
  const money = (value: number) => `${Number(value ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AOA`;
  if (!companyId || !versionCode) return null;
  const blocked = versionStatus !== "ACTIVE";
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none" data-testid="pgc-report-simulation">
    <CardHeader className="border-b border-[#d9e0e7] px-3 py-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Eye className="h-4 w-4 text-[#1267d6]" /> Simulação de relatórios com PGCA candidato</CardTitle><p className="mt-0.5 text-[11px] text-slate-500">Pré-visualização read-only dos movimentos publicados com a nomenclatura da versão {versionCode}.</p></div><Badge variant="outline">{blocked ? "Não activa" : "Activa"}</Badge></div></CardHeader>
    <CardContent className="space-y-3 p-3"><div className="flex items-start gap-2 rounded border border-blue-200 bg-blue-50 p-2 text-[11px] text-blue-900"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Esta simulação não importa contas, não escreve lançamentos e não altera a versão activa. Os totais vêm dos movimentos publicados do período seleccionado; apenas a designação é resolvida contra o catálogo PGCA candidato quando existe correspondência de código.</span></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={map === "trial" ? "default" : "outline"} onClick={() => setMap("trial")} className="h-7 text-[11px]">Balancete</Button><Button type="button" size="sm" variant={map === "results" ? "default" : "outline"} onClick={() => setMap("results")} className="h-7 text-[11px]">Resultados</Button><Button type="button" size="sm" variant={map === "balance" ? "default" : "outline"} onClick={() => setMap("balance")} className="h-7 text-[11px]">Balanço</Button></div>{map === "trial" && <div className="overflow-auto rounded border border-slate-200 bg-white"><table className="w-full text-left text-xs"><thead className="border-b bg-slate-50 text-[10px] uppercase text-slate-500"><tr><th className="px-2 py-1.5">Código</th><th className="px-2 py-1.5">Designação PGCA candidata</th><th className="px-2 py-1.5 text-right">Débito</th><th className="px-2 py-1.5 text-right">Crédito</th></tr></thead><tbody className="divide-y divide-slate-100">{trial.isLoading ? <tr><td colSpan={4} className="px-2 py-3 text-slate-500">A calcular simulação…</td></tr> : (trial.data?.rows ?? []).length === 0 ? <tr><td colSpan={4} className="px-2 py-3 text-slate-500">Sem movimentos publicados no período.</td></tr> : trial.data?.rows.map(row => <tr key={row.accountCode}><td className="px-2 py-1.5 font-mono font-semibold text-[#1267d6]">{row.accountCode}</td><td className="px-2 py-1.5">{resolveCandidateAccountName(row.accountCode, accounts, row.accountName)}<span className="ml-2 text-[10px] text-slate-400">{names.has(row.accountCode) ? "candidato" : "sem correspondência"}</span></td><td className="px-2 py-1.5 text-right">{money(row.debit)}</td><td className="px-2 py-1.5 text-right">{money(row.credit)}</td></tr>)}</tbody><tfoot className="border-t bg-slate-50 font-semibold"><tr><td colSpan={2} className="px-2 py-1.5">Totais</td><td className="px-2 py-1.5 text-right">{money(trial.data?.totals.debit ?? 0)}</td><td className="px-2 py-1.5 text-right">{money(trial.data?.totals.credit ?? 0)}</td></tr></tfoot></table></div>}{map === "results" && <div className="grid gap-2 md:grid-cols-3">{[["Rendimentos", results.data?.revenue], ["Gastos", results.data?.expenses], ["Resultado líquido", results.data?.netIncome]].map(([label, value]) => <div key={String(label)} className="rounded border border-slate-200 bg-white p-3"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{money(Number(value ?? 0))}</p></div>)}</div>}{map === "balance" && <div className="grid gap-2 md:grid-cols-3">{[["Activo", balance.data?.assets], ["Passivo", balance.data?.liabilities], ["Capital próprio", balance.data?.equity]].map(([label, value]) => <div key={String(label)} className="rounded border border-slate-200 bg-white p-3"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{money(Number(value ?? 0))}</p></div>)}</div>}</CardContent>
  </Card>;
}
