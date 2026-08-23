import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normativeErrorLabel } from "@/lib/normativeErrors";
import {
  buildIvaReadinessCsv,
  downloadIvaExport,
  openIvaExport,
  type IvaReadinessExportEntry,
} from "@/lib/ivaReadinessExport";
import { IvaReadinessPanel } from "@/components/IvaReadinessPanel";

const statusLabel: Record<string, string> = {
  PENDING: "Pendente",
  HUMAN_APPROVED: "Aprovada por humano",
  ACTIVE: "Activa",
  SUPERSEDED: "Substituída",
  REJECTED: "Rejeitada",
};
const ruleTypeLabel: Record<string, string> = {
  TAX_RATE: "Taxa",
  REGIME: "Regime",
  INCIDENCE: "Incidência",
  EXEMPTION: "Isenção",
  DEDUCTION: "Dedução",
  WITHHOLDING: "Cativação",
  REGULARIZATION: "Regularização",
  DECLARATION: "Declaração",
};
const movementLabel: Record<string, string> = {
  DEBIT: "Débito",
  CREDIT: "Crédito",
  MIXED: "Mista",
  NOT_APPLICABLE: "Não aplicável",
};

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  const approved = status === "HUMAN_APPROVED";
  return (
    <Badge
      variant="outline"
      className={`rounded-sm text-[10px] ${active ? "border-emerald-300 bg-emerald-50 text-emerald-700" : approved ? "border-blue-300 bg-blue-50 text-blue-700" : status === "REJECTED" ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}
    >
      {statusLabel[status] ?? status}
    </Badge>
  );
}

type IvaNormativeReviewPanelProps = {
  organizationId?: number;
  readinessResetKey?: number;
};

export function IvaNormativeReviewPanel({
  organizationId,
  readinessResetKey = 0,
}: IvaNormativeReviewPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [regime, setRegime] = useState<
    "TODOS" | "GERAL" | "SIMPLIFICADO" | "EXCLUSAO"
  >("TODOS");
  const [asOf, setAsOf] = useState("2026-08-23");
  const [note, setNote] = useState("");
  const [exportHistory, setExportHistory] = useState<IvaReadinessExportEntry[]>(
    []
  );
  const [selectedRuleId, setSelectedRuleId] = useState<number>();
  const [selectedMappingId, setSelectedMappingId] = useState<number>();
  const asOfDate = useMemo(() => new Date(`${asOf}T00:00:00Z`), [asOf]);
  const queryInput = useMemo(
    () =>
      organizationId
        ? {
            organizationId,
            asOf: asOfDate,
            includePending: isAdmin,
            regime: regime === "TODOS" ? undefined : regime,
            limit: 100,
          }
        : undefined,
    [organizationId, asOfDate, isAdmin, regime]
  );
  const readinessInput = useMemo(
    () =>
      organizationId
        ? { organizationId, asOf: asOfDate }
        : { organizationId: 0 },
    [organizationId, asOfDate]
  );
  const readinessQuery = trpc.normative.ivaReadiness.useQuery(readinessInput, {
    enabled: Boolean(organizationId),
  });
  const openExport = (entry: IvaReadinessExportEntry) => {
    try {
      if (!openIvaExport(entry)) {
        toast.error("O navegador bloqueou a abertura do ficheiro exportado.");
      }
    } catch {
      toast.error("Não foi possível abrir o ficheiro exportado.");
    }
  };
  const showExportSuccess = (entry: IvaReadinessExportEntry) => {
    setExportHistory(previous =>
      [entry, ...previous.filter(item => item.id !== entry.id)].slice(0, 5)
    );
    toast.success(`Relatório ${entry.format} de prontidão IVA descarregado.`, {
      description: entry.filename,
      action: {
        label: "Abrir ficheiro",
        onClick: () => openExport(entry),
      },
    });
  };
  const redownloadExport = (entry: IvaReadinessExportEntry) => {
    try {
      downloadIvaExport(entry);
      showExportSuccess(entry);
    } catch {
      toast.error(
        `Não foi possível descarregar novamente o ficheiro ${entry.filename}.`
      );
    }
  };
  const exportIvaReadinessPdf =
    trpc.normative.exportIvaReadinessPdf.useMutation({
      onSuccess: result => {
        const entry: IvaReadinessExportEntry = {
          id: `${result.filename}-${Date.now()}`,
          format: "PDF",
          filename: result.filename,
          mimeType: result.mimeType,
          content: result.dataBase64,
          encoding: "base64",
          createdAt: Date.now(),
        };
        try {
          downloadIvaExport(entry);
          showExportSuccess(entry);
        } catch {
          toast.error(
            "Não foi possível preparar a descarga do relatório PDF IVA."
          );
        }
      },
      onError: error => toast.error(normativeErrorLabel(error.message)),
    });
  const exportCsv = () => {
    if (!readinessQuery.data) {
      toast.error("O estado de prontidão IVA ainda não está disponível.");
      return;
    }
    const filename = `prontidao-iva-${organizationId ?? "contexto"}-${new Date().toISOString().slice(0, 10)}.csv`;
    const entry: IvaReadinessExportEntry = {
      id: `${filename}-${Date.now()}`,
      format: "CSV",
      filename,
      mimeType: "text/csv;charset=utf-8",
      content: buildIvaReadinessCsv(readinessQuery.data, asOfDate),
      encoding: "text",
      createdAt: Date.now(),
    };
    try {
      downloadIvaExport(entry);
      showExportSuccess(entry);
    } catch {
      toast.error("Não foi possível preparar a descarga do relatório CSV IVA.");
    }
  };
  const exportPdf = () => {
    if (!organizationId) {
      toast.error("Seleccione uma organização autorizada antes de exportar.");
      return;
    }
    exportIvaReadinessPdf.mutate({
      organizationId,
      asOf: asOfDate,
    });
  };
  useEffect(() => {
    if (readinessResetKey > 0 && organizationId) void readinessQuery.refetch();
  }, [organizationId, readinessQuery.refetch, readinessResetKey]);
  const rulesQuery = trpc.normative.ivaRules.useQuery(
    queryInput ?? { organizationId: 0, limit: 1 },
    { enabled: Boolean(organizationId) }
  );
  const accountsQuery = trpc.normative.ivaAccounts.useQuery(
    queryInput ?? { organizationId: 0, limit: 1 },
    { enabled: Boolean(organizationId) }
  );
  const utils = trpc.useUtils();
  const refresh = async () => {
    await Promise.all([
      readinessQuery.refetch(),
      rulesQuery.refetch(),
      accountsQuery.refetch(),
    ]);
  };
  const reviewRule = trpc.normative.reviewIvaRule.useMutation({
    onSuccess: async () => {
      toast.success("Decisão da regra IVA registada.");
      setSelectedRuleId(undefined);
      setNote("");
      await refresh();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const reviewAccount = trpc.normative.reviewIvaAccount.useMutation({
    onSuccess: async () => {
      toast.success("Decisão da conta IVA registada.");
      setSelectedMappingId(undefined);
      setNote("");
      await refresh();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const activateRule = trpc.normative.activateIvaRule.useMutation({
    onSuccess: async () => {
      toast.success("Regra IVA activada após aprovação humana.");
      await refresh();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const activateAccount = trpc.normative.activateIvaAccount.useMutation({
    onSuccess: async () => {
      toast.success("Mapeamento da conta IVA activado após aprovação humana.");
      await refresh();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const selectedRule = useMemo(
    () => (rulesQuery.data ?? []).find(row => row.id === selectedRuleId),
    [rulesQuery.data, selectedRuleId]
  );
  const selectedMapping = useMemo(
    () => (accountsQuery.data ?? []).find(row => row.id === selectedMappingId),
    [accountsQuery.data, selectedMappingId]
  );
  const review = (
    kind: "rule" | "account",
    decision: "HUMAN_APPROVED" | "REJECTED"
  ) => {
    if (!organizationId) return;
    if (kind === "rule" && selectedRuleId)
      reviewRule.mutate({
        organizationId,
        ruleId: selectedRuleId,
        decision,
        note: note || undefined,
      });
    if (kind === "account" && selectedMappingId)
      reviewAccount.mutate({
        organizationId,
        mappingId: selectedMappingId,
        decision,
        note: note || undefined,
      });
  };

  return (
    <Card className="rounded-sm border-[#bfc9d4] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-[#d9e0e7] px-3 py-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-[#1267d6]" /> Regras IVA e
            conta 34.5
          </CardTitle>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Fonte, vigência e estado normativo. Só regras activas podem calcular
            IVA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-sm border-slate-300 bg-slate-50 text-[10px] text-slate-600"
          >
            <LockKeyhole className="mr-1 h-3 w-3" /> CONFIRMED_ONLY
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-7 rounded-sm bg-white text-[11px]"
            onClick={() => void refresh()}
            disabled={
              !organizationId ||
              rulesQuery.isFetching ||
              accountsQuery.isFetching
            }
          >
            <RefreshCw
              className={`mr-1 h-3 w-3 ${rulesQuery.isFetching || accountsQuery.isFetching ? "animate-spin" : ""}`}
            />{" "}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <IvaReadinessPanel
          data={readinessQuery.data}
          isLoading={readinessQuery.isLoading}
          isError={readinessQuery.isError}
          onExportCsv={exportCsv}
          onExportPdf={exportPdf}
          exportPdfPending={exportIvaReadinessPdf.isPending}
          exportHistory={exportHistory}
          onRedownloadExport={redownloadExport}
          onOpenExport={openExport}
          onStartExport={exportCsv}
        />
        <div className="mb-3 grid grid-cols-[1fr_180px_auto] items-end gap-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Data de vigência
            </label>
            <input
              aria-label="Data de vigência das regras IVA"
              type="date"
              value={asOf}
              onChange={event => setAsOf(event.target.value)}
              className="mt-1 h-7 w-full rounded-sm border border-[#c7d0da] bg-white px-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Regime
            </label>
            <Select
              value={regime}
              onValueChange={value => setRegime(value as typeof regime)}
            >
              <SelectTrigger className="mt-1 h-7 rounded-sm bg-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os regimes</SelectItem>
                <SelectItem value="GERAL">Geral</SelectItem>
                <SelectItem value="SIMPLIFICADO">Simplificado</SelectItem>
                <SelectItem value="EXCLUSAO">Exclusão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="pb-1 text-right text-[10px] text-slate-500">
            {isAdmin
              ? "Administração: revisão disponível"
              : "Consulta de leitura"}
          </div>
        </div>
        <Tabs defaultValue="regras" className="space-y-2">
          <TabsList className="h-8 rounded-sm border border-[#c7d0da] bg-slate-50 p-1">
            <TabsTrigger value="regras" className="rounded-sm text-[11px]">
              Regras ({rulesQuery.data?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="contas" className="rounded-sm text-[11px]">
              Conta 34.5 ({accountsQuery.data?.length ?? 0})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="regras">
            <div className="overflow-x-auto border border-[#d9e0e7]">
              <table className="w-full min-w-[780px] text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Código / artigo</th>
                    <th className="px-2 py-1.5">Tipo</th>
                    <th className="px-2 py-1.5">Regime</th>
                    <th className="px-2 py-1.5">Taxa</th>
                    <th className="px-2 py-1.5">Estado</th>
                    <th className="px-2 py-1.5 text-right">Acção</th>
                  </tr>
                </thead>
                <tbody>
                  {(rulesQuery.data ?? []).slice(0, 25).map(rule => (
                    <tr key={rule.id} className="border-t border-[#e4e9ee]">
                      <td className="px-2 py-1.5">
                        <div className="font-semibold text-slate-800">
                          {rule.code}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Artigo {rule.article}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        {ruleTypeLabel[rule.ruleType] ?? rule.ruleType}
                      </td>
                      <td className="px-2 py-1.5">{rule.regime}</td>
                      <td className="px-2 py-1.5">
                        {rule.rate == null ? "—" : `${rule.rate}%`}
                      </td>
                      <td className="px-2 py-1.5">
                        <StatusBadge status={rule.verificationStatus} />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {isAdmin && rule.verificationStatus === "PENDING" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 rounded-sm text-[10px]"
                            onClick={() => {
                              setSelectedRuleId(rule.id);
                              setSelectedMappingId(undefined);
                            }}
                          >
                            Rever
                          </Button>
                        ) : isAdmin &&
                          rule.verificationStatus === "HUMAN_APPROVED" ? (
                          <Button
                            size="sm"
                            className="h-6 rounded-sm bg-[#1267d6] text-[10px]"
                            onClick={() =>
                              activateRule.mutate({
                                organizationId: organizationId!,
                                ruleId: rule.id,
                              })
                            }
                          >
                            Activar
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Somente leitura
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="contas">
            <div className="overflow-x-auto border border-[#d9e0e7]">
              <table className="w-full min-w-[780px] text-left text-[11px]">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-1.5">Conta</th>
                    <th className="px-2 py-1.5">Movimento</th>
                    <th className="px-2 py-1.5">Finalidade</th>
                    <th className="px-2 py-1.5">Vigência</th>
                    <th className="px-2 py-1.5">Estado</th>
                    <th className="px-2 py-1.5 text-right">Acção</th>
                  </tr>
                </thead>
                <tbody>
                  {(accountsQuery.data ?? []).slice(0, 25).map(mapping => (
                    <tr key={mapping.id} className="border-t border-[#e4e9ee]">
                      <td className="px-2 py-1.5">
                        <div className="font-semibold text-slate-800">
                          {mapping.accountCode}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {mapping.accountName}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        {movementLabel[mapping.movement] ?? mapping.movement}
                      </td>
                      <td className="px-2 py-1.5">{mapping.purpose}</td>
                      <td className="px-2 py-1.5">
                        {new Date(mapping.effectiveFrom).toLocaleDateString(
                          "pt-PT"
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <StatusBadge status={mapping.verificationStatus} />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {isAdmin && mapping.verificationStatus === "PENDING" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 rounded-sm text-[10px]"
                            onClick={() => {
                              setSelectedMappingId(mapping.id);
                              setSelectedRuleId(undefined);
                            }}
                          >
                            Rever
                          </Button>
                        ) : isAdmin &&
                          mapping.verificationStatus === "HUMAN_APPROVED" ? (
                          <Button
                            size="sm"
                            className="h-6 rounded-sm bg-[#1267d6] text-[10px]"
                            onClick={() =>
                              activateAccount.mutate({
                                organizationId: organizationId!,
                                mappingId: mapping.id,
                              })
                            }
                          >
                            Activar
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Somente leitura
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
        {(selectedRule || selectedMapping) && (
          <div className="mt-3 grid gap-2 border border-amber-200 bg-amber-50 p-2">
            <div className="text-xs font-semibold text-amber-950">
              Revisão humana:{" "}
              {selectedRule ? selectedRule.code : selectedMapping?.accountCode}
            </div>
            <div className="text-[10px] text-amber-900">
              Confirme apenas depois de comparar a evidência oficial, artigo,
              página e hash registados.
            </div>
            <textarea
              aria-label="Nota da revisão IVA"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Nota da decisão (obrigatória para rejeitar)"
              className="min-h-14 rounded-sm border border-amber-300 bg-white p-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-sm bg-white text-[11px]"
                onClick={() => {
                  setSelectedRuleId(undefined);
                  setSelectedMappingId(undefined);
                  setNote("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 rounded-sm border-red-300 bg-white text-[11px] text-red-700"
                onClick={() =>
                  review(selectedRule ? "rule" : "account", "REJECTED")
                }
              >
                <XCircle className="mr-1 h-3 w-3" /> Rejeitar
              </Button>
              <Button
                size="sm"
                className="h-7 rounded-sm bg-emerald-600 text-[11px]"
                onClick={() =>
                  review(selectedRule ? "rule" : "account", "HUMAN_APPROVED")
                }
              >
                <CheckCircle2 className="mr-1 h-3 w-3" /> Aprovar humanamente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
