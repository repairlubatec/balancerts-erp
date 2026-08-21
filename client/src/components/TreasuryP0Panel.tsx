import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

export function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error("O ficheiro deve conter cabeçalho e pelo menos uma linha.");
  const header = lines[0].split(/[;,]/).map((value) => value.trim().toLowerCase());
  const index = (names: string[]) => names.map((name) => header.indexOf(name)).find((value) => value >= 0) ?? -1;
  const booking = index(["data", "data movimento", "bookingdate"]);
  const value = index(["data valor", "valordate", "valuedate"]);
  const description = index(["descrição", "descricao", "description", "movimento"]);
  const direction = index(["sentido", "direcção", "direcao", "direction"]);
  const amount = index(["valor", "montante", "amount"]);
  const reference = index(["referência", "referencia", "reference", "externalreference"]);
  if ([booking, description, direction, amount].some((field) => field < 0)) throw new Error("O cabeçalho deve conter Data, Descrição, Sentido e Valor.");
  return lines.slice(1).map((line, rowIndex) => {
    const values = line.split(/[;,]/).map((item) => item.trim());
    const parsedAmount = Number(values[amount].replace(/\s/g, "").replace(/\./g, "").replace(",", "."));
    const parsedDirection = values[direction].toUpperCase().startsWith("E") || values[direction].toUpperCase().startsWith("I") ? "IN" : "OUT";
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new Error(`Valor inválido na linha ${rowIndex + 2}.`);
    return { bookingDate: new Date(values[booking]), valueDate: new Date(value >= 0 ? values[value] : values[booking]), description: values[description], externalReference: reference >= 0 ? values[reference] : undefined, direction: parsedDirection as "IN" | "OUT", amount: parsedAmount };
  });
}

