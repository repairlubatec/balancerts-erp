import React, { useMemo, useState } from "react";
import { BookOpen, Plus, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
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
