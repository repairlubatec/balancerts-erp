import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export function TreasuryApprovalPanel({ companyId }: { companyId?: number }) {
  const [reference, setReference] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const api = trpc as typeof trpc & { treasury: typeof trpc.treasury & { approvePayment?: any } };
  const payments = trpc.treasury.payments.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const approve = api.treasury.approvePayment?.useMutation ? api.treasury.approvePayment.useMutation({ onSuccess: () => { setReference(""); setFeedback("Pagamento aprovado, executado e auditado."); }, onError: (error: Error) => setFeedback(error.message) }) : { isPending: false, mutate: () => undefined };
  if (!companyId) return null;
  const pending = ((payments.data ?? []) as Array<{ payment: { id: number; direction: string; amount: string | number; method: string; approvalStatus?: string; createdBy: number; createdAt: Date } }>).filter(({ payment }) => payment.approvalStatus === "PENDING");
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Aprovação de pagamentos</CardTitle><p className="text-xs text-slate-500">Pagamentos preparados por outro utilizador aguardam validação antes da execução.</p></CardHeader><CardContent className="space-y-2">{pending.map(({ payment }) => <div key={payment.id} className="flex flex-wrap items-center gap-2 border-b border-[#edf2f7] py-2 text-xs"><div className="min-w-0 flex-1"><strong className="text-[#102a43]">#{payment.id} · {payment.direction === "PAYMENT" ? "Pagamento" : "Recebimento"} · {Number(payment.amount).toLocaleString("pt-PT")} AOA</strong><div className="text-slate-500">Método: {payment.method === "BANK_TRANSFER" ? "Transferência bancária" : payment.method} · Criado por utilizador #{payment.createdBy}</div></div><Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Referência de execução" className="h-8 w-48 text-xs" /><Button type="button" size="sm" disabled={approve.isPending} onClick={() => approve.mutate({ companyId, paymentId: payment.id, executionReference: reference || undefined })}>Aprovar e executar</Button></div>)}{!pending.length && <p className="text-xs text-slate-500">Não existem pagamentos pendentes de aprovação.</p>}{feedback && <p role="status" className="text-xs font-semibold text-[#477514]">{feedback}</p>}</CardContent></Card>;
}
