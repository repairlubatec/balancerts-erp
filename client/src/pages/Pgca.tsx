import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  FilePlus2,
  Loader2,
  MessageSquare,
  Undo2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { skipToken } from "@tanstack/react-query";
import { normativeErrorLabel } from "@/lib/normativeErrors";
import { presentationLabel } from "@/lib/presentationLabels";
import { normativeBatches } from "@/data/normativeBatches";
import { NormativeConfirmationDashboard } from "@/components/NormativeConfirmationDashboard";
import { PgcEvidenceSubmissionPanel } from "@/components/PgcEvidenceSubmissionPanel";
import { PgcMovementSimulatorPanel } from "@/components/PgcMovementSimulatorPanel";
import { PgcAuditLogPanel } from "@/components/PgcAuditLogPanel";
import { AccountingRuleFormPanel } from "@/components/AccountingRuleFormPanel";
import { IvaNormativeReviewPanel } from "@/components/IvaNormativeReviewPanel";
import { IvaPdfSimulationPanel } from "@/components/IvaPdfSimulationPanel";
import { PgcCoverageSummary } from "@/components/PgcCoverageSummary";
import { PgcaV2StagingPanel } from "@/components/PgcaV2StagingPanel";
import { PgcaExternalSummaryPanel } from "@/components/PgcaExternalSummaryPanel";
import {
  filterPgcAccountsByStatus,
  pgcAccountStatusClass,
  pgcAccountStatusLabel,
} from "@/lib/pgcAccountStatus";
import { sortPgcAccounts } from "@/lib/pgcaAccountSorting";
import { buildPgcaReviewCsv, downloadPgcaReviewCsv } from "@/lib/pgcaReviewExport";
import { pgcaExternalBlockers } from "@/data/pgcaExternalBlockers";

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho",
  UNDER_REVIEW: "Em revisão",
  VALIDATED: "Validada",
  ACTIVE: "Activa",
  SUPERSEDED: "Substituída",
  ARCHIVED: "Arquivada",
  NEEDS_NORMATIVE_VALIDATION: "Validação normativa pendente",
  CONFIRMED: "Confirmada",
  PENDING: "Pendente",
  RUNNING: "Em execução",
  COMPLETED: "Concluída",
  FAILED: "Falhou",
  REVIEWED: "Revisto",
  APPROVED: "Aprovado",
  APPLIED: "Aplicado",
  REJECTED: "Rejeitada",
  CONFLICT: "Conflito",
  INVALID: "Inválida",
  DUPLICATE: "Duplicada",
  MISSING_PARENT: "Conta-pai em falta",
};
const accountTypeLabel: Record<string, string> = {
  CLASS: "Classe",
  GROUP: "Grupo",
  MOVEMENT: "Movimento",
  ANALYTICAL: "Analítica",
};
const natureLabel: Record<string, string> = {
  DEBIT: "Devedora",
  CREDIT: "Credora",
  MIXED: "Mista",
  NOT_APPLICABLE: "Não aplicável",
};
const readinessBlockerLabel: Record<string, string> = {
  PGC_VERSION_MUST_BE_VALIDATED: "A versão ainda não foi validada",
  PGC_VERSION_WITHOUT_ACCOUNTS: "A versão não tem contas",
  PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS: "Existem contas sem confirmação",
  PGC_VERSION_WITHOUT_SOURCES: "A versão não tem fontes normativas",
  PGC_VERSION_HAS_UNCONFIRMED_SOURCES: "Existem fontes sem confirmação",
  PGC_VERSION_WITHOUT_ACCOUNTING_RULES:
    "Não existem regras contabilísticas activas",
  PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE:
    "Falta cobertura de uma ou mais operações",
};

