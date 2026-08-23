import React from "react";
import { Badge } from "@/components/ui/badge";

type Coverage = { required: string[]; active: string[]; missing: string[]; complete: boolean };

export function PgcCoverageSummary({ coverage }: { coverage?: Coverage }) {
  if (!coverage) return null;
  return <div aria-label="Cobertura operacional PGCA" className="mt-2 flex flex-wrap gap-1 text-[10px]"><span className="font-semibold text-slate-600">Cobertura operacional:</span>{coverage.required.map((operation) => <Badge key={operation} variant="outline" className={`rounded-sm px-1.5 py-0 text-[10px] ${coverage.active.includes(operation) ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}>{operation}</Badge>)}</div>;
}
