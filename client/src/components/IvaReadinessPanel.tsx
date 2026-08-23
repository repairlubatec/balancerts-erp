import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  FileWarning,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ivaNormativeChain } from "@/data/ivaNormativeChain";
import { cn } from "@/lib/utils";

type ReadinessData = {
  ready: boolean;
  activeRules: number;
  activeMappings: number;
  confirmedSources: number;
  missingChainSources?: string[];
  activeByRegime: Record<string, number>;
  blockers: string[];
};

type Props = {
  data?: ReadinessData;
  isLoading?: boolean;
  isError?: boolean;
};

const blockerLabels: Record<string, string> = {
  IVA_SEM_REGRA_ACTIVE: "Não existe regra IVA activa para o período.",
  IVA_SEM_MAPEAMENTO_34_5_ACTIVE:
    "Não existe mapeamento activo para a conta 34.5-IVA.",
  IVA_SEM_FONTE_CONFIRMADA: "Não existe fonte normativa confirmada.",
  IVA_CADEIA_NORMATIVA_INCOMPLETA:
    "Falta confirmar um ou mais diplomas da cadeia normativa IVA.",
};

function formatBlocker(blocker: string) {
  return blockerLabels[blocker] ?? blocker;
}

export function IvaReadinessPanel({ data, isLoading, isError }: Props) {
  const missing = new Set(data?.missingChainSources ?? []);
  const hasChainBlocker = data?.blockers.includes(
    "IVA_CADEIA_NORMATIVA_INCOMPLETA"
  );
  const chainComplete = data ? !hasChainBlocker && missing.size === 0 : false;

  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#f8fafc] shadow-none">
      <CardHeader className="border-b border-[#d9e0e7] px-3 py-2.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm text-[#1d2a38]">
              <ShieldCheck className="h-4 w-4 text-[#1267d6]" />
              Estado da prontidão IVA
            </CardTitle>
            <p className="mt-1 text-[11px] text-slate-500">
              Resultado das validações normativas da organização e da data
              seleccionada. A prontidão não substitui a confirmação humana da
              evidência primária.
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-sm border-slate-300 bg-white text-[10px] text-slate-600"
          >
            <LockKeyhole className="mr-1 h-3 w-3" /> CONFIRMED_ONLY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {isLoading ? (
          <div className="border border-slate-200 bg-white px-3 py-4 text-xs text-slate-500">
            A verificar a prontidão IVA…
          </div>
        ) : isError || !data ? (
          <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Não foi possível obter o estado de prontidão IVA.</span>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 border px-3 py-2.5",
                data.ready
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              )}
              role="status"
              aria-label={`Prontidão IVA ${data.ready ? "pronta" : "bloqueada"}`}
            >
              <div className="flex items-center gap-2">
                {data.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <FileWarning className="h-4 w-4 text-amber-600" />
                )}
                <div>
                  <p className="text-xs font-semibold">
                    Prontidão IVA: {data.ready ? "Pronta" : "Bloqueada"}
                  </p>
                  <p className="mt-0.5 text-[10px] opacity-80">
                    {data.ready
                      ? "As validações necessárias estão satisfeitas para a data seleccionada."
                      : "Os cálculos e movimentos dependentes continuam protegidos."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="min-w-20 border border-current/15 bg-white/60 px-2 py-1">
                  <strong className="block text-sm">{data.activeRules}</strong>
                  <span>regras activas</span>
                </div>
                <div className="min-w-20 border border-current/15 bg-white/60 px-2 py-1">
                  <strong className="block text-sm">
                    {data.activeMappings}
                  </strong>
                  <span>mapeamentos 34.5</span>
                </div>
                <div className="min-w-20 border border-current/15 bg-white/60 px-2 py-1">
                  <strong className="block text-sm">
                    {data.confirmedSources}
                  </strong>
                  <span>fontes confirmadas</span>
                </div>
              </div>
            </div>

            <div className="border border-[#d7e0e8] bg-white">
              <div className="flex items-center justify-between gap-2 border-b border-[#e4e9ef] bg-[#eef3f7] px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-[#1d2a38]">
                    Cadeia normativa IVA exigida
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Cada diploma é identificado individualmente; a falta de
                    qualquer elemento bloqueia a prontidão.
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Explicar a cadeia normativa IVA"
                      className="rounded-sm p-1 text-slate-500 hover:bg-slate-100 hover:text-[#1267d6]"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-[11px]">
                    A cadeia histórica preserva as versões anteriores. A
                    presença de um diploma não confirma automaticamente as suas
                    regras, taxas ou contas.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-5">
                {ivaNormativeChain.map((diploma, index) => {
                  const isMissing = missing.has(diploma.code);
                  return (
                    <Tooltip key={diploma.code}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "min-h-24 border px-2.5 py-2 text-left",
                            isMissing
                              ? "border-amber-300 bg-amber-50"
                              : "border-emerald-200 bg-emerald-50"
                          )}
                          data-testid={`iva-chain-${diploma.code}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                              {index + 1}. {diploma.shortTitle}
                            </span>
                            {isMissing ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            )}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold leading-tight text-[#1d2a38]">
                            {isMissing ? "Em falta" : "Identificado"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-600">
                            {diploma.role}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-[11px]">
                        <strong>{diploma.title}</strong>
                        <span className="mt-1 block">
                          {isMissing
                            ? "Não existe confirmação identificada para este diploma no contexto actual."
                            : "Existe uma fonte confirmada com este código no contexto actual."}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              <div
                className={cn(
                  "mx-3 mb-3 flex items-start gap-2 border px-2.5 py-2 text-[11px]",
                  chainComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                )}
                data-testid="iva-chain-summary"
              >
                {chainComplete ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {chainComplete
                    ? "Os cinco diplomas estão identificados como confirmados."
                    : `Diplomas em falta: ${Array.from(missing).length || "verifique o estado da cadeia"}.`}
                </span>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {Object.entries(data.activeByRegime).map(([regime, count]) => (
                <div
                  key={regime}
                  className="border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    Regime {regime}
                  </span>
                  <strong className="mt-0.5 block text-sm text-slate-900">
                    {count} regra(s) activa(s)
                  </strong>
                </div>
              ))}
            </div>

            {data.blockers.length > 0 && (
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-900">
                <p className="font-semibold">
                  Validações que impedem a prontidão
                </p>
                <ul className="mt-1 space-y-0.5">
                  {data.blockers.map(blocker => (
                    <li key={blocker}>• {formatBlocker(blocker)}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
