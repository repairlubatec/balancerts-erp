import { useMemo, useState } from "react";
import React from "react";
import {
  FileCheck2,
  FileText,
  FlaskConical,
  LockKeyhole,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTestIdentifier(file: File) {
  return `SIM-${file.name.length}-${file.size}-${file.lastModified}`;
}

export function IvaPdfSimulationPanel() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedFile, setSimulatedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const testIdentifier = useMemo(
    () => (simulatedFile ? buildTestIdentifier(simulatedFile) : null),
    [simulatedFile]
  );

  const simulateUpload = () => {
    if (!selectedFile) {
      toast.error("Seleccione um PDF para iniciar a simulação.");
      return;
    }
    setSimulatedFile(selectedFile);
    toast.success("Simulação concluída localmente. Nenhum PDF foi enviado.");
  };

  const clearSimulation = () => {
    setSelectedFile(null);
    setSimulatedFile(null);
    setFileInputKey(value => value + 1);
  };

  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#f8fafc] shadow-none">
      <CardHeader className="border-b border-[#d9e0e7] px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm text-[#1d2a38]">
              <FlaskConical className="h-4 w-4 text-[#1267d6]" />
              Simulação de envio de evidência IVA
            </CardTitle>
            <p className="mt-1 text-[11px] text-slate-500">
              Teste o percurso da interface com um PDF local, sem envio,
              persistência ou confirmação normativa.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-sm border-violet-300 bg-violet-50 text-[10px] text-violet-700"
          >
            <FlaskConical className="mr-1 h-3 w-3" /> MODO DE TESTE
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-end gap-2 border border-dashed border-[#9fb4c9] bg-white p-2.5">
          <div className="min-w-64 flex-1">
            <Label className="text-[10px] uppercase tracking-wide text-slate-500">
              PDF para simulação
            </Label>
            <Input
              key={fileInputKey}
              aria-label="PDF para simulação"
              type="file"
              accept=".pdf,application/pdf"
              onChange={event => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setSimulatedFile(null);
              }}
              className="mt-1 h-9 cursor-pointer rounded-sm bg-white text-xs file:mr-2 file:border-0 file:bg-[#eee8ff] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-violet-700"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Aceita apenas PDF · o conteúdo não sai do navegador.
            </p>
          </div>
          <Button
            type="button"
            onClick={simulateUpload}
            disabled={!selectedFile}
            className="h-8 rounded-sm bg-[#1267d6] text-xs"
          >
            <UploadCloud className="mr-1 h-3.5 w-3.5" /> Simular envio
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearSimulation}
            disabled={!selectedFile && !simulatedFile}
            className="h-8 rounded-sm bg-white text-xs"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        </div>

        {selectedFile && (
          <div className="grid gap-2 border border-[#d7e0e8] bg-white p-3 md:grid-cols-[auto_1fr_auto] md:items-center">
            <div className="flex h-9 w-9 items-center justify-center bg-[#eef3f7] text-[#1267d6]">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                {formatFileSize(selectedFile.size)} ·{" "}
                {selectedFile.type || "application/pdf"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`w-fit rounded-sm text-[10px] ${simulatedFile ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-slate-50 text-slate-600"}`}
            >
              {simulatedFile ? (
                <>
                  <FileCheck2 className="mr-1 h-3 w-3" /> Simulação concluída
                </>
              ) : (
                "Seleccionado para teste"
              )}
            </Badge>
          </div>
        )}

        {simulatedFile && testIdentifier && (
          <div className="border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] text-violet-900">
            <p className="font-semibold">Resultado da simulação</p>
            <p className="mt-1">
              O fluxo de selecção e submissão visual foi concluído.
              Identificador de teste:{" "}
              <span className="font-mono">{testIdentifier}</span>.
            </p>
            <p className="mt-1 text-violet-800">
              Este identificador não é hash probatório e não substitui a
              evidência primária, a revisão humana ou a confirmação de qualquer
              diploma.
            </p>
          </div>
        )}

        <div className="flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Simulação local e não normativa.</strong> O PDF não é
            enviado para a API, não é guardado no armazenamento, não cria
            evidência na fila e não altera a prontidão IVA. Para submissão real,
            utilize o formulário de evidência primária sujeito a revisão humana.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
