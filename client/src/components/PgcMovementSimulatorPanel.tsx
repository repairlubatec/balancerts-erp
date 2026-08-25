import { useMemo, useState } from "react";
import { Ban, CheckCircle2, FlaskConical, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { getAccountingMovementRule, validateDirectionalMovement } from "../../../shared/accountingMovementRules";

type PgcAccount = { id: number; code: string; name: string; nature: string; acceptsEntries: number; validationStatus: string; active: number };
type Props = { organizationId?: number; companyId?: number; versionId?: number; accounts: PgcAccount[] };
type SimulationResult = { simulationOnly: boolean; canPost: boolean; summary: string; levels: Array<{ code: string; label: string; status: "PASS" | "BLOCKED"; checks: Array<{ code: string; label: string; status: "PASS" | "BLOCKED"; detail: string }> }>; plannedMovement: { debit: string; credit: string; amount: number; ivaRate: number | null; ivaAmount: number | null; operation: string; documentType: string | null; transactionDate: Date } };

const levelAccent: Record<string, string> = { STRUCTURAL: "border-slate-300 bg-slate-50", NORMATIVE: "border-blue-200 bg-blue-50", OPERATIONAL: "border-emerald-200 bg-emerald-50" };
export const pgcOperations = ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] as const;

export function PgcMovementSimulatorPanel({ organizationId, companyId, versionId, accounts }: Props) {
  const [debitAccountId, setDebitAccountId] = useState("");
  const [creditAccountId, setCreditAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState("COMPRA");
  const [documentType, setDocumentType] = useState("");
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [ivaRate, setIvaRate] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const simulate = trpc.pgc.simulateMovement.useMutation({ onSuccess: (data) => { setResult(data as SimulationResult); toast.success("Simulação concluída sem publicar lançamentos."); }, onError: (error) => toast.error(error.message || "A simulação não pôde ser executada.") });
  const postableAccounts = useMemo(() => accounts.filter((account) => account.acceptsEntries === 1), [accounts]);
  const debitAccount = postableAccounts.find(account => String(account.id) === debitAccountId);
  const creditAccount = postableAccounts.find(account => String(account.id) === creditAccountId);
  const movement = validateDirectionalMovement({ debitNature: debitAccount?.nature, creditNature: creditAccount?.nature, hasConfirmedRule: false });
  const canSimulate = Boolean(organizationId && companyId && versionId && debitAccountId && creditAccountId && amount && operation.trim() && movement.ok && !simulate.isPending);

  const runSimulation = () => {
    if (!organizationId || !companyId || !versionId) { toast.error("Seleccione primeiro a empresa e a versão PGCA."); return; }
    if (!debitAccountId || !creditAccountId) { toast.error("Seleccione as contas a débito e a crédito."); return; }
    if (!movement.ok) { toast.error(movement.reason); return; }
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { toast.error("Indique um valor positivo válido."); return; }
    const numericRate = ivaRate.trim() ? Number(ivaRate.replace(",", ".")) : null;
    simulate.mutate({ organizationId, companyId, versionId, debitAccountId: Number(debitAccountId), creditAccountId: Number(creditAccountId), amount: numericAmount, operation: operation.trim(), documentType: documentType.trim() || null, transactionDate: new Date(`${transactionDate}T00:00:00.000Z`), ivaRate: numericRate, ivaAmount: numericRate == null ? null : Math.round(numericAmount * numericRate) / 100 });
  };

  return <Card className="rounded-sm border-[#bfc9d4] bg-[#f8fafc] shadow-none">
    <CardHeader className="border-b border-[#d9e0e7] px-3 py-2.5"><CardTitle className="flex items-center gap-2 text-sm"><FlaskConical className="h-4 w-4 text-[#1267d6]" /> Simulador seguro de regras de movimentação</CardTitle><p className="mt-1 text-[11px] text-slate-500">Teste uma regra PGCA em três níveis. Este fluxo é apenas de leitura: não cria, altera ou publica lançamentos.</p></CardHeader>
    <CardContent className="space-y-3 px-3 pb-3 pt-3">
      <div className={`rounded border px-3 py-2 text-[11px] ${movement.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><p className="font-semibold">Validação da contrapartida</p><p className="mt-1"><strong>Débito:</strong> {getAccountingMovementRule(debitAccount?.nature).debitLabel}</p><p><strong>Crédito:</strong> {getAccountingMovementRule(creditAccount?.nature).creditLabel}</p><p className="mt-1 text-[10px]">{debitAccount && creditAccount ? movement.reason : "Seleccione as duas contas para obter a validação."} Contas mistas exigem regra PGCA confirmada antes da publicação.</p></div><div className="grid gap-2 md:grid-cols-2"><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Conta a débito</Label><select value={debitAccountId} onChange={(event) => setDebitAccountId(event.target.value)} className="mt-1 h-8 w-full rounded-sm border border-[#d7e0e8] bg-white px-2 text-xs"><option value="">Seleccione uma conta</option>{postableAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {account.name} ({account.nature})</option>)}</select></div><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Conta a crédito</Label><select value={creditAccountId} onChange={(event) => setCreditAccountId(event.target.value)} className="mt-1 h-8 w-full rounded-sm border border-[#d7e0e8] bg-white px-2 text-xs"><option value="">Seleccione uma conta</option>{postableAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} — {account.name} ({account.nature})</option>)}</select></div></div>
      <div className="grid gap-2 md:grid-cols-5"><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Valor (Kz)</Label><Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0,00" className="mt-1 h-8 rounded-sm bg-white text-xs" /></div><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Operação</Label><select value={operation} onChange={(event) => setOperation(event.target.value)} className="mt-1 h-8 w-full rounded-sm border border-[#d7e0e8] bg-white px-2 text-xs">{pgcOperations.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Tipo de documento</Label><Input value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="FACTURA" className="mt-1 h-8 rounded-sm bg-white text-xs" /></div><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Data da operação</Label><Input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className="mt-1 h-8 rounded-sm bg-white text-xs" /></div><div><Label className="text-[10px] uppercase tracking-wide text-slate-500">IVA (%) opcional</Label><Input value={ivaRate} onChange={(event) => setIvaRate(event.target.value)} inputMode="decimal" placeholder="14" className="mt-1 h-8 rounded-sm bg-white text-xs" /></div></div>
      <div className="flex flex-wrap items-center justify-between gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"><span className="flex items-center gap-2"><LockKeyhole className="h-3.5 w-3.5" /><strong>Modo seguro:</strong> o simulador nunca chama o posting.</span><Button type="button" onClick={runSimulation} disabled={!canSimulate} className="h-8 rounded-sm bg-[#1267d6] text-xs"><Play className="mr-1 h-3.5 w-3.5" /> {simulate.isPending ? "A simular…" : "Executar simulação"}</Button></div>
      {result ? <div className="space-y-2"><div className={`border px-3 py-2 text-xs ${result.canPost ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-950"}`}><div className="flex items-center gap-2 font-semibold">{result.canPost ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />} {result.summary}</div><p className="mt-1 text-[10px]">Movimento planeado: débito {result.plannedMovement.debit} · crédito {result.plannedMovement.credit} · {result.plannedMovement.amount.toLocaleString("pt-PT")} Kz. Publicação: bloqueada.</p></div><div className="grid gap-2 lg:grid-cols-3">{result.levels.map((level) => <div key={level.code} className={`border p-2 ${levelAccent[level.code] ?? "border-slate-200 bg-white"}`}><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">{level.label}</p><Badge variant="outline" className={`rounded-sm text-[10px] ${level.status === "PASS" ? "border-emerald-300 text-emerald-700" : "border-red-300 text-red-700"}`}>{level.status === "PASS" ? "APROVADO" : "BLOQUEADO"}</Badge></div><div className="mt-2 space-y-1">{level.checks.map((check) => <div key={check.code} className="flex items-start gap-1.5 text-[10px]"><span className="mt-0.5">{check.status === "PASS" ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Ban className="h-3 w-3 text-red-600" />}</span><span><strong>{check.label}:</strong> {check.detail}</span></div>)}</div></div>)}</div><p className="flex items-center gap-1 text-[10px] text-slate-500"><ShieldCheck className="h-3 w-3" /> A simulação é informativa e não substitui a conferência humana da evidência primária PGCA.</p></div> : <p className="border border-dashed border-[#9fb4c9] bg-white px-3 py-4 text-center text-[11px] text-slate-500">Preencha a operação e execute a simulação para ver os três níveis de validação.</p>}
    </CardContent>
  </Card>;
}
