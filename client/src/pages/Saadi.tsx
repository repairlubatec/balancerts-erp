import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, FlaskConical, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Saadi() {
  const { user } = useAuth();
  const companies = trpc.companies.list.useQuery();
  const rows = companies.data ?? [];
  const [companyId, setCompanyId] = useState<number | undefined>();
  const selected = rows.find(({ company }) => company.id === companyId) ?? rows[0];
  const activeCompanyId = selected?.company.id;
  const organizationId = selected?.company.organizationId;
  const studies = trpc.saadi.studies.useQuery(
    activeCompanyId && organizationId ? { companyId: activeCompanyId, organizationId } : { companyId: 0, organizationId: 0 },
    { enabled: Boolean(activeCompanyId && organizationId) },
  );
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const createStudy = trpc.saadi.createStudy.useMutation({
    onSuccess: async () => { setCode(""); setName(""); await utils.saadi.studies.invalidate(); },
  });
  const statusText = useMemo(() => {
    if (companies.isLoading) return "A carregar empresas autorizadas…";
    if (!rows.length) return "Não existem empresas autorizadas para o utilizador actual.";
    return `${rows.length} empresa${rows.length === 1 ? "" : "s"} disponível${rows.length === 1 ? "" : "eis"}.`;
  }, [companies.isLoading, rows.length]);

  return <div className="space-y-4 p-4 text-[#1d2a38]">
    <div className="flex items-start justify-between gap-3 border-b border-[#dbe5f1] pb-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#477514]">Sistema autónomo de análise</p><h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[#102a43]"><FlaskConical className="h-5 w-5 text-[#1267d6]" /> SAADI</h1><p className="mt-1 text-xs text-slate-500">Estudos e projecções com dados capturados do BALANCERTS.ERP, sem alterar os registos operacionais.</p></div><Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Escopo protegido</Badge>
    </div>
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Building2 className="h-4 w-4 text-[#1267d6]" /> Contexto da análise</CardTitle></CardHeader><CardContent className="space-y-2"><Label htmlFor="saadi-company">Empresa de trabalho</Label><select id="saadi-company" aria-label="Empresa de trabalho SAADI" value={activeCompanyId ?? ""} onChange={(event) => setCompanyId(Number(event.target.value))} className="h-9 w-full max-w-xl rounded-md border border-[#dbe5f1] bg-white px-2 text-xs"><option value="">Seleccionar empresa</option>{rows.map(({ company }) => <option key={company.id} value={company.id}>{company.name} · {company.nif}</option>)}</select><p className="text-xs text-slate-500">{statusText}{user?.name ? ` Utilizador: ${user.name}.` : ""}</p></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Novo estudo</CardTitle></CardHeader><CardContent><form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (!activeCompanyId || !organizationId || !code.trim() || !name.trim()) return; createStudy.mutate({ companyId: activeCompanyId, organizationId, studyCode: code, name, baseCurrency: selected?.company.functionalCurrency ?? "AOA" }); }}><Input aria-label="Código do estudo" placeholder="Código, por exemplo INV-001" value={code} onChange={(event) => setCode(event.target.value)} /><Input aria-label="Nome do estudo" placeholder="Nome do estudo" value={name} onChange={(event) => setName(event.target.value)} /><Button type="submit" disabled={!activeCompanyId || !code.trim() || !name.trim() || createStudy.isPending} className="w-full bg-[#1267d6]"><Plus className="mr-1 h-4 w-4" />{createStudy.isPending ? "A registar…" : "Criar estudo"}</Button>{createStudy.error && <p role="alert" className="text-xs text-rose-700">Não foi possível criar o estudo: {createStudy.error.message}</p>}{createStudy.isSuccess && <p role="status" className="text-xs text-emerald-700">Estudo criado e pronto para configuração.</p>}</form></CardContent></Card>
      <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-[#102a43]">Estudos da empresa</CardTitle><Button type="button" size="sm" variant="outline" onClick={() => studies.refetch()} disabled={studies.isFetching}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualizar</Button></CardHeader><CardContent>{studies.isLoading ? <p className="text-xs text-slate-500">A carregar estudos…</p> : studies.error ? <p className="text-xs text-rose-700">Não foi possível carregar os estudos: {studies.error.message}</p> : !activeCompanyId ? <p className="text-xs text-slate-500">Seleccione uma empresa para consultar o seu contexto SAADI.</p> : !(studies.data ?? []).length ? <p className="text-xs text-slate-500">Ainda não existem estudos nesta empresa.</p> : <div className="space-y-2">{(studies.data ?? []).map((study) => <div key={study.id} className="flex items-center justify-between rounded border border-[#dbe5f1] bg-white px-3 py-2"><div><p className="text-xs font-semibold text-[#102a43]">{study.name}</p><p className="text-[11px] text-slate-500">{study.studyCode} · {study.baseCurrency}</p></div><Badge variant="outline">{study.status === "DRAFT" ? "Rascunho" : study.status === "ACTIVE" ? "Activo" : "Arquivado"}</Badge></div>)}</div>}</CardContent></Card>
    </div>
  </div>;
}
