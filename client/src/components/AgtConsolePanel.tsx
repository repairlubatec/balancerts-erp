import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presentationLabel } from "@/lib/presentationLabels";

export function AgtConsolePanel({ company }: { company?: { id: number } }) {
  const utils = trpc.useUtils();
  const [feedback, setFeedback] = useState<string | null>(null);
  const submissions = trpc.agt.submissions.useQuery({ companyId: company?.id ?? 0 }, { enabled: Boolean(company?.id) });
  const update = trpc.agt.updateSubmission.useMutation({
    onSuccess: () => { setFeedback("Submissão marcada para reprocessamento interno."); void utils.agt.submissions.invalidate(); },
    onError: () => setFeedback("Não foi possível reprocessar a submissão."),
  });
  if (!company) return null;
  const rows = submissions.data ?? [];
  return <Card className="border-[#b9d2ef] bg-[#f8fbff] shadow-sm">
    <CardHeader className="pb-3"><CardTitle className="text-sm text-[#102a43]">Consola AGT</CardTitle><p className="text-xs text-slate-500">Fila persistente, requestID, resposta e reprocessamento interno. A comunicação real permanece desactivada.</p></CardHeader>
    <CardContent className="space-y-2">
      {submissions.isLoading && <p className="text-xs text-slate-500">A carregar fila AGT…</p>}
      {!submissions.isLoading && rows.length === 0 && <p className="rounded-md border border-dashed border-[#cfe0f5] bg-white p-3 text-xs text-slate-500">Não existem submissões persistentes para a empresa activa.</p>}
      {rows.map(({ submission, documents }) => <div key={submission.id} className="rounded-md border border-[#dbe5f1] bg-white p-3 text-xs"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-[#1267d6]">#{submission.id}</span><span className="font-medium text-[#102a43]">{presentationLabel(submission.operation)}</span><span className="rounded bg-[#eef5ff] px-2 py-0.5 font-semibold text-[#305b88]">{presentationLabel(submission.state)}</span><span className="text-slate-500">requestID: {submission.requestID ?? "—"}</span><Button type="button" variant="outline" size="sm" disabled={update.isPending || ["PROCESSING", "COMPLETED"].includes(submission.state)} onClick={() => update.mutate({ companyId: company.id, submissionId: submission.id, state: "PENDING" })} className="ml-auto h-7 border-[#1267d6] bg-white text-[#1267d6]">Reprocessar</Button></div><p className="mt-2 break-all text-slate-500">UUID: {submission.submissionUUID} · código de resultado: {submission.resultCode ?? "—"}</p>{submission.lastError && <p className="mt-1 text-rose-700">{submission.lastError}</p>}{documents && <p className="mt-1 text-slate-500">Documento: {documents.documentNo} · estado {presentationLabel(documents.documentStatus)}</p>}</div>)}
      {feedback && <p className="text-xs font-medium text-[#477514]">{feedback}</p>}
    </CardContent>
  </Card>;
}
