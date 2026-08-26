import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Rule = {
  id: number;
  operation: string;
  documentType: string | null;
  debitAccountId: number | null;
  creditAccountId: number | null;
  ivaAccountId: number | null;
  priority: number;
  active: number;
  effectiveFrom: Date | string;
  effectiveTo: Date | string | null;
  sourceId: number | null;
};

type Account = { id: number; code: string; name: string };

export function AccountingRuleActivationPanel({
  organizationId,
  versionId,
  versionStatus,
  rules,
  accounts,
}: {
  organizationId?: number;
  versionId?: number;
  versionStatus?: string;
  rules: Rule[];
  accounts: Account[];
}) {
  const utils = trpc.useUtils();
  const activateRule = trpc.pgc.activateAccountingRule.useMutation({
    onSuccess: async () => {
      toast.success("Regra contabilística activada e auditada.");
      await utils.pgc.accountingRules.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const accountLabel = (id: number | null) => {
    const account = accounts.find(item => item.id === id);
    return account ? `${account.code} · ${account.name}` : `Conta #${id ?? "—"}`;
  };
  const pendingRules = rules.filter(rule => rule.active !== 1);
  return (
    <Card className="rounded-sm border-[#bfc9d4] shadow-none">
      <CardHeader className="border-b border-[#d9e0e7] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm">Regras contabilísticas da versão</CardTitle>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Defina primeiro a regra e active-a depois de rever a fonte e as contas.
            </p>
          </div>
          <Badge variant="outline" className="rounded-sm text-[10px]">
            {rules.filter(rule => rule.active === 1).length} activas · {pendingRules.length} em rascunho
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {!rules.length ? (
          <div className="flex items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            <LockKeyhole className="h-3.5 w-3.5" /> Ainda não existem regras definidas para esta versão.
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{rule.operation}{rule.documentType ? ` · ${rule.documentType}` : ""}</div>
                  <div className="truncate text-slate-600">{accountLabel(rule.debitAccountId)} → {accountLabel(rule.creditAccountId)}</div>
                  <div className="text-[10px] text-slate-500">Prioridade {rule.priority} · Vigência desde {new Date(rule.effectiveFrom).toLocaleDateString("pt-PT")}</div>
                </div>
                {rule.active === 1 ? (
                  <Badge className="rounded-sm bg-emerald-100 text-[10px] text-emerald-800"><CheckCircle2 className="mr-1 h-3 w-3" /> Activa</Badge>
                ) : (
                  <Button
                    type="button"
                    className="h-7 rounded-sm bg-[#1267d6] px-2 text-[10px]"
                    disabled={!organizationId || !versionId || versionStatus !== "UNDER_REVIEW" || activateRule.isPending}
                    title={versionStatus !== "UNDER_REVIEW" ? "A versão tem de estar em revisão." : "Revalida a fonte e as contas antes de activar."}
                    onClick={() => {
                      if (!organizationId || !versionId) return;
                      if (!window.confirm("Confirma a activação desta regra contabilística? A operação será auditada.")) return;
                      activateRule.mutate({ organizationId, versionId, ruleId: rule.id });
                    }}
                  >
                    {activateRule.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                    Activar regra
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
        {versionStatus !== "UNDER_REVIEW" && <p className="mt-2 text-[10px] text-amber-700">A activação está bloqueada porque a versão não está em revisão.</p>}
      </CardContent>
    </Card>
  );
}
