export type BalancertsRole = "admin" | "contabilista" | "financeiro" | "operador" | "auditor" | "user";
export type Permission = "read" | "create" | "validate" | "issue" | "post" | "close" | "reopen" | "audit";

const matrix: Record<BalancertsRole, Partial<Record<string, Permission[]>>> = {
  admin: { "*": ["read", "create", "validate", "issue", "post", "close", "reopen", "audit"] },
  contabilista: { accounting: ["read", "create", "validate", "post"], documents: ["read", "validate", "issue"], fiscal: ["read", "validate"], reports: ["read"], close: ["read", "close", "reopen"] },
  financeiro: { treasury: ["read", "create", "validate"], documents: ["read", "create"], reports: ["read"] },
  operador: { documents: ["read", "create"], stock: ["read", "create"], treasury: ["read"] },
  auditor: { accounting: ["read"], documents: ["read"], fiscal: ["read"], reports: ["read"], audit: ["read", "audit"] },
  user: {},
};

export function can(role: BalancertsRole, module: string, permission: Permission) {
  const allowed = matrix[role]["*"] ?? matrix[role][module] ?? [];
  return allowed.includes(permission);
}
