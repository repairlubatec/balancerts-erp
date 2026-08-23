import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  FileWarning,
  FlaskConical,
  LockKeyhole,
  RotateCcw,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ivaNormativeChain } from "@/data/ivaNormativeChain";

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildTestIdentifier(file: File) {
  return `SIM-${file.name.length}-${file.size}-${file.lastModified}`;
}

function normalizeForNameMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findDiplomaNameMatch(fileName: string) {
  const normalizedName = normalizeForNameMatch(fileName.replace(/\.pdf$/i, ""));
  return ivaNormativeChain.find(diploma => {
    const numericReference = diploma.shortTitle.replace(/[^0-9]+/g, "");
    const aliases = [
      diploma.shortTitle,
      diploma.title,
      diploma.code,
      `lei${numericReference}`,
      numericReference,
    ];
    return aliases.some(alias => {
      const normalizedAlias = normalizeForNameMatch(alias);
      const isUsefulAlias =
        normalizedAlias.length > 4 ||
        (/^\\d+$/.test(normalizedAlias) && normalizedAlias.length >= 4);
      return isUsefulAlias && normalizedName.includes(normalizedAlias);
    });
  });
}

type SimulationStatus = "IDLE" | "READY" | "PROCESSING" | "COMPLETED";
type FilenameValidation = {
  matchedDiploma: (typeof ivaNormativeChain)[number] | null;
  checked: boolean;
};

type Props = {
  onResetReadiness?: () => void | Promise<void>;
};

