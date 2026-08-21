import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Building2, Database, FlaskConical, GitCompareArrows, Plus, RefreshCw, ShieldCheck } from "lucide-react";

const studyStatusLabel = (status: string) => status === "DRAFT" ? "Rascunho" : status === "ACTIVE" ? "Activo" : "Arquivado";
const versionStatusLabel = (status: string) => status === "APPROVED" ? "Aprovada" : status === "IN_REVIEW" ? "Em revisão" : status === "ARCHIVED" ? "Arquivada" : "Rascunho";
const snapshotStatusLabel = (status: string) => status === "READY" ? "Pronto" : status === "STALE" ? "Desactualizado" : "Inválido";
const companyDisplayName = (name: string) => name.replace(/BALANCERTS Test Tenant - Disposable/gi, "BALANCERTS — Empresa de teste").replace(/tenant/gi, "organização").replace(/disposable/gi, "teste");

export default function Saadi() {
  const { user } = useAuth();
  const companies = trpc.companies.list.useQuery();
  const rows = [...(companies.data ?? [])].sort((left, right) => (left.company.name.toLowerCase().includes("repair lubatec") ? -1 : right.company.name.toLowerCase().includes("repair lubatec") ? 1 : 0));
  const [companyId, setCompanyId] = useState<number | undefined>();
  const [studyId, setStudyId] = useState<number | undefined>();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [investmentDomain, setInvestmentDomain] = useState<"IMOBILIARIO" | "AGRICULTURA" | "INDUSTRIA" | "ENERGIA" | "HOTELARIA" | "LOGISTICA" | "OUTRO">("OUTRO");
  const selected = rows.find(({ company }) => company.id === companyId) ?? rows[0];
  const activeCompanyId = selected?.company.id;
  const organizationId = selected?.company.organizationId;
  const studies = trpc.saadi.studies.useQuery(
    activeCompanyId && organizationId ? { companyId: activeCompanyId, organizationId } : { companyId: 0, organizationId: 0 },
    { enabled: Boolean(activeCompanyId && organizationId) },
  );
  const selectedStudyId = studyId ?? studies.data?.[0]?.id;
  const snapshots = trpc.saadi.snapshots.useQuery(
    activeCompanyId && organizationId ? { companyId: activeCompanyId, organizationId, studyId: selectedStudyId } : { companyId: 0, organizationId: 0, studyId: 0 },
    { enabled: Boolean(activeCompanyId && organizationId) },
  );
  const versions = trpc.saadi.versions.useQuery(
    activeCompanyId && organizationId && selectedStudyId ? { companyId: activeCompanyId, organizationId, studyId: selectedStudyId } : { companyId: 0, organizationId: 0, studyId: 0 },
    { enabled: Boolean(activeCompanyId && organizationId && selectedStudyId) },
  );
  const selectedSnapshotId = snapshots.data?.[0]?.id;
  const [periodId, setPeriodId] = useState("1");
  const [varianceMetric, setVarianceMetric] = useState("resultadoLiquidoRealizado");
  const [projectedValue, setProjectedValue] = useState("0");
  const [riskTitle, setRiskTitle] = useState("");
  const [riskDescription, setRiskDescription] = useState("");
  const [riskProbability, setRiskProbability] = useState("3");
  const [riskImpact, setRiskImpact] = useState("3");
  const [riskResponse, setRiskResponse] = useState<"EVITAR" | "REDUZIR" | "TRANSFERIR" | "ACEITAR">("REDUZIR");
  const feasibility = trpc.saadi.feasibility.useQuery(activeCompanyId && organizationId && selectedStudyId ? { organizationId, companyId: activeCompanyId, studyId: selectedStudyId } : { organizationId: 0, companyId: 0, studyId: 0 }, { enabled: Boolean(activeCompanyId && organizationId && selectedStudyId) });
  const [initialInvestment, setInitialInvestment] = useState("1000000");
  const [discountRate, setDiscountRate] = useState("0.15");
  const [cashFlows, setCashFlows] = useState("300000,350000,400000,450000,500000");
  const [scenarioName, setScenarioName] = useState("Cenário base");
  const saveFeasibility = trpc.saadi.saveFeasibilityInput.useMutation({ onSuccess: async () => { await feasibility.refetch(); } });
  const calculateFeasibility = trpc.saadi.calculateFeasibility.useMutation({ onSuccess: async () => { await feasibility.refetch(); } });
  const scenarios = trpc.saadi.scenarios.useQuery(activeCompanyId && organizationId && selectedStudyId ? { organizationId, companyId: activeCompanyId, studyId: selectedStudyId } : { organizationId: 0, companyId: 0, studyId: 0 }, { enabled: Boolean(activeCompanyId && organizationId && selectedStudyId) });
  const saveScenario = trpc.saadi.saveScenario.useMutation({ onSuccess: async () => { await scenarios.refetch(); } });
  const captureErpSnapshot = trpc.saadi.captureErpAccountingSnapshot.useMutation({ onSuccess: async () => { await snapshots.refetch(); } });
  const variances = trpc.saadi.variances.useQuery(activeCompanyId && organizationId && selectedStudyId ? { organizationId, companyId: activeCompanyId, studyId: selectedStudyId, snapshotId: selectedSnapshotId } : { organizationId: 0, companyId: 0, studyId: 0 }, { enabled: Boolean(activeCompanyId && organizationId && selectedStudyId) });
  const compareVariance = trpc.saadi.compareProjectionToRealized.useMutation({ onSuccess: async () => { await variances.refetch(); } });
  const risks = trpc.saadi.risks.useQuery(activeCompanyId && organizationId && selectedStudyId ? { organizationId, companyId: activeCompanyId, studyId: selectedStudyId } : { organizationId: 0, companyId: 0, studyId: 0 }, { enabled: Boolean(activeCompanyId && organizationId && selectedStudyId) });
  const createRisk = trpc.saadi.createRisk.useMutation({ onSuccess: async () => { setRiskTitle(""); setRiskDescription(""); await risks.refetch(); } });
  const provenance = trpc.saadi.provenance.useQuery(
    activeCompanyId && organizationId && selectedSnapshotId ? { companyId: activeCompanyId, organizationId, snapshotId: selectedSnapshotId } : { companyId: 0, organizationId: 0, snapshotId: 0 },
    { enabled: Boolean(activeCompanyId && organizationId && selectedSnapshotId) },
  );
  const utils = trpc.useUtils();
  const createStudy = trpc.saadi.createStudy.useMutation({
    onSuccess: async () => { setCode(""); setName(""); await utils.saadi.studies.invalidate(); },
  });
  const transitionVersion = trpc.saadi.transitionVersion.useMutation({ onSuccess: async () => { await versions.refetch(); } });
  const statusText = useMemo(() => {
    if (companies.isLoading) return "A carregar empresas autorizadas…";
    if (!rows.length) return "Não existem empresas autorizadas para o utilizador actual.";
    return `${rows.length} empresa${rows.length === 1 ? "" : "s"} disponível${rows.length === 1 ? "" : "eis"}.`;
  }, [companies.isLoading, rows.length]);

  return (
    <div className="space-y-4 p-4 text-[#1d2a38]">
      <div className="flex items-start justify-between gap-3 border-b border-[#dbe5f1] pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#477514]">Sistema autónomo de análise</p>
          <h1 className="mt-1 flex items-center gap-2 text-xl font-semibold text-[#102a43]"><FlaskConical className="h-5 w-5 text-[#1267d6]" /> SAADI</h1>
          <p className="mt-1 text-xs text-slate-500">Estudos e projecções com dados capturados do BALANCERTS.ERP, sem alterar os registos operacionais.</p>
        </div>
        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Escopo protegido</Badge>
      </div>

      <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
        <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Building2 className="h-4 w-4 text-[#1267d6]" /> Contexto da análise</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="saadi-company">Empresa de trabalho</Label>
          <select id="saadi-company" aria-label="Empresa de trabalho SAADI" value={activeCompanyId ?? ""} onChange={(event) => { setCompanyId(Number(event.target.value)); setStudyId(undefined); }} className="h-9 w-full max-w-xl rounded-md border border-[#dbe5f1] bg-white px-2 text-xs">
            <option value="">Seleccionar empresa</option>
            {rows.map(({ company }) => <option key={company.id} value={company.id}>{companyDisplayName(company.name)} · {company.nif}</option>)}
          </select>
          <p className="text-xs text-slate-500">{statusText}{user?.name ? ` Utilizador: ${user.name}.` : ""}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Novo estudo</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (!activeCompanyId || !organizationId || !code.trim() || !name.trim()) return; createStudy.mutate({ companyId: activeCompanyId, organizationId, studyCode: code, name, investmentDomain, baseCurrency: selected?.company.functionalCurrency ?? "AOA" }); }}>
              <Input aria-label="Código do estudo" placeholder="Código, por exemplo INV-001" value={code} onChange={(event) => setCode(event.target.value)} />
              <Input aria-label="Nome do estudo" placeholder="Nome do estudo" value={name} onChange={(event) => setName(event.target.value)} />
              <select aria-label="Domínio do investimento" value={investmentDomain} onChange={(event) => setInvestmentDomain(event.target.value as typeof investmentDomain)} className="h-9 w-full rounded-md border border-[#dbe5f1] bg-white px-2 text-xs"><option value="OUTRO">Outro investimento</option><option value="IMOBILIARIO">Imobiliário</option><option value="AGRICULTURA">Agricultura</option><option value="INDUSTRIA">Indústria</option><option value="ENERGIA">Energia</option><option value="HOTELARIA">Hotelaria</option><option value="LOGISTICA">Logística</option></select>
              <Button type="submit" disabled={!activeCompanyId || !code.trim() || !name.trim() || createStudy.isPending} className="w-full bg-[#1267d6]"><Plus className="mr-1 h-4 w-4" />{createStudy.isPending ? "A registar…" : "Criar estudo"}</Button>
              {createStudy.error && <p role="alert" className="text-xs text-rose-700">Não foi possível criar o estudo. Verifique os dados e as permissões da empresa.</p>}
              {createStudy.isSuccess && <p role="status" className="text-xs text-emerald-700">Estudo criado e pronto para configuração.</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm text-[#102a43]">Estudos da empresa</CardTitle><Button type="button" size="sm" variant="outline" onClick={() => studies.refetch()} disabled={studies.isFetching}><RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualizar</Button></CardHeader>
          <CardContent>
            {studies.isLoading ? <p className="text-xs text-slate-500">A carregar estudos…</p> : studies.error ? <p className="text-xs text-rose-700">Não foi possível carregar os estudos. Verifique as permissões da empresa.</p> : !activeCompanyId ? <p className="text-xs text-slate-500">Seleccione uma empresa para consultar o seu contexto SAADI.</p> : !(studies.data ?? []).length ? <p className="text-xs text-slate-500">Ainda não existem estudos nesta empresa.</p> : <div className="space-y-2">{(studies.data ?? []).map((study) => <button type="button" key={study.id} onClick={() => setStudyId(study.id)} className={`flex w-full items-center justify-between rounded border px-3 py-2 text-left ${selectedStudyId === study.id ? "border-[#1267d6] bg-[#eef5ff]" : "border-[#dbe5f1] bg-white"}`}><div><p className="text-xs font-semibold text-[#102a43]">{study.name}</p><p className="text-[11px] text-slate-500">{study.studyCode} · {study.baseCurrency} · {study.investmentDomain === "IMOBILIARIO" ? "Imobiliário" : study.investmentDomain === "AGRICULTURA" ? "Agricultura" : study.investmentDomain === "INDUSTRIA" ? "Indústria" : study.investmentDomain === "ENERGIA" ? "Energia" : study.investmentDomain === "HOTELARIA" ? "Hotelaria" : study.investmentDomain === "LOGISTICA" ? "Logística" : "Outro investimento"}</p></div><Badge variant="outline">{studyStatusLabel(study.status)}</Badge></button>)}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Capturas de dados</CardTitle></CardHeader>
          <CardContent>{snapshots.isLoading ? <p className="text-xs text-slate-500">A carregar capturas…</p> : !(snapshots.data ?? []).length ? <p className="text-xs text-slate-500">Sem capturas para o estudo seleccionado.</p> : <div className="space-y-2">{(snapshots.data ?? []).map((snapshot) => <div key={snapshot.id} className="rounded border border-[#dbe5f1] bg-white p-2"><div className="flex justify-between text-xs"><span className="font-semibold text-[#102a43]">{snapshotStatusLabel(snapshot.status)}</span><span className="text-slate-500">{snapshot.sourceFingerprint.slice(0, 12)}…</span></div><p className="mt-1 text-[11px] text-slate-500">Chave de repetição segura: {snapshot.idempotencyKey}</p></div>)}</div>}</CardContent>
        </Card>

        <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Versões e origem dos dados</CardTitle></CardHeader>
          <CardContent>{versions.isLoading ? <p className="text-xs text-slate-500">A carregar versões…</p> : !(versions.data ?? []).length ? <p className="text-xs text-slate-500">Sem versões criadas para o estudo seleccionado.</p> : <div className="space-y-2">{(versions.data ?? []).map((version) => <div key={version.id} className="rounded border border-[#dbe5f1] bg-white p-2"><div className="flex justify-between gap-2 text-xs"><span className="font-semibold text-[#102a43]">Versão {version.versionNumber}</span><Badge variant="outline">{versionStatusLabel(version.status)}</Badge></div><p className="mt-1 text-[11px] text-slate-500">Integridade: {version.versionHash.slice(0, 16)}… · Criada por {version.createdBy}</p><div className="mt-2 flex gap-2">{version.status === "IN_REVIEW" && <Button type="button" size="sm" className="bg-[#477514]" disabled={transitionVersion.isPending} onClick={() => activeCompanyId && organizationId && transitionVersion.mutate({ organizationId, companyId: activeCompanyId, versionId: version.id, decision: "APPROVE" })}>Aprovar</Button>}{version.status !== "ARCHIVED" && <Button type="button" size="sm" variant="outline" disabled={transitionVersion.isPending} onClick={() => activeCompanyId && organizationId && transitionVersion.mutate({ organizationId, companyId: activeCompanyId, versionId: version.id, decision: "ARCHIVE" })}>Arquivar</Button>}</div></div>)}</div>}{selectedSnapshotId && <p className="mt-2 text-[11px] text-slate-500">{provenance.isLoading ? "A carregar origem da captura…" : provenance.data?.length ? `${provenance.data.length} registo${provenance.data.length === 1 ? "" : "s"} de origem associado${provenance.data.length === 1 ? "" : "s"}.` : "A captura ainda não tem detalhes de origem registados."}</p>}</CardContent>
        </Card>
      </div>
      <Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-[#102a43]">Estudo de Viabilidade — análise financeira</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!selectedStudyId ? <p className="text-xs text-slate-500">Crie ou seleccione um estudo para iniciar a análise financeira.</p> : <>
            <div className="grid gap-3 md:grid-cols-3">
              <div><Label htmlFor="saadi-investment">Investimento inicial</Label><Input id="saadi-investment" type="number" min="0" step="0.01" value={initialInvestment} onChange={(event) => setInitialInvestment(event.target.value)} /></div>
              <div><Label htmlFor="saadi-rate">Taxa de desconto anual</Label><Input id="saadi-rate" type="number" min="-0.99" max="10" step="0.01" value={discountRate} onChange={(event) => setDiscountRate(event.target.value)} /><p className="mt-1 text-[11px] text-slate-500">Use 0,15 para 15%.</p></div>
              <div><Label htmlFor="saadi-cashflows">Fluxos de caixa anuais</Label><Input id="saadi-cashflows" value={cashFlows} onChange={(event) => setCashFlows(event.target.value)} placeholder="300000,350000,400000" /></div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="bg-[#1267d6]" disabled={saveFeasibility.isPending || !activeCompanyId || !organizationId} onClick={() => { const flows = cashFlows.split(",").map((value) => Number(value.trim())); if (activeCompanyId && organizationId && selectedStudyId) saveFeasibility.mutate({ organizationId, companyId: activeCompanyId, studyId: selectedStudyId, feasibility: { initialInvestment: Number(initialInvestment), discountRate: Number(discountRate), cashFlows: flows, currency: selected?.company.functionalCurrency ?? "AOA" } }); }}>Guardar premissas</Button>
              <Button type="button" variant="outline" disabled={calculateFeasibility.isPending || !feasibility.data?.input} onClick={() => { if (activeCompanyId && organizationId && selectedStudyId) calculateFeasibility.mutate({ organizationId, companyId: activeCompanyId, studyId: selectedStudyId }); }}>Calcular viabilidade</Button>
              {saveFeasibility.error && <p role="alert" className="self-center text-xs text-rose-700">Não foi possível guardar as premissas. Verifique os valores.</p>}
              {calculateFeasibility.error && <p role="alert" className="self-center text-xs text-rose-700">Não foi possível calcular. Verifique se existem fluxos válidos.</p>}
              {saveFeasibility.isSuccess && <p role="status" className="self-center text-xs text-emerald-700">Premissas guardadas.</p>}
            </div>
            <div className="flex flex-wrap items-end gap-2 border-t border-[#dbe5f1] pt-3"><div className="min-w-[220px] flex-1"><Label htmlFor="saadi-scenario">Nome do cenário</Label><Input id="saadi-scenario" value={scenarioName} onChange={(event) => setScenarioName(event.target.value)} placeholder="Cenário optimista" /></div><Button type="button" variant="outline" disabled={saveScenario.isPending || !scenarioName.trim()} onClick={() => { const flows = cashFlows.split(",").map((value) => Number(value.trim())); if (activeCompanyId && organizationId && selectedStudyId) saveScenario.mutate({ organizationId, companyId: activeCompanyId, studyId: selectedStudyId, name: scenarioName, feasibility: { initialInvestment: Number(initialInvestment), discountRate: Number(discountRate), cashFlows: flows, currency: selected?.company.functionalCurrency ?? "AOA" } }); }}>Guardar cenário calculado</Button></div>
            {scenarios.data?.length ? <div className="space-y-2"><p className="text-xs font-semibold text-[#102a43]">Cenários guardados</p>{scenarios.data.map((scenario) => <div key={scenario.id} className="flex items-center justify-between rounded border border-[#dbe5f1] bg-white px-3 py-2 text-xs"><span>{scenario.name}</span><span className={scenario.decision === "PROSSEGUIR" ? "font-semibold text-emerald-700" : scenario.decision === "REJEITAR" ? "font-semibold text-rose-700" : "font-semibold text-amber-700"}>{scenario.decision === "PROSSEGUIR" ? "Prosseguir" : scenario.decision === "REJEITAR" ? "Rejeitar" : "Rever"}</span></div>)}</div> : null}
            <div className="rounded border border-[#dbe5f1] bg-[#f6faff] p-3">
              <div className="flex items-center gap-2"><Database className="h-4 w-4 text-[#1267d6]" /><p className="text-xs font-semibold text-[#102a43]">Dados realizados do BALANCERTS.ERP</p></div>
              <p className="mt-1 text-[11px] text-slate-500">Captura somente de leitura. Os movimentos contabilísticos do ERP não serão alterados.</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div><Label htmlFor="saadi-period">Período contabilístico</Label><Input id="saadi-period" type="number" min="1" value={periodId} onChange={(event) => setPeriodId(event.target.value)} className="w-32" /></div>
                <Button type="button" variant="outline" disabled={captureErpSnapshot.isPending || !activeCompanyId || !organizationId || !selectedStudyId} onClick={() => { if (activeCompanyId && organizationId && selectedStudyId) captureErpSnapshot.mutate({ studyId: selectedStudyId, request: { organizationId, companyId: activeCompanyId, periodIds: [Number(periodId)], currency: selected?.company.functionalCurrency ?? "AOA", purpose: "Análise do realizado contabilístico", contractVersion: "v1.0", correlationId: `erp-accounting-${selectedStudyId}-${periodId}`, includeHrDetails: false } }); }}><Database className="mr-1 h-3.5 w-3.5" />{captureErpSnapshot.isPending ? "A capturar…" : "Capturar realizado"}</Button>
                {captureErpSnapshot.isSuccess && <span className="text-[11px] text-emerald-700">Captura concluída com proveniência.</span>}
                {captureErpSnapshot.error && <span role="alert" className="text-[11px] text-rose-700">Não foi possível capturar o período seleccionado.</span>}
              </div>
            </div>
            <div className="rounded border border-[#dbe5f1] bg-white p-3">
              <div className="flex items-center gap-2"><GitCompareArrows className="h-4 w-4 text-[#1267d6]" /><p className="text-xs font-semibold text-[#102a43]">Projectado versus realizado</p></div>
              <p className="mt-1 text-[11px] text-slate-500">Compare um valor projectado com uma métrica realizada proveniente da captura ERP.</p>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <div className="min-w-[190px]"><Label htmlFor="saadi-variance-metric">Métrica realizada</Label><select id="saadi-variance-metric" value={varianceMetric} onChange={(event) => setVarianceMetric(event.target.value)} className="h-9 w-full rounded-md border border-[#dbe5f1] bg-white px-2 text-xs"><option value="resultadoLiquidoRealizado">Resultado líquido realizado</option><option value="receitaRealizada">Receita realizada</option><option value="despesasRealizadas">Despesas realizadas</option></select></div>
                <div><Label htmlFor="saadi-projected-value">Valor projectado</Label><Input id="saadi-projected-value" type="number" step="0.01" value={projectedValue} onChange={(event) => setProjectedValue(event.target.value)} className="w-36" /></div>
                <Button type="button" variant="outline" disabled={compareVariance.isPending || !selectedSnapshotId} onClick={() => { if (activeCompanyId && organizationId && selectedStudyId && selectedSnapshotId) compareVariance.mutate({ organizationId, companyId: activeCompanyId, studyId: selectedStudyId, snapshotId: selectedSnapshotId, metric: varianceMetric, projectedValue: Number(projectedValue), currency: selected?.company.functionalCurrency ?? "AOA" }); }}><GitCompareArrows className="mr-1 h-3.5 w-3.5" />{compareVariance.isPending ? "A comparar…" : "Calcular desvio"}</Button>
              </div>
              {variances.data?.length ? <div className="mt-3 space-y-1">{variances.data.map((variance) => <div key={variance.id} className="flex flex-wrap items-center justify-between rounded bg-[#f8fafc] px-2 py-1 text-[11px]"><span>{variance.metric === "resultadoLiquidoRealizado" ? "Resultado líquido" : variance.metric === "receitaRealizada" ? "Receita" : "Despesas"}</span><span>Projectado: {Number(variance.projectedValue).toLocaleString("pt-PT")} · Realizado: {Number(variance.realizedValue).toLocaleString("pt-PT")} · Desvio: {Number(variance.absoluteVariance).toLocaleString("pt-PT")}</span></div>)}</div> : <p className="mt-2 text-[11px] text-slate-500">Ainda não existem desvios calculados para esta captura.</p>}
              {compareVariance.error && <p role="alert" className="mt-2 text-[11px] text-rose-700">Não foi possível calcular o desvio. Capture primeiro os dados realizados.</p>}
            </div>
            <div className="rounded border border-[#dbe5f1] bg-white p-3">
              <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /><p className="text-xs font-semibold text-[#102a43]">Riscos do investimento</p></div>
              <p className="mt-1 text-[11px] text-slate-500">Registe probabilidade e impacto numa escala de 1 a 5. A exposição é calculada pelo servidor.</p>
              <div className="mt-3 grid gap-2 md:grid-cols-4"><Input aria-label="Título do risco" placeholder="Título do risco" value={riskTitle} onChange={(event) => setRiskTitle(event.target.value)} /><Input aria-label="Descrição do risco" placeholder="Descrição e impacto esperado" value={riskDescription} onChange={(event) => setRiskDescription(event.target.value)} /><Input aria-label="Probabilidade do risco" type="number" min="1" max="5" value={riskProbability} onChange={(event) => setRiskProbability(event.target.value)} /><Input aria-label="Impacto do risco" type="number" min="1" max="5" value={riskImpact} onChange={(event) => setRiskImpact(event.target.value)} /></div>
              <div className="mt-2 flex flex-wrap items-center gap-2"><select aria-label="Resposta ao risco" value={riskResponse} onChange={(event) => setRiskResponse(event.target.value as typeof riskResponse)} className="h-9 rounded-md border border-[#dbe5f1] bg-white px-2 text-xs"><option value="REDUZIR">Reduzir</option><option value="EVITAR">Evitar</option><option value="TRANSFERIR">Transferir</option><option value="ACEITAR">Aceitar</option></select><Button type="button" variant="outline" disabled={createRisk.isPending || !riskTitle.trim() || !riskDescription.trim()} onClick={() => { if (activeCompanyId && organizationId && selectedStudyId) createRisk.mutate({ organizationId, companyId: activeCompanyId, studyId: selectedStudyId, title: riskTitle, description: riskDescription, probability: Number(riskProbability), impact: Number(riskImpact), response: riskResponse }); }}><AlertTriangle className="mr-1 h-3.5 w-3.5" />{createRisk.isPending ? "A registar…" : "Registar risco"}</Button>{createRisk.isSuccess && <span className="text-[11px] text-emerald-700">Risco registado.</span>}{createRisk.error && <span role="alert" className="text-[11px] text-rose-700">Não foi possível registar o risco.</span>}</div>
              {risks.data?.length ? <div className="mt-3 space-y-1">{risks.data.map((risk) => <div key={risk.id} className="flex flex-wrap items-center justify-between rounded bg-[#f8fafc] px-2 py-1 text-[11px]"><span className="font-medium">{risk.title}</span><span>Exposição {risk.exposure} · {risk.exposure >= 20 ? "Crítico" : risk.exposure >= 12 ? "Alto" : risk.exposure >= 6 ? "Moderado" : "Baixo"} · {risk.response === "REDUZIR" ? "Reduzir" : risk.response === "EVITAR" ? "Evitar" : risk.response === "TRANSFERIR" ? "Transferir" : "Aceitar"}</span></div>)}</div> : <p className="mt-2 text-[11px] text-slate-500">Ainda não existem riscos registados para este estudo.</p>}
            </div>
            {feasibility.data?.result ? <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded border border-[#dbe5f1] bg-white p-3"><p className="text-[11px] text-slate-500">Valor presente líquido</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{feasibility.data.result.npv.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} {feasibility.data.input?.currency}</p></div>
              <div className="rounded border border-[#dbe5f1] bg-white p-3"><p className="text-[11px] text-slate-500">Taxa interna de rentabilidade</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{feasibility.data.result.irr === null ? "—" : `${(feasibility.data.result.irr * 100).toFixed(2)}%`}</p></div>
              <div className="rounded border border-[#dbe5f1] bg-white p-3"><p className="text-[11px] text-slate-500">Prazo de retorno</p><p className="mt-1 text-lg font-semibold text-[#102a43]">{feasibility.data.result.paybackMonths === null ? "Não recuperado" : `${feasibility.data.result.paybackMonths.toFixed(1)} períodos`}</p></div>
              <div className="rounded border border-[#dbe5f1] bg-white p-3"><p className="text-[11px] text-slate-500">Decisão analítica</p><p className={`mt-1 text-lg font-semibold ${feasibility.data.result.decision === "PROSSEGUIR" ? "text-emerald-700" : feasibility.data.result.decision === "REJEITAR" ? "text-rose-700" : "text-amber-700"}`}>{feasibility.data.result.decision === "PROSSEGUIR" ? "Prosseguir" : feasibility.data.result.decision === "REJEITAR" ? "Rejeitar" : "Rever"}</p></div>
            </div> : <p className="text-xs text-slate-500">Ainda não existe resultado calculado para este estudo.</p>}
          </>}
        </CardContent>
      </Card>
    </div>
  );
}
