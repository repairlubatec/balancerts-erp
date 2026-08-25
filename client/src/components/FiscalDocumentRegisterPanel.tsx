import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { presentationLabel } from "@/lib/presentationLabels";

type FiscalRegisterEntry = {
  documentId: number;
  documentNumber: string;
  issueDate: Date | string;
  status: string;
  ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  normativeRuleIds?: number[];
  normativeRuleVersions?: string[];
  legalReferences?: string[];
};

type FiscalRegister = {
  entries: FiscalRegisterEntry[];
  reconciled: boolean;
  totals: { netAmount: number; taxAmount: number; totalAmount: number };
};

export function FiscalDocumentRegisterPanel({
  fiscalRegister,
  isLoading,
}: {
  fiscalRegister?: FiscalRegister;
  isLoading?: boolean;
}) {
  const entries = fiscalRegister?.entries ?? [];
  const tracedEntries = entries.filter(
    (entry) =>
      Boolean(entry.normativeRuleIds?.length) ||
      Boolean(entry.normativeRuleVersions?.length) ||
      Boolean(entry.legalReferences?.length)
  ).length;

  return (
    <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
      <CardHeader className="border-b border-[#e6edf5] pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base text-[#102a43]">
              Registo fiscal documental
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              IVA persistido por documento, com regra, versão e referência jurídica
              quando registadas. A ausência de proveniência não é substituída por
              uma estimativa.
            </p>
          </div>
          {fiscalRegister && (
            <span
              className={cn(
                "shrink-0 rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
                fiscalRegister.reconciled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              )}
            >
              {fiscalRegister.reconciled ? "Reconciliado" : "Rever"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-3">
        {isLoading ? (
          <p className="text-xs text-slate-500">A carregar registo fiscal…</p>
        ) : !fiscalRegister ? (
          <p className="text-xs text-slate-500">
            Seleccione uma empresa autorizada para consultar o registo fiscal.
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-[#e6edf5] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Documentos
                </p>
                <p className="mt-1 text-lg font-semibold text-[#102a43]">
                  {entries.length.toLocaleString("pt-PT")}
                </p>
              </div>
              <div className="rounded border border-[#e6edf5] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  Com proveniência
                </p>
                <p className="mt-1 text-lg font-semibold text-[#102a43]">
                  {tracedEntries.toLocaleString("pt-PT")}
                </p>
              </div>
              <div className="rounded border border-[#e6edf5] bg-white px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                  IVA registado
                </p>
                <p className="mt-1 text-lg font-semibold text-[#102a43]">
                  {fiscalRegister.totals.taxAmount.toLocaleString("pt-PT")} AOA
                </p>
              </div>
            </div>
            <div className="overflow-x-auto rounded border border-[#e6edf5] bg-white">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead className="border-b border-[#e6edf5] bg-[#f8fafd] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Documento</th>
                    <th className="px-3 py-2">Data</th>
                    <th className="px-3 py-2">Regime</th>
                    <th className="px-3 py-2 text-right">Base</th>
                    <th className="px-3 py-2 text-right">IVA</th>
                    <th className="px-3 py-2">Regra / versão / referência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f7]">
                  {entries.map((entry) => {
                    const provenance = [
                      entry.normativeRuleIds?.length
                        ? `Regra #${entry.normativeRuleIds.join(", #")}`
                        : null,
                      entry.normativeRuleVersions?.length
                        ? `Versão ${entry.normativeRuleVersions.join(", ")}`
                        : null,
                      entry.legalReferences?.length
                        ? entry.legalReferences.join("; ")
                        : null,
                    ].filter(Boolean);
                    return (
                      <tr key={entry.documentId}>
                        <td className="px-3 py-2 font-semibold text-[#1267d6]">
                          {entry.documentNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          {new Date(entry.issueDate).toLocaleDateString("pt-PT")}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {presentationLabel(entry.ivaRegime)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                          {entry.netAmount.toLocaleString("pt-PT")} AOA
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right text-slate-600">
                          {entry.taxAmount.toLocaleString("pt-PT")} AOA
                        </td>
                        <td className="max-w-[420px] px-3 py-2 text-slate-600">
                          {provenance.length ? (
                            <span>{provenance.join(" · ")}</span>
                          ) : (
                            <span className="text-slate-400">
                              Sem proveniência normativa persistida
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!entries.length && (
                    <tr>
                      <td colSpan={6} className="px-3 py-5 text-center text-slate-500">
                        Não existem documentos fiscais persistidos para a empresa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
