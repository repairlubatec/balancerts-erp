export type BalancertsRole = "admin" | "contabilista" | "financeiro" | "operador" | "auditor" | "user";
export type Permission = "read" | "create" | "validate" | "issue" | "post" | "reverse" | "close" | "reopen" | "audit";

const matrix: Record<BalancertsRole, Partial<Record<string, Permission[]>>> = {
  admin: { "*": ["read", "create", "validate", "issue", "post", "reverse", "close", "reopen", "audit"] },
  contabilista: { companies: ["read"], accounting: ["read", "create", "validate", "post", "reverse"], documents: ["read", "validate", "issue"], fiscal: ["read", "validate"], stock: ["read", "create", "validate"], reports: ["read"], close: ["read", "close", "reopen"] },
  financeiro: { companies: ["read"], treasury: ["read", "create", "validate"], documents: ["read", "create"], reports: ["read"] },
  operador: { companies: ["read"], documents: ["read", "create"], stock: ["read", "create"], treasury: ["read"] },
  auditor: { companies: ["read"], accounting: ["read"], documents: ["read"], fiscal: ["read"], reports: ["read"], audit: ["read", "audit"] },
  user: {},
};

export function can(role: BalancertsRole, module: string, permission: Permission) {
  const allowed = matrix[role]["*"] ?? matrix[role][module] ?? [];
  return allowed.includes(permission);
}
