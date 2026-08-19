import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presentationLabel, statusLabel, userFacingError } from "@/lib/presentationLabels";
import { trpc } from "@/lib/trpc";

type TreasuryTransactionRow = {
  transaction: {
    id: number;
    direction: "IN" | "OUT";
    amount: string | number;
    valueDate: Date | string;
    reconciliationStatus: "UNRECONCILED" | "RECONCILED" | "EXCEPTION";
    correlationId: string;
  };
  account: { id: number; name: string };
};

export function TreasuryReconciliationPanel({ companyId, rows }: { companyId?: number; rows: TreasuryTransactionRow[] }) {
  const utils = trpc.useUtils();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const reconcileProcedure = (trpc.treasury as typeof trpc.treasury & { reconcileTransaction?: typeof trpc.treasury.reconcileTransaction }).reconcileTransaction;
  if (!reconcileProcedure) return null;
  const reconcile = reconcileProcedure.useMutation({
    onSuccess: async (result) => {
      await utils.treasury.transactions.invalidate({ companyId: companyId ?? 0 });
      setPendingId(null);
      setFeedback(result.alreadyReconciled ? "O movimento já estava reconciliado." : "Movimento reconciliado e auditado.");
    },
    onError: (error) => {
      setPendingId(null);
      setFeedback(`Reconciliação bloqueada: ${userFacingError(error.message)}`);
    },
  });
  const pendingRows = useMemo(() => rows.filter(({ transaction }) => transaction.reconciliationStatus !== "RECONCILED"), [rows]);
  const reconcileOne = (row: TreasuryTransactionRow) => {
    if (!companyId || reconcile.isPending) return;
    const reason = window.prompt("Indique a referência ou motivo da reconciliação")?.trim();
    if (!reason) {
      setFeedback("A reconciliação exige uma referência ou motivo.");
      return;
    }
    setPendingId(row.transaction.id);
    reconcile.mutate({ companyId, transactionId: row.transaction.id, reason });
  };
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Movimentos por reconciliar</CardTitle><p className="text-xs text-slate-500">Cada movimento pode ser confirmado individualmente; a alteração fica registada na auditoria.</p></CardHeader><CardContent className="space-y-2 pt-0">{pendingRows.length === 0 ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">Não existem movimentos pendentes de reconciliação.</p> : pendingRows.map(({ transaction, account }) => <div key={transaction.id} className="flex flex-wrap items-center gap-3 rounded-md border border-[#dbe5f1] bg-white px-3 py-2 text-xs"><div className="min-w-0 flex-1"><p className="font-semibold text-[#102a43]">Movimento #{transaction.id} · {account.name}</p><p className="text-slate-500">{new Date(transaction.valueDate).toLocaleDateString("pt-PT")} · {transaction.direction === "IN" ? "Entrada" : "Saída"} · {Number(transaction.amount).toLocaleString("pt-PT")} AOA · {presentationLabel(transaction.correlationId)}</p></div><span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-700">{statusLabel(transaction.reconciliationStatus)}</span><Button type="button" size="sm" disabled={reconcile.isPending} onClick={() => reconcileOne({ transaction, account })} className="bg-[#1267d6] hover:bg-[#0f58b8]">{pendingId === transaction.id ? "A reconciliar…" : "Reconciliar"}</Button></div>)}{feedback && <p className="text-xs font-semibold text-[#477514]">{feedback}</p>}</CardContent></Card>;
}