export function TreasuryP0Panel({ companyId, organizationId }: { companyId?: number; organizationId?: number }) {
  const [filename, setFilename] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [openingBalance, setOpeningBalance] = React.useState("");
  const [closingBalance, setClosingBalance] = React.useState("");
  const [selectedCashAccountId, setSelectedCashAccountId] = React.useState("");
  const [adjustmentAmount, setAdjustmentAmount] = React.useState("");
  const [adjustmentReason, setAdjustmentReason] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { data: accounts } = trpc.treasury.accounts.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  React.useEffect(() => { if (!selectedCashAccountId && accounts?.[0]?.account.id) setSelectedCashAccountId(String(accounts[0].account.id)); }, [accounts, selectedCashAccountId]);
  const treasuryApi = trpc as typeof trpc & { treasury: typeof trpc.treasury & { importStatement?: any; statementLines?: any } };
  const importStatement = treasuryApi.treasury.importStatement?.useMutation ? treasuryApi.treasury.importStatement.useMutation({ onSuccess: (result: { importRow?: { rowCount?: number } }) => setFeedback(`Extracto importado com ${result.importRow?.rowCount ?? 0} linhas.`), onError: (error: Error) => setFeedback(error.message) }) : { isPending: false, mutate: () => undefined };
  const statementLines = treasuryApi.treasury.statementLines?.useQuery ? treasuryApi.treasury.statementLines.useQuery({ companyId: companyId ?? 0, status: "UNMATCHED" }, { enabled: Boolean(companyId) }) : { data: [] as Array<{ line: { id: number; description: string; amount: string; direction: string; status: string } }> };
  const reconcile = treasuryApi.treasury.reconcile?.useMutation ? treasuryApi.treasury.reconcile.useMutation({ onSuccess: (result: { status: string; difference: number }) => setFeedback(result.status === "RECONCILED" ? "Conta reconciliada e auditada." : `Reconciliação aberta: diferença ${result.difference} AOA.`), onError: (error: any) => setFeedback(error.message) }) : { isPending: false, mutate: () => undefined };
  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !companyId || !organizationId) return;
    setFilename(file.name); setFeedback("");
    try {
      const rows = parseCsv(await file.text());
      const account = accounts?.find(({ account: candidate }) => candidate.id === Number(selectedCashAccountId))?.account;
      if (!account) throw new Error("Cadastre primeiro uma conta bancária ou de caixa.");
      importStatement.mutate({ organizationId, companyId, cashAccountId: account.id, statementDate: new Date(), openingBalance: 0, closingBalance: 0, originalFilename: file.name, rows });
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Não foi possível ler o extracto."); }
  };
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Controlo bancário e reconciliação</CardTitle><p className="text-xs text-slate-500">Contas bancárias identificadas, importação de extractos e linhas pendentes de conferência.</p></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-3">{(accounts ?? []).map(({ account }) => <div key={account.id} className="border border-[#dbe5f1] bg-white p-2 text-xs"><strong className="text-[#102a43]">{account.name}</strong><div className="text-slate-500">{account.kind === "BANK" ? "Banco" : "Caixa"} · {account.currency}</div><div className="text-slate-500">{account.bankName ?? "Banco não identificado"} · {account.iban ?? account.accountNumber ?? "Sem identificador"}</div><div className="text-slate-500">Titular: {account.holderName ?? "Não indicado"} · Saldo inicial: {Number(account.openingBalance ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2 })} AOA</div></div>)}{!accounts?.length && <p className="text-xs text-slate-500">Ainda não existem contas de tesouraria.</p>}</div><div className="flex flex-wrap items-center gap-2"><select aria-label="Conta para extracto e reconciliação" value={selectedCashAccountId} onChange={(event) => setSelectedCashAccountId(event.target.value)} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="">Seleccione a conta</option>{(accounts ?? []).map(({ account }) => <option key={account.id} value={account.id}>{account.name} · {account.kind === "BANK" ? "Banco" : "Caixa"}</option>)}</select><input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} /><Button type="button" variant="outline" disabled={!companyId || !organizationId || importStatement.isPending} onClick={() => inputRef.current?.click()}>{importStatement.isPending ? "A importar…" : "Importar extracto CSV"}</Button><span className="text-xs text-slate-500">{filename || "Nenhum extracto seleccionado"}</span></div><div className="grid gap-2 border-t border-[#dbe5f1] pt-2 md:grid-cols-4"><Input aria-label="Saldo inicial" placeholder="Saldo inicial" value={openingBalance} onChange={(event) => setOpeningBalance(event.target.value)} /><Input aria-label="Saldo final" placeholder="Saldo final" value={closingBalance} onChange={(event) => setClosingBalance(event.target.value)} /><Input aria-label="Ajuste autorizado" placeholder="Ajuste autorizado" value={adjustmentAmount} onChange={(event) => setAdjustmentAmount(event.target.value)} /><Input aria-label="Motivo do ajuste" placeholder="Motivo obrigatório se houver ajuste" value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} /><Button type="button" disabled={!companyId || !selectedCashAccountId || reconcile.isPending || !openingBalance || !closingBalance} onClick={() => reconcile.mutate({ companyId: companyId!, cashAccountId: Number(selectedCashAccountId), statementDate: new Date(), openingBalance: Number(openingBalance), closingBalance: Number(closingBalance), adjustmentAmount: adjustmentAmount ? Number(adjustmentAmount) : undefined, adjustmentReason: adjustmentReason || undefined })}>{reconcile.isPending ? "A reconciliar…" : "Reconciliar conta"}</Button></div>{feedback && <p role="status" className="text-xs font-semibold text-[#477514]">{feedback}</p>}<div className="border-t border-[#dbe5f1] pt-2"><div className="text-xs font-semibold text-[#102a43]">Linhas por conferir</div><div className="mt-1 grid gap-1 text-[11px] text-slate-600">{((statementLines.data ?? []) as Array<{ line: { id: number; description: string; amount: string | number; direction: string; status: string } }>).slice(0, 8).map(({ line }) => <div key={line.id} className="flex justify-between border-b border-[#edf2f7] py-1"><span>{line.description}</span><span>{line.direction === "IN" ? "+" : "−"}{Number(line.amount).toLocaleString("pt-PT")} AOA</span></div>)}{!(statementLines.data ?? []).length && <span>Não existem linhas pendentes de conferência.</span>}</div></div></CardContent></Card>;
}
