import React from "react";
import { CircleAlert, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleContextBarProps = {
  company?: {
    name: string;
    nif: string;
    configurationStatus: "PENDING" | "READY" | "BLOCKED";
  };
};

export function ModuleContextBar({ company }: ModuleContextBarProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2 rounded-xl border px-4 py-2.5 text-xs",
        company ? "border-[#cfe0f5] bg-[#f3f8ff] text-[#305b88]" : "border-amber-200 bg-amber-50 text-amber-800",
      )}
    >
      {company ? (
        <>
          <span className="h-2 w-2 rounded-full bg-[#79c324]" />
          <span className="min-w-0 font-semibold text-[#102a43]">Empresa activa: {company.name}</span>
          <span>· NIF {company.nif}</span>
          <span>· {company.configurationStatus === "READY" ? "operacional" : "configuração pendente"}</span>
          <span className="w-full font-semibold text-[#1267d6] sm:ml-auto sm:w-auto sm:text-right">Todas as operações deste módulo aplicam-se a esta empresa</span>
        </>
      ) : (
        <>
          <CircleAlert className="h-3.5 w-3.5" />
          <span>Seleccione uma empresa activa para continuar.</span>
        </>
      )}
    </div>
  );
}

type ModuleSecurityNoticeProps = {
  requirement?: string;
};

export function ModuleSecurityNotice({ requirement = "BAL-REQ-ACC-001" }: ModuleSecurityNoticeProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#cfe0f5] bg-[#f3f8ff] px-4 py-3 text-xs text-[#305b88]">
      <LockKeyhole className="h-4 w-4 shrink-0 text-[#1267d6]" />
      <span>As operações críticas são validadas no servidor, protegidas por idempotência e registadas no trilho de auditoria.</span>
      <span className="ml-auto hidden font-semibold text-[#1267d6] sm:block">{requirement}</span>
    </div>
  );
}
