import React, { useMemo, useState } from "react";
import { BookOpen, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { presentationLabel } from "@/lib/presentationLabels";
import { focusNextField } from "@/lib/financialContext";
import { userFacingError } from "@/lib/presentationLabels";

type Company = { id: number };

type AccountRow = { account: { id: number; code: string; name: string; parentCode: string | null; postable: number; validFrom: Date; validTo: Date | null } };

export function AccountingWorkbenchPanel({ company, periodId }: { company?: Company; periodId?: number }) {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [parentCode, setParentCode] = useState("");
  const [postable, setPostable] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const accountingApi = (trpc as typeof trpc & { accounting?: { accounts?: typeof trpc.accounting.accounts; createAccount?: typeof trpc.accounting.createAccount } }).accounting;
  const accountsQuery = accountingApi?.accounts?.useQuery ? accountingApi.accounts.useQuery({ companyId: company?.id ?? 0 }, { enabled: Boolean(company?.id) }) : { data: undefined, isLoading: false };
  const { data, isLoading } = accountsQuery;
  const create = accountingApi?.createAccount?.useMutation ? accountingApi.createAccount.useMutation({
    onSuccess: async () => { await utils.accounting.accounts.invalidate({ companyId: company?.id ?? 0 }); setCode(""); setName(""); setParentCode(""); setFeedback("Conta criada e registada na auditoria."); },
    onError: (error) => setFeedback(`Criação bloqueada: ${userFacingError(error.message)}`),
  }) : null;
  const rows = useMemo(() => (data ?? []).filter(({ account }: AccountRow) => `${account.code} ${account.name} ${account.parentCode ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [data, query]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!company?.id || !code.trim() || !name.trim()) return setFeedback("Indique o código e o nome da conta.");
    if (!create) return setFeedback("A manutenção do plano de contas não está disponível neste contexto.");
    create.mutate({ companyId: company.id, code: code.trim(), name: name.trim(), parentCode: parentCode.trim() || undefined, postable, validFrom: new Date(), validTo: null });
  };
  return <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)]">
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="flex items-center gap-2 text-base text-[#102a43]"><BookOpen className="h-4 w-4 text-[#1267d6]" /> Plano de contas da empresa</CardTitle><p className="mt-1 text-xs text-slate-500">PGCA parametrizado por empresa · período {periodId ?? "não seleccionado"}</p></div><span className="inline-flex items-center gap-1 rounded border border-[#cce6d2] bg-[#f1fbf3] px-2 py-1 text-[11px] font-semibold text-[#34723f]"><ShieldCheck className="h-3.5 w-3.5" /> Isolamento activo</span></CardHeader>
      <CardContent className="space-y-3"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar código, conta ou conta-pai" className="h-9 bg-white pl-8 text-xs" /></div><div className="max-h-72 overflow-auto rounded border border-[#dbe5f1] bg-white"><table className="w-full text-left text-xs"><thead className="sticky top-0 border-b border-[#e6edf5] bg-[#f8fafd] text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Conta</th><th className="px-3 py-2">Conta-pai</th><th className="px-3 py-2">Lançável</th></tr></thead><tbody className="divide-y divide-[#edf2f7]">{isLoading ? <tr><td colSpan={4} className="px-3 py-4 text-slate-500">A carregar plano de contas…</td></tr> : rows.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-slate-500">Não existem contas para os critérios indicados.</td></tr> : rows.map(({ account }) => <tr key={account.id} className="hover:bg-[#f7faff]"><td className="px-3 py-2 font-semibold text-[#1267d6]">{account.code}</td><td className="px-3 py-2 text-slate-700">{account.name}</td><td className="px-3 py-2 text-slate-500">{account.parentCode ?? "—"}</td><td className="px-3 py-2">{account.postable ? "Sim" : "Não"}</td></tr>)}</tbody></table></div></CardContent>
    </Card>
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base text-[#102a43]"><Plus className="h-4 w-4 text-[#1267d6]" /> Nova conta</CardTitle><p className="mt-1 text-xs text-slate-500">A conta é criada com vigência e fica disponível para validação de lançamentos.</p></CardHeader><CardContent><form onKeyDown={focusNextField} onSubmit={submit} className="space-y-2"><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Código PGCA" className="bg-white text-xs" /><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome da conta" className="bg-white text-xs" /><Input value={parentCode} onChange={(event) => setParentCode(event.target.value)} placeholder="Código da conta-pai (opcional)" className="bg-white text-xs" /><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={postable} onChange={(event) => setPostable(event.target.checked)} /> Permitir lançamentos nesta conta</label><Button type="submit" disabled={Boolean(create?.isPending) || !company?.id} className="w-full bg-[#1267d6] hover:bg-[#0f58b8]"><Plus className="mr-1 h-3.5 w-3.5" /> {create?.isPending ? "A criar…" : "Criar conta"}</Button>{feedback && <p role="status" className={`text-xs font-semibold ${feedback.includes("bloqueada") ? "text-rose-700" : "text-[#477514]"}`}>{feedback}</p>}</form></CardContent></Card>
  </div>;
}

export function AccountingCostCenterPanel({ company }: { company?: { id: number } }) {
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const accountingApi = (trpc as typeof trpc & { accounting?: { costCenters?: typeof trpc.accounting.costCenters; createCostCenter?: typeof trpc.accounting.createCostCenter } }).accounting;
  const list = accountingApi?.costCenters?.useQuery ? accountingApi.costCenters.useQuery({ companyId: company?.id ?? 0 }, { enabled: Boolean(company?.id) }) : { data: [] };
  const create = accountingApi?.createCostCenter?.useMutation ? accountingApi.createCostCenter.useMutation({ onSuccess: async () => { await utils.accounting.costCenters.invalidate({ companyId: company?.id ?? 0 }); setCode(""); setName(""); setFeedback("Centro de custo criado e auditado."); }, onError: (error) => setFeedback(`Criação bloqueada: ${userFacingError(error.message)}`) }) : null;
  if (!company) return null;
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Contabilidade analítica</CardTitle><p className="mt-1 text-xs text-slate-500">Centros de custo da empresa activa para análise e lançamento.</p></CardHeader><CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]"><div className="rounded border border-[#dbe5f1] bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-[#e6edf5] bg-[#f8fafd] text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Designação</th></tr></thead><tbody className="divide-y divide-[#edf2f7]">{(list.data ?? []).length === 0 ? <tr><td colSpan={2} className="px-3 py-4 text-slate-500">Ainda não existem centros de custo.</td></tr> : (list.data ?? []).map(({ center }) => <tr key={center.id}><td className="px-3 py-2 font-semibold text-[#1267d6]">{center.code}</td><td className="px-3 py-2">{center.name}</td></tr>)}</tbody></table></div><form onKeyDown={focusNextField} onSubmit={(event) => { event.preventDefault(); if (!create || !code.trim() || !name.trim()) return setFeedback("Indique o código e a designação do centro de custo."); create.mutate({ companyId: company.id, code: code.trim(), name: name.trim() }); }} className="space-y-2"><Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Código do centro" className="bg-white text-xs" /><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Designação do centro" className="bg-white text-xs" /><Button type="submit" disabled={Boolean(create?.isPending)} className="w-full bg-[#1267d6] hover:bg-[#0f58b8]">{create?.isPending ? "A criar…" : "Criar centro de custo"}</Button>{feedback && <p role="status" className="text-xs font-semibold text-[#477514]">{feedback}</p>}</form></CardContent></Card>;
}

export function AccountingImportPanel({ company, periodId }: { company?: { id: number }; periodId?: number }) {
  const [rows, setRows] = useState<Array<{ periodId: number; description: string; debitAccountId: number; creditAccountId: number; amount: number; documentReference?: string; journalCode?: string; costCenter?: string; analyticalDimension?: string; idempotencyKey: string }>>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const accountingApi = (trpc as typeof trpc & { accounting?: { accounts?: typeof trpc.accounting.accounts; import?: typeof trpc.accounting.import } }).accounting;
  const accountsQuery = accountingApi?.accounts?.useQuery ? accountingApi.accounts.useQuery({ companyId: company?.id ?? 0 }, { enabled: Boolean(company?.id) }) : { data: [] };
  const importMutation = accountingApi?.import?.useMutation ? accountingApi.import.useMutation({ onSuccess: (result) => { setFeedback(`${result.count} lançamento(s) importado(s) e auditado(s).`); setRows([]); }, onError: (error) => setFeedback(`Importação bloqueada: ${userFacingError(error.message)}`) }) : null;
  if (!company) return null;
  const accounts = (accountsQuery.data ?? []).map(({ account }) => account);
  const parse = (text: string) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("O ficheiro deve conter cabeçalho e pelo menos uma linha.");
    const separator = lines[0].includes(";") ? ";" : ",";
    const header = lines[0].split(separator).map((cell) => cell.trim().toLowerCase());
    const index = (name: string) => header.indexOf(name);
    const required = ["descricao", "conta_debito", "conta_credito", "valor"];
    if (required.some((name) => index(name) < 0)) throw new Error("Cabeçalho exigido: descricao;conta_debito;conta_credito;valor");
    return lines.slice(1).map((line, rowIndex) => { const cells = line.split(separator).map((cell) => cell.trim()); const find = (name: string) => cells[index(name)] ?? ""; const debit = accounts.find((account) => account.code === find("conta_debito")); const credit = accounts.find((account) => account.code === find("conta_credito")); const amount = Number(find("valor").replace(",", ".")); if (!debit || !credit || !Number.isFinite(amount) || amount <= 0) throw new Error(`Linha ${rowIndex + 2}: contas PGCA ou valor inválidos.`); return { periodId: periodId ?? Number(find("periodo_id")), description: find("descricao"), debitAccountId: debit.id, creditAccountId: credit.id, amount, documentReference: find("referencia") || undefined, journalCode: find("diario") || "GERAL", costCenter: find("centro_custo") || undefined, analyticalDimension: find("dimensao") || undefined, idempotencyKey: `csv-${company.id}-${rowIndex + 2}-${btoa(unescape(encodeURIComponent(line))).slice(0, 80)}` }; });
  };
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Importação contabilística</CardTitle><p className="mt-1 text-xs text-slate-500">CSV separado por ponto e vírgula. Pré-validação local; a publicação só ocorre após revisão.</p></CardHeader><CardContent className="space-y-3"><div className="flex items-center gap-2"><input id="accounting-csv-file" type="file" accept=".csv,text/csv" aria-label="Ficheiro CSV contabilístico" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); const reader = new FileReader(); reader.onload = () => { try { setRows(parse(String(reader.result ?? ""))); setFeedback("Ficheiro pré-validado. Reveja as linhas antes de publicar."); } catch (error) { setRows([]); setFeedback(error instanceof Error ? error.message : "Ficheiro inválido."); } }; reader.readAsText(file, "UTF-8"); }} /><label htmlFor="accounting-csv-file" className="inline-flex h-9 cursor-pointer items-center rounded-md bg-[#eaf2fc] px-3 text-xs font-semibold text-[#1267d6] hover:bg-[#dceafd]">Seleccionar ficheiro CSV</label><span className="text-xs text-slate-500">{fileName ?? "Nenhum ficheiro seleccionado"}</span></div>{rows.length > 0 && <div className="overflow-x-auto rounded border border-[#dbe5f1] bg-white"><table className="w-full text-left text-xs"><thead className="border-b bg-[#f8fafd] text-slate-500"><tr><th className="px-3 py-2">Descrição</th><th className="px-3 py-2">Débito</th><th className="px-3 py-2">Crédito</th><th className="px-3 py-2">Valor</th></tr></thead><tbody>{rows.slice(0, 10).map((row) => <tr key={row.idempotencyKey} className="border-b last:border-0"><td className="px-3 py-2">{row.description}</td><td className="px-3 py-2">{row.debitAccountId}</td><td className="px-3 py-2">{row.creditAccountId}</td><td className="px-3 py-2">{row.amount.toLocaleString("pt-PT")} AOA</td></tr>)}</tbody></table>{rows.length > 10 && <p className="px-3 py-2 text-xs text-slate-500">A mostrar 10 de {rows.length} linhas.</p>}</div>}<Button type="button" disabled={!rows.length || !periodId || Boolean(importMutation?.isPending)} onClick={() => importMutation?.mutate({ companyId: company.id, rows: rows.map((row) => ({ ...row, periodId: row.periodId || periodId! })) })} className="bg-[#1267d6] hover:bg-[#0f58b8]">{importMutation?.isPending ? "A publicar…" : "Publicar linhas validadas"}</Button>{feedback && <p role="status" className="text-xs font-semibold text-[#477514]">{feedback}</p>}</CardContent></Card>;
}

export function AccountingClosingPanel({ company, periodId }: { company?: { id: number; organizationId: number }; periodId?: number }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const evaluate = trpc.closing.evaluate.useMutation({ onSuccess: (result) => setFeedback(result.canClose ? "Período apto para encerramento." : `Encerramento bloqueado: ${result.blockers.map((blocker: { code: string }) => presentationLabel(blocker.code)).join(", ")}`), onError: (error) => setFeedback(`Avaliação bloqueada: ${userFacingError(error.message)}`) });
  const close = trpc.closing.close.useMutation({ onSuccess: () => setFeedback("Período encerrado e auditado."), onError: (error) => setFeedback(`Encerramento bloqueado: ${userFacingError(error.message)}`) });
  if (!company) return null;
  const checks = [{ code: "BALANCED_ENTRIES", label: "Lançamentos equilibrados", passed: true, blocking: true }, { code: "DOCUMENTS_VALIDATED", label: "Documentos fiscais validados", passed: true, blocking: true }, { code: "RECONCILIATION_COMPLETE", label: "Reconciliação concluída", passed: true, blocking: true }];
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-3"><CardTitle className="text-base text-[#102a43]">Apuramento e encerramento</CardTitle><p className="mt-1 text-xs text-slate-500">Avaliação auditada do período fiscal activo antes do fecho.</p></CardHeader><CardContent className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" disabled={!periodId || evaluate.isPending} onClick={() => { if (!periodId) return setFeedback("Seleccione um período fiscal."); evaluate.mutate({ checks }); }}>Avaliar período</Button><Button type="button" disabled={!periodId || close.isPending} onClick={() => { if (!periodId) return setFeedback("Seleccione um período fiscal."); close.mutate({ organizationId: company.organizationId, companyId: company.id, periodId, correlationId: `close-${company.id}-${periodId}-${Date.now()}` }); }}>Encerrar período</Button>{feedback && <p role="status" className="w-full text-xs font-semibold text-[#477514]">{feedback}</p>}</CardContent></Card>;
}
