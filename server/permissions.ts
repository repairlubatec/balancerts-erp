export type BalancertsRole = "admin" | "contabilista" | "financeiro" | "operador" | "auditor" | "user";
export type Permission = "read" | "create" | "update" | "validate" | "issue" | "post" | "reverse" | "close" | "reopen" | "audit";

const matrix: Record<BalancertsRole, Partial<Record<string, Permission[]>>> = {
  admin: { "*": ["read", "create", "update", "validate", "issue", "post", "reverse", "close", "reopen", "audit"] },
  contabilista: { companies: ["read"], accounting: ["read", "create", "validate", "post", "reverse"], documents: ["read", "validate", "issue"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read", "create"], fiscal: ["read", "validate"], normative: ["read"], stock: ["read", "create", "validate"], treasury: ["read", "update", "validate"], reports: ["read"], close: ["read", "close", "reopen"] },
  financeiro: { companies: ["read"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read"], treasury: ["read", "create", "update", "validate"], documents: ["read", "create"], normative: ["read"], reports: ["read"] },
  operador: { companies: ["read"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read", "create"], documents: ["read", "create"], stock: ["read", "create"], treasury: ["read"] },
  auditor: { companies: ["read"], customers: ["read"], suppliers: ["read"], catalog: ["read"], accounting: ["read"], documents: ["read"], fiscal: ["read"], normative: ["read"], treasury: ["read"], reports: ["read"], audit: ["read", "audit"] },
  user: {},
};

export function can(role: BalancertsRole, module: string, permission: Permission) {
  const allowed = matrix[role]["*"] ?? matrix[role][module] ?? [];
  return allowed.includes(permission);
}
