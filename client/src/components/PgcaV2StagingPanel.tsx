import React from "react";
import { AlertTriangle, CheckCircle2, FileSearch, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pgcaV2Decision, pgcaV2Preflight } from "@/data/pgcaV2Preflight";

export function PgcaV2StagingPanel() {
  const decision = pgcaV2Decision();

  return (
    <Card className="rounded-sm border-amber-300 bg-amber-50/60 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <CardTitle className="text-sm text-amber-950">Nova versão PGCA — revisão controlada</CardTitle>
            <p className="mt-0.5 text-[10px] text-amber-900/80">
              O documento foi reconhecido, mas permanece fora do catálogo activo até à confirmação humana da fonte primária.
            </p>
          </div>
        </div>
        <Badge className="shrink-0 rounded-sm border-amber-400 bg-amber-100 text-[10px] text-amber-900">
          <LockKeyhole className="mr-1 h-3 w-3" aria-hidden="true" /> Apenas revisão
        </Badge>
      </CardHeader>
      <CardContent className="min-w-0 space-y-3 px-3 pb-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 2xl:grid-cols-4">
          <Summary label="Contas reconhecidas" value={pgcaV2Preflight.accountCount} />
          <Summary label="Códigos repetidos" value={pgcaV2Preflight.duplicateCodes.length} danger />
          <Summary label="Extensões reservadas" value={pgcaV2Preflight.reservedExtensions} danger />
          <Summary label="Documento concatenado" value="Não" good />
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-sm border border-amber-200 bg-white/70 px-2 py-1.5 text-[10px] text-slate-700">
            <span className="font-semibold">Códigos a desambiguar:</span>{" "}
            <span className="font-mono">{pgcaV2Preflight.duplicateCodes.join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-red-700">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Importação normativa e activação bloqueadas
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-amber-950/80">
          As extensões reservadas não recebem designações inventadas, não aceitam lançamentos e não criam regras contabilísticas. A matriz detalhada e o resultado do preflight ficam disponíveis para revisão documental.
        </p>
        <div className="sr-only" aria-live="polite">Estado de incorporação: {decision}</div>
      </CardContent>
    </Card>
  );
}

function Summary({ label, value, danger, good }: { label: string; value: number | string; danger?: boolean; good?: boolean }) {
  return (
    <div className="min-w-0 rounded-sm border border-amber-200 bg-white/70 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] text-slate-600">
        {good ? <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 text-base font-semibold ${danger ? "text-red-700" : good ? "text-emerald-700" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
