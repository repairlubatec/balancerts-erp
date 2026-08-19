import React, { useState } from "react";
import { Archive, FileClock, FileText, Plus, Search, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const categories = [
  ["FISCAL", "Fiscal"],
  ["CONTABILISTICO", "Contabilístico"],
  ["CONTRATO", "Contrato"],
  ["RH", "Recursos humanos"],
  ["OUTRO", "Outro"],
] as const;

type Category = (typeof categories)[number][0];

export function DigitalArchivePanel({ companyId }: { companyId?: number }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number>();
  const [reasonId, setReasonId] = useState<number>();
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const utils = trpc.useUtils();
  if (!(trpc as unknown as { files?: unknown }).files) return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardContent className="p-4 text-sm text-slate-500">O arquivo digital está disponível após activar os contratos de ficheiros.</CardContent></Card>;
  const files = trpc.files.list.useQuery({ companyId: companyId ?? 0, search: search || undefined }, { enabled: Boolean(companyId) });
  const versions = trpc.files.versions.useQuery({ companyId: companyId ?? 0, fileId: selectedId ?? 0 }, { enabled: Boolean(companyId && selectedId) });
  const update = trpc.files.updateMetadata.useMutation({ onSuccess: () => { setFeedback("Metadados actualizados."); void utils.files.list.invalidate(); } });
  const archive = trpc.files.archive.useMutation({ onSuccess: () => { setFeedback("Documento arquivado."); setReasonId(undefined); setReason(""); void utils.files.list.invalidate(); } });
  const version = trpc.files.newVersion.useMutation({ onSuccess: () => { setFeedback("Nova versão registada."); void utils.files.list.invalidate(); void utils.files.versions.invalidate(); } });

  if (!companyId) return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardContent className="p-4 text-sm text-slate-500">Seleccione uma empresa para abrir o arquivo digital.</CardContent></Card>;

  return <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
    <CardHeader className="border-b border-[#e6edf5] pb-3"><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-[#102a43]"><Archive className="h-4 w-4 text-[#1267d6]" /> Arquivo digital</CardTitle><p className="mt-1 text-xs text-slate-500">Documentos internos com integridade, classificação, ACL e versões.</p></div><span className="inline-flex items-center gap-1 text-[11px] text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Controlo de acesso activo</span></div></CardHeader>
    <CardContent className="space-y-3 p-4">
      <div className="flex flex-wrap gap-2"><div className="relative min-w-[230px] flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por nome, descrição ou referência" className="h-9 bg-white pl-8 text-xs" /></div><Button type="button" variant="outline" size="sm" onClick={() => void files.refetch()} className="h-9">Actualizar</Button></div>
      {feedback && <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{feedback}</p>}
      {files.isLoading ? <p className="text-sm text-slate-500">A carregar arquivo…</p> : !files.data?.length ? <div className="rounded border border-dashed border-[#bfc9d4] bg-white p-6 text-center text-sm text-slate-500"><FileText className="mx-auto mb-2 h-6 w-6 text-slate-400" />Não existem documentos no arquivo nesta pesquisa.</div> : <div className="overflow-x-auto rounded border border-[#dbe5f1] bg-white"><table className="w-full text-left text-xs"><thead className="border-b border-[#e6edf5] bg-[#f8fafd] text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-3 py-2">Ficheiro</th><th className="px-3 py-2">Classificação</th><th className="px-3 py-2">Versão</th><th className="px-3 py-2">Acções</th></tr></thead><tbody className="divide-y divide-[#edf2f7]">{files.data.map((file) => <tr key={file.id} className={selectedId === file.id ? "bg-[#f0f6ff]" : ""}><td className="px-3 py-2"><button type="button" className="font-medium text-[#1267d6] hover:underline" onClick={() => setSelectedId(file.id)}>{file.filename}</button><div className="text-[11px] text-slate-500">{file.reference || "Sem referência"} · {file.size.toLocaleString("pt-PT")} bytes</div></td><td className="px-3 py-2"><select aria-label={`Classificação de ${file.filename}`} value={file.category} onChange={(event) => update.mutate({ companyId, fileId: file.id, category: event.target.value as Category })} className="h-8 rounded border border-[#dbe5f1] bg-white px-2 text-xs">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="px-3 py-2">v{file.currentVersion}<div className="text-[11px] text-slate-500">SHA-256 {file.sha256.slice(0, 12)}…</div></td><td className="px-3 py-2"><div className="flex flex-wrap gap-1"><label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-[#dbe5f1] bg-white px-2 text-xs text-[#1267d6] hover:bg-[#f0f6ff]"><Upload className="h-3.5 w-3.5" /> Nova versão<input type="file" className="hidden" onChange={async (event) => { const upload = event.target.files?.[0]; if (!upload) return; const dataBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? ""); reader.onerror = () => reject(reader.error); reader.readAsDataURL(upload); }); version.mutate({ companyId, fileId: file.id, filename: upload.name, mimeType: upload.type || "application/octet-stream", dataBase64 }); }} /></label><Button type="button" size="sm" variant="outline" onClick={() => { setSelectedId(file.id); setReasonId(file.id); }}><FileClock className="mr-1 h-3.5 w-3.5" /> Versões</Button><Button type="button" size="sm" variant="outline" onClick={() => { setSelectedId(undefined); setReasonId(file.id); setReason(""); }}>Arquivar</Button></div></td></tr>)}</tbody></table></div>}
      {reasonId && files.data?.some((file) => file.id === reasonId) && <div className="rounded border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">{selectedId === reasonId ? "Histórico da versão seleccionada" : "Arquivar documento"}</p>{selectedId === reasonId && versions.data && <div className="mt-2 space-y-1 text-xs text-slate-700">{versions.data.map(({ version: item }) => <div key={item.id} className="flex items-center justify-between rounded bg-white px-2 py-1"><span>v{item.versionNumber} · {item.filename}</span><span className="text-slate-500">{item.sha256.slice(0, 12)}…</span></div>)}</div>}{selectedId !== reasonId && <div className="mt-2 flex gap-2"><Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo obrigatório do arquivamento" className="h-8 bg-white text-xs" /><Button type="button" size="sm" disabled={reason.trim().length < 3 || archive.isPending} onClick={() => archive.mutate({ companyId, fileId: reasonId, reason: reason.trim() })}>Confirmar</Button><Button type="button" size="sm" variant="ghost" onClick={() => setReasonId(undefined)}>Cancelar</Button></div>}</div>}
      <div className="flex items-center gap-2 text-[11px] text-slate-500"><Plus className="h-3.5 w-3.5" /> O carregamento inicial continua disponível no painel de importação e validação fiscal.</div>
    </CardContent>
  </Card>;
}
