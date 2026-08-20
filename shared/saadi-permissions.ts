import { z } from "zod";

export const saadiPermissionSchema = z.enum([
  "saadi.project.read",
  "saadi.project.manage",
  "saadi.study.read",
  "saadi.study.manage",
  "saadi.snapshot.read",
  "saadi.snapshot.refresh",
  "saadi.version.approve",
  "saadi.decision.record",
  "saadi.hr.detail.read",
]);

export type SaadiPermission = z.infer<typeof saadiPermissionSchema>;

/**
 * Permissões operacionais que nunca podem ser concedidas por um catálogo SAADI.
 * Esta lista é um contrato de segurança, não uma alteração do RBAC activo.
 */
export const saadiForbiddenOperationalPermissions = [
  "accounting.post",
  "payments.execute",
  "documents.issue",
  "stock.adjust",
  "period.reopen",
  "agt.submit",
] as const;

export type SaadiForbiddenOperationalPermission = (typeof saadiForbiddenOperationalPermissions)[number];

export function isSaadiPermission(value: string): value is SaadiPermission {
  return saadiPermissionSchema.safeParse(value).success;
}

export function isForbiddenOperationalPermission(value: string): value is SaadiForbiddenOperationalPermission {
  return (saadiForbiddenOperationalPermissions as readonly string[]).includes(value);
}
