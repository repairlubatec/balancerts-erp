import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

type Company = {
  id: number;
  name: string;
  nif: string;
  functionalCurrency: string;
  ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";
  legalForm?: string | null;
  address?: string | null;
  municipality?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  activity?: string | null;
  incorporationYear?: number | null;
  legalRepresentatives?: string | null;
  configurationStatus?: "PENDING" | "READY" | "BLOCKED";
};

export function CompanyEditPanel({ company }: { company?: Company }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", functionalCurrency: "AOA", ivaRegime: "EXCLUSAO" as Company["ivaRegime"], legalForm: "", address: "", municipality: "", province: "", phone: "", email: "", activity: "", incorporationYear: "", legalRepresentatives: "" });
  const [feedback, setFeedback] = useState<string | null>(null);
  useEffect(() => { if (company) setForm({ name: company.name, functionalCurrency: company.functionalCurrency, ivaRegime: company.ivaRegime, legalForm: company.legalForm ?? "", address: company.address ?? "", municipality: company.municipality ?? "", province: company.province ?? "", phone: company.phone ?? "", email: company.email ?? "", activity: company.activity ?? "", incorporationYear: company.incorporationYear ? String(company.incorporationYear) : "", legalRepresentatives: company.legalRepresentatives ?? "" }); }, [company]);
  const companiesApi = (trpc as typeof trpc & { companies?: { update?: typeof trpc.companies.update } }).companies;
  const update = companiesApi?.update?.useMutation ? companiesApi.update.useMutation({ onSuccess: async () => { await utils.companies.list.invalidate(); setFeedback("Empresa actualizada e alteração registada na auditoria."); }, onError: (error) => setFeedback(`Não foi possível actualizar: ${error.message}`) }) : { isPending: false, mutate: () => setFeedback("A edição de empresas está disponível na aplicação operacional.") };
  if (!company) return null;
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); setFeedback(null); const year = Number(form.incorporationYear); if (!form.name.trim() || !form.address.trim() || !form.activity.trim()) return setFeedback("Preencha nome, morada e actividade."); if (!Number.isInteger(year) || year < 1900) return setFeedback("Indique um ano de criação válido."); update.mutate({ companyId: company.id, ...form, incorporationYear: year }); };
  return <Card id="operational-update-form" className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3"><div><CardTitle className="text-sm text-[#102a43]">Editar empresa</CardTitle><p className="text-xs text-slate-500">NIF {company.nif} · o identificador fiscal não pode ser alterado neste formulário.</p></div><span className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] text-slate-500">{company.configurationStatus ?? "Estado actual"}</span></CardHeader><CardContent><form onSubmit={submit} className="grid gap-2 md:grid-cols-3"><div><label className="mb-1 block text-[11px] font-semibold text-slate-600">Nome legal *</label><Input value={form.name} onChange={set("name")} className="bg-white" /></div><div><label className="mb-1 block text-[11px] font-semibold text-slate-600">Moeda funcional</label><Input value={form.functionalCurrency} onChange={set("functionalCurrency")} maxLength={3} className="bg-white" /></div><div><label className="mb-1 block text-[11px] font-semibold text-slate-600">Regime IVA</label><select value={form.ivaRegime} onChange={set("ivaRegime")} className="h-9 w-full rounded-md border border-[#dbe5f1] bg-white px-3 text-sm"><option value="GERAL">Geral</option><option value="SIMPLIFICADO">Simplificado</option><option value="EXCLUSAO">Exclusão</option></select></div>{(["legalForm", "address", "municipality", "province", "phone", "email", "activity", "incorporationYear", "legalRepresentatives"] as const).map((key) => <div key={key} className={key === "legalRepresentatives" ? "md:col-span-3" : ""}><label className="mb-1 block text-[11px] font-semibold text-slate-600">{({ legalForm: "Forma jurídica", address: "Morada", municipality: "Município", province: "Província", phone: "Telefone", email: "Email", activity: "Actividade", incorporationYear: "Ano de criação", legalRepresentatives: "Representantes legais" } as Record<string, string>)[key]}</label><Input type={key === "email" ? "email" : key === "incorporationYear" ? "number" : "text"} value={form[key]} onChange={set(key)} className="bg-white" /></div>)}<div className="md:col-span-3 flex items-center justify-end gap-2 pt-2"><Button type="submit" disabled={update.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8]">{update.isPending ? "A guardar…" : "Guardar alterações"}</Button>{feedback && <p role="status" className="text-xs font-medium text-[#477514]">{feedback}</p>}</div></form></CardContent></Card>;
}
