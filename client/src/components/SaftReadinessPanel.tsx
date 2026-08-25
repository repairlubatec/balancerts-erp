import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const labels: Record<string, string> = {
  HEADER_COMPANY_NAME: "Nome da empresa no cabeçalho",
  HEADER_TAX_ID: "NIF da empresa",
  HEADER_CURRENCY: "Moeda funcional",
  HEADER_PERIOD: "Exercício e período",
  MASTERFILES_ACCOUNTS: "Plano de contas",
  GENERAL_LEDGER_ENTRIES: "Movimentos do razão",
  SOURCE_DOCUMENTS: "Documentos de origem",
  MASTERFILES_CUSTOMERS: "Clientes",
  MASTERFILES_SUPPLIERS: "Fornecedores",
  MASTERFILES_PRODUCTS: "Artigos e serviços",
  MASTERFILES_TAX_TABLES: "Tabelas fiscais",
};

type SaftCountKey = "accounts" | "journalEntries" | "documents" | "customers" | "suppliers" | "products" | "taxRules";
const countLabels: Array<[SaftCountKey, string]> = [
  ["accounts", "Contas"],
  ["journalEntries", "Movimentos"],
  ["documents", "Documentos"],
  ["customers", "Clientes"],
  ["suppliers", "Fornecedores"],
  ["products", "Artigos/serviços"],
  ["taxRules", "Regras fiscais"],
];

export function SaftReadinessPanel({ companyId, companyName }: { companyId?: number; companyName?: string }) {
  const readiness = trpc.reports.saftReadiness.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  if (!companyId) return null;
  const data = readiness.data;
  const counts = data?.counts;
  const missing = data?.missing ?? [];
  const presentCount = counts ? countLabels.filter(([key]) => Number(counts[key] ?? 0) > 0).length : 0;
  const completion = counts ? Math.round((presentCount / countLabels.length) * 100) : 0;
  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="flex flex-row items-start justify-between gap-3 pb-3"><div><CardTitle className="flex items-center gap-2 text-base text-[#102a43]"><ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Prontidão SAF-T AO</CardTitle><p className="mt-1 text-xs text-slate-500">Cobertura persistente de {companyName ?? "empresa activa"}; o resultado não equivale a homologação AGT.</p></div>{data && <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-semibold ${data.ready ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>{data.ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{data.ready ? "Cobertura completa" : "Cobertura incompleta"}</span>}</CardHeader><CardContent className="space-y-3">{readiness.isLoading ? <p className="text-sm text-slate-500">A consultar entidades persistentes…</p> : readiness.error ? <p className="text-sm text-rose-700">Não foi possível consultar a prontidão SAF-T para esta empresa.</p> : data ? <><div className="flex items-center justify-between text-xs"><span className="font-semibold text-[#102a43]">Cobertura local</span><span className="text-slate-500">{presentCount}/{countLabels.length} grupos · {completion}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${data.ready ? "bg-amber-500" : "bg-[#1267d6]"}`} style={{ width: `${completion}%` }} /></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{countLabels.map(([key, label]) => <div key={key} className="rounded border border-[#e6edf5] bg-white p-2"><p className="text-[10px] uppercase tracking-[0.08em] text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{counts?.[key] ?? 0}</p></div>)}</div><div className={`rounded border px-3 py-2 text-xs ${missing.length ? "border-rose-200 bg-rose-50 text-rose-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}><p className="font-semibold">{missing.length ? "Elementos em falta" : "Preparação local completa"}</p>{missing.length ? <ul className="mt-1 list-disc space-y-0.5 pl-4">{missing.map((code) => <li key={code}>{labels[code] ?? code}</li>)}</ul> : <p className="mt-1">O ficheiro local pode ser analisado, mas a submissão permanece bloqueada até validação e homologação oficiais.</p>}</div><p className="text-[11px] text-slate-500">Formato: {data.format} · esquema {data.schemaVersion} · submissão externa: não configurada.</p></> : <p className="text-sm text-slate-500">Sem dados persistentes de prontidão.</p>}</CardContent></Card>;
}
