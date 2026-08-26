import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type FiscalTaxCoverageRow = {
  code: string;
  name: string;
  status: "IMPLEMENTADO_PARCIAL" | "PERSISTENCIA_APENAS" | "NAO_CONFIGURADO";
  configurationState: "NÃO CONFIGURADO" | "EM CONFIGURAÇÃO" | "CONFIGURADO" | "VALIDADO" | "HOMOLOGAÇÃO PENDENTE" | "ATIVO";
  supportedOperations: string[];
  missingCapabilities: string[];
  sourceUrls: string[];
};

const statusLabel: Record<FiscalTaxCoverageRow["status"], string> = {
  IMPLEMENTADO_PARCIAL: "Implementado parcialmente",
  PERSISTENCIA_APENAS: "Persistência apenas",
  NAO_CONFIGURADO: "Não configurado",
};

export function FiscalTaxCoveragePanel({
  coverage,
  isLoading,
}: {
  coverage?: FiscalTaxCoverageRow[];
  isLoading?: boolean;
}) {
  const rows = coverage ?? [];
  const configured = rows.filter((tax) => tax.configurationState === "ATIVO" || tax.configurationState === "VALIDADO").length;
  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
      <CardHeader className="border-b border-[#e6edf5] pb-3">
        <CardTitle className="text-base text-[#102a43]">Cobertura dos impostos</CardTitle>
        <p className="mt-1 text-xs text-slate-500">
          Mapa técnico por imposto. Estado configurado não significa homologação AGT nem autoriza taxas sem fonte activa.
        </p>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {isLoading ? <p className="text-xs text-slate-500">A carregar cobertura fiscal…</p> : !rows.length ? <p className="text-xs text-slate-500">Não foi possível obter o mapa de cobertura.</p> : <>
          <div className="flex items-center justify-between rounded border border-[#dbe5f1] bg-white px-3 py-2 text-xs">
            <span className="text-slate-600">Impostos catalogados: <strong className="text-[#102a43]">{rows.length}</strong></span>
            <span className="text-slate-600">Validados/activos: <strong className="text-[#102a43]">{configured}</strong></span>
          </div>
          <div className="overflow-x-auto rounded border border-[#e6edf5] bg-white">
            <table className="w-full min-w-[820px] text-left text-xs">
              <thead className="border-b border-[#e6edf5] bg-[#f8fafd] text-[10px] uppercase tracking-[0.1em] text-slate-500"><tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Imposto</th><th className="px-3 py-2">Cobertura técnica</th><th className="px-3 py-2">Estado V2</th><th className="px-3 py-2">Cobertura disponível</th><th className="px-3 py-2">Capacidades em falta</th></tr></thead>
              <tbody className="divide-y divide-[#edf2f7]">{rows.map((tax) => <tr key={tax.code}><td className="px-3 py-2 font-semibold text-[#1267d6]">{tax.code}</td><td className="px-3 py-2 font-medium text-[#102a43]">{tax.name}</td><td className="px-3 py-2"><span className={cn("inline-flex rounded border px-2 py-1 text-[10px] font-semibold", tax.status === "IMPLEMENTADO_PARCIAL" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{statusLabel[tax.status]}</span></td><td className="px-3 py-2"><span className={cn("inline-flex rounded border px-2 py-1 text-[10px] font-semibold", tax.configurationState === "HOMOLOGAÇÃO PENDENTE" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-amber-200 bg-amber-50 text-amber-700")}>{tax.configurationState}</span></td><td className="max-w-[250px] px-3 py-2 text-slate-600">{tax.supportedOperations.length ? tax.supportedOperations.join(" · ") : "Nenhuma operação activa"}</td><td className="max-w-[320px] px-3 py-2 text-slate-500">{tax.missingCapabilities.length ? tax.missingCapabilities.join(" · ") : "Sem lacunas catalogadas"}</td></tr>)}</tbody>
            </table>
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