export function IvaPdfSimulationPanel({ onResetReadiness }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedFile, setSimulatedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [simulationStatus, setSimulationStatus] =
    useState<SimulationStatus>("IDLE");
  const [progress, setProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filenameValidation, setFilenameValidation] =
    useState<FilenameValidation>({ matchedDiploma: null, checked: false });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const testIdentifier = useMemo(
    () => (simulatedFile ? buildTestIdentifier(simulatedFile) : null),
    [simulatedFile]
  );

  useEffect(() => {
    if (!selectedFile || typeof URL.createObjectURL !== "function") {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(current => (current === url ? null : current));
    };
  }, [selectedFile]);

  useEffect(() => {
    if (simulationStatus !== "PROCESSING") return;
    const timer = window.setInterval(() => {
      setProgress(current => Math.min(current + 20, 100));
    }, 80);
    return () => window.clearInterval(timer);
  }, [simulationStatus]);

  useEffect(() => {
    if (simulationStatus !== "PROCESSING" || progress < 100 || !selectedFile)
      return;
    setSimulatedFile(selectedFile);
    setSimulationStatus("COMPLETED");
    toast.success("Simulação concluída localmente. Nenhum PDF foi enviado.");
  }, [progress, selectedFile, simulationStatus]);

  const handlePdfFile = (file: File | null) => {
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Seleccione um ficheiro PDF válido.");
      return;
    }
    setSelectedFile(file);
    setSimulatedFile(null);
    setFilenameValidation({
      matchedDiploma: findDiplomaNameMatch(file.name) ?? null,
      checked: true,
    });
    setProgress(0);
    setSimulationStatus("READY");
  };

  const simulateUpload = () => {
    if (!selectedFile) {
      toast.error("Seleccione um PDF para iniciar a simulação.");
      return;
    }
    setSimulatedFile(null);
    setProgress(0);
    setSimulationStatus("PROCESSING");
  };

  const clearSimulation = () => {
    setSelectedFile(null);
    setSimulatedFile(null);
    setFilenameValidation({ matchedDiploma: null, checked: false });
    setProgress(0);
    setSimulationStatus("IDLE");
    setFileInputKey(value => value + 1);
    setClearDialogOpen(false);
    void onResetReadiness?.();
    toast.success(
      "Simulação limpa. A prontidão IVA foi reposta ao estado validado."
    );
  };

  const isProcessing = simulationStatus === "PROCESSING";
  const hasLocalState = Boolean(selectedFile || simulatedFile);

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
        <div
          className={`flex flex-wrap items-end gap-2 border border-dashed bg-white p-2.5 transition-colors ${isDragActive ? "border-[#1267d6] bg-blue-50" : "border-[#9fb4c9]"}`}
          data-testid="iva-pdf-dropzone"
          role="group"
          aria-label="Zona de arrastar e largar PDF"
          onDragEnter={event => {
            event.preventDefault();
            setIsDragActive(true);
          }}
          onDragOver={event => event.preventDefault()}
          onDragLeave={event => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setIsDragActive(false);
            }
          }}
          onDrop={event => {
            event.preventDefault();
            setIsDragActive(false);
            handlePdfFile(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          <div className="min-w-64 flex-1">
            <Label className="text-[10px] uppercase tracking-wide text-slate-500">
              PDF para simulação
            </Label>
            <Input
              key={fileInputKey}
              aria-label="PDF para simulação"
              type="file"
              accept=".pdf,application/pdf"
              onChange={event => handlePdfFile(event.target.files?.[0] ?? null)}
              className="mt-1 h-9 cursor-pointer rounded-sm bg-white text-xs file:mr-2 file:border-0 file:bg-[#eee8ff] file:px-2 file:py-1 file:text-xs file:font-semibold file:text-violet-700"
            />
            <p className="mt-1 text-[10px] text-slate-500">
              Aceita apenas PDF · o conteúdo não sai do navegador.
            </p>
            <p
              className={`mt-2 border px-2 py-1.5 text-[10px] ${isDragActive ? "border-blue-300 bg-blue-50 font-semibold text-blue-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}
            >
              {isDragActive
                ? "Largue o PDF aqui para o seleccionar"
                : "Ou arraste e largue o PDF nesta zona"}
            </p>
          </div>
          <Button
            type="button"
            onClick={simulateUpload}
            disabled={!selectedFile || isProcessing}
            className="h-8 rounded-sm bg-[#1267d6] text-xs"
          >
            <UploadCloud className="mr-1 h-3.5 w-3.5" />
            {isProcessing ? "A simular…" : "Simular envio"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setClearDialogOpen(true)}
            disabled={!hasLocalState && simulationStatus === "IDLE"}
            className="h-8 rounded-sm bg-white text-xs"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Limpar e repor
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
              className={`w-fit rounded-sm text-[10px] ${simulatedFile ? "border-emerald-300 bg-emerald-50 text-emerald-700" : isProcessing ? "border-blue-300 bg-blue-50 text-blue-700" : "border-slate-300 bg-slate-50 text-slate-600"}`}
            >
              {simulatedFile ? (
                <>
                  <FileCheck2 className="mr-1 h-3 w-3" /> Simulação concluída
                </>
              ) : isProcessing ? (
                "A processar…"
              ) : (
                "Seleccionado para teste"
              )}
            </Badge>
          </div>
        )}

        {selectedFile && filenameValidation.checked && (
          <div
            className={`flex items-start gap-2 border px-3 py-2 text-[11px] ${filenameValidation.matchedDiploma ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
            data-testid="iva-filename-validation"
          >
            {filenameValidation.matchedDiploma ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            ) : (
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            )}
            <span>
              {filenameValidation.matchedDiploma ? (
                <>
                  <strong>Nome compatível:</strong> o ficheiro parece referir-se
                  a {filenameValidation.matchedDiploma.shortTitle}.
                </>
              ) : (
                <>
                  <strong>Aviso de divergência:</strong> o nome do PDF não
                  identifica claramente um dos cinco diplomas exigidos. A
                  simulação pode continuar, mas não confirma qualquer diploma.
                </>
              )}
            </span>
          </div>
        )}

        {selectedFile && (
          <div
            className="border border-slate-200 bg-slate-50 p-2.5"
            data-testid="iva-pdf-preview"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700">
              <Eye className="h-3.5 w-3.5 text-[#1267d6]" />
              Pré-visualização local antes da simulação
            </div>
            {previewUrl ? (
              <object
                title="Pré-visualização do PDF simulado"
                data={previewUrl}
                type="application/pdf"
                aria-label="Pré-visualização do PDF simulado"
                className="mt-2 h-56 w-full border border-slate-300 bg-white"
              >
                <span className="block p-2 text-[10px] text-slate-600">
                  O visualizador incorporado não conseguiu abrir este PDF neste
                  ambiente.
                </span>
              </object>
            ) : (
              <p className="mt-2 border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] text-amber-900">
                A pré-visualização incorporada não está disponível neste
                ambiente. O PDF continua seleccionado localmente e não foi
                enviado.
              </p>
            )}
            <p className="mt-1 text-[10px] text-slate-500">
              Pré-visualização temporária no navegador; não é guardada nem usada
              como confirmação normativa.
            </p>
          </div>
        )}

        {isProcessing && (
          <div
            className="border border-blue-200 bg-blue-50 px-3 py-2.5"
            aria-live="polite"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] text-blue-900">
              <span className="font-semibold">
                A simular o carregamento local…
              </span>
              <span className="font-mono font-semibold">{progress}%</span>
            </div>
            <Progress
              value={progress}
              aria-label="Progresso da simulação"
              className="mt-2 h-2 bg-blue-100 [&_[data-slot=progress-indicator]]:bg-[#1267d6]"
            />
            <p className="mt-1 text-[10px] text-blue-800">
              O progresso é apenas visual; nenhum conteúdo está a ser
              transmitido.
            </p>
          </div>
        )}

        {simulatedFile && testIdentifier && (
          <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
            <p className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Resultado da simulação
            </p>
            <p className="mt-1">
              O fluxo de selecção e submissão visual foi concluído.
              Identificador de teste:{" "}
              <span className="font-mono">{testIdentifier}</span>.
            </p>
            <p className="mt-1 text-emerald-800">
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
            evidência na fila e não altera a prontidão IVA. O botão “Limpar e
            repor” remove o estado local e actualiza novamente a prontidão
            validada no servidor.
          </span>
        </div>
      </CardContent>
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent className="rounded-sm border-[#bfc9d4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base text-[#1d2a38]">
              Limpar a simulação?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-slate-600">
              O PDF seleccionado, a pré-visualização e o progresso local serão
              removidos. A prontidão IVA validada no servidor será apenas
              relida; nenhuma fonte ou confirmação normativa será alterada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-sm bg-white text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-red-600 text-xs text-white hover:bg-red-700"
              onClick={clearSimulation}
            >
              Sim, limpar e repor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