export default function Pgca() {
  const { user } = useAuth();
  const companiesQuery = trpc.companies.list.useQuery();
  const companies = companiesQuery.data ?? [];
  const [companyId, setCompanyId] = useState<number>();
  const [ivaReadinessResetKey, setIvaReadinessResetKey] = useState(0);
  const activeCompany =
    companies.find(row => row.company.id === companyId) ?? companies[0];
  const resolvedCompanyId = activeCompany?.company.id;
  const organizationId = activeCompany?.company.organizationId;
  const versionsQuery = trpc.pgc.versions.useQuery(
    organizationId ? { organizationId } : skipToken
  );
  const versions = versionsQuery.data ?? [];
  const [versionId, setVersionId] = useState<number>();
  const activeVersion =
    versions.find(version => version.id === versionId) ?? versions[0];
  const resolvedVersionId = activeVersion?.id;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "CONFIRMED" | "PENDING" | "OTHER"
  >("ALL");
  const [accountSort, setAccountSort] = useState<
    "CODE_ASC" | "CODE_DESC" | "NAME_ASC" | "STATUS"
  >("CODE_ASC");
  const [accountPage, setAccountPage] = useState(1);
  const accountsPerPage = 50;
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [selectedExternalBlocker, setSelectedExternalBlocker] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [inlineStatus, setInlineStatus] = useState<string | undefined>();
  const [inlineResponsibleId, setInlineResponsibleId] = useState<number | null | undefined>();
  const [undoAction, setUndoAction] = useState<{ accountId: number; validationStatus: "NEEDS_NORMATIVE_VALIDATION" | "CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT"; responsibleUserId: number | null; expiresAt: number } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [batchStatus, setBatchStatus] = useState<
    "CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT"
  >("CONFIRMED");
  const [batchNotes, setBatchNotes] = useState("");
  const accountsQuery = trpc.pgc.accounts.useQuery(
    organizationId && resolvedVersionId
      ? {
          organizationId,
          versionId: resolvedVersionId,
          search: search || undefined,
        }
      : skipToken
  );
  const accountHistoryQuery = trpc.audit.pgcLogs.useQuery(
    organizationId && selectedAccountId
      ? { organizationId, entityType: "pgcAccount", entityId: String(selectedAccountId), page: 1, pageSize: 100 }
      : skipToken
  );
  const updateInline = trpc.pgc.updateInline.useMutation({
    onSuccess: async () => { toast.success("Conta actualizada sem recarregar a página."); await accountsQuery.refetch(); },
    onError: error => { setUndoAction(null); toast.error(normativeErrorLabel(error.message)); },
  });
  const addComment = trpc.pgc.addComment.useMutation({
    onSuccess: async () => { setCommentText(""); toast.success("Comentário guardado no histórico da conta."); await accountHistoryQuery.refetch(); },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const auditsQuery = trpc.pgc.auditRuns.useQuery(
    resolvedCompanyId ? { companyId: resolvedCompanyId } : skipToken
  );
  const migrationQuery = trpc.pgc.migrationMaps.useQuery(
    resolvedCompanyId && resolvedVersionId
      ? { companyId: resolvedCompanyId, versionId: resolvedVersionId }
      : skipToken
  );
  const rulesQuery = trpc.pgc.accountingRules.useQuery(
    organizationId && resolvedVersionId
      ? {
          organizationId,
          versionId: resolvedVersionId,
          companyId: resolvedCompanyId,
        }
      : skipToken
  );
  const readinessQuery = trpc.pgc.activationReadiness.useQuery(
    organizationId && resolvedVersionId
      ? { organizationId, versionId: resolvedVersionId }
      : skipToken
  );
  const sourcesQuery = trpc.pgc.sources.useQuery(
    organizationId && resolvedVersionId
      ? { organizationId, versionId: resolvedVersionId }
      : skipToken
  );
  const primarySourceConfirmed = Boolean(
    sourcesQuery.data?.some(source => source.verificationStatus === "CONFIRMED")
  );
  const reviewSource = trpc.pgc.reviewSource.useMutation({
    onSuccess: async () => {
      toast.success("Fonte revista.");
      await sourcesQuery.refetch();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const reviewAccount = trpc.pgc.reviewAccount.useMutation({
    onSuccess: async () => {
      toast.success("Conta revista.");
      await accountsQuery.refetch();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const utils = trpc.useUtils();
  const createVersion = trpc.pgc.createVersion.useMutation({
    onSuccess: async () => {
      toast.success("Versão PGCA criada em rascunho.");
      await utils.pgc.versions.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const submitForReview = trpc.pgc.submitForReview.useMutation({
    onSuccess: async () => {
      toast.success("Versão enviada para revisão.");
      await utils.pgc.versions.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const validateVersion = trpc.pgc.validateVersion.useMutation({
    onSuccess: async () => {
      toast.success("Versão validada.");
      await utils.pgc.versions.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const activateVersion = trpc.pgc.activateVersion.useMutation({
    onSuccess: async () => {
      toast.success("Versão PGCA activada.");
      await utils.pgc.versions.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const auditLegacy = trpc.pgc.auditLegacy.useMutation({
    onSuccess: async result => {
      toast.success(
        `Auditoria concluída: ${result.totalChecked} contas verificadas.`
      );
      await auditsQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const reviewAccountsBatch = trpc.pgc.reviewAccountsBatch.useMutation({
    onSuccess: async result => {
      if (result.applied.length)
        toast.success(
          `${result.applied.length} conta(s) revista(s) individualmente.`
        );
      if (result.blocked.length)
        toast.error(
          `${result.blocked.length} conta(s) bloqueada(s): requerem revisão individual.`
        );
      setSelectedAccountIds([]);
      setBatchNotes("");
      await accountsQuery.refetch();
    },
    onError: error => toast.error(normativeErrorLabel(error.message)),
  });
  const [newVersionCode, setNewVersionCode] = useState("");
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const selectedBatch = normativeBatches.find(
    batch => batch.batchId === selectedBatchId
  );

  const visibleAccounts = accountsQuery.data ?? [];
  const selectedAccount = visibleAccounts.find(account => account.id === selectedAccountId) ?? null;
  const beginInlineUpdate = (account: typeof visibleAccounts[number], patch: { validationStatus?: "NEEDS_NORMATIVE_VALIDATION" | "CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT"; responsibleUserId?: number | null }) => {
    if (!organizationId || !resolvedVersionId) return;
    setUndoAction({ accountId: account.id, validationStatus: account.validationStatus, responsibleUserId: account.responsibleUserId ?? null, expiresAt: Date.now() + 10000 });
    window.setTimeout(() => setUndoAction(current => current?.accountId === account.id && current.expiresAt <= Date.now() ? null : current), 10100);
    updateInline.mutate({ organizationId, versionId: resolvedVersionId, accountId: account.id, ...patch });
  };
  const undoInlineUpdate = () => {
    if (!undoAction || undoAction.expiresAt <= Date.now() || !organizationId || !resolvedVersionId) { setUndoAction(null); return; }
    updateInline.mutate({ organizationId, versionId: resolvedVersionId, accountId: undoAction.accountId, validationStatus: undoAction.validationStatus, responsibleUserId: undoAction.responsibleUserId });
    setUndoAction(null);
    toast.success("Alteração revertida.");
  };
  const filteredAccounts = useMemo(() => {
    const effectiveStatus = selectedExternalBlocker ? "PENDING" : statusFilter;
    const accounts = filterPgcAccountsByStatus(visibleAccounts, effectiveStatus);
    return sortPgcAccounts(accounts, accountSort);
  }, [accountSort, selectedExternalBlocker, statusFilter, visibleAccounts]);
  const accountPageCount = Math.max(1, Math.ceil(filteredAccounts.length / accountsPerPage));
  const paginatedAccounts = filteredAccounts.slice((accountPage - 1) * accountsPerPage, accountPage * accountsPerPage);
  const selectableAccounts = paginatedAccounts.filter(
    account => account.validationStatus !== "CONFIRMED"
  );
  const allVisibleSelected =
    selectableAccounts.length > 0 &&
    selectableAccounts.every(account =>
      selectedAccountIds.includes(account.id)
    );
  const exportFilteredAccounts = () => {
    setIsExportingCsv(true);
    try {
      const csv = buildPgcaReviewCsv(filteredAccounts, pgcaExternalBlockers);
      downloadPgcaReviewCsv(csv);
      toast.success(`CSV exportado: ${filteredAccounts.length} contas e ${pgcaExternalBlockers.length} grupos de pendências.`);
    } catch (error) {
      toast.error(`Não foi possível gerar o CSV: ${error instanceof Error ? error.message : "erro desconhecido"}.`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const summary = useMemo(() => {
    const accounts = accountsQuery.data ?? [];
    return {
      total: accounts.length,
      entries: accounts.filter(account => Boolean(account.acceptsEntries))
        .length,
      pending: accounts.filter(
        account => account.validationStatus === "NEEDS_NORMATIVE_VALIDATION"
      ).length,
    };
  }, [accountsQuery.data]);

  const handleCreateVersion = () => {
    if (
      !organizationId ||
      !newVersionCode.trim() ||
      !newVersionName.trim() ||
      !newVersionDescription.trim()
    ) {
      toast.error("Preencha o código, nome e descrição da versão.");
      return;
    }
    createVersion.mutate({
      organizationId,
      code: newVersionCode,
      name: newVersionName,
      description: newVersionDescription,
      sourceType: "PGC_BASE",
      effectiveFrom: new Date(),
    });
  };

  return (
    <div className="min-h-full bg-[#e8edf2] p-4 text-[#1d2a38]">
      <div className="mx-auto max-w-[1500px] space-y-3">
        <header className="flex flex-wrap items-start justify-between gap-3 border border-[#aeb9c5] bg-[#f8fafc] px-4 py-3 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1267d6]">
              <BookOpenCheck className="h-4 w-4" /> Contabilidade normativa
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Plano Geral de Contabilidade de Angola
            </h1>
            <p className="mt-1 max-w-3xl text-xs text-slate-600">
              Gestão versionada do PGCA, fontes legais, contas postáveis,
              auditoria do plano legado e mapas de migração. Nenhuma alteração
              histórica é executada automaticamente.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge
              variant="outline"
              className="rounded-sm border-emerald-300 bg-emerald-50 text-emerald-700"
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Isolamento activo
            </Badge>
            <Button
              variant="outline"
              className="h-8 rounded-sm bg-white text-xs"
              onClick={() =>
                organizationId &&
                resolvedVersionId &&
                submitForReview.mutate({
                  organizationId,
                  versionId: resolvedVersionId,
                })
              }
              disabled={
                !organizationId ||
                !resolvedVersionId ||
                activeVersion?.status !== "DRAFT"
              }
            >
              <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Enviar para
              revisão
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-sm bg-white text-xs"
              onClick={() =>
                organizationId &&
                resolvedVersionId &&
                validateVersion.mutate({
                  organizationId,
                  versionId: resolvedVersionId,
                })
              }
              disabled={
                !organizationId ||
                !resolvedVersionId ||
                activeVersion?.status !== "UNDER_REVIEW"
              }
            >
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Validar versão
            </Button>
            <Button
              variant="outline"
              className="h-8 rounded-sm bg-white text-xs"
              onClick={() =>
                organizationId &&
                resolvedVersionId &&
                activateVersion.mutate({
                  organizationId,
                  versionId: resolvedVersionId,
                })
              }
              disabled={
                !organizationId ||
                !resolvedVersionId ||
                activeVersion?.status !== "VALIDATED"
              }
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Activar versão
            </Button>
            <Button
              className="h-8 rounded-sm bg-[#1267d6] text-xs"
              onClick={() =>
                resolvedCompanyId &&
                auditLegacy.mutate({
                  companyId: resolvedCompanyId,
                  versionId: resolvedVersionId,
                })
              }
              disabled={!resolvedCompanyId || auditLegacy.isPending}
            >
              <RefreshCw
                className={`mr-1 h-3.5 w-3.5 ${auditLegacy.isPending ? "animate-spin" : ""}`}
              />{" "}
              Auditar plano legado
            </Button>
          </div>
        </header>
        <Card className="rounded-sm border-[#bfc9d4] shadow-none">
          <CardContent className="grid gap-3 p-3 md:grid-cols-[1fr_1fr_2fr]">
            <div>
              <Label className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Empresa de trabalho
              </Label>
              <Select
                value={resolvedCompanyId ? String(resolvedCompanyId) : ""}
                onValueChange={value => setCompanyId(Number(value))}
              >
                <SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs">
                  <SelectValue placeholder="Seleccione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(row => (
                    <SelectItem
                      key={row.company.id}
                      value={String(row.company.id)}
                    >
                      {row.company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
                Versão normativa
              </Label>
              <Select
                value={resolvedVersionId ? String(resolvedVersionId) : ""}
                onValueChange={value => setVersionId(Number(value))}
              >
                <SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs">
                  <SelectValue placeholder="Seleccione a versão" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map(version => (
                    <SelectItem key={version.id} value={String(version.id)}>
                      {version.code} · {version.name} ·{" "}
                      {statusLabel[version.status] ?? version.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Contas carregadas" value={summary.total} />
              <Metric label="Postáveis" value={summary.entries} />
              <Metric
                label="Validação pendente"
                value={summary.pending}
                warning={summary.pending > 0}
              />
            </div>
          </CardContent>
        </Card>
        <PgcaExternalSummaryPanel selectedLabel={selectedExternalBlocker} onSelectBlocker={label => setSelectedExternalBlocker(current => current === label ? null : label)} />
        {undoAction ? <div className="flex items-center justify-between gap-2 rounded-sm border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-900"><span>Alteração recente guardada. Pode desfazer durante alguns segundos.</span><Button variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={undoInlineUpdate} disabled={updateInline.isPending}><Undo2 className="mr-1 h-3 w-3" /> Desfazer</Button></div> : null}
        <PgcaV2StagingPanel />
        <NormativeConfirmationDashboard />
        <IvaNormativeReviewPanel
          organizationId={organizationId}
          readinessResetKey={ivaReadinessResetKey}
        />
        <IvaPdfSimulationPanel
          onResetReadiness={() => setIvaReadinessResetKey(value => value + 1)}
        />
        <PgcEvidenceSubmissionPanel
          organizationId={organizationId}
          companyId={resolvedCompanyId}
          versionId={resolvedVersionId}
          sources={sourcesQuery.data ?? []}
        />
        <PgcMovementSimulatorPanel
          organizationId={organizationId}
          companyId={resolvedCompanyId}
          versionId={resolvedVersionId}
          accounts={accountsQuery.data ?? []}
        />
        {user?.role === "admin" || user?.role === "contabilista" ? (
          <AccountingRuleFormPanel
            organizationId={organizationId}
            companyId={resolvedCompanyId}
            versionId={resolvedVersionId}
            accounts={accountsQuery.data ?? []}
            sources={sourcesQuery.data ?? []}
          />
        ) : null}
        {(user?.role === "admin" ||
          user?.role === "auditor" ||
          user?.role === "contabilista") && (
          <PgcAuditLogPanel
            organizationId={organizationId}
            companyId={resolvedCompanyId}
            canWriteNotes={
              user?.role === "admin" || user?.role === "contabilista"
            }
            canManageAlerts={
              user?.role === "admin" || user?.role === "contabilista"
            }
          />
        )}
        <Tabs defaultValue="plano" className="space-y-3">
          <TabsList className="h-9 rounded-sm border border-[#bfc9d4] bg-[#f8fafc] p-1">
            <TabsTrigger value="plano" className="rounded-sm text-xs">
              Plano de contas
            </TabsTrigger>
            <TabsTrigger value="fontes" className="rounded-sm text-xs">
              Versões e fontes
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="rounded-sm text-xs">
              Auditoria e migração
            </TabsTrigger>
          </TabsList>
          <TabsContent value="plano">
            <Card className="rounded-sm border-[#bfc9d4] shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-[#d9e0e7] px-3 py-2">
                <div>
                  <CardTitle className="text-sm">
                    Contas da versão seleccionada
                  </CardTitle>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    Seleccione contas pendentes para uma revisão humana em lote;
                    cada resultado mantém auditoria própria.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={value => {
                      setStatusFilter(value as typeof statusFilter);
                      setAccountPage(1);
                      setSelectedAccountIds([]);
                    }}
                  >
                    <SelectTrigger
                      aria-label="Filtrar contas por estado"
                      className="h-7 w-40 rounded-sm bg-white text-[11px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos os estados</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmadas</SelectItem>
                      <SelectItem value="PENDING">Pendentes</SelectItem>
                      <SelectItem value="OTHER">Outros estados</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={accountSort} onValueChange={value => { setAccountSort(value as typeof accountSort); setAccountPage(1); }}>
                    <SelectTrigger aria-label="Ordenar contas PGCA" className="h-7 w-36 rounded-sm bg-white text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CODE_ASC">Código crescente</SelectItem>
                      <SelectItem value="CODE_DESC">Código decrescente</SelectItem>
                      <SelectItem value="NAME_ASC">Designação A–Z</SelectItem>
                      <SelectItem value="STATUS">Estado</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2 rounded-sm border border-[#c7d0da] bg-white px-2 py-1 text-[10px] text-slate-600">
                    <input
                      aria-label="Seleccionar todas as contas pendentes visíveis"
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={event =>
                        setSelectedAccountIds(
                          event.target.checked
                            ? selectableAccounts.map(account => account.id)
                            : []
                        )
                      }
                      disabled={!selectableAccounts.length}
                    />{" "}
                    Seleccionar pendentes
                  </div>
                  <Button variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={exportFilteredAccounts} disabled={!filteredAccounts.length || isExportingCsv} title="Exporta as contas filtradas e o resumo das pendências externas para CSV">{isExportingCsv ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> A gerar…</> : "Exportar CSV"}</Button>
                  <div className="relative w-72">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={search}
                      onChange={event => { setSearch(event.target.value); setAccountPage(1); }}
                      placeholder="Pesquisar código, designação, nome ou email"
                      aria-label="Pesquisa global de contas por código, designação, nome ou email"
                      className="h-7 rounded-sm pl-7 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              {selectedAccountIds.length > 0 && (
                <div className="flex flex-wrap items-end gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="text-xs font-semibold text-amber-900">
                    {selectedAccountIds.length} seleccionada(s)
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-amber-800">
                      Decisão
                    </Label>
                    <Select
                      value={batchStatus}
                      onValueChange={value =>
                        setBatchStatus(value as typeof batchStatus)
                      }
                    >
                      <SelectTrigger className="h-7 w-44 rounded-sm bg-white text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFIRMED">Confirmar</SelectItem>
                        <SelectItem value="INVALID">Marcar inválida</SelectItem>
                        <SelectItem value="DUPLICATE">
                          Marcar duplicada
                        </SelectItem>
                        <SelectItem value="MISSING_PARENT">
                          Pai em falta
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-64 flex-1">
                    <Label className="text-[10px] uppercase text-amber-800">
                      Nota comum (obrigatória excepto para confirmação)
                    </Label>
                    <Input
                      value={batchNotes}
                      onChange={event => setBatchNotes(event.target.value)}
                      className="h-7 rounded-sm bg-white text-[11px]"
                      placeholder="Motivo da decisão"
                    />
                  </div>
                  <Button
                    className="h-7 rounded-sm bg-[#1267d6] px-3 text-[11px]"
                    disabled={
                      !organizationId ||
                      !resolvedVersionId ||
                      activeVersion?.status !== "UNDER_REVIEW" ||
                      !primarySourceConfirmed ||
                      reviewAccountsBatch.isPending ||
                      (batchStatus !== "CONFIRMED" && !batchNotes.trim())
                    }
                    onClick={() => {
                      if (!organizationId || !resolvedVersionId) return;
                      if (
                        !window.confirm(
                          `Confirma a decisão em ${selectedAccountIds.length} conta(s)? A operação será auditada por conta e não activará regras de movimentação.`
                        )
                      )
                        return;
                      reviewAccountsBatch.mutate({
                        organizationId,
                        versionId: resolvedVersionId,
                        accountIds: selectedAccountIds,
                        validationStatus: batchStatus,
                        notes: batchNotes.trim() || null,
                      });
                    }}
                  >
                    {reviewAccountsBatch.isPending ? <><Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> A aplicar…</> : "Aplicar revisão"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-7 rounded-sm bg-white px-3 text-[11px]"
                    onClick={() => setSelectedAccountIds([])}
                  >
                    Limpar
                  </Button>
                </div>
              )}
              {!primarySourceConfirmed && selectedAccountIds.length > 0 && (
                <div className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-[10px] text-red-800">
                  A confirmação em lote está bloqueada até existir uma fonte
                  normativa primária confirmada.
                </div>
              )}
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b border-[#e1e7ed] bg-[#fbfcfd] px-3 py-1.5 text-[10px] text-slate-500">
                  <span>{filteredAccounts.length} conta(s) apresentada(s)</span>
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full bg-emerald-500"
                        aria-hidden="true"
                      />{" "}
                      Confirmada
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full bg-amber-500"
                        aria-hidden="true"
                      />{" "}
                      Pendente
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full bg-red-500"
                        aria-hidden="true"
                      />{" "}
                      Outro estado
                    </span>
                  </span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#eef2f6] text-[10px] uppercase tracking-[0.1em] text-slate-500">
                      <tr>
                        <th className="w-8 px-3 py-2">
                          <span className="sr-only">Seleccionar</span>
                        </th>
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Designação</th>
                        <th className="px-3 py-2">Utilizador</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Natureza</th>
                        <th className="px-3 py-2">Lançável</th>
                        <th className="px-3 py-2">Validação</th>
                        <th className="px-3 py-2">Responsável</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAccounts.map(account => (
                        <tr
                          key={account.id}
                          className="border-t border-[#e5e9ee] hover:bg-[#f7fafc]"
                        >
                          <td className="px-3 py-2">
                            <input
                              aria-label={`Seleccionar conta ${account.code}`}
                              type="checkbox"
                              checked={selectedAccountIds.includes(account.id)}
                              onChange={event =>
                                setSelectedAccountIds(current =>
                                  event.target.checked
                                    ? Array.from(
                                        new Set([...current, account.id])
                                      )
                                    : current.filter(id => id !== account.id)
                                )
                              }
                              disabled={
                                account.validationStatus === "CONFIRMED"
                              }
                            />
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold"><button type="button" className="text-left text-[#1267d6] underline-offset-2 hover:underline" onClick={() => { setSelectedAccountId(account.id); setInlineStatus(account.validationStatus); setInlineResponsibleId(account.responsibleUserId ?? null); }}>{account.code}</button>{account.recentActivityAt && Date.now() - new Date(account.recentActivityAt).getTime() < 7 * 24 * 60 * 60 * 1000 ? <Badge className="ml-2 bg-amber-100 px-1 text-[9px] text-amber-800" title={`Alteração recente em ${new Date(account.recentActivityAt).toLocaleString("pt-PT")}`}><MessageSquare className="mr-1 h-2.5 w-2.5" /> Recente</Badge> : null}</td>
                          <td className="px-3 py-2">{account.name}</td>
                          <td className="max-w-48 px-3 py-2 text-[10px] text-slate-600"><div className="truncate">{account.createdByUserName ?? "Utilizador não identificado"}</div><div className="truncate text-[9px] text-slate-400">{account.createdByUserEmail ?? "Email não disponível"}</div></td>
                          <td className="px-3 py-2">
                            {accountTypeLabel[account.accountType] ??
                              account.accountType}
                          </td>
                          <td className="px-3 py-2">
                            {natureLabel[account.nature] ?? account.nature}
                          </td>
                          <td className="px-3 py-2">
                            {account.acceptsEntries ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              "Não"
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <select aria-label={`Editar estado da conta ${account.code}`} className="h-6 rounded-sm border border-slate-300 bg-white px-1 text-[10px]" value={account.validationStatus} disabled={activeVersion?.status !== "UNDER_REVIEW" || updateInline.isPending} onChange={event => { if (!organizationId || !resolvedVersionId) return; setInlineStatus(event.target.value); beginInlineUpdate(account, { validationStatus: event.target.value as "NEEDS_NORMATIVE_VALIDATION" | "CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT" }); }}><option value="NEEDS_NORMATIVE_VALIDATION">Pendente</option><option value="CONFIRMED">Confirmada</option><option value="INVALID">Inválida</option><option value="DUPLICATE">Duplicada</option><option value="MISSING_PARENT">Conta-pai em falta</option></select>
                              <Badge
                                variant="outline"
                                className={`rounded-sm text-[10px] ${pgcAccountStatusClass[account.validationStatus] ?? "border-slate-300 bg-slate-50 text-slate-700"}`}
                              >
                                <span className="mr-1" aria-hidden="true">
                                  {account.validationStatus === "CONFIRMED"
                                    ? "●"
                                    : account.validationStatus ===
                                        "NEEDS_NORMATIVE_VALIDATION"
                                      ? "●"
                                      : "◆"}
                                </span>
                                {pgcAccountStatusLabel[
                                  account.validationStatus
                                ] ??
                                  statusLabel[account.validationStatus] ??
                                  account.validationStatus}
                              </Badge>
                              {account.validationStatus !== "CONFIRMED" && (
                                <Button
                                  variant="outline"
                                  className="h-6 rounded-sm bg-white px-2 text-[10px]"
                                  disabled={
                                    activeVersion?.status !== "UNDER_REVIEW" ||
                                    !primarySourceConfirmed ||
                                    reviewAccount.isPending
                                  }
                                  title={
                                    !primarySourceConfirmed
                                      ? "Confirme primeiro a fonte normativa primária."
                                      : undefined
                                  }
                                  onClick={() =>
                                    organizationId &&
                                    resolvedVersionId &&
                                    reviewAccount.mutate({
                                      organizationId,
                                      versionId: resolvedVersionId,
                                      accountId: account.id,
                                      validationStatus: "CONFIRMED",
                                    })
                                  }
                                >
                                  {primarySourceConfirmed
                                    ? "Confirmar"
                                    : "Fonte pendente"}
                                </Button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2"><Input aria-label={`Editar responsável da conta ${account.code}`} type="number" min="1" className="h-6 w-24 rounded-sm px-1 text-[10px]" value={account.responsibleUserId ?? ""} placeholder="ID" disabled={activeVersion?.status !== "UNDER_REVIEW" || updateInline.isPending} onChange={event => setInlineResponsibleId(event.target.value ? Number(event.target.value) : null)} onBlur={() => { if (!organizationId || !resolvedVersionId || inlineResponsibleId === undefined) return; beginInlineUpdate(account, { responsibleUserId: inlineResponsibleId }); }} /></td>
                        </tr>
                      ))}
                      {!filteredAccounts.length && (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-3 py-10 text-center text-slate-500"
                          >
                            {visibleAccounts.length
                              ? "Nenhuma conta corresponde ao filtro seleccionado."
                              : "Não existem contas carregadas para esta versão."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-[#d9e0e7] bg-[#fbfcfd] px-3 py-2 text-[10px] text-slate-600">
                  <span>Contas {filteredAccounts.length ? (accountPage - 1) * accountsPerPage + 1 : 0}–{Math.min(accountPage * accountsPerPage, filteredAccounts.length)} de {filteredAccounts.length}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => { setAccountPage(page => Math.max(1, page - 1)); setSelectedAccountIds([]); }} disabled={accountPage <= 1}>Anterior</Button>
                    <span aria-live="polite">Página {accountPage} de {accountPageCount}</span>
                    <Button variant="outline" className="h-7 rounded-sm bg-white px-2 text-[10px]" onClick={() => { setAccountPage(page => Math.min(accountPageCount, page + 1)); setSelectedAccountIds([]); }} disabled={accountPage >= accountPageCount}>Seguinte</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="fontes">
            <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
              <Card className="rounded-sm border-[#bfc9d4] shadow-none lg:col-span-2">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-sm">
                    Lote de confirmação humana
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 px-3 pb-3 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <Label className="text-xs">Seleccione o lote a rever</Label>
                    <Select
                      value={selectedBatchId}
                      onValueChange={setSelectedBatchId}
                    >
                      <SelectTrigger className="mt-1 h-8 rounded-sm bg-white text-xs">
                        <SelectValue placeholder="Seleccione um lote PGCA ou IVA" />
                      </SelectTrigger>
                      <SelectContent>
                        {normativeBatches.map(batch => (
                          <SelectItem key={batch.batchId} value={batch.batchId}>
                            {batch.domain} · {batch.scope} · {batch.confirmed}/
                            {batch.count} confirmadas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    {selectedBatch ? (
                      <>
                        <strong className="text-slate-900">
                          {selectedBatch.batchId}
                        </strong>
                        <br />
                        {selectedBatch.count - selectedBatch.confirmed} registos
                        aguardam confirmação visual.
                      </>
                    ) : (
                      <>
                        A selecção é apenas uma fila de trabalho. Nenhum registo
                        é confirmado automaticamente.
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-sm border-[#bfc9d4] shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-sm">
                    Criar versão em rascunho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  <Field
                    label="Código"
                    value={newVersionCode}
                    onChange={setNewVersionCode}
                    placeholder="PGC-ANG-82-01"
                  />
                  <Field
                    label="Nome"
                    value={newVersionName}
                    onChange={setNewVersionName}
                    placeholder="PGC Angola — Decreto 82/01"
                  />
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <textarea
                      value={newVersionDescription}
                      onChange={event =>
                        setNewVersionDescription(event.target.value)
                      }
                      className="mt-1 min-h-20 w-full border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1267d6]"
                      placeholder="Base normativa e âmbito da versão"
                    />
                  </div>
                  <Button
                    onClick={handleCreateVersion}
                    disabled={createVersion.isPending}
                    className="h-8 rounded-sm bg-[#1267d6] text-xs"
                  >
                    <FilePlus2 className="mr-1 h-3.5 w-3.5" /> Criar rascunho
                  </Button>
                </CardContent>
              </Card>
              <Card className="rounded-sm border-[#bfc9d4] shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="text-sm">
                    Governação das versões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {versions.map(version => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div>
                        <p className="font-semibold">
                          {version.code} · {version.name}
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Vigência desde{" "}
                          {new Date(version.effectiveFrom).toLocaleDateString(
                            "pt-PT"
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-sm">
                        {statusLabel[version.status] ?? version.status}
                      </Badge>
                    </div>
                  ))}
                  {!versions.length && (
                    <p className="py-8 text-center text-xs text-slate-500">
                      Ainda não existem versões normativas nesta organização.
                    </p>
                  )}
                  <Separator className="my-3" />
                  <div className="text-xs font-semibold">Fontes normativas</div>
                  {!primarySourceConfirmed && (
                    <p className="mt-1 text-[11px] text-amber-700">
                      Confirme primeiro a fonte normativa primária; só depois
                      poderá confirmar contas PGCA.
                    </p>
                  )}
                  {sourcesQuery.data?.map(source => (
                    <div
                      key={source.id}
                      className="mt-2 border border-slate-200 bg-white px-2 py-1.5 text-[11px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">
                          {source.instrument} n.º{" "}
                          {source.instrumentNumber ?? "—"}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-sm text-[10px]"
                        >
                          {statusLabel[source.verificationStatus] ??
                            source.verificationStatus}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-slate-600">{source.title}</p>
                      <p className="mt-0.5 text-slate-500">
                        {source.article ?? "Artigo não especificado"} · Vigência{" "}
                        {source.effectiveFrom
                          ? new Date(source.effectiveFrom).toLocaleDateString(
                              "pt-PT"
                            )
                          : "por confirmar"}
                      </p>
                      {source.verificationStatus !== "CONFIRMED" && (
                        <Button
                          variant="outline"
                          className="mt-1 h-6 rounded-sm bg-white px-2 text-[10px]"
                          disabled={
                            activeVersion?.status !== "UNDER_REVIEW" ||
                            reviewSource.isPending
                          }
                          onClick={() =>
                            organizationId &&
                            resolvedVersionId &&
                            reviewSource.mutate({
                              organizationId,
                              versionId: resolvedVersionId,
                              sourceId: source.id,
                              verificationStatus: "CONFIRMED",
                            })
                          }
                        >
                          Confirmar fonte
                        </Button>
                      )}
                    </div>
                  ))}
                  {!sourcesQuery.data?.length && (
                    <p className="pt-2 text-[11px] text-slate-500">
                      Ainda não existem fontes registadas para esta versão.
                    </p>
                  )}
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      Regras contabilísticas
                    </span>
                    <Badge variant="outline" className="rounded-sm">
                      {rulesQuery.data?.length ?? 0} activas/configuradas
                    </Badge>
                  </div>
                  {!rulesQuery.data?.length && (
                    <p className="pt-2 text-[11px] text-slate-500">
                      As regras só podem ser criadas depois de as contas PGCA e
                      a fonte normativa serem confirmadas.
                    </p>
                  )}
                  <div className="mt-3 border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        Prontidão para activação
                      </span>
                      <Badge
                        variant="outline"
                        className={`rounded-sm ${readinessQuery.data?.ready ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}`}
                      >
                        {readinessQuery.data?.ready ? "Pronta" : "Bloqueada"}
                      </Badge>
                    </div>
                    {readinessQuery.data && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <span>
                          Contas
                          <br />
                          <strong className="text-slate-900">
                            {readinessQuery.data.confirmedAccountCount}/
                            {readinessQuery.data.accountCount}
                          </strong>
                        </span>
                        <span>
                          Fontes
                          <br />
                          <strong className="text-slate-900">
                            {readinessQuery.data.confirmedSourceCount}/
                            {readinessQuery.data.sourceCount}
                          </strong>
                        </span>
                        <span>
                          Regras
                          <br />
                          <strong className="text-slate-900">
                            {readinessQuery.data.accountingRuleCount}
                          </strong>
                        </span>
                      </div>
                    )}
                    <PgcCoverageSummary
                      coverage={readinessQuery.data?.coverage}
                    />
                    {Boolean(readinessQuery.data?.blockers.length) && (
                      <p className="mt-2 text-[11px] text-amber-700">
                        Bloqueadores:{" "}
                        {readinessQuery.data?.blockers
                          .map(
                            blocker =>
                              readinessBlockerLabel[blocker] ??
                              "Requisito técnico pendente"
                          )
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="auditoria">
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="rounded-sm border-[#bfc9d4] shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-[#1267d6]" />{" "}
                    Execuções de auditoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {(auditsQuery.data ?? []).map(audit => (
                    <div
                      key={audit.id}
                      className="border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Auditoria #{audit.id}
                        </span>
                        <Badge variant="outline" className="rounded-sm">
                          {statusLabel[audit.status] ?? audit.status}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-slate-600">
                        <span>
                          Verificadas
                          <br />
                          <strong className="text-slate-900">
                            {audit.totalChecked}
                          </strong>
                        </span>
                        <span>
                          Válidas
                          <br />
                          <strong className="text-emerald-700">
                            {audit.validCount}
                          </strong>
                        </span>
                        <span>
                          Pendentes
                          <br />
                          <strong className="text-amber-700">
                            {audit.needsValidationCount}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ))}
                  {!auditsQuery.data?.length && (
                    <p className="py-8 text-center text-xs text-slate-500">
                      Execute a auditoria para avaliar as contas legadas.
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-sm border-[#bfc9d4] shadow-none">
                <CardHeader className="px-3 py-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Mapas
                    de migração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-3 pb-3">
                  {(migrationQuery.data ?? []).map(map => (
                    <div
                      key={map.id}
                      className="flex items-center justify-between border border-slate-200 bg-white px-3 py-2 text-xs"
                    >
                      <span>
                        <strong>{map.legacyCode}</strong> →{" "}
                        {map.newCode ?? "Por decidir"}
                        <br />
                        <span className="text-slate-500">{map.reason}</span>
                      </span>
                      <Badge variant="outline" className="rounded-sm">
                        {presentationLabel(map.status)}
                      </Badge>
                    </div>
                  ))}
                  {!migrationQuery.data?.length && (
                    <p className="py-8 text-center text-xs text-slate-500">
                      As decisões de correspondência surgirão aqui após a
                      revisão do contabilista.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        <Sheet open={selectedAccountId !== null} onOpenChange={open => { if (!open) setSelectedAccountId(null); }}>
          <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>Detalhe da conta {selectedAccount?.code ?? ""}</SheetTitle>
              <SheetDescription>{selectedAccount?.name ?? "Conta PGCA"}. O histórico é apenas de leitura e respeita o isolamento da organização.</SheetDescription>
            </SheetHeader>
            {selectedAccount ? <div className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-sm border border-slate-200 bg-slate-50 p-3"><div><span className="text-slate-500">Estado</span><p className="font-semibold">{pgcAccountStatusLabel[selectedAccount.validationStatus] ?? selectedAccount.validationStatus}</p></div><div><span className="text-slate-500">Responsável</span><p className="font-semibold">{selectedAccount.responsibleUserName ?? "Não atribuído"}</p><p className="text-[10px] text-slate-500">{selectedAccount.responsibleUserEmail ?? ""}</p></div><div><span className="text-slate-500">Autoria original</span><p>{selectedAccount.createdByUserName ?? "Não identificado"}</p></div><div><span className="text-slate-500">Natureza</span><p>{natureLabel[selectedAccount.nature] ?? selectedAccount.nature}</p></div></div>
              <div><h3 className="mb-2 flex items-center gap-1 font-semibold text-slate-800"><MessageSquare className="h-3.5 w-3.5" /> Comentários e observações</h3><Textarea value={commentText} onChange={event => setCommentText(event.target.value)} placeholder="Escreva uma observação sobre esta conta…" className="min-h-20 text-xs" maxLength={4000} /><Button className="mt-2 h-8 rounded-sm bg-[#1267d6] text-xs" disabled={!organizationId || !resolvedVersionId || !selectedAccountId || !commentText.trim() || addComment.isPending} onClick={() => organizationId && resolvedVersionId && selectedAccountId && addComment.mutate({ organizationId, versionId: resolvedVersionId, accountId: selectedAccountId, comment: commentText.trim() })}>{addComment.isPending ? "A guardar…" : "Guardar comentário"}</Button></div><div><h3 className="mb-2 font-semibold text-slate-800">Histórico de acções</h3>{accountHistoryQuery.isLoading ? <p className="text-slate-500">A carregar histórico…</p> : accountHistoryQuery.isError ? <p className="text-red-700">Não foi possível carregar o histórico desta conta.</p> : accountHistoryQuery.data?.items.length ? <div className="space-y-2">{accountHistoryQuery.data.items.map(event => <div key={event.id} className="rounded-sm border border-slate-200 bg-white p-2"><div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-800">{presentationLabel(event.action)}</span><span className="text-[10px] text-slate-500">{new Date(event.createdAt).toLocaleString("pt-PT")}</span></div><p className="mt-1 text-[10px] text-slate-500">{event.actor?.name ?? event.actor?.email ?? "Utilizador não identificado"}</p><p className="mt-1 break-words text-[10px] text-slate-600">{event.afterState ?? "Sem detalhe adicional"}</p></div>)}</div> : <p className="text-slate-500">Ainda não existem acções auditadas para esta conta.</p>}</div>
            </div> : null}
          </SheetContent>
        </Sheet>
        <p className="text-[11px] text-slate-500">
          Utilizador: {user?.name ?? "sessão protegida"} · Fonte normativa deve
          ser confirmada por contabilista responsável antes de activar uma
          versão.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-8 rounded-sm text-xs"
      />
    </div>
  );
}
function Metric({
  label,
  value,
  warning,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="border border-slate-200 bg-white px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-lg font-semibold ${warning ? "text-amber-700" : "text-slate-900"}`}
      >
        {value}
      </p>
    </div>
  );
}
