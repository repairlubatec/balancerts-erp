import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAccountTraceRoutes, getReportTraceRoutes } from "@/lib/traceability";

type Props = {
  mode: "report" | "account";
  selected: string;
  onNavigate: (path: string) => void;
};

export function TraceabilityPanel({ mode, selected, onNavigate }: Props) {
  const reportRoutes = mode === "report" ? getReportTraceRoutes(selected) : null;
  const accountRoutes = mode === "account" ? getAccountTraceRoutes(selected) : null;
  const routes = reportRoutes ?? accountRoutes!;
  return <Card className="border-[#cfe0f5] bg-[#f3f8ff] shadow-sm"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-[#102a43]">Percurso de rastreabilidade</p><p className="mt-1 text-xs text-slate-500">Registo seleccionado: {selected}. Abrir o contexto operacional relacionado.</p></div><div className="flex flex-wrap gap-2">{reportRoutes ? <><Button variant="outline" size="sm" onClick={() => onNavigate(reportRoutes.account)}>Conta</Button><Button variant="outline" size="sm" onClick={() => onNavigate(reportRoutes.journal)}>Lançamento</Button><Button variant="outline" size="sm" onClick={() => onNavigate(reportRoutes.document)}>Documento</Button></> : <><Button variant="outline" size="sm" onClick={() => onNavigate(accountRoutes!.report)}>Relatório</Button><Button variant="outline" size="sm" onClick={() => onNavigate(accountRoutes!.journal)}>Lançamento</Button><Button variant="outline" size="sm" onClick={() => onNavigate(accountRoutes!.document)}>Documento</Button></>}<Button variant="outline" size="sm" onClick={() => onNavigate(routes.audit)}>Auditoria</Button></div></CardContent></Card>;
}
