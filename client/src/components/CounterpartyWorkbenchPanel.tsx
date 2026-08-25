import React, { useEffect, useMemo, useState } from "react";
import { Building2, FileText, History, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { presentationLabel, userFacingError } from "@/lib/presentationLabels";
import { trpc } from "@/lib/trpc";
import { skipToken } from "@tanstack/react-query";

type CounterpartyKind = "CUSTOMER" | "SUPPLIER";
type Counterparty = {
  id: number;
  kind: CounterpartyKind;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  municipality: string | null;
  province: string | null;
  paymentTermsDays: number;
  creditLimit: string | number;
  preferredCurrency: string;
  active: number;
};

export function CounterpartyWorkbenchPanel({ companyId, kind }: { companyId?: number; kind: CounterpartyKind }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("0");
  const [creditLimit, setCreditLimit] = useState("0");
  const [preferredCurrency, setPreferredCurrency] = useState("AOA");
  const [asOf] = useState(() => new Date());
  const counterpartiesQuery = trpc.counterparties.list.useQuery(companyId ? { companyId, kind } : skipToken);
  const documentsQuery = trpc.documents.list.useQuery(companyId ? { companyId } : skipToken);
  const auditQuery = trpc.audit.list.useQuery(companyId ? { companyId } : skipToken);
  const agingQuery = kind === "CUSTOMER"
    ? trpc.reports.customerAging.useQuery(companyId ? { companyId, asOf } : skipToken)
    : trpc.reports.supplierAging.useQuery(companyId ? { companyId, asOf } : skipToken);
  const update = trpc.counterparties.update.useMutation({
    onSuccess: async () => {
      await utils.counterparties.list.invalidate({ companyId, kind });
      setFeedback("Ficha actualizada e auditada.");
    },
    onError: (error) => setFeedback(`Actualização bloqueada: ${userFacingError(error.message)}`),
  });
  const rows = useMemo(() => (counterpartiesQuery.data ?? []).map(({ counterparty }) => counterparty as Counterparty).filter((row) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || [row.name, row.taxId, row.email, row.phone, row.municipality, row.province].filter(Boolean).join(" ").toLocaleLowerCase().includes(query);
  }), [counterpartiesQuery.data, search]);
  const selected = rows.find((row) => row.id === selectedId) ?? (counterpartiesQuery.data ?? []).map(({ counterparty }) => counterparty as Counterparty).find((row) => row.id === selectedId);
  const selectedDocuments = (documentsQuery.data ?? []).map(({ document }) => document).filter((document) => Number(document.counterpartyId) === Number(selected?.id));
  const selectedEvents = (auditQuery.data ?? []).map(({ event }) => event).filter((event) => event.entityType === "counterparty" && event.entityId === String(selected?.id));
  const openItems = (agingQuery.data?.rows ?? []).filter((row) => row.partyName === selected?.name);
  useEffect(() => {
    if (!selected) return;
    setName(selected.name);
    setTaxId(selected.taxId ?? "");
    setEmail(selected.email ?? "");
    setPhone(selected.phone ?? "");
    setAddress(selected.address ?? "");
    setMunicipality(selected.municipality ?? "");
    setProvince(selected.province ?? "");
    setPaymentTermsDays(String(selected.paymentTermsDays ?? 0));
    setCreditLimit(String(selected.creditLimit ?? "0"));
    setPreferredCurrency(selected.preferredCurrency ?? "AOA");
  }, [selected?.id, selected?.name, selected?.taxId, selected?.email, selected?.phone, selected?.address, selected?.municipality, selected?.province, selected?.paymentTermsDays, selected?.creditLimit, selected?.preferredCurrency]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId || !selected || !name.trim()) return setFeedback("Seleccione uma contraparte e indique um nome válido.");
    update.mutate({ companyId, counterpartyId: selected.id, name: name.trim(), taxId: taxId.trim() || undefined, email: email.trim() || undefined, phone: phone.trim() || undefined, address: address.trim() || undefined, municipality: municipality.trim() || undefined, province: province.trim() || undefined, paymentTermsDays: Number(paymentTermsDays || 0), creditLimit: Number(creditLimit || 0), preferredCurrency: preferredCurrency.trim().toUpperCase() || "AOA" });
  };
  if (!companyId) return null;
  const label = kind === "CUSTOMER" ? "Clientes" : "Fornecedores";
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm">
    <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Building2 className="h-4 w-4 text-[#1267d6]" /> Posto de trabalho — {label}</CardTitle><p className="text-xs text-slate-500">Cadastro fiscal e operacional com detalhe, saldo em aberto, documentos e auditoria da empresa activa.</p></CardHeader>
    <CardContent className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><div className="relative min-w-[260px] flex-1"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Pesquisar ${label.toLocaleLowerCase()} por nome, NIF ou contacto`} className="bg-white pl-8" /></div><span className="text-xs text-slate-500">{rows.length} de {(counterpartiesQuery.data ?? []).length} registos</span></div>
      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.5fr]">
        <div className="max-h-72 overflow-auto rounded-md border border-[#dbe5f1] bg-white"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-[#f4f8fc] text-[#486581]"><tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">NIF</th><th className="px-3 py-2">Estado</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} tabIndex={0} onClick={() => setSelectedId(row.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(row.id); }} className={`cursor-pointer border-t border-[#edf2f7] hover:bg-[#f7faff] ${selected?.id === row.id ? "bg-[#eef6ff]" : ""}`}><td className="px-3 py-2 font-medium text-[#102a43]">{row.name}</td><td className="px-3 py-2">{row.taxId || "—"}</td><td className="px-3 py-2"><span className={row.active ? "text-emerald-700" : "text-slate-500"}>{row.active ? "Activo" : "Inactivo"}</span></td></tr>)}</tbody></table>{counterpartiesQuery.isLoading && <p className="px-3 py-4 text-xs text-slate-500">A carregar {label.toLocaleLowerCase()}…</p>}{!counterpartiesQuery.isLoading && rows.length === 0 && <p className="px-3 py-4 text-xs text-slate-500">Não existem registos persistidos para este filtro.</p>}</div>
        <div className="space-y-3 rounded-md border border-[#dbe5f1] bg-white p-3">{selected ? <><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-[#102a43]">{selected.name}</p><p className="text-xs text-slate-500">{selected.taxId || "NIF não registado"} · {selected.preferredCurrency}</p></div><span className="inline-flex items-center gap-1 text-xs text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> {selected.active ? "Activo" : "Inactivo"}</span></div><form onSubmit={submit} className="grid gap-2 md:grid-cols-2"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome legal" className="bg-white" /><Input value={taxId} onChange={(event) => setTaxId(event.target.value)} placeholder="NIF" className="bg-white" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="bg-white" /><Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" className="bg-white" /><Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Morada" className="bg-white" /><Input value={municipality} onChange={(event) => setMunicipality(event.target.value)} placeholder="Município" className="bg-white" /><Input value={province} onChange={(event) => setProvince(event.target.value)} placeholder="Província" className="bg-white" /><Input value={preferredCurrency} onChange={(event) => setPreferredCurrency(event.target.value)} placeholder="Moeda (AOA)" maxLength={3} className="bg-white" /><Input type="number" min="0" value={paymentTermsDays} onChange={(event) => setPaymentTermsDays(event.target.value)} placeholder="Prazo de pagamento (dias)" className="bg-white" /><Input type="number" min="0" step="0.01" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} placeholder="Limite de crédito AOA" className="bg-white" /><Button type="submit" disabled={update.isPending} className="bg-[#1267d6] hover:bg-[#0f58b8] md:col-span-2">{update.isPending ? "A guardar…" : "Guardar ficha"}</Button></form>{feedback && <p role="status" className="text-xs font-medium text-[#477514]">{feedback}</p>}<div className="grid gap-2 md:grid-cols-3"><div className="rounded border border-[#e6edf5] p-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Em aberto</p><p className="mt-1 text-sm font-semibold text-[#102a43]">{openItems.reduce((total, row) => total + Number(row.amount) - Number(row.settledAmount), 0).toLocaleString("pt-PT", { style: "currency", currency: "AOA" })}</p></div><div className="rounded border border-[#e6edf5] p-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Documentos</p><p className="mt-1 text-sm font-semibold text-[#102a43]">{selectedDocuments.length}</p></div><div className="rounded border border-[#e6edf5] p-2"><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Eventos auditados</p><p className="mt-1 text-sm font-semibold text-[#102a43]">{selectedEvents.length}</p></div></div><div className="grid gap-2 md:grid-cols-2"><div className="rounded border border-[#e6edf5] p-2"><p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><FileText className="h-3 w-3" /> Documentos associados</p>{selectedDocuments.length ? <ul className="mt-1 space-y-1 text-xs text-slate-600">{selectedDocuments.slice(0, 5).map((document) => <li key={document.id}>{document.documentNumber} · {presentationLabel(document.status)} · {Number(document.totalAmount).toLocaleString("pt-PT", { style: "currency", currency: "AOA" })}</li>)}</ul> : <p className="mt-1 text-xs text-slate-500">Sem documentos associados.</p>}</div><div className="rounded border border-[#e6edf5] p-2"><p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500"><History className="h-3 w-3" /> Histórico de auditoria</p>{selectedEvents.length ? <ul className="mt-1 space-y-1 text-xs text-slate-600">{selectedEvents.slice(0, 5).map((event) => <li key={event.id}>{presentationLabel(event.action)} · {new Date(event.createdAt).toLocaleString("pt-PT")}</li>)}</ul> : <p className="mt-1 text-xs text-slate-500">Sem eventos para esta contraparte.</p>}</div></div></> : <div className="flex min-h-52 items-center justify-center text-center text-xs text-slate-500">Seleccione um registo para consultar a ficha, os saldos e a rastreabilidade.</div>}</div>
      </div>
    </CardContent>
  </Card>;
}
