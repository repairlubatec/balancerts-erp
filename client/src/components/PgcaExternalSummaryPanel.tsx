import React from "react";
import { BarChart3, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pgcaExternalBlockers } from "@/data/pgcaExternalBlockers";

const total = pgcaExternalBlockers.reduce((sum, blocker) => sum + blocker.count, 0);

export function PgcaExternalSummaryPanel({ onSelectBlocker, selectedLabel }: { onSelectBlocker?: (label: string) => void; selectedLabel?: string | null }) {
  return (
    <Card className="rounded-sm border-[#bfc9d4] shadow-none" data-testid="pgca-external-summary">
      <CardHeader className="flex flex-row items-center justify-between px-3 py-2">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5 text-[#1267d6]" aria-hidden="true" /> Distribuição das pendências externas</CardTitle>
          <p className="mt-0.5 text-[10px] text-slate-500">27 itens em espera, agrupados pelo motivo operacional.</p>
        </div>
        <span className="text-sm font-semibold text-red-700">{total}</span>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-2 px-3 pb-3 sm:grid-cols-2 2xl:grid-cols-3">
        {pgcaExternalBlockers.map(blocker => {
          const percent = Math.round((blocker.count / total) * 100);
          return <button type="button" key={blocker.label} className={`min-w-0 rounded-sm border px-2 py-1.5 text-left transition-colors ${selectedLabel === blocker.label ? "border-[#1267d6] bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-[#1267d6]"}`} onClick={() => onSelectBlocker?.(blocker.label)} title={blocker.reason} aria-label={`${blocker.label}: ${blocker.count} pendências, ${percent}%; clicar para filtrar contas pendentes`}>
            <div className="flex items-center justify-between gap-2 text-[10px]"><span className="truncate font-medium text-slate-700">{blocker.label}</span><span className="shrink-0 font-semibold text-slate-900">{blocker.count} ({percent}%)</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#1267d6]" style={{ width: `${percent}%` }} /></div>
            <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-500"><Info className="h-2.5 w-2.5" aria-hidden="true" /> Em espera por dependência externa</div>
          </button>;
        })}
      </CardContent>
    </Card>
  );
}
