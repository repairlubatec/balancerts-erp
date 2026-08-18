import {
  BookOpenCheck,
  Building2,
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
  ["/empresas?focus=5417283901", "Abrir BALANCERTS Serviços", Building2],
  ["/tesouraria?new=reconcile", "Iniciar reconciliação bancária", WalletCards],
  ["/fecho?new=checklist", "Executar checklist de fecho", ClipboardCheck],
] as const;

export function resolveNewAction(search: string) {
  const action = new URL(search, "https://balancerts.local").searchParams.get("new");
  return {
    action,
    label:
      action === "1"
        ? "Criar novo documento"
        : action === "reconcile"
          ? "Iniciar reconciliação bancária"
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
    cta: action === "1" ? "Abrir formulário" : action === "reconcile" ? "Seleccionar movimentos" : "Abrir checklist",
    feedback: completed ? "Fluxo iniciado" : null,
  };
}

export function getQuickActions(query: string) {
  return quickActions.filter(([, label]) => label.toLowerCase().includes(query.toLowerCase()));
}
