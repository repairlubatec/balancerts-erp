import React from "react";
import { BookOpenCheck, ChevronRight, FileCog, Landmark, LockKeyhole, Settings2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { presentationLabel } from "@/lib/presentationLabels";

type Props = { companyId?: number; companyName?: string };

type Destination = { label: string; description: string; path: string; icon: React.ElementType };

export function DefinitionsPanel({ companyId, companyName }: Props) {
  const [, setLocation] = useLocation();
  const api = trpc as typeof trpc & { normative?: typeof trpc.normative; documents?: typeof trpc.documents & { seriesList?: { useQuery: typeof trpc.documents.list.useQuery } } };
  const coverage = api.normative?.coverage?.useQuery ? api.normative.coverage.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) }) : { data: undefined, isLoading: false };
  const agt = api.normative?.agtConfig?.useQuery ? api.normative.agtConfig.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) }) : { data: undefined, isLoading: false };
  const series = api.documents?.seriesList?.useQuery?.({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const destinations: Destination[] = [
    { label: "Empresas e períodos", description: "Representantes, exercícios, períodos e empresa activa", path: "/empresas", icon: Landmark },
    { label: "Séries documentais", description: "Tipos, séries e numeração sequencial por empresa", path: "/facturacao", icon: FileCog },
    { label: "Normas fiscais", description: "Regimes de IVA, vigência e evidência normativa", path: "/fiscalidade", icon: BookOpenCheck },
    { label: "Auditoria e permissões", description: "Acesso por função e trilho de negócio", path: "/auditoria", icon: LockKeyhole },
  ];
  if (!companyId) return <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4 text-xs text-amber-900">Seleccione uma empresa activa para consultar as definições operacionais.</CardContent></Card>;
  const coverageItems = Array.isArray(coverage.data) ? coverage.data : [];
  const agtConfig = agt.data?.[0]?.config;
  return <div className="space-y-3"><Card className="rounded-sm border-[#b9d2ef] bg-[#f8fbff] shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Settings2 className="h-4 w-4 text-[#1267d6]" /> Definições operacionais</CardTitle><p className="text-xs text-slate-500">Configuração controlada da empresa activa{companyName ? ` · ${companyName}` : ""}. Cada alteração abre o posto persistente correspondente.</p></CardHeader><CardContent className="grid gap-2 md:grid-cols-2">{destinations.map(({ label, description, path, icon: Icon }) => <button key={path} type="button" onClick={() => setLocation(path)} className="flex items-center gap-3 rounded border border-[#d5dde6] bg-white px-3 py-3 text-left transition-colors hover:border-[#1267d6] hover:bg-[#f4f8fd] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1267d6]"><span className="flex h-8 w-8 items-center justify-center rounded bg-[#edf5ff] text-[#1267d6]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block text-xs text-[#1d2a38]">{label}</strong><span className="mt-0.5 block text-[11px] text-[#687787]">{description}</span></span><ChevronRight className="h-4 w-4 text-[#1267d6]" /></button>)}</CardContent></Card><div className="grid gap-3 md:grid-cols-3"><Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><BookOpenCheck className="h-4 w-4 text-[#1267d6]" /> Cobertura normativa</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-[#102a43]">{coverage.isLoading ? "…" : coverageItems.length}</p><p className="text-xs text-slate-500">verificações parametrizadas disponíveis</p></CardContent></Card><Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><Landmark className="h-4 w-4 text-[#1267d6]" /> Integração AGT</CardTitle></CardHeader><CardContent><Badge className="border-amber-200 bg-amber-50 text-amber-800">{agt.isLoading ? "A consultar" : agtConfig ? presentationLabel(agtConfig.homologationStatus ?? "INTERNAL_READY") : "Não configurada"}</Badge><p className="mt-2 text-xs text-slate-500">Preparada localmente; não há comunicação externa activa.</p></CardContent></Card><Card className="rounded-sm border-[#bfc9d4] bg-[#fbfcfd] shadow-none"><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm text-[#102a43]"><ShieldCheck className="h-4 w-4 text-[#477514]" /> Séries documentais</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-[#102a43]">{series?.isLoading ? "…" : series?.data?.length ?? 0}</p><p className="text-xs text-slate-500">séries persistentes desta empresa</p></CardContent></Card></div></div>;
}
