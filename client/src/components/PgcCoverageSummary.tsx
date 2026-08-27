import React from "react";
import { Badge } from "@/components/ui/badge";
import { operationalRulePreparations } from "../../../shared/accountingMovementRules";

type Coverage = { required: string[]; active: string[]; missing: string[]; complete: boolean };

export function PgcCoverageSummary({ coverage }: { coverage?: Coverage }) {
  if (!coverage) return null;
  return (
    <div aria-label="Cobertura operacional PGCA" className="mt-2 space-y-1 text-[10px]">
      <div className="flex flex-wrap gap-1">
        <span className="font-semibold text-slate-600">Cobertura operacional:</span>
        {coverage.required.map((operation) => (
          <Badge key={operation} variant="outline" className={`rounded-sm px-1.5 py-0 text-[10px] ${coverage.active.includes(operation) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
            {operation}
          </Badge>
        ))}
      </div>
      <div aria-label="Modelos de regras contabilísticas" className="flex flex-wrap gap-1 text-slate-500">
        <span className="font-semibold">Modelos de regra:</span>
        {operationalRulePreparations.map((rule) => (
          <span key={rule.operation} title={`${rule.label}: ${rule.taxRequirement}. Códigos PGCA requeridos: ${rule.requiredAccountCodes.join(", ")}. ${rule.sourceBackedMovement}`} className="rounded-sm border border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px]">
            {rule.label} · RASCUNHO
          </span>
        ))}
      </div>
    </div>
  );
}
