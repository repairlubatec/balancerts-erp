import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileCheck2, LockKeyhole, UploadCloud } from "lucide-react";
import { skipToken } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const evidenceTypeLabels = { DIPLOMA: "Diploma legal", ANEXO: "Anexo", QUADRO: "Quadro oficial", DIAGRAMA: "Diagrama de movimentos", OUTRO: "Outro documento" } as const;
const statusLabels = { PENDING_REVIEW: "Pendente de revisão", UNDER_REVIEW: "Em revisão", ACCEPTED: "Aceite documentalmente", REJECTED: "Rejeitada" } as const;
const decisionLabels = { CONFIRM: "Aceitar evidência", KEEP_PENDING: "Manter pendente", REQUEST_NEW_EVIDENCE: "Solicitar nova evidência", REJECT: "Rejeitar evidência" } as const;

type PgcSource = { id: number; title: string; instrument: string; instrumentNumber: string | null; verificationStatus: string };

type Props = {
  organizationId?: number;
  companyId?: number;
  versionId?: number;
  sources: PgcSource[];
};

export function PgcEvidenceSubmissionPanel({ organizationId, companyId, versionId, sources }: Props) {
  const [classCode, setClassCode] = useState("2");
  const [targetCodesText, setTargetCodesText] = useState("");
  const [sourceId, setSourceId] = useState("none");
  const [evidenceType, setEvidenceType] = useState<keyof typeof evidenceTypeLabels>("DIPLOMA");
  const [pageFrom, setPageFrom] = useState("");
  const [pageTo, setPageTo] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const evidenceQuery = trpc.pgc.evidenceSubmissions.useQuery(organizationId && companyId && versionId ? { organizationId, companyId, versionId } : skipToken);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [reviewDecision, setReviewDecision] = useState<keyof typeof decisionLabels>("CONFIRM");
  const [reviewNote, setReviewNote] = useState("");
  const submitEvidence = trpc.pgc.submitEvidence.useMutation({
    onSuccess: async () => {
      toast.success("Evidência submetida para revisão humana.");
      setSelectedFile(null);
      setFileInputKey((value) => value + 1);
      setTargetCodesText("");
      setPageFrom("");
      setPageTo("");
      setNotes("");
      await evidenceQuery.refetch();
    },
    onError: (error) => toast.error(error.message || "A evidência não pôde ser submetida."),
  });
  const startReview = trpc.pgc.startEvidenceReview.useMutation({
    onSuccess: async (result) => { setSelectedSubmissionId(result.submissionId); toast.success("Evidência colocada em revisão."); await evidenceQuery.refetch(); },
    onError: (error) => toast.error(error.message || "Não foi possível iniciar a revisão."),
  });
  const reviewEvidence = trpc.pgc.reviewEvidence.useMutation({
    onSuccess: async () => { toast.success("Decisão de revisão registada em auditoria."); setReviewNote(""); setSelectedSubmissionId(null); await evidenceQuery.refetch(); },
    onError: (error) => toast.error(error.message || "Não foi possível registar a decisão."),
  });

  const confirmedSources = useMemo(() => sources.filter((source) => source.verificationStatus === "CONFIRMED"), [sources]);
  const canSubmit = Boolean(organizationId && companyId && versionId && selectedFile && targetCodesText.trim() && !submitEvidence.isPending);
  const selectedSubmission = evidenceQuery.data?.find((submission) => submission.id === selectedSubmissionId);
  const canReview = Boolean(organizationId && companyId && versionId && selectedSubmission && selectedSubmission.status === "UNDER_REVIEW" && !reviewEvidence.isPending);

  const readFileAsBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    reader.onload = () => resolve(String(reader.result).split(",").pop() ?? "");
    reader.readAsDataURL(file);
  });

  const handleSubmit = async () => {
    if (!organizationId || !companyId || !versionId || !selectedFile) {
      toast.error("Seleccione um ficheiro e confirme o contexto da empresa e da versão.");
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("O ficheiro não pode ultrapassar 25 MB.");
      return;
    }
    const targetCodes = targetCodesText.split(/[,;\n]+/).map((code) => code.trim()).filter(Boolean);
    if (!targetCodes.length) {
      toast.error("Indique pelo menos um código de conta ou grupo a conferir.");
      return;
    }
    if (pageFrom && pageTo && Number(pageTo) < Number(pageFrom)) {
      toast.error("A página final não pode ser anterior à página inicial.");
      return;
    }
    try {
      const dataBase64 = await readFileAsBase64(selectedFile);
      submitEvidence.mutate({ organizationId, companyId, versionId, sourceId: sourceId === "none" ? null : Number(sourceId), classCode, targetCodes, evidenceType, pageFrom: pageFrom ? Number(pageFrom) : null, pageTo: pageTo ? Number(pageTo) : null, notes: notes.trim() || null, filename: selectedFile.name, mimeType: selectedFile.type || "application/octet-stream", dataBase64 });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "O ficheiro não pôde ser lido.");
    }
  };

  return <Card className="rounded-sm border-[#bfc9d4] bg-[#f8fafc] shadow-none">
    <CardHeader className="border-b border-[#d9e0e7] px-3 py-2.5">
      <CardTitle className="flex items-center gap-2 text-sm"><UploadCloud className="h-4 w-4 text-[#1267d6]" /> Submeter evidência primária</CardTitle>
      <p className="mt-1 text-[11px] text-slate-500">Envie páginas legíveis do diploma ou quadro oficial para a revisão humana das classes ainda pendentes.</p>
    </CardHeader>
    <CardContent className="space-y-3 px-3 pb-3 pt-3">
      <div className="grid gap-2 md:grid-cols-4">
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Classe PGCA</Label><Select value={classCode} onValueChange={setClassCode}><SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => <SelectItem key={value} value={String(value)}>Classe {value}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Tipo de evidência</Label><Select value={evidenceType} onValueChange={(value) => setEvidenceType(value as keyof typeof evidenceTypeLabels)}><SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(evidenceTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Página inicial</Label><Input type="number" min={1} max={20000} value={pageFrom} onChange={(event) => setPageFrom(event.target.value)} placeholder="Ex.: 44" className="mt-1 h-8 rounded-sm bg-white text-xs" /></div>
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Página final</Label><Input type="number" min={1} max={20000} value={pageTo} onChange={(event) => setPageTo(event.target.value)} placeholder="Ex.: 47" className="mt-1 h-8 rounded-sm bg-white text-xs" /></div>
      </div>
      <div className="grid gap-2 md:grid-cols-[1.25fr_1fr]">
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Códigos a conferir</Label><Input value={targetCodesText} onChange={(event) => setTargetCodesText(event.target.value)} placeholder="Ex.: 32, 33, 34 ou 52.1" className="mt-1 h-8 rounded-sm bg-white text-xs" /><p className="mt-1 text-[10px] text-slate-500">Separe os códigos por vírgulas, ponto e vírgula ou linhas.</p></div>
        <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Fonte já registada (opcional)</Label><Select value={sourceId} onValueChange={setSourceId}><SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs"><SelectValue placeholder="Associar fonte" /></SelectTrigger><SelectContent><SelectItem value="none">Sem associação prévia</SelectItem>{confirmedSources.map((source) => <SelectItem key={source.id} value={String(source.id)}>{source.instrument} n.º {source.instrumentNumber ?? "—"} · {source.title}</SelectItem>)}</SelectContent></Select><p className="mt-1 text-[10px] text-slate-500">A associação não confirma a fonte nem as contas.</p></div>
      </div>
      <div><Label className="text-[10px] uppercase tracking-wide text-slate-500">Observações para o contabilista</Label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} placeholder="Indique o que deve ser confrontado: código, designação, débito, crédito ou contrapartida." className="mt-1 min-h-16 w-full resize-y border border-[#d7e0e8] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1267d6]" /></div>
      <div className="flex flex-wrap items-end gap-2 border border-dashed border-[#9fb4c9] bg-white p-2.5">
        <div className="min-w-64 flex-1"><Label className="text-[10px] uppercase tracking-wide text-slate-500">Ficheiro primário</Label><Input key={fileInputKey} aria-label="Ficheiro primário" type="file" accept=".pdf,application/pdf,.png,image/png,.jpg,.jpeg,image/jpeg,.webp,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} className="mt-1 h-9 cursor-pointer rounded-sm bg-white text-xs file:mr-2 file:border-0 file:bg-[#e6f0fc] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-[#1267d6]" /><p className="mt-1 text-[10px] text-slate-500">PDF, PNG, JPEG ou WebP · máximo 25 MB.</p></div>
        <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit} className="h-8 rounded-sm bg-[#1267d6] text-xs"><FileCheck2 className="mr-1 h-3.5 w-3.5" /> {submitEvidence.isPending ? "A submeter…" : "Submeter para revisão"}</Button>
      </div>
      <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><strong>Revisão humana obrigatória.</strong> A submissão guarda o ficheiro e os metadados como pendentes; não confirma contas, não publica movimentos e não activa regras contabilísticas.</span></div>
      <div className="border border-[#d7e0e8] bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-[#e4e9ef] bg-[#eef3f7] px-3 py-2"><div><p className="text-xs font-semibold">Fila de evidências submetidas</p><p className="text-[10px] text-slate-500">Apenas itens deste contexto de empresa e versão.</p></div><Badge variant="outline" className="rounded-sm text-[10px]">{evidenceQuery.data?.length ?? 0} registos</Badge></div>
        <div className="max-h-52 overflow-auto">{evidenceQuery.isLoading ? <p className="px-3 py-5 text-center text-xs text-slate-500">A carregar fila…</p> : evidenceQuery.data?.length ? evidenceQuery.data.map((submission) => <div key={submission.id} className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#edf0f3] px-3 py-2 text-xs last:border-b-0 ${selectedSubmissionId === submission.id ? "bg-[#eef6ff]" : ""}`}><div className="min-w-0"><p className="font-semibold text-slate-800">Classe {submission.classCode} · {submission.targetCodes.join(", ")}</p><p className="mt-0.5 truncate text-[10px] text-slate-500">{submission.file.filename} · SHA-256 {submission.file.sha256.slice(0, 12)}… · páginas {submission.pageFrom ?? "—"}–{submission.pageTo ?? submission.pageFrom ?? "—"}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={`rounded-sm text-[10px] ${submission.status === "PENDING_REVIEW" ? "border-amber-300 text-amber-700" : submission.status === "ACCEPTED" ? "border-emerald-300 text-emerald-700" : submission.status === "UNDER_REVIEW" ? "border-blue-300 text-blue-700" : "border-slate-300 text-slate-600"}`}>{statusLabels[submission.status as keyof typeof statusLabels] ?? submission.status}</Badge>{submission.status === "PENDING_REVIEW" ? <Button type="button" variant="outline" onClick={() => { if (!organizationId || !companyId || !versionId) return; startReview.mutate({ organizationId, companyId, versionId, submissionId: submission.id }); }} disabled={startReview.isPending} className="h-7 rounded-sm px-2 text-[10px]">Iniciar revisão</Button> : submission.status === "UNDER_REVIEW" ? <Button type="button" variant="outline" onClick={() => setSelectedSubmissionId(submission.id)} className="h-7 rounded-sm border-blue-300 px-2 text-[10px] text-blue-700">Seleccionar</Button> : null}</div></div>) : <p className="px-3 py-5 text-center text-xs text-slate-500">Ainda não existem evidências submetidas neste contexto.</p>}</div>
      </div>
      {selectedSubmission && selectedSubmission.status === "UNDER_REVIEW" ? <div className="border border-blue-200 bg-blue-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-blue-950">Decisão humana · {selectedSubmission.file.filename}</p><p className="mt-0.5 text-[10px] text-blue-800">Os códigos permanecem pendentes até confirmação normativa independente.</p></div><Badge variant="outline" className="rounded-sm border-blue-300 text-[10px] text-blue-700">Em revisão</Badge></div><div className="mt-2 grid gap-2 md:grid-cols-[1fr_1.5fr_auto]"><Select value={reviewDecision} onValueChange={(value) => setReviewDecision(value as keyof typeof decisionLabels)}><SelectTrigger className="h-8 rounded-sm bg-white text-xs"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(decisionLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} maxLength={4000} placeholder={reviewDecision === "CONFIRM" ? "Nota opcional da conferência" : "Nota obrigatória para esta decisão"} className="h-8 rounded-sm bg-white text-xs" /><Button type="button" onClick={() => { if (!organizationId || !companyId || !versionId || !selectedSubmission) return; reviewEvidence.mutate({ organizationId, companyId, versionId, submissionId: selectedSubmission.id, decision: reviewDecision, reviewNote: reviewNote.trim() || null }); }} disabled={!canReview || (reviewDecision !== "CONFIRM" && !reviewNote.trim())} className="h-8 rounded-sm bg-[#1267d6] text-xs">{reviewEvidence.isPending ? "A registar…" : "Registar decisão"}</Button></div><p className="mt-2 text-[10px] text-blue-800">Aceitar evidência significa apenas que o documento foi considerado suficiente para a revisão. Não confirma automaticamente contas nem regras de movimento.</p></div> : null}
      <p className="flex items-center gap-1 text-[10px] text-slate-500"><AlertTriangle className="h-3 w-3" /> Uma evidência aceite documentalmente ainda exige confronto literal antes de qualquer confirmação normativa.</p>
    </CardContent>
  </Card>;
}
