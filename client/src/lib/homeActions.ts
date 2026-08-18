import {
  BookOpenCheck,
  ClipboardCheck,
  LayoutDashboard,
  FileText,
  Plus,
  ShieldAlert,
  WalletCards,
} from "lucide-react";

export const quickActions = [
  ["/", "Minhas Empresas", LayoutDashboard],
  ["/contabilidade", "Contabilidade", BookOpenCheck],
  ["/facturacao", "Facturação", FileText],
  ["/tesouraria", "Tesouraria", WalletCards],
  ["/auditoria", "Auditoria", ShieldAlert],
  ["/facturacao?new=1", "Criar novo documento", Plus],
  ["/fecho?new=checklist", "Executar checklist de fecho", ClipboardCheck],
] as const;

export function resolveNewAction(search: string) {
  const action = new URL(search, "https://balancerts.local").searchParams.get("new");
  return {
    action,
    label:
      action === "1"
        ? "Criar novo documento"
        : action === "checklist"
            ? "Executar checklist de fecho"
            : null,
  };
}

export function getActionPresentation(search: string, completed = false) {
  const { action, label } = resolveNewAction(search);
  if (!label) return { action, label: null, cta: null, feedback: null };
  return {
    action,
    label,
    cta: action === "1" ? "Abrir formulário" : "Abrir checklist",
    feedback: completed ? "Fluxo iniciado" : null,
  };
}

export function getQuickActions(query: string) {
  return quickActions.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));
}

export type ActiveCompanyCandidate = { id: number; name: string; nif: string };

export function isDisposableCompany(row?: Pick<ActiveCompanyCandidate, "name" | "nif">) {
  return Boolean(row && (row.name.toLowerCase().includes("disposable") || row.nif === "999999990"));
}

export function resolveActiveCompanyId(rows: ActiveCompanyCandidate[], currentId?: number, manuallySelected = false) {
  if (!rows.length) return undefined;
  const active = rows.find((row) => row.id === currentId);
  if (active && (!isDisposableCompany(active) || manuallySelected)) return active.id;
  return rows.find((row) => row.nif === "5001121871")?.id ?? rows.find((row) => !isDisposableCompany(row))?.id ?? rows[0].id;
}
